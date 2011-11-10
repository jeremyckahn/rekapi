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
  
  
  /**
   * Finds the index of the keyframe that occurs for `millisecond`.
   * @param {Kapi.Actor} actor The actor to find the keyframe during which
   *    `millisecond` occurs.
   * @param {number} millisecond
   * @returns {number} The keyframe index for `millisecond`, or -1 if it was
   *    not found.
   */
  //TODO:  Oh noes, this is a linear search!  Maybe optimize it?
  function getKeyframeForMillisecond (actor, millisecond) {
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


  /**
   * Apply new values to an Object.  If the new value for a given property is
   * `null` or `undefined`, the property is deleted from the original Object.
   * @param {Object} targetObject The Object to modify.
   * @param {Object} augmentation The Object containing properties to modify
   *    `targetObject` with.
   */
  function augmentObject (targetObject, augmentation) {
    _.each(augmentation, function (newVal, name) {
      if (newVal === undefined || newVal === null) {
        delete targetObject[name];
      } else {
        targetObject[name] = newVal;
      }
    });
  }
  
  
  /**
   * `Kapi.Actor` constructor.  An Actor is an individual component of an
   * animation.
   * @param {Object} opt_config An Object that may contain the `setup, `draw`
   *    and `teardown` methods for the Actor.
   * @returns {Actor.Kapi}
   */
  gk.Actor = function Actor (opt_config) {
    
    opt_config = opt_config || {};
    
    // Steal the `Tweenable` constructor.
    this.constructor.call(this, {
      'initialState': opt_config.initialState
    });
    
    _.extend(this, {
      '_keyframes': {}
      ,'_keyframeList': []
      ,'_data': {}
      ,'_isShowing': false
      ,'_isPersisting': false
      ,'id': getUniqueActorId()
      ,'setup': opt_config.setup || gk.util.noop
      ,'draw': opt_config.draw || gk.util.noop
      ,'teardown': opt_config.teardown || gk.util.noop
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
    //TODO: This function is too long!  It needs to be broken out somehow.
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
    this.hide();

    if (startMs <= forMillisecond && forMillisecond <= endMs) {
      this.show();
      keyframes = this._keyframes;
      timeRangeIndexStart = getKeyframeForMillisecond(this, 
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


  /**
   * Augments the properties a preiexisting keyframe.
   * @param {number} when Which keyframe to modify, as identified by it's 
   * millisecond position in the animation.
   * @param {Object} stateModification The properties to augment the keyframe's
   *    state properties with.  If any properties in this Object are `null` or
   *    `undefined`, those state properties are deleted from the keyframe.
   * @param {Object} opt_easingModification The properties to augment the 
   *    individual property easings of the keyframe.  Works the same way as
   *    `stateModification`.
   */
  gk.Actor.prototype.modifyKeyframe = function (when, stateModification,
      opt_easingModification) {

    var targetKeyframe;

    targetKeyframe = this._keyframes[when];
    augmentObject(targetKeyframe.position, stateModification);

    if (opt_easingModification) {
      augmentObject(targetKeyframe.easing, opt_easingModification);
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


  gk.Actor.prototype.show = function (alsoPersist) {
    this._isShowing = true;
    this._isPersisting = !!alsoPersist;
    
    return this;
  };
  
  
  gk.Actor.prototype.hide = function (alsoUnpersist) {
    this._isShowing = false;

    if (alsoUnpersist === true) {
      this._isPersisting = false;
    }
    
    return this;
  };
  
  
  gk.Actor.prototype.isShowing = function () {
    return this._isShowing || this._isPersisting;
  };


  /**
   * Exposes the Actor's ordered list of keyframe times.
   * @returns {Array}
   */
  gk.Actor.prototype.keyframeList = function () {
    return this._keyframeList;
  };


  gk.Actor.prototype.data = function (opt_newData) {
    if (opt_newData) {
      this._data = opt_newData;
    }

    return this._data;
  };


  /**
   * Start Shifty interoperability methods...
   ******/

  _.each(['tween', 'to'], function (shiftyMethodName) {
    gk.Actor.prototype[shiftyMethodName] = function () {
      this.show(true);
      Tweenable.prototype[shiftyMethodName].apply(this, arguments);
    }
  }, this);

  /******
   * ...End Shifty interoperability methods.
   */

} (this));
