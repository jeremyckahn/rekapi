/*jslint browser: true, nomen: true, plusplus: true, undef: true, vars: true, white: true */
/**
 * Rekapi - Rewritten Kapi. v0.9.9 (Fri, 22 Jun 2012 02:21:16 GMT)
 * https://github.com/jeremyckahn/rekapi
 *
 * By Jeremy Kahn (jeremyckahn@gmail.com), with significant contributions from
 *   Franck Lecollinet
 *
 * Make fun keyframe animations with JavaScript.
 * Dependencies: Underscore.js (https://github.com/documentcloud/underscore),
 *   Shifty.js (https://github.com/jeremyckahn/shifty).
 * MIT Lincense.  This code free to use, modify, distribute and enjoy.
 */
;(function (global) {
// REKAPI-GLOBAL METHODS
// These are global in development, but get wrapped in a closure at build-time.

/**
 * Fire an event bound to a Kapi.
 * @param {Kapi} kapi
 * @param {string} eventName
 * @param {Underscore} _ A reference to the scoped Underscore dependency
 * @param {object} opt_data Optional event-specific data
 */
function fireEvent (kapi, eventName, _, opt_data) {
  _.each(kapi._events[eventName], function (handler) {
    handler(kapi, opt_data);
  });
}


/**
 * @param {Kapi} kapi
 */
function recalculateAnimationLength (kapi) {
  var actorLengths = [];

  _.each(kapi._actors, function (actor) {
    actorLengths.push(actor.getEnd());
  });

  kapi._animationLength = Math.max.apply(Math, actorLengths);
};


/**
 * Does nothing.  Absolutely nothing at all.
 */
function noop () {
  // NOOP!
}


var rekapiCore = function (context, _, Tweenable) {

  'use strict';

  // GLOBAL is read from for various environment properties
  // http://stackoverflow.com/questions/3277182/how-to-get-the-global-object-in-javascript
  var Fn = Function, GLOBAL = Fn('return this')();


  /**
   * Determines which iteration of the loop the animation is currently in.
   * @param {Kapi} kapi
   * @param {number} timeSinceStart
   */
  function determineCurrentLoopIteration (kapi, timeSinceStart) {
    var currentIteration = Math.floor(
        (timeSinceStart) / kapi._animationLength);
    return currentIteration;
  }


  /**
   * Calculate how many milliseconds since the animation began.
   * @param {Kapi} kapi
   * @return {number}
   */
  function calculateTimeSinceStart (kapi) {
    return now() - kapi._loopTimestamp;
  }


  /**
   * Determines is the animation is complete or not.
   * @param {Kapi} kapi
   * @param {number} currentLoopIteration
   */
  function isAnimationComplete (kapi, currentLoopIteration) {
    return currentLoopIteration >= kapi._timesToIterate
        && kapi._timesToIterate !== -1;
  }


  /**
   * Stops the animation if the animation is complete.
   * @param {Kapi} kapi
   * @param {number} currentLoopIteration
   */
  function updatePlayState (kapi, currentLoopIteration) {
    if (isAnimationComplete(kapi, currentLoopIteration)) {
      kapi.stop();
      fireEvent(kapi, 'animationComplete', _);
    }
  }


  /**
   * Calculate how far in the animation loop `kapi` is, in milliseconds, based
   * on the current time.  Also overflows into a new loop if necessary.
   * @param {Kapi} kapi
   * @return {number}
   */
  function calculateLoopPosition (kapi, forMillisecond, currentLoopIteration) {
    var currentLoopPosition;

    if (isAnimationComplete(kapi, currentLoopIteration)) {
      currentLoopPosition = kapi._animationLength;
    } else {
      currentLoopPosition = forMillisecond % kapi._animationLength;
    }

    return currentLoopPosition;
  }


  /**
   * Calculate the position and state for a given millisecond.
   * Also updates the state internally and accounts for how many loop
   * iterations the animation runs for.
   * @param {Kapi} kapi
   * @param {number} forMillisecond The millisecond to update
   */
  function updateToMillisecond (kapi, forMillisecond) {
    var currentIteration = determineCurrentLoopIteration(kapi, forMillisecond);
    var loopPosition = calculateLoopPosition(kapi, forMillisecond,
        currentIteration);
    kapi.update(loopPosition);
    updatePlayState(kapi, currentIteration);
  }


  /**
   * Calculate how far in the animation loop `kapi` is, in milliseconds, and
   * update based on that time.
   * @param {Kapi} kapi
   */
  function updateToCurrentMillisecond (kapi) {
    updateToMillisecond(kapi, calculateTimeSinceStart(kapi));
  }


  /**
   * This is the heartbeat of an animation.  Updates the state and then calls
   * itself based on the framerate of the supplied Kapi.
   * @param {Kapi} kapi
   */
  function tick (kapi) {
    var updateFn = function () {
      tick(kapi);
      updateToCurrentMillisecond(kapi);
    };

    // Need to check for .call presence to get around an IE limitation.
    // See annotation for cancelLoop for more info.
    if (kapi._scheduleUpdate.call) {
      kapi._loopId = kapi._scheduleUpdate.call(GLOBAL,
          updateFn, 1000 / kapi.config.fps);
    } else {
      kapi._loopId = setTimeout(updateFn, 1000 / kapi.config.fps);
    }
  }


  /**
   * @param {number}
   * @return {Function}
   */
  function getUpdateMethod (framerate) {
    var updateMethod;

    if (framerate !== 60) {
      updateMethod = GLOBAL.setTimeout;
    } else {
      // requestAnimationFrame() shim by Paul Irish (modified for Rekapi)
      // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
      updateMethod = GLOBAL.requestAnimationFrame ||
        GLOBAL.webkitRequestAnimationFrame ||
        GLOBAL.oRequestAnimationFrame      ||
        GLOBAL.msRequestAnimationFrame     ||
        (GLOBAL.mozCancelRequestAnimationFrame
          && GLOBAL.mozRequestAnimationFrame) ||
        GLOBAL.setTimeout;
    }

    return updateMethod;
  }


  /**
   * @param {number}
   * @return {Function}
   */
  function getCancelMethod (framerate) {
    var cancelMethod;

    if (framerate !== 60) {
      cancelMethod = GLOBAL.clearTimeout;
    } else {
      cancelMethod = GLOBAL.cancelAnimationFrame ||
        GLOBAL.webkitCancelAnimationFrame ||
        GLOBAL.oCancelAnimationFrame      ||
        GLOBAL.msCancelAnimationFrame     ||
        GLOBAL.mozCancelRequestAnimationFrame ||
        GLOBAL.clearTimeout;
    }

    return cancelMethod;
  }


  /**
   * Cancels an update loop.  This abstraction is needed to get around the fact
   * that in IE, clearTimeout is not technically a function
   * (https://twitter.com/kitcambridge/status/206655060342603777) and thus
   * Function.prototype.call cannot be used upon it.
   * @param {Kapi} kapi
   */
  function cancelLoop (kapi) {
    if (kapi._cancelUpdate.call) {
      kapi._cancelUpdate.call(GLOBAL, kapi._loopId);
    } else {
      clearTimeout(kapi._loopId);
    }
  }

  var now = Tweenable.util.now;

  var defaultConfig = {
    'fps': 60
  };

  var playState = {
    'STOPPED': 'stopped'
    ,'PAUSED': 'paused'
    ,'PLAYING': 'playing'
  };


  /**
   * @param {Object} opt_config
   * @constructor
   */
  var Kapi = context.Kapi || function Kapi (opt_config) {
    this.config = opt_config || {};
    this.context = this.config.context || {};
    this._actors = {};
    this._playState = playState.STOPPED;

    this._events = {
      'animationComplete': []
      ,'playStateChange': []
      ,'play': []
      ,'pause': []
      ,'stop': []
      ,'beforeUpdate': []
      ,'afterUpdate': []
      ,'addActor': []
      ,'removeActor': []
    };

    // How many times to loop the animation before stopping.
    this._timesToIterate = -1;

    // Millisecond duration of the animation
    this._animationLength = 0;

    // The setTimeout ID of `tick`
    this._loopId = null;

    // The UNIX time at which the animation loop started
    this._loopTimestamp = null;

    // Used for maintaining position when the animation is paused.
    this._pausedAtTime = null;

    // The last millisecond position that was updated
    this._lastUpdatedMillisecond = 0;

    _.extend(this.config, opt_config);
    _.defaults(this.config, defaultConfig);

    this._scheduleUpdate = getUpdateMethod(this.config.fps);
    this._cancelUpdate = getCancelMethod(this.config.fps);

    _.each(this._contextInitHook, function (fn) {
      fn.call(this);
    }, this);

    return this;
  };


  /**
   * @type {Object.<function>} Contains the context init function to be called
   * in the Kapi contstructor.
   */
  Kapi.prototype._contextInitHook = {};


  /**
   * @param {Kapi.Actor} actor
   * @return {Kapi}
   */
  Kapi.prototype.addActor = function (actor) {
    // You can't add an actor more than once.
    if (!_.contains(this._actors, actor)) {
      if (!actor.context()) {
        actor.context(this.context);
      }

      actor.kapi = this;
      actor.fps = this.framerate();
      this._actors[actor.id] = actor;
      recalculateAnimationLength(this);
      actor.setup();

      fireEvent(this, 'addActor', _, actor);
    }

    return this;
  };


  /**
   * @param {number} actorId
   * @return {Kapi.Actor}
   */
  Kapi.prototype.getActor = function (actorId) {
    return this._actors[actorId];
  };


  /**
   * @returns {Array}
   */
  Kapi.prototype.getActorIds = function () {
    return _.pluck(this._actors, 'id');
  };


  /**
   * @returns {Array}
   */
  Kapi.prototype.getAllActors = function () {
    return _.clone(this._actors);
  };


  /**
   * @param {Kapi.Actor} actor
   * @return {Kapi}
   */
  Kapi.prototype.removeActor = function (actor) {
    delete this._actors[actor.id];
    delete actor.kapi;
    actor.teardown();
    recalculateAnimationLength(this);

    fireEvent(this, 'removeActor', _, actor);

    return this;
  };


  /**
   * @param {number} opt_howManyTimes
   * @return {Kapi}
   */
  Kapi.prototype.play = function (opt_howManyTimes) {
    cancelLoop(this);

    if (this._playState === playState.PAUSED) {
      this._loopTimestamp += now() - this._pausedAtTime;
    } else {
      this._loopTimestamp = now();
    }

    this._timesToIterate = opt_howManyTimes || -1;
    this._playState = playState.PLAYING;
    tick(this);

    // Also resume any Shifty tweens that are paused.
    _.each(this._actors, function (actor) {
      if (actor._state.isPaused ) {
        actor.resume();
      }
    });

    fireEvent(this, 'playStateChange', _);
    fireEvent(this, 'play', _);

    return this;
  };


  /**
   * @param {number} millisecond
   * @param {number} opt_howManyTimes
   * @return {Kapi}
   */
  Kapi.prototype.playFrom = function (millisecond, opt_howManyTimes) {
    this.play(opt_howManyTimes);
    this._loopTimestamp = now() - millisecond;

    return this;
  };


  /**
   * @param {number} opt_howManyTimes
   * @return {Kapi}
   */
  Kapi.prototype.playFromCurrent = function (opt_howManyTimes) {
    return this.playFrom(this._lastUpdatedMillisecond, opt_howManyTimes);
  };


  /**
   * @return {Kapi}
   */
  Kapi.prototype.pause = function () {
    if (this._playState === playState.PAUSED) {
      return this;
    }

    this._playState = playState.PAUSED;
    cancelLoop(this);
    this._pausedAtTime = now();

    // Also pause any Shifty tweens that are running
    _.each(this._actors, function (actor) {
      if (actor._state.isTweening) {
        actor.pause();
      }
    });

    fireEvent(this, 'playStateChange', _);
    fireEvent(this, 'pause', _);

    return this;
  };


  /**
   * @return {Kapi}
   */
  Kapi.prototype.stop = function () {
    this._playState = playState.STOPPED;
    cancelLoop(this);

    // Also kill any shifty tweens that are running.
    _.each(this._actors, function (actor) {
      actor.stop();
    });

    fireEvent(this, 'playStateChange', _);
    fireEvent(this, 'stop', _);

    return this;
  };


  /**
   * @return {boolean}
   */
  Kapi.prototype.isPlaying = function () {
    return this._playState === playState.PLAYING;
  };


  /**
   * @return {number}
   */
  Kapi.prototype.animationLength = function () {
    return this._animationLength;
  };


  /**
   * @return {number}
   */
  Kapi.prototype.lastPositionUpdated = function () {
    return (this._lastUpdatedMillisecond / this._animationLength);
  };


  /**
   * @return {number}
   */
  Kapi.prototype.actorCount = function () {
    return _.size(this._actors);
  };


  /**
   * @param {number} opt_newFramerate
   * @return {number}
   */
  Kapi.prototype.framerate = function (opt_newFramerate) {
    if (opt_newFramerate) {
      this.config.fps = opt_newFramerate;
      this._scheduleUpdate = getUpdateMethod(this.config.fps);
      this._cancelUpdate = getCancelMethod(this.config.fps);
    }

    return this.config.fps;
  };


  /**
   * @param {number} millisecond
   * @return {Kapi}
   */
  Kapi.prototype.update = function (millisecond) {
    fireEvent(this, 'beforeUpdate', _);
    _.each(this._actors, function (actor) {
      actor.updateState(millisecond);
      if (typeof actor.update === 'function') {
        actor.update(actor.context(), actor.get());
      }
    });
    this._lastUpdatedMillisecond = millisecond;
    fireEvent(this, 'afterUpdate', _);

    return this;
  };


  /**
   * @param {string} eventName
   * @param {Function} handler
   * @return {Kapi}
   */
  Kapi.prototype.on = function (eventName, handler) {
    if (!this._events[eventName]) {
      return;
    }

    this._events[eventName].push(handler);

    return this;
  };


  /**
   * @param {string} eventName
   * @param {Function} opt_handler
   * @return {Kapi}
   */
  Kapi.prototype.off = function (eventName, opt_handler) {
    if (!this._events[eventName]) {
      return;
    }

    if (!opt_handler) {
      this._events[eventName] = [];
    } else {
      this._events[eventName] = _.without(this._events[eventName],
        opt_handler);
    }

    return this;
  };


  /**
   * @return {Object}
   */
  Kapi.prototype.exportTimeline = function () {
    var exportData = {
      'duration': this._animationLength
      ,'actors': {}
    };

    _.each(this._actors, function (actor) {
      exportData.actors[actor.id] = actor.exportTimeline();
    }, this);

    return exportData;
  };


  Kapi.util = {};


  // Some hooks for testing.
  if (typeof KAPI_DEBUG !== 'undefined' && KAPI_DEBUG === true) {
    Kapi._private = {
      'calculateLoopPosition': calculateLoopPosition
      ,'updateToCurrentMillisecond': updateToCurrentMillisecond
      ,'tick': tick
      ,'determineCurrentLoopIteration': determineCurrentLoopIteration
      ,'calculateTimeSinceStart': calculateTimeSinceStart
      ,'isAnimationComplete': isAnimationComplete
      ,'updatePlayState': updatePlayState
    };
  }

  context.Kapi = Kapi;

};
var rekapiActor = function (context, _, Tweenable) {

  'use strict';

  var DEFAULT_EASING = 'linear';
  var Kapi = context.Kapi;


  /**
   * Sorts an array numerically, from smallest to largest.
   * @param {Array} array The Array to sort.
   * @return {Array} The sorted Array.
   */
  function sortNumerically (array) {
    return array.sort(function (a, b) {
      return a - b;
    });
  }


  /**
   * @param {Kapi.Actor} actor
   * @param {number} millisecond
   * @return {number}
   */
  //TODO:  Oh noes, this is a linear search!  Maybe optimize it?
  function getPropertyCacheIdForMillisecond (actor, millisecond) {
    var list = actor._timelinePropertyCacheIndex;
    var len = list.length;

    var i;
    for (i = 1; i < len; i++) {
      if (list[i] >= millisecond) {
        return (i - 1);
      }
    }

    return -1;
  }


  /**
   * Order all of an Actor's property tracks so they can be cached.
   * @param {Kapi.Actor} actor
   */
  function sortPropertyTracks (actor) {
    _.each(actor._propertyTracks, function (track, name) {
      actor._propertyTracks[name] = _.sortBy(actor._propertyTracks[name],
        function (keyframeProperty) {
        return keyframeProperty.millisecond;
      });
    });
  }


  /**
   * Compute and fill all timeline caches.
   * @param {Kapi.Actor} actor
   */
  function cachePropertiesToSegments (actor) {
    _.each(actor._timelinePropertyCaches, function (propertyCache, cacheId) {
      var latestProperties = getLatestPropeties(actor, +cacheId);
      _.defaults(propertyCache, latestProperties);
    });
  }


  /**
   * Gets all of the current and most recent Kapi.KeyframeProperties for a
   * given millisecond.
   * @param {Kapi.Actor} actor
   * @param {number} forMillisecond
   * @return {Object} An Object containing Kapi.KeyframeProperties
   */
  function getLatestPropeties (actor, forMillisecond) {
    var latestProperties = {};

    _.each(actor._propertyTracks, function (propertyTrack, propertyName) {
      var previousKeyframeProperty = null;

      _.find(propertyTrack, function (keyframeProperty) {
        if (keyframeProperty.millisecond > forMillisecond) {
          latestProperties[propertyName] = previousKeyframeProperty;
        } else if (keyframeProperty.millisecond === forMillisecond) {
          latestProperties[propertyName] = keyframeProperty;
        }

        previousKeyframeProperty = keyframeProperty;
        return !!latestProperties[propertyName];
      });

      if (!latestProperties[propertyName]) {
        var lastProp = _.last(propertyTrack);

        if (lastProp && lastProp.millisecond <= forMillisecond) {
          latestProperties[propertyName] = lastProp;
        }
      }
    });

    return latestProperties;
  }


  /**
   * Links each KeyframeProperty to the next one in it's respective track.
   *
   * They're linked lists!
   * @param {Kapi.Actor} actor
   */
  function linkTrackedProperties (actor) {
    _.each(actor._propertyTracks, function (propertyTrack, trackName) {
      _.each(propertyTrack, function (trackProperty, i) {
        trackProperty.linkToNext(propertyTrack[i + 1]);
      });
    });
  }


  /**
   * Returns a requested KeyframeProperty at a millisecond on a specified
   * track.
   * @param {Kapi.Actor} actor
   * @param {string} trackName
   * @param {number} millisecond
   * @return {Kapi.KeyframeProperty}
   */
  function findPropertyAtMillisecondInTrack (actor, trackName, millisecond) {
    return _.find(actor._propertyTracks[trackName],
        function (keyframeProperty) {
      return keyframeProperty.millisecond === millisecond;
    });
  }


  /**
   * Empty out and re-cache internal KeyframeProperty data.
   * @param {Kapi.Actor}
   */
  function invalidatePropertyCache  (actor) {
    actor._timelinePropertyCaches = {};

    _.each(actor._keyframeProperties, function (keyframeProperty) {
      if (!actor._timelinePropertyCaches[keyframeProperty.millisecond]) {
        actor._timelinePropertyCaches[keyframeProperty.millisecond] = {};
      }

      actor._timelinePropertyCaches[keyframeProperty.millisecond][
          keyframeProperty.name] = keyframeProperty;
    }, actor);

    actor._timelinePropertyCacheIndex = _.keys(actor._timelinePropertyCaches);

    _.each(actor._timelinePropertyCacheIndex, function (listId, i) {
      actor._timelinePropertyCacheIndex[i] = +listId;
    }, actor);

    sortNumerically(actor._timelinePropertyCacheIndex);
    cachePropertiesToSegments(actor);
    linkTrackedProperties(actor);
  }


  /**
   * @param {Object} opt_config
   * @constructor
   */
  var Actor = Kapi.Actor = function (opt_config) {

    opt_config = opt_config || {};

    // Steal the `Tweenable` constructor.
    Tweenable.call(this);

    _.extend(this, {
      '_data': {}
      ,'_propertyTracks': {}
      ,'_timelinePropertyCaches': {}
      ,'_timelinePropertyCacheIndex': []
      ,'_keyframeProperties': {}
      ,'id': _.uniqueId()
      ,'setup': opt_config.setup || noop
      ,'update': opt_config.update || noop
      ,'teardown': opt_config.teardown || noop
    });

    if (opt_config.context) {
      this.context(opt_config.context);
    }

    return this;
  };


  // Kind of a fun way to set up an inheritance chain.  `ActorMethods` prevents
  // methods on `Actor.prototype` from polluting `Tweenable`'s prototype with
  // `Actor` specific methods.
  var ActorMethods = function () {};
  ActorMethods.prototype = Tweenable.prototype;
  Actor.prototype = new ActorMethods();
  // But the magic doesn't stop here!  `Actor`'s constructor steals the
  // `Tweenable` constructor.


  /**
   * @param {Object} opt_context
   * @return {Object}
   */
  Actor.prototype.context = function (opt_context) {
    if (opt_context) {
      this._context = opt_context;
    }

    return this._context;
  };


  /**
   * @param {number} when
   * @param {Object} position
   * @param {string|Object} easing
   * @return {Kapi.Actor}
   */
  Actor.prototype.keyframe = function keyframe (when, position, opt_easing) {
    var originalEasingString;

    // TODO:  The opt_easing logic seems way overcomplicated, it's probably out
    // of date.  Multiple eases landed first in Rekapi, then were pushed
    // upstream into Shifty.  There's likely some redundant logic here.
    opt_easing = opt_easing || DEFAULT_EASING;

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

    _.each(position, function (value, name) {
      var newKeyframeProperty = new Kapi.KeyframeProperty(this, when, name, value,
          opt_easing[name]);
      this._keyframeProperties[newKeyframeProperty.id] = newKeyframeProperty;

      if (!this._propertyTracks[name]) {
        this._propertyTracks[name] = [];
      }

      this._propertyTracks[name].push(newKeyframeProperty);
      sortPropertyTracks(this);
    }, this);

    if (this.kapi) {
      recalculateAnimationLength(this.kapi);
    }

    invalidatePropertyCache(this);

    return this;
  };


  /**
   * @param {string} property
   * @param {number} index
   * @return {Kapi.KeyframeProperty}
   */
  Actor.prototype.getKeyframeProperty = function (property, index) {
    if (this._propertyTracks[property]
        && this._propertyTracks[property][index]) {
      return this._propertyTracks[property][index];
    }
  };


  /**
   * @param {string} property
   * @param {number} index
   * @param {Object} newProperties
   * @return {Kapi.Actor}
   */
  Actor.prototype.modifyKeyframeProperty = function (property, index,
      newProperties) {
    if (this._propertyTracks[property]
        && this._propertyTracks[property][index]) {
      this._propertyTracks[property][index].modifyWith(newProperties);
    }

    sortPropertyTracks(this);
    invalidatePropertyCache(this);
    recalculateAnimationLength(this.kapi);
    return this;
  };


  /**
   * @return {Array}
   */
  Actor.prototype.getTrackNames = function () {
    return _.keys(this._propertyTracks);
  };


  /**
   * @param {string} trackName
   * @return {number}
   */
  Actor.prototype.getTrackLength = function (trackName) {
    if (!this._propertyTracks[trackName]) {
      return;
    }

    return this._propertyTracks[trackName].length;
  };


  /**
   * @param {number} copyTo
   * @param {number} copyFrom
   * @return {Kapi.Actor}
   */
  Actor.prototype.copyProperties = function (copyTo, copyFrom) {
    var sourcePositions = {};
    var sourceEasings = {};

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var foundProperty = findPropertyAtMillisecondInTrack(this, trackName,
          copyFrom);

      if (foundProperty) {
        sourcePositions[trackName] = foundProperty.value;
        sourceEasings[trackName] = foundProperty.easing;
      }
    }, this);

    this.keyframe(copyTo, sourcePositions, sourceEasings);
    return this;
  };


  /**
   * @param {number} until
   * @return {Kapi.Actor}
   */
  Actor.prototype.wait = function (until) {
    var length = this.getEnd();

    if (until <= length) {
      return this;
    }

    var end = this.getEnd();
    var latestProps = getLatestPropeties(this, this.getEnd());
    var serializedProps = {};
    var serializedEasings = {};

    _.each(latestProps, function (latestProp, propName) {
      serializedProps[propName] = latestProp.value;
      serializedEasings[propName] = latestProp.easing;
    });

    this.removeKeyframe(end);
    this.keyframe(end, serializedProps, serializedEasings);
    this.keyframe(until, serializedProps, serializedEasings);

    return this;
  };


  /**
   * @return {number}
   */
  Actor.prototype.getStart = function () {
    var starts = [];

    _.each(this._propertyTracks, function (propertyTrack) {
      if (propertyTrack.length) {
        starts.push(propertyTrack[0].millisecond);
      }
    });

    if (starts.length === 0) {
      starts = [0];
    }

    return Math.min.apply(Math, starts);
  };


  /**
   * @return {number}
   */
  Actor.prototype.getEnd = function () {
    var latest = 0;

    _.each(this._propertyTracks, function (propertyTrack) {
      if (propertyTrack.length) {
        var trackLength = _.last(propertyTrack).millisecond;

        if (trackLength > latest) {
          latest = trackLength;
        }
      }
    }, this);

    return latest;
  };


  /**
   * @return {number}
   */
  Actor.prototype.getLength = function () {
    return this.getEnd() - this.getStart();
  };


  /*
   * Determines if an actor has a keyframe set at a given millisecond.
   * Can optionally look for an existing keyframe on a single property track.
   *
   * @param {number} when Millisecond
   * @param {string} opt_trackName Optional name of a property track
   * @return {boolean}
   */
  Actor.prototype.hasKeyframeAt = function(when, opt_trackName) {
    var tracks = this._propertyTracks;

    if (opt_trackName) {
      if (!_.has(tracks, opt_trackName)) {
        return false;
      }
      tracks = _.pick(tracks, opt_trackName);
    }

    return _.find(tracks, function (propertyTrack, trackName) {
      return findPropertyAtMillisecondInTrack(this, trackName, when) !== undefined;
    }, this) !== undefined;
  };


  /**
   * @param {number} when
   * @param {Object} stateModification
   * @param {Object} opt_easingModification
   * @return {Kapi.Actor}
   */
  Actor.prototype.modifyKeyframe = function (when, stateModification,
      opt_easingModification) {

    opt_easingModification = opt_easingModification || {};

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var property = findPropertyAtMillisecondInTrack(this, trackName, when);

      if (property) {
        property.modifyWith({
          'value': stateModification[trackName]
          ,'easing': opt_easingModification[trackName]
        });
      }
    }, this);

    return this;
  };


  /**
   * @param {when} when
   * @return {Kapi.Actor}
   */
  Actor.prototype.removeKeyframe = function (when) {
    _.each(this._propertyTracks, function (propertyTrack, propertyName) {
      var i = -1;
      var foundProperty = false;

      _.find(propertyTrack, function (keyframeProperty) {
        i++;
        foundProperty = (when === keyframeProperty.millisecond);
        return foundProperty;
      });

      if (foundProperty) {
        var removedProperty = propertyTrack.splice(i, 1)[0];

        if (removedProperty) {
          delete this._keyframeProperties[removedProperty.id];
        }
      }
    }, this);

    if (this.kapi) {
      recalculateAnimationLength(this.kapi);
    }

    invalidatePropertyCache(this);

    return this;
  };


  /**
   * @return {Kapi.Actor}
   */
  Actor.prototype.removeAllKeyframeProperties = function () {
    _.each(this._propertyTracks, function (propertyTrack, propertyName) {
      propertyTrack.length = 0;
    }, this);

    this._keyframeProperties = {};
    return this.removeKeyframe(0);
  };


  /**
   * @param {number} millisecond
   * @return {Kapi.Actor}
   */
  Actor.prototype.updateState = function (millisecond) {
    var startMs = this.getStart();
    var endMs = this.getEnd();

    if (startMs <= millisecond && millisecond <= endMs) {
      var latestCacheId = getPropertyCacheIdForMillisecond(this, millisecond);
      var propertiesToInterpolate =
          this._timelinePropertyCaches[this._timelinePropertyCacheIndex[
          latestCacheId]];
      var interpolatedObject = {};

      _.each(propertiesToInterpolate, function (keyframeProperty, propName) {
        if (keyframeProperty) {
          interpolatedObject[propName] =
              keyframeProperty.getValueAt(millisecond);
        }
      });

      this.set(interpolatedObject);
    }

    return this;
  };


  /**
   * @param {Object} opt_newData
   * @return {Object}
   */
  Actor.prototype.data = function (opt_newData) {
    if (opt_newData) {
      this._data = opt_newData;
    }

    return this._data;
  };


  /**
   * @return {Object}
   */
  Actor.prototype.exportTimeline = function () {
    var exportData = {
      'start': this.getStart()
      ,'end': this.getEnd()
      ,'trackNames': this.getTrackNames()
      ,'propertyTracks': {}
    };

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var trackAlias = exportData.propertyTracks[trackName] = [];
      _.each(propertyTrack, function (keyframeProperty) {
        trackAlias.push(keyframeProperty.exportPropertyData());
      });
    });

    return exportData;
  };

};
var rekapiKeyframeProperty = function (context, _, Tweenable) {

  'use strict';

  var DEFAULT_EASING = 'linear';
  var Kapi = context.Kapi;


  /**
   * @param {Kapi.Actor} ownerActor
   * @param {number} millisecond
   * @param {string} name
   * @param {number} value
   * @param {string} opt_easing
   * @constructor
   */
  var KeyframeProperty = Kapi.KeyframeProperty = function (ownerActor,
      millisecond, name, value, opt_easing) {
    this.id = _.uniqueId('keyframeProperty_');
    this.ownerActor = ownerActor;
    this.millisecond = millisecond;
    this.name = name;
    this.value = value;
    this.easing = opt_easing || DEFAULT_EASING;
    this.nextProperty = null;

    return this;
  };


  /**
   * @param {Object} newProperties
   */
  KeyframeProperty.prototype.modifyWith = function (newProperties) {
    var modifiedProperties = {};

    _.each(['millisecond', 'easing', 'value'], function (str) {
      modifiedProperties[str] = typeof(newProperties[str]) === 'undefined' ?
          this[str] : newProperties[str];
    }, this);

    _.extend(this, modifiedProperties);
  };


  /**
   * @param {KeyframeProperty} nextProperty
   */
  KeyframeProperty.prototype.linkToNext = function (nextProperty) {
    this.nextProperty = nextProperty || null;
  };


  /**
   * @param {number} millisecond
   * @return {number}
   */
  KeyframeProperty.prototype.getValueAt = function (millisecond) {
    var fromObj = {};
    var toObj = {};
    var value;

    if (this.nextProperty) {
      fromObj[this.name] = this.value;
      toObj[this.name] = this.nextProperty.value;
      var delta = this.nextProperty.millisecond - this.millisecond;
      var interpolatedPosition = (millisecond - this.millisecond) / delta;
      value = Tweenable.util.interpolate(fromObj, toObj, interpolatedPosition,
          this.nextProperty.easing)[this.name];
    } else {
      value =  this.value;
    }

    return value;
  };


  /**
   * @return {Object}
   */
  KeyframeProperty.prototype.exportPropertyData = function () {
    return {
     'id': this.id
     ,'millisecond': this.millisecond
     ,'name': this.name
     ,'value': this.value
     ,'easing': this.easing
    };
  };

};
var rekapiCanvasContext = function (context, _) {

  'use strict';

  var Kapi = context.Kapi;

  /**
   * Gets (and optionally sets) height or width on a canvas.
   * @param {HTMLCanvas} context
   * @param {string} dimension The dimension (either "height" or "width") to
   *    get or set.
   * @param {number} opt_newSize The new value to set for `dimension`.
   * @return {number}
   */
  function canvasDimension (context, dimension, opt_newSize) {
    if (typeof opt_newSize !== 'undefined') {
      context[dimension] = opt_newSize;
      context.style[dimension] = opt_newSize + 'px';
    }

    return context[dimension];
  }


  /**
   * Takes care of some pre-drawing tasks for canvas animations.
  * @param {Kapi}
   */
  function beforeDraw (kapi) {
    if (kapi.config.clearOnUpdate) {
      kapi.canvasClear();
    }
  }


  /**
   * Draw all the `Actor`s at whatever position they are currently in.
   * @param {Kapi}
   * @return {Kapi}
   */
  function draw (kapi) {
    fireEvent(kapi, 'beforeDraw', _);
    var len = kapi._drawOrder.length;
    var drawOrder;

    if (kapi._drawOrderSorter) {
      var orderedActors = _.sortBy(kapi._canvasActors, kapi._drawOrderSorter);
      drawOrder = _.pluck(orderedActors, 'id');
    } else {
      drawOrder = kapi._drawOrder;
    }

    var currentActor, canvas_context;

    var i;
    for (i = 0; i < len; i++) {
      currentActor = kapi._canvasActors[drawOrder[i]];
      canvas_context = currentActor.context();
      currentActor.draw(canvas_context, currentActor.get());
    }
    fireEvent(kapi, 'afterDraw', _);

    return kapi;
  }


  function addActor (kapi, actor) {
    if (actor instanceof Kapi.CanvasActor) {
      kapi._drawOrder.push(actor.id);
      kapi._canvasActors[actor.id] = actor;
    }
  }


  function removeActor (kapi, actor) {
    if (actor instanceof Kapi.CanvasActor) {
      kapi._drawOrder = _.without(kapi._drawOrder, actor.id);
      delete kapi._canvasActors[actor.id];
    }
  }


  Kapi.prototype._contextInitHook.canvas = function () {
    this._drawOrder = [];
    this._drawOrderSorter = null;
    this._canvasActors = {};
    this.config.clearOnUpdate = true;

    _.extend(this._events, {
      'beforeDraw': []
      ,'afterDraw': []
    });

    _.each(['Height', 'Width'], function (dimension) {
      var dimensionLower = dimension.toLowerCase();
      if (this.config[dimensionLower]) {
        this['canvas' + dimension](this.config[dimensionLower]);
        delete this.config[dimension];
      }
    }, this);

    this.on('afterUpdate', draw);
    this.on('addActor', addActor);
    this.on('removeActor', removeActor);
    this.on('beforeDraw', beforeDraw);
  };


  /**
   * @param {number} opt_height
   * @return {number}
   */
  Kapi.prototype.canvasHeight = function (opt_height) {
    return canvasDimension(this.context, 'height', opt_height);
  };


  /**
   * @param {number} opt_width
   * @return {number}
   */
  Kapi.prototype.canvasWidth = function (opt_width) {
    return canvasDimension(this.context, 'width', opt_width);
  };


  /**
   * @return {Kapi}
   */
  Kapi.prototype.canvasClear = function () {
    if (this.context.getContext) {
      this.canvasContext().clearRect(
          0, 0, this.canvasWidth(), this.canvasHeight());
    }

    return this;
  };


  /**
   * @return {CanvasRenderingContext2D}
   */
  Kapi.prototype.canvasContext = function () {
    return this.context.getContext('2d');
  };


  /**
   * @return {Kapi}
   */
  Kapi.prototype.redraw = function () {
    draw(this);

    return this;
  };


  /**
   * @param {Kapi.Actor} actor
   * @param {number} layer
   * @return {Kapi.Actor|undefined}
   */
  Kapi.prototype.moveActorToLayer = function (actor, layer) {
    if (layer < this._drawOrder.length) {
      this._drawOrder = _.without(this._drawOrder, actor.id);
      this._drawOrder.splice(layer, 0, actor.id);

      return actor;
    }

    return;
  };


  /**
   * @param {function(Kapi.Actor, number)} sortFunction
   * @return {Kapi}
   */
  Kapi.prototype.setOrderFunction = function (sortFunction) {
    this._drawOrderSorter = sortFunction;
    return this;
  };


  /**
   * @return {Kapi}
   */
  Kapi.prototype.unsetOrderFunction = function () {
    this._drawOrderSorter = null;
    return this;
  };


  /**
   * @return {Object}
   */
  Kapi.prototype.exportTimeline = function () {
    var exportData = {
      'duration': this._animationLength
      ,'actorOrder': this._drawOrder.slice(0)
      ,'actors': {}
    };

    _.each(this._drawOrder, function (actorId) {
      exportData.actors[actorId] = this._actors[actorId].exportTimeline();
    }, this);

    return exportData;
  };

};
var rekapiCanvasActor = function (context, _) {

  'use strict';

  var Kapi = context.Kapi;

  function CanvasActorMethods () {}
  CanvasActorMethods.prototype = Kapi.Actor.prototype;

  /**
   * @param {Object} opt_config
   * @constructor
   */
  var CanvasActor = Kapi.CanvasActor = function (opt_config) {
    Kapi.Actor.call(this, opt_config);

    opt_config = opt_config || {};
    this.draw = opt_config.draw || noop;

    return this;
  };

  CanvasActor.prototype = new CanvasActorMethods();

  /**
   * @param {Object} opt_context
   * @return {Object}
   */
  CanvasActor.prototype.context = function (opt_context) {
    if (opt_context) {
      this._context = opt_context;
    }

    return this._context && this._context.getContext('2d');
  };

  /**
   * @param {number} layer
   * @return {Kapi.Actor|undefined}
   */
  CanvasActor.prototype.moveToLayer = function (layer) {
    return this.kapi.moveActorToLayer(this, layer);
  };
};
var rekapiDOM = function (context, _) {

  'use strict';

  var Kapi = context.Kapi;
  // TODO:  Change the name of this array to a clearer name, e.g. `vendorTransforms`
  var transforms = [
    'transform'
    ,'webkitTransform'
    ,'MozTransform'
    ,'oTransform'
    ,'msTransform'];
  var transformFunctions = [
    'translateX',
    'translateY',
    'scale',
    'scaleX',
    'scaleY',
    'rotate',
    'skewX',
    'skewY'];


  function setStyle (forElement, styleName, styleValue) {
    forElement.style[styleName] = styleValue;
  }


  /**
   * @param {string} name A transform function name
   * @return {boolean}
   */
  function isTransformFunction (name) {
    return _.contains(transformFunctions, name);
  }


  /**
   * Builds a concatenated string of given transform property values in order.
   *
   * @param {Array.<string>} orderedFunctions Array of ordered transform function names
   * @param {Object} transformProperties Transform properties to build together
   * @return {string}
   */
  function buildTransformValue (orderedFunctions, transformProperties) {
    var transformComponents = [];

    _.each(orderedFunctions, function(functionName) {
      if (transformProperties[functionName]) {
        transformComponents.push(functionName + '(' +
          transformProperties[functionName] + ')');
      }
    });

    return transformComponents.join(' ');
  }


  /**
   * Sets value for all vendor prefixed transform properties on a given context
   *
   * @param {Object} context The actor's DOM context
   * @param {string} transformValue The transform style value
   */
  function setTransformStyles (context, transformValue) {
    _.each(transforms, function(prefixedTransform) {
      setStyle(context, prefixedTransform, transformValue);
    });
  }


  /**
   * @param {HTMLElement} element
   * @constructor
   */
  Kapi.DOMActor = function (element) {
    Kapi.Actor.call(this);
    this._context = element;
    var className = this.getCSSName();

    // Add the class if it's not already there.
    // Using className instead of classList to make IE happy.
    if (!this._context.className.match(className)) {
      this._context.className += ' ' + className;
    }

    this._transformOrder = transformFunctions.slice(0);

    // Remove the instance's update method to allow the
    // ActorMethods.prototype.update method to be accessible.
    delete this.update;
    delete this.teardown;

    return this;
  };


  function DOMActorMethods () {}
  DOMActorMethods.prototype = Kapi.Actor.prototype;
  Kapi.DOMActor.prototype = new DOMActorMethods();


  /**
   * @param {HTMLElement} context
   * @param {Object} state
   */
  DOMActorMethods.prototype.update = function (context, state) {
    var propertyNames = _.keys(state);
    // TODO:  Optimize the following code so that propertyNames is not looped over twice.
    var transformFunctionNames = _.filter(propertyNames, isTransformFunction);
    var otherPropertyNames = _.reject(propertyNames, isTransformFunction);
    var otherProperties = _.pick(state, otherPropertyNames);

    if (transformFunctionNames.length) {
      var transformProperties = _.pick(state, transformFunctionNames);
      var builtStyle = buildTransformValue(this._transformOrder, transformProperties);
      setTransformStyles(context, builtStyle);
    } else if (state.transform) {
      setTransformStyles(context, state.transform);
    }

    _.each(otherProperties, function (styleValue, styleName) {
      setStyle(context, styleName, styleValue);
    }, this);
  };


  DOMActorMethods.prototype.teardown = function (context, state) {
    var classList = this._context.className.match(/\S+/g);
    var sanitizedClassList = _.without(classList, this.getCSSName());
    this._context.className = sanitizedClassList;
  };


  /**
   * @return {string}
   */
  DOMActorMethods.prototype.getCSSName = function () {
    return 'actor-' + this.id;
  };


  /**
   * Overrides the default transform function order.
   * 
   * @param {Array} orderedFunctions The Array of transform function names
   * @return {Kapi}
   */
  DOMActorMethods.prototype.setTransformOrder = function (orderedFunctions) {
    var unknownFunctions = _.reject(orderedFunctions, isTransformFunction);

    if (unknownFunctions.length) {
      throw 'Unknown or unsupported transform functions: ' + unknownFunctions.join(', ');
    }
    // Ignore duplicate transform function names in the array
    this._transformOrder = _.uniq(orderedFunctions);

    return this;
  };

};
var rekapiToCSS = function (context, _) {

  'use strict';

  var Kapi = context.Kapi;

  // CONSTANTS
  //
  var DEFAULT_GRANULARITY = 100;
  var TRANSFORM_TOKEN = 'TRANSFORM';
  var VENDOR_PREFIXES = Kapi.util.VENDOR_PREFIXES = {
    'microsoft': '-ms-'
    ,'mozilla': '-moz-'
    ,'opera': '-o-'
    ,'w3': ''
    ,'webkit': '-webkit-'
  };


  // TEMPLATES
  //

  /**
   * [0]: vendor
   * [1]: animation name
   * [2]: keyframes
   */
  var KEYFRAME_TEMPLATE = [
    '@%skeyframes %s-keyframes {'
    ,'%s'
    ,'}'
  ].join('\n');

  /**
   * [0] class name
   * [1] class attributes
   */
  var CLASS_BOILERPLATE = [
    '.%s {'
    ,'  position: absolute;'
    ,'%s'
    ,'}'
  ].join('\n');


  // PROTOTYPE EXTENSIONS
  //
  /**
   * @param {Object} opts
   */
  context.Kapi.prototype.toCSS = function (opts) {
    opts = opts || {};
    var animationCSS = [];
    var actorIds = this.getActorIds();

    _.each(actorIds, function (id) {
      animationCSS.push(this.getActor(id).toCSS(opts));
    }, this);

    return animationCSS.join('\n');
  };


  /**
   * @param {Object} opts
   */
  context.Kapi.Actor.prototype.toCSS = function (opts) {
    opts = opts || {};
    var actorCSS = [];
    var animName = opts.name || this.getCSSName();
    var granularity = opts.granularity || DEFAULT_GRANULARITY;
    var actorClass = generateCSSClass(this, opts.vendors, animName);
    actorCSS.push(actorClass);
    var keyframes = generateActorKeyframes(this, granularity);
    var boilerplatedKeyframes = applyVendorBoilerplates(
        keyframes, animName, opts.vendors);
    actorCSS.push(boilerplatedKeyframes);

    return actorCSS.join('\n');
  };


  // UTILITY FUNCTIONS
  //
  /**
   * @param {string} str
   */
  function isColorString (str) {
    return (/rgb/).test(str);
  }


  /**
   * @param {Kapi.Actor} actor
   */
  function serializeActorStep (actor) {
    var serializedProps = ['{'];
    var printVal;
    _.each(actor.get(), function (val, key) {
      printVal = val;
      var printKey = key;

      if (key === 'transform') {
        printKey = TRANSFORM_TOKEN;
      }

      serializedProps.push(printKey + ':' + printVal + ';');
    });

    serializedProps.push('}');
    return serializedProps.join('');
  }


  /**
   * @param {Kapi.Actor} actor
   * @param {number} granularity
   * @return {string}
   */
  function generateActorKeyframes (actor, granularity) {
    var animLength = actor.getLength();
    var delay = actor.getStart();
    var serializedFrames = [];
    var percent, adjustedPercent, stepPrefix;
    var increment = animLength / granularity;
    var adjustedIncrement = Math.floor(increment);
    var animPercent = animLength / 100;
    var loopStart = delay + increment;
    var loopEnd = animLength + delay - increment;

    actor.updateState(delay);
    serializedFrames.push('  from ' + serializeActorStep(actor));

    var i;
    for (i = loopStart; i <= loopEnd; i += increment) {
      actor.updateState(i);
      percent = (i - delay) / animPercent;
      adjustedPercent = +percent.toFixed(2);
      stepPrefix = adjustedPercent + '% ';
      serializedFrames.push('  ' + stepPrefix + serializeActorStep(actor));
    }

    actor.updateState(animLength + delay);
    serializedFrames.push('  to ' + serializeActorStep(actor));

    return serializedFrames.join('\n');
  }


  /**
   * @param {string} toKeyframes Generated keyframes to wrap in boilerplates
   * @param {string} animName
   * @param {[string]} opt_vendors Vendor boilerplates to be applied.  Should be
   *     any of the values in Kapi.util.VENDOR_PREFIXES.
   * @return {string}
   */
  function applyVendorBoilerplates (toKeyframes, animName, opt_vendors) {
    opt_vendors = opt_vendors || ['w3'];
    var renderedKeyframes = [];

    _.each(opt_vendors, function (vendor) {
      var renderedChunk = printf(KEYFRAME_TEMPLATE,
          [VENDOR_PREFIXES[vendor], animName, toKeyframes]);
      var prefixedKeyframes =
        applyVendorPropertyPrefixes(renderedChunk, vendor);
      renderedKeyframes.push(prefixedKeyframes);
    });

    return renderedKeyframes.join('\n');
  }


  /**
   * @param {string} keyframes
   * @param {vendor} vendor
   * @return {string}
   */
  function applyVendorPropertyPrefixes (keyframes, vendor) {
    var transformRegExp = new RegExp(TRANSFORM_TOKEN, 'g');
    var prefixedTransformKey = VENDOR_PREFIXES[vendor] + 'transform';
    var prefixedKeyframes =
      keyframes.replace(transformRegExp, prefixedTransformKey);

    return prefixedKeyframes;
  }


  /**
   * @param {Kapi.Actor} actor
   * @param {[string]} opt_vendors
   * @param {string} animName
   */
  function generateCSSClass (actor, opt_vendors, animName) {
    opt_vendors = opt_vendors || ['w3'];
    var classAttrs = [];
    var vendorAttrs;

    _.each(opt_vendors, function (vendor) {
      vendorAttrs = generateCSSVendorAttributes(actor, vendor, animName);
      classAttrs.push(vendorAttrs);
    });

    var boilerplatedClass = printf(CLASS_BOILERPLATE
        ,[animName, classAttrs.join('\n')]);

    return boilerplatedClass;
  }


  /**
   * @param {Kapi.Actor} actor
   * @param {string} vendor
   * @param {string} animName
   */
  function generateCSSVendorAttributes (actor, vendor, animName) {
    var generatedAttributes = [];
    var prefix = VENDOR_PREFIXES[vendor];
    var start = actor.getStart();
    var duration = actor.getEnd() - start;

    duration = printf('  %sanimation-duration: %sms;'
        ,[prefix, duration]);
    generatedAttributes.push(duration);

    var animationName = printf('  %sanimation-name: %s;'
        ,[prefix, animName + '-keyframes']);
    generatedAttributes.push(animationName);

    var delay = printf('  %sanimation-delay: %sms;', [prefix, start]);
    generatedAttributes.push(delay);

    var fillMode = printf('  %sanimation-fill-mode: forwards;', [prefix]);
    generatedAttributes.push(fillMode);

    return generatedAttributes.join('\n');
  }


  /**
   * @param {string} formatter
   * @param {[string]} args
   * @return {string}
   */
  var printf = Kapi.util.printf = function (formatter, args) {
    var composedStr = formatter;
    _.each(args, function (arg) {
      composedStr = composedStr.replace('%s', arg);
    });

    return composedStr;
  };

};
var rekapi = function (global, deps) {

  'use strict';

  // If `deps` is defined, it means that Rekapi is loaded via AMD.
  // Don't use global context in this case so that the global scope
  // is not polluted by the Kapi object.
  var context = deps ? {} : global;

  var _ = (deps && deps.underscore) ? deps.underscore : context._;
  var Tweenable = (deps && deps.Tweenable) ?
      deps.Tweenable : context.Tweenable;

  rekapiCore(context, _, Tweenable);
  rekapiActor(context, _, Tweenable);
  rekapiKeyframeProperty(context, _, Tweenable);

  // Extensions
  if (typeof rekapiDOM === 'function') {
    rekapiDOM(context, _, Tweenable);
  }
  if (typeof rekapiToCSS === 'function') {
    rekapiToCSS(context, _, Tweenable);
  }
  if (typeof rekapiCanvasContext === 'function') {
    rekapiCanvasContext(context, _, Tweenable);
  }
  if (typeof rekapiCanvasActor === 'function') {
    rekapiCanvasActor(context, _, Tweenable);
  }

  return context.Kapi;
};


