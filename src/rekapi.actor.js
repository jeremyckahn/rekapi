;(function rekapiActor (global) {

  var DEFAULT_EASING = 'linear'
      ,gk
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
  // `Tweenable` constructor.
  
  
  /**
   * Calculates and sets the Actor's position at a particular millisecond in the
   * animation.
   * @param {number} forMillisecond
   * @returns {Kapi.Actor}
   */
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
        .set(keyframes[keyframeList[timeRangeIndexStart]].position)
        .interpolate(keyframes[keyframeList[timeRangeIndexStart + 1]].position,
            interpolatedPosition,
            keyframes[keyframeList[timeRangeIndexStart + 1]].easing);
                
    } else {
      this.set({});
    }
    
    return this;
  };


  /**
   * Define a keyframe for an Actor.
   * @param {number} when
   * @param {Object} position
   * @param {string|Object} easing If this is a string, the easing is applied
   *    to all parameters of `position`.  You can also mix and match easings
   *    for each parameter. So:
   *  @codestart
   *    actor.keyframe(1000, {
   *      'x': 100
   *      ,'y': 100
   *    }, {
   *      'x': 'easeOutSine'
   *      ,'y': 'easeInSine'
   *    });
   *  @codeend
   * @returns {Kapi.Actor}
   */
  gk.Actor.prototype.keyframe = function keyframe (when, position, easing) {
    var originalEasingString;
    
    // This code will be used.  Other work needs to be done beforehand, though.
    if (!easing) {
      easing = DEFAULT_EASING;
    }
    
    if (typeof easing === 'string') {
      originalEasingString = easing;
      easing = {};
      _.each(position, function (positionVal, positionName) {
        easing[positionName] = originalEasingString;
      });
    }
    
    // If `easing` was passed as an Object, this will fill in any missing
    // easing properties with the default equation.
    _.each(position, function (positionVal, positionName) {
      easing[positionName] = easing[positionName] || DEFAULT_EASING;
    });
    
    this._keyframes[when] = {
      'position': position
      ,'easing': easing
    };
    this._keyframeList.push(when);
    gk.util.sortNumerically(this._keyframeList);
    this.kapi.updateInternalState();
    
    return this;
  };


  /**
   * Copies an existing keyframe into another keyframe.  If the original
   * keyframe is modified by Kapi.Actor.modifyKeyframe, then the copy is
   * modified as well.  If the original keyframe is deleted, the copy remains.
   * If the original keyframe is overwritten with Kapi.Actor.keyframe, then the
   * link between the frames is lost (although the copy remains as an
   * independant keyframe).
   * @param {number} when Where in the animation to make the new keyframe.
   * @param {number} source The "when" of the target keyframe to copy.
   * @returns {Kapi.Actor}
   */
  gk.Actor.prototype.liveCopy = function (when, source) {
    var sourceKeyframeData;

    if (this._keyframes.hasOwnProperty(source)) {
      sourceKeyframeData = this._keyframes[source];
      this.keyframe(when, sourceKeyframeData.position,
          sourceKeyframeData.easing);
    }

    return this;
  };


  gk.Actor.prototype.modifyKeyframe = function (when, stateModification,
      opt_easingModification) {

      var targetKeyframe;

      targetKeyframe = this._keyframes[when];

    _.each(stateModification, function (newState, propName) {
      if (newState === undefined || newState === null) {
        delete targetKeyframe.position[propName];
      } else {
        targetKeyframe.position[propName] = newState;
      }
    }, this);

    if (opt_easingModification) {
      _.each(opt_easingModification, function (newEasing, propName) {
        if (newEasing === undefined || newEasing === null) {
          delete targetKeyframe.easing[propName];
        } else {
          targetKeyframe.easing[propName] = newEasing;
        }
      }, this);
    }

    return this;
  };


  /**
   * Remove a keyframe set on the actor.
   * @param {when} when the millisecond to remove the keyframe from.
   * @returns {Kapi.Actor}
   */
  gk.Actor.prototype.removeKeyframe = function (when) {
    if (this._keyframeList.indexOf(when) !== -1) {
      this._keyframeList = _.without(this._keyframeList, when);
      delete this._keyframes[when];
      this.kapi.updateInternalState();
    }

    return this;
  };


  /**
   * Removes all keyframes set on the actor.
   * @returns {Kapi.Actor}
   */
  gk.Actor.prototype.removeAllKeyframes = function () {
    var keyframeListCopy;

    keyframeListCopy = this._keyframeList.slice(0);

    _.each(keyframeListCopy, function (when) {
      this.removeKeyframe(when);
    }, this);

    return this;
  };
  
  
  /**
   * Move this Actor to another layer in the owner Kapi isntance.
   * @param {number} layer The 0-based layer to move to.
   * @returns {Kapi.Actor|undefined} If successful, the actor is returned.  If
   *    the operation fails, `undefined` is returned.
   */
  gk.Actor.prototype.moveToLayer = function (layer) {
    return this.kapi.moveActorToLayer(this, layer);
  };


  /**
   * Exposes the Actor's ordered list of keyframe times.
   * @returns {Array}
   */
  gk.Actor.prototype.keyframeList = function () {
    return this._keyframeList;
  };

} (this));
