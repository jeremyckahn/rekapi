;(function rekapiActor (global) {

  var gk
      ,actorCount
      ,ActorMethods;
  
  gk = global.Kapi;
  actorCount = 0;
  
  
  function getUniqueActorId () {
    return actorCount++;
  }
  
  
  //TODO:  Oh noes, this is a linear search!  Maybe optimize it?
  function getCurrentMillisecondRangeIndex (actor, millisecond) {
    var i, len
        ,list;
    
    list = actor._keyframeList;
    len = list.length;
    
    for (i = 1; i < len; i++) {
      if (list[i] >= millisecond) {
        return (i - 1);
      }
    }
    
    return -1;
  }
  
  
  gk.Actor = function Actor (kapi, opt_config) {
    
    opt_config = opt_config || {};
    
    // Steal the `Tweenable` constructor.
    this.constructor.call(this, {
      'fps': kapi.config.fps
      ,'initialState': opt_config.initialState
    });
    
    _.extend(this, {
      '_keyframes': {}
      ,'_keyframeList': []
      ,'id': getUniqueActorId()
      ,'kapi': kapi
      ,'setup': opt_config.setup || gk.noop
      ,'draw': opt_config.draw || gk.noop
      ,'teardown': opt_config.teardown || gk.noop
    });
    
    return this;
  };
  
  
  // Kind of a fun way to set up an inheritance chain.  `ActorMethods` prevents
  // methods on `Actor.prototype` from polluting `Tweenable`'s prototype with
  // `Actor` specific methods.
  ActorMethods = function () {};
  ActorMethods.prototype = Tweenable.prototype;
  gk.Actor.prototype = new ActorMethods();
  // But the magic doesn't stop here!  `Actor`'s constructor steals the
  // `Tweenable` constuctor.
  
  /**
   * @param {number} when
   * @param {Object} position
   */
  gk.Actor.prototype.keyframe = function keyframe (when, position) {
    this._keyframes[when] = position;
    this._keyframeList.push(when);
    gk.util.sortNumerically(this._keyframeList);
    this.kapi.updateInternalState();
    
    return this;
  };
  
  
  gk.Actor.prototype.calculatePosition = function (forMillisecond) {
    var keyframeList
        ,keyframes
        ,delta
        ,interpolatedPosition
        ,startMs
        ,endMs
        ,timeRangeIndexStart
        ,rangeFloor
        ,rangeCeil;
        
    keyframeList = this._keyframeList;
    startMs = _.first(keyframeList);
    endMs = _.last(keyframeList);
    
    if (startMs <= forMillisecond && forMillisecond <= endMs) {
      
      keyframes = this._keyframes;
      timeRangeIndexStart = getCurrentMillisecondRangeIndex(this, 
          forMillisecond);
      rangeFloor = keyframeList[timeRangeIndexStart];
      rangeCeil = keyframeList[timeRangeIndexStart + 1];
      delta = rangeCeil - rangeFloor;
      interpolatedPosition = (forMillisecond - rangeFloor) / delta;
      
      this
        .set(keyframes[keyframeList[timeRangeIndexStart]])
        .interpolate(keyframes[keyframeList[timeRangeIndexStart + 1]],
            interpolatedPosition);
                
    } else {
      this.set({});
    }
    
    return this;
  };

  
  gk.Actor.prototype.keyframeList = function () {
    return this._keyframeList;
  }

} (this));