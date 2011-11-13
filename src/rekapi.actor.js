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
   * Compute a keyframe's positions and easing from all of the keyframes that
   * came before it.
   * @param {Kapi} kapi
   * @param {number} keyframeId
   * @returns {Object}
   */
  function composeKeyframe (kapi, keyframeId) {
    var keyframeList
        ,keyframes
        ,composedKeyframe
        ,i;

    keyframeList = kapi._keyframeList;
    keyframes = kapi._keyframes;
    composedKeyframe = {
      'position': {}
      ,'easing': {}
    };
    
    for (i = keyframeId; i >= 0; i--) {
      _.defaults(composedKeyframe.position, keyframes[keyframeList[i]].position)
      _.defaults(composedKeyframe.easing, keyframes[keyframeList[i]].easing)
    }

    return composedKeyframe;
  }


  /**
   * @param {Object} opt_config
   * @returns {Actor.Kapi}
   */
  gk.Actor = function Actor (opt_config) {
    
    opt_config = opt_config || {};
    
    // Steal the `Tweenable` constructor.
    this.constructor.call(this);
    
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
   * @param {number} when
   * @param {Object} position
   * @param {string|Object} easing
   * @returns {Kapi.Actor}
   */
  gk.Actor.prototype.keyframe = function keyframe (when, position, opt_easing) {
    var originalEasingString;
    
    // This code will be used.  Other work needs to be done beforehand, though.
    if (!opt_easing) {
      opt_easing = DEFAULT_EASING;
    }
    
    if (typeof opt_easing === 'string') {
      originalEasingString = opt_easing;
      opt_easing = {};
      _.each(position, function (positionVal, positionName) {
        opt_easing[positionName] = originalEasingString;
      });
    }

    // If `opt_easing` was passed as an Object, this will fill in any missing
    // opt_easing properties with the default equation.
    _.each(position, function (positionVal, positionName) {
      opt_easing[positionName] = opt_easing[positionName] || DEFAULT_EASING;
    });

    this._keyframes[when] = {
      'position': position
      ,'easing': opt_easing
    };
    this._keyframeList.push(when);
    gk.util.sortNumerically(this._keyframeList);
    this.kapi.updateInternalState();
    
    return this;
  };


  /**
   * @param {number} when
   * @param {number} opt_source
   * @returns {Kapi.Actor}
   */
  gk.Actor.prototype.liveCopy = function (when, opt_source) {
    var sourceKeyframeData;

    if (typeof opt_source === 'undefined') {
      opt_source = _.last(this._keyframeList);
    }

    if (this._keyframes.hasOwnProperty(opt_source)) {
      sourceKeyframeData = this._keyframes[opt_source];
      this.keyframe(when, sourceKeyframeData.position,
          sourceKeyframeData.easing);
    }

    return this;
  };


  /**
   * @param {number} when
   * @param {Object} stateModification
   * @param {Object} opt_easingModification
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
   * @param {when} when
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
   * @param {number} layer
   * @returns {Kapi.Actor|undefined}
   */
  gk.Actor.prototype.moveToLayer = function (layer) {
    return this.kapi.moveActorToLayer(this, layer);
  };


  /**
   * @param {boolean} alsoPersist
   * @returns {Kapi.Actor}
   */
  gk.Actor.prototype.show = function (alsoPersist) {
    this._isShowing = true;
    this._isPersisting = !!alsoPersist;
    
    return this;
  };
  
  
  /**
   * @param {boolean} alsoUnpersist
   * @returns {Kapi.Actor}
   */
  gk.Actor.prototype.hide = function (alsoUnpersist) {
    this._isShowing = false;

    if (alsoUnpersist === true) {
      this._isPersisting = false;
    }
    
    return this;
  };
  
  
  /**
   * @returns {boolean}
   */
  gk.Actor.prototype.isShowing = function () {
    return this._isShowing || this._isPersisting;
  };


  /**
   * @param {number} millisecond
   * @returns {Kapi.Actor}
   */
  gk.Actor.prototype.calculatePosition = function (millisecond) {
    //TODO: This function is too long!  It needs to be broken out somehow.
    var keyframeList
        ,keyframes
        ,delta
        ,interpolatedPosition
        ,startMs
        ,endMs
        ,timeRangeIndexStart
        ,rangeFloor
        ,rangeCeil
        ,composedFrom
        ,composedTo;
        
    keyframeList = this._keyframeList;
    startMs = _.first(keyframeList);
    endMs = _.last(keyframeList);
    this.hide();

    if (startMs <= millisecond && millisecond <= endMs) {
      this.show();
      keyframes = this._keyframes;
      timeRangeIndexStart = getKeyframeForMillisecond(this,
          millisecond);
      rangeFloor = keyframeList[timeRangeIndexStart];
      rangeCeil = keyframeList[timeRangeIndexStart + 1];
      delta = rangeCeil - rangeFloor;
      interpolatedPosition = (millisecond - rangeFloor) / delta;
      composedFrom = composeKeyframe(this,
          timeRangeIndexStart);
      composedTo = _.extend({},
          keyframes[keyframeList[timeRangeIndexStart + 1]]);
      _.defaults(composedTo.position, composedFrom.position);
      _.defaults(composedTo.easing, composedFrom.easing);

      this
        .set(composedFrom.position)
        .interpolate(composedTo.position,
            interpolatedPosition,
            composedTo.easing);
    }

    return this;
  };


  /**
   * @returns {Array}
   */
  gk.Actor.prototype.keyframeList = function () {
    return this._keyframeList;
  };


  /**
   * @param {Object} opt_newData
   * @returns {Object}
   */
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