if (typeof define === 'function' && define.amd) {
  var underscoreAlreadyInUse = (typeof _ !== 'undefined');

  // Expose Rekapi as an AMD module if it's loaded with RequireJS or similar.
  // Shifty and Underscore are set as dependencies of this module.
  //
  // The rekapi module is anonymous so that it can be required with any name.
  // Example: define(['lib/rekapi.min'], function(Kapi) { ... });
  define(['shifty', 'underscore'], function (Tweenable, Underscore) {
    var underscoreSupportsAMD = (Underscore !== null);
    var deps = {  Tweenable: Tweenable,
                  // Some versions of Underscore.js support AMD, others don't.
                  // If not, use the `_` global.
                  underscore: underscoreSupportsAMD ? Underscore : _ };
    var Kapi = rekapi(global, deps);

    if (typeof KAPI_DEBUG !== 'undefined' && KAPI_DEBUG === true) {
      Kapi.underscore_version = deps.underscore.VERSION;
    }

    if (!underscoreAlreadyInUse && underscoreSupportsAMD) {
      // Prevent Underscore from polluting the global scope.
      // This global can be safely removed since Rekapi keeps its own reference
      // to Underscore via the `deps` object passed earlier as an argument.
      global._ = undefined;
    }

    return Kapi;
  });
} else {
  // Load Rekapi normally (creating a Kapi global) if not using an AMD loader.

  // Note: `global` is not defined when running unit tests. Pass `this` instead.
  rekapi(typeof global !== 'undefined' ? global : this);
}
} (this));
