;(function rekapiActor (global) {

  var gk
      ,actorCount;
  
  gk = global.Kapi;
  actorCount = 0;
  
  function getUniqueActorId () {
    return actorCount++;
  }
  
  gk.Actor = function Actor (kapi, opt_config) {
    opt_config = opt_config || {};
    
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
  
  gk.Actor.prototype = Tweenable.prototype;
  
  /**
   * @param {number} when
   * @param {Object} position
   */
  gk.Actor.prototype.keyframe = function keyframe (when, position) {
    this._keyframes[when] = position;
    this._keyframeList.push(when);
    gk.util.sortNumerically(this._keyframeList);
    
    return this;
  };
  
  function getCurrentTimeRangeIndex (actor, millisecond) {
    var i, len
        ,list;
    
    list = actor._keyframeList;
    len = list.length;
    
    for (i = 1; i < len; i++) {
      if (list[i] > millisecond) {
        return (i - 1);
      }
    }
    
    return -1;
  }
  
  
  gk.Actor.calculatePosition = function (millisecond) {
    var list
        ,startMs
        ,endMs
        ,timeRangeIndex
        ,rangeFloor
        ,rangeCeil;
        
    list = this._keyframeList;
    startMs = _.first(list);
    endMs = _.last(list);
    
    if (startMs <= millisecond && millisecond <= endMs) {
      timeRangeIndex = getCurrentTimeRangeIndex(this, millisecond);
      rangeFloor = list[timeRangeIndex];
      rangeCeil = list[timeRangeIndex + 1];
      
      if (rangeCeil) {
        // Calculate the current position...
      }
      
    } else {
      this.set({});
    }
    
  };

} (this));