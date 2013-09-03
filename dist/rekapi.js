/*! Rekapi - v0.15.17 - 2013-09-02 - http://rekapi.com */
/*!
 * Rekapi - Rewritten Kapi.
 * https://github.com/jeremyckahn/rekapi
 *
 * By Jeremy Kahn (jeremyckahn@gmail.com)
 *
 * Make fun keyframe animations with JavaScript.
 * Dependencies: Underscore.js (https://github.com/documentcloud/underscore),
 *   Shifty.js (https://github.com/jeremyckahn/shifty).
 * MIT License.  This code free to use, modify, distribute and enjoy.
 */

;(function (global) {

// A hack for UglifyJS defines
if (typeof KAPI_DEBUG === 'undefined') {
  KAPI_DEBUG = true;
}


// REKAPI-GLOBAL METHODS
// These are global in development, but get wrapped in a closure at build-time.

/*!
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


/*!
 * @param {Kapi} kapi
 */
function recalculateAnimationLength (kapi, _) {
  var actorLengths = [];

  _.each(kapi._actors, function (actor) {
    actorLengths.push(actor.getEnd());
  });

  kapi._animationLength = Math.max.apply(Math, actorLengths);
}


/*!
 * Does nothing.  Absolutely nothing at all.
 */
function noop () {
  // NOOP!
}


var rekapiCore = function (root, _, Tweenable) {

  'use strict';

  // GLOBAL is read from for various environment properties
  // http://stackoverflow.com/questions/3277182/how-to-get-the-global-object-in-javascript
  var Fn = Function, GLOBAL = new Fn('return this')();


  /*!
   * Determines which iteration of the loop the animation is currently in.
   * @param {Kapi} kapi
   * @param {number} timeSinceStart
   */
  function determineCurrentLoopIteration (kapi, timeSinceStart) {
    var currentIteration = Math.floor(
        (timeSinceStart) / kapi._animationLength);
    return currentIteration;
  }


  /*!
   * Calculate how many milliseconds since the animation began.
   * @param {Kapi} kapi
   * @return {number}
   */
  function calculateTimeSinceStart (kapi) {
    return now() - kapi._loopTimestamp;
  }


  /*!
   * Determines is the animation is complete or not.
   * @param {Kapi} kapi
   * @param {number} currentLoopIteration
   */
  function isAnimationComplete (kapi, currentLoopIteration) {
    return currentLoopIteration >= kapi._timesToIterate
        && kapi._timesToIterate !== -1;
  }


  /*!
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


  /*!
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


  /*!
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


  /*!
   * Calculate how far in the animation loop `kapi` is, in milliseconds, and
   * update based on that time.
   * @param {Kapi} kapi
   */
  function updateToCurrentMillisecond (kapi) {
    updateToMillisecond(kapi, calculateTimeSinceStart(kapi));
  }


  /*!
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


  /*!
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


  /*!
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


  /*!
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

  var now = Tweenable.now;

  var defaultConfig = {
    'fps': 60
  };

  var playState = {
    'STOPPED': 'stopped'
    ,'PAUSED': 'paused'
    ,'PLAYING': 'playing'
  };


  /**
   * Rekapi constructor.  Valid values for `opt_config` are:
   *
   * - __fps__ (_number_): The frames per second at which the animation updates.  The default value is 30.
   * - __context__ (_Object_): The context that the animation will run in.  Can be any type of `Object`; gets used by the renderer and inherited by the `Kapi.Actor`s as they are added to the animation.  This isn't always needed, it usually just applies to `<canvas>` animations.  See the documentation on the [`<canvas>` extension](../ext/canvas/rekapi.canvas.context.js.html) for more info.
   *
   * __[Example](../../../../docs/examples/kapi.html)__
   * @param {Object} opt_config
   * @constructor
   */
  function Kapi (opt_config) {
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
  }


  /*!
   * @type {Object.<function>} Contains the context init function to be called
   * in the Kapi constructor.
   */
  Kapi.prototype._contextInitHook = {};


  /**
   * Add a `Kapi.Actor` to the animation.
   *
   * __[Example](../../../../docs/examples/add_actor.html)__
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
      recalculateAnimationLength(this, _);
      actor.setup();

      fireEvent(this, 'addActor', _, actor);
    }

    return this;
  };


  /**
   * Retrieve a `Kapi.Actor` from the `Kapi` instance by its ID.  All `Actor`s have an `id` property.
   *
   * __[Example](../../../../docs/examples/get_actor.html)__
   * @param {number} actorId
   * @return {Kapi.Actor}
   */
  Kapi.prototype.getActor = function (actorId) {
    return this._actors[actorId];
  };


  /**
   * Retrieve the IDs of all `Kapi.Actor`s in a `Kapi` instance as an Array.
   *
   * __[Example](../../../../docs/examples/get_actor_ids.html)__
   * @return {Array.<number>}
   */
  Kapi.prototype.getActorIds = function () {
    return _.pluck(this._actors, 'id');
  };


  /**
   * Retrieve all `Kapi.Actor`s in the animation as an Object.  Actors' IDs correspond to the property names of the returned Object.
   *
   * __[Example](../../../../docs/examples/get_all_actors.html)__
   * @return {Array}
   */
  Kapi.prototype.getAllActors = function () {
    return _.clone(this._actors);
  };


  /**
   * Remove a `Kapi.Actor` from the animation.  This does not destroy the `Actor`, it only removes the link between it and the `Kapi` instance.
   *
   * __[Example](../../../../docs/examples/remove_actor.html)__
   * @param {Kapi.Actor} actor
   * @return {Kapi}
   */
  Kapi.prototype.removeActor = function (actor) {
    delete this._actors[actor.id];
    delete actor.kapi;
    actor.teardown();
    recalculateAnimationLength(this, _);

    fireEvent(this, 'removeActor', _, actor);

    return this;
  };


  /**
   * Play the animation on a loop, either a set amount of times or infinitely.  If `opt_howManyTimes` is omitted, the animation will loop infinitely.
   *
   * __[Example](../../../../docs/examples/play.html)__
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

    fireEvent(this, 'playStateChange', _);
    fireEvent(this, 'play', _);

    return this;
  };


  /**
   * Move to a specific millisecond on the timeline and play from there. `opt_howManyTimes` works as it does in `play()`.
   *
   * __[Example](../../../../docs/examples/play_from.html)__
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
   * Play from the last frame that was drawn with `render()`. `opt_howManyTimes` works as it does in `play()`.
   *
   * __[Example](../../../../docs/examples/play_from_current.html)__
   * @param {number} opt_howManyTimes
   * @return {Kapi}
   */
  Kapi.prototype.playFromCurrent = function (opt_howManyTimes) {
    return this.playFrom(this._lastUpdatedMillisecond, opt_howManyTimes);
  };


  /**
   * Pause the animation.  A "paused" animation can be resumed from where it left off with `play()`.
   *
   * __[Example](../../../../docs/examples/pause.html)__
   * @return {Kapi}
   */
  Kapi.prototype.pause = function () {
    if (this._playState === playState.PAUSED) {
      return this;
    }

    this._playState = playState.PAUSED;
    cancelLoop(this);
    this._pausedAtTime = now();

    fireEvent(this, 'playStateChange', _);
    fireEvent(this, 'pause', _);

    return this;
  };


  /**
   * Stop the animation.  A "stopped" animation will start from the beginning if `play()` is called.
   *
   * __[Example](../../../../docs/examples/stop.html)__
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
   * Return whether or not the animation is playing (meaning not paused or stopped).
   *
   * __[Example](../../../../docs/examples/is_playing.html)__
   * @return {boolean}
   */
  Kapi.prototype.isPlaying = function () {
    return this._playState === playState.PLAYING;
  };


  /**
   * Return the length of the animation, in milliseconds.
   *
   * __[Example](../../../../docs/examples/animation_length.html)__
   * @return {number}
   */
  Kapi.prototype.animationLength = function () {
    return this._animationLength;
  };


  /**
   * Return the normalized (between 0 and 1) timeline position that was last calculated.
   *
   * __[Example](../../../../docs/examples/last_position_updated.html)__
   * @return {number}
   */
  Kapi.prototype.lastPositionUpdated = function () {
    return (this._lastUpdatedMillisecond / this._animationLength);
  };


  /**
   * Return the number of `Kapi.Actor`s in the animation.
   *
   * __[Example](../../../../docs/examples/actor_count.html)__
   * @return {number}
   */
  Kapi.prototype.actorCount = function () {
    return _.size(this._actors);
  };


  /**
   * Get and optionally set the framerate of the animation.  There's generally no point in going above 60.
   *
   * __[Example](../../../../docs/examples/framerate.html)__
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
   * Update the position of all the `Kapi.Actor`s to `opt_millisecond`.  If `opt_millisecond` is omitted, update to the last millisecond that the animation was updated to (it's a re-update).
   *
   * __[Example](../../../../docs/examples/update.html)__
   * @param {number=} opt_millisecond
   * @return {Kapi}
   */
  Kapi.prototype.update = function (opt_millisecond) {
    if (opt_millisecond === undefined) {
      opt_millisecond = this._lastUpdatedMillisecond;
    }

    fireEvent(this, 'beforeUpdate', _);
    _.each(this._actors, function (actor) {
      actor.updateState(opt_millisecond);
      if (typeof actor.update === 'function') {
        actor.update(actor.context(), actor.get());
      }
    });
    this._lastUpdatedMillisecond = opt_millisecond;
    fireEvent(this, 'afterUpdate', _);

    return this;
  };


  /**
   * Bind a handler function to a Kapi event.  Valid events are:
   *
   * - __animationComplete__: Fires when all animations loops have completed.
   * - __playStateChange__: Fires when the animation is played, paused, or stopped.
   * - __play__: Fires when the animation is `play()`ed.
   * - __pause__: Fires when the animation is `pause()`d.
   * - __stop__: Fires when the animation is `stop()`ped.
   * - __beforeUpdate__: Fires each frame before all Actors are updated.
   * - __afterUpdate__: Fires each frame after all Actors are updated.
   * - __addActor__: Fires when an Actor is added.
   * - __removeActor__: Fires when an Actor is removed.
   * - __timelineModified__: Fires when a keyframe is added, modified or removed.
   *
   * __[Example](../../../../docs/examples/bind.html)__
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
   * Unbind `opt_handler` from a Kapi event.  If `opt_handler` is omitted, all handler functions bound to `eventName` are unbound.  Valid events correspond to the list under `bind()`.
   *
   * __[Example](../../../../docs/examples/unbind.html)__
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
   * Export the current state of the animation into a serializable `Object`.
   *
   * __[Example](../../../docs/examples/export_timeline.html)__
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
  if (KAPI_DEBUG) {
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

  root.Kapi = Kapi;

};

var rekapiActor = function (context, _, Tweenable) {

  'use strict';

  var DEFAULT_EASING = 'linear';
  var Kapi = context.Kapi;


  /*!
   * Sorts an array numerically, from smallest to largest.
   * @param {Array} array The Array to sort.
   * @return {Array} The sorted Array.
   */
  function sortNumerically (array) {
    return array.sort(function (a, b) {
      return a - b;
    });
  }


  /*!
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


  /*!
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


  /*!
   * Compute and fill all timeline caches.
   * @param {Kapi.Actor} actor
   */
  function cachePropertiesToSegments (actor) {
    _.each(actor._timelinePropertyCaches, function (propertyCache, cacheId) {
      var latestProperties = getLatestPropeties(actor, +cacheId);
      _.defaults(propertyCache, latestProperties);
    });
  }


  /*!
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


  /*!
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


  /*!
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


  /*!
   * Empty out and re-cache internal KeyframeProperty data.
   * @param {Kapi.Actor}
   */
  function invalidatePropertyCache (actor) {
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

    if (actor.kapi) {
      fireEvent(actor.kapi, 'timelineModified', _);
    }
  }


  /*!
   * Updates internal Kapi and Actor data after a KeyframeProperty
   * modification method is called.
   *
   * TODO: This should be moved to core.
   *
   * @param {Kapi.Actor} actor
   */
  function cleanupAfterKeyframeModification (actor) {
    sortPropertyTracks(actor);
    invalidatePropertyCache(actor);
    recalculateAnimationLength(actor.kapi, _);
  }


  /**
   * Create a `Kapi.Actor` instance.  Note that the rest of the API docs for `Kapi.Actor` will simply refer to this Object as `Actor`.
   *
   * Valid properties of `opt_config` (you can omit the ones you don't need):
   *
   * - __context__ (_Object_): The context that this Actor is associated with. If omitted, this Actor gets the `Kapi` instance's context when it is added with [`Kapi#addActor`](rekapi.core.js.html#addActor).
   * - __setup__ (_Function_): A function that gets called when the `Actor` is added with [`Kapi#addActor`](rekapi.core.js.html#addActor).
   * - __update__ (_Function(Object, Object)_): A function that gets called every time that the `Actor`'s state is updated. It receives two parameters: A reference to the `Actor`'s context and an Object containing the current state properties.
   * - __teardown__ (_Function_): A function that gets called when the `Actor` is removed with [`Kapi#removeActor`](rekapi.core.js.html#removeActor).
   *
   * `Kapi.Actor` does _not_ render to any context.  It is a base class.  Use the [`Kapi.CanvasActor`](../ext/canvas/rekapi.canvas.actor.js.html) or [`Kapi.DOMActor`](../ext/dom/rekapi.dom.actor.js.html) subclasses to render to the screen.  You can also make your own rendering subclass - see the source code for the aforementioned examples.
   *
   * __[Example](../../../../docs/examples/actor.html)__
   * @param {Object} opt_config
   * @constructor
   */
  Kapi.Actor = function (opt_config) {

    opt_config = opt_config || {};

    // Steal the `Tweenable` constructor.
    Tweenable.call(this);

    _.extend(this, {
      '_propertyTracks': {}
      ,'_timelinePropertyCaches': {}
      ,'_timelinePropertyCacheIndex': []
      ,'_keyframeProperties': {}
      ,'id': _.uniqueId()
      ,'setup': opt_config.setup || noop
      ,'update': opt_config.update || noop
      ,'teardown': opt_config.teardown || noop
      ,'data': {}
    });

    if (opt_config.context) {
      this.context(opt_config.context);
    }

    return this;
  };
  var Actor = Kapi.Actor;


  // Kind of a fun way to set up an inheritance chain.  `ActorMethods` prevents
  // methods on `Actor.prototype` from polluting `Tweenable`'s prototype with
  // `Actor` specific methods.
  var ActorMethods = function () {};
  ActorMethods.prototype = Tweenable.prototype;
  Actor.prototype = new ActorMethods();
  // But the magic doesn't stop here!  `Actor`'s constructor steals the
  // `Tweenable` constructor.


  /**
   * Get and optionally set the `Actor`'s context.
   *
   * __[Example](../../../../docs/examples/actor_context.html)__
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
   * Create a keyframe for the `Actor`.  `millisecond` defines where in the animation to place the keyframe, in milliseconds (assumes that `0` is when the animation began).  The animation length will automatically "grow" to accommodate any keyframe position.
   *
   * `properties` should contain all of the properties that define the keyframe's state.  These properties can be any value that can be tweened by [Shifty](https://github.com/jeremyckahn/shifty) (numbers, color strings, CSS properties).
   *
   * __Note:__ Internally, this creates [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s and places them on a "track."  These [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s are managed for you by the `Actor` APIs.
   *
   * ## Easing
   *
   * `opt_easing`, if specified, can be a string or an Object.  If it's a string, all properties in `properties` will have the same easing formula applied to them. For example:
   *
   * ```javascript
   * actor.keyframe(1000, {
   *     'x': 100,
   *     'y': 100
   *   }, 'easeOutSine');
   * ```
   *
   * Both `x` and `y` will have `easeOutSine` applied to them.  You can also specify multiple easing formulas with an Object:
   *
   * ```javascript
   * actor.keyframe(1000, {
   *     'x': 100,
   *     'y': 100
   *   }, {
   *     'x': 'easeinSine',
   *     'y': 'easeOutSine'
   *   });
   * ```
   *
   * `x` will ease with `easeInSine`, and `y` will ease with `easeOutSine`.  Any unspecified properties will ease with `linear`.  If `opt_easing` is omitted, all properties will default to `linear`.
   *
   * ## Keyframe inheritance
   *
   * Keyframes always inherit missing properties from the keyframes that came before them.  For example:
   *
   * ```javascript
   * actor.keyframe(0, {
   *   'x': 100
   * }).keyframe(1000{
   *   // Inheriting the `x` from above!
   *   'y': 50
   * });
   * ```
   *
Keyframe `1000` will have a `y` of `50`, and an `x` of `100`, because `x` was inherited from keyframe `0`.
   * @param {number} millisecond Where on the timeline to set the keyframe.
   * @param {Object} properties Keyframe properties to set for the keyframe.
   * @param {string|Object} opt_easing Optional easing string or configuration object.
   * @return {Kapi.Actor}
   */
  Actor.prototype.keyframe = function keyframe (
      millisecond, properties, opt_easing) {

    var originalEasingString;

    // TODO:  The opt_easing logic seems way overcomplicated, it's probably out
    // of date.  Multiple eases landed first in Rekapi, then were pushed
    // upstream into Shifty.  There's likely some redundant logic here.
    opt_easing = opt_easing || DEFAULT_EASING;

    if (typeof opt_easing === 'string') {
      originalEasingString = opt_easing;
      opt_easing = {};
      _.each(properties, function (property, propertyName) {
        opt_easing[propertyName] = originalEasingString;
      });
    }

    // If `opt_easing` was passed as an Object, this will fill in any missing
    // opt_easing properties with the default equation.
    _.each(properties, function (property, propertyName) {
      opt_easing[propertyName] = opt_easing[propertyName] || DEFAULT_EASING;
    });

    _.each(properties, function (value, name) {
      var newKeyframeProperty = new Kapi.KeyframeProperty(
          this, millisecond, name, value, opt_easing[name]);

      this._keyframeProperties[newKeyframeProperty.id] = newKeyframeProperty;

      if (!this._propertyTracks[name]) {
        this._propertyTracks[name] = [];
      }

      this._propertyTracks[name].push(newKeyframeProperty);
      sortPropertyTracks(this);
    }, this);

    if (this.kapi) {
      recalculateAnimationLength(this.kapi, _);
    }

    invalidatePropertyCache(this);

    return this;
  };


  /**
   * Gets the [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html) from an `Actor`'s [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html) track. Returns `undefined` if there were no properties found with the specified parameters.
   *
   * __[Example](../../../../docs/examples/actor_get_keyframe_property.html)__
   * @param {string} property The name of the property.
   * @param {number} index The 0-based index of the KeyframeProperty in the Actor's KeyframeProperty track.
   * @return {Kapi.KeyframeProperty|undefined}
   */
  Actor.prototype.getKeyframeProperty = function (property, index) {
    if (this._propertyTracks[property]
        && this._propertyTracks[property][index]) {
      return this._propertyTracks[property][index];
    }
  };


  /**
   * Modify a specified [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html) stored on an `Actor`.  Essentially, this calls [`KeyframeProperty#modifyWith`](rekapi.keyframeprops.js.html#modifyWith) (passing along `newProperties`) and then performs some cleanup.
   *
   * __[Example](../../../../docs/examples/actor_modify_keyframe_property.html)__
   * @param {string} property The name of the property to modify
   * @param {number} index The property track index of the KeyframeProperty to modify
   * @param {Object} newProperties The properties to augment the KeyframeProperty with
   * @return {Kapi.Actor}
   */
  Actor.prototype.modifyKeyframeProperty = function (
      property, index, newProperties) {

    if (this._propertyTracks[property]
        && this._propertyTracks[property][index]) {
      this._propertyTracks[property][index].modifyWith(newProperties);
    }

    cleanupAfterKeyframeModification(this);

    return this;
  };


  /**
   * Get a list of all the track names for an `Actor`.
   *
   * __[Example](../../../../docs/examples/actor_get_track_names.html)__
   * @return {Array.<string>}
   */
  Actor.prototype.getTrackNames = function () {
    return _.keys(this._propertyTracks);
  };


  /**
   * Get the property track length for an `Actor` (how many `KeyframeProperty`s are in a given property track).
   *
   * __[Example](../../../../docs/examples/actor_get_track_length.html)__
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
   * Copy all of the properties that at one point in the timeline to another point. This is useful for many things, particularly for bringing a `Kapi.Actor` back to its original position.
   *
   * __[Example](../../../../docs/examples/actor_copy_properties.html)__
   * @param {number} copyTo The millisecond to copy KeyframeProperties to
   * @param {number} copyFrom The millisecond to copy KeyframeProperties from
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
   * Extend the last state on this `Actor`'s timeline to create a animation wait. The state does not change during this time.
   *
   * __[Example](../../../../docs/examples/actor_wait.html)__
   * @param {number} until At what point in the animation the Actor should wait until (relative to the start of the animation)
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
   * Get the millisecond of the first state of an `Actor` (when it first starts animating).  You can get the start time of a specific track with `opt_trackName`.
   *
   * __[Example](../../../../docs/examples/actor_get_start.html)__
   * @param {string} opt_trackName
   * @return {number}
   */
  Actor.prototype.getStart = function (opt_trackName) {
    var starts = [];

    if (opt_trackName) {
      starts.push(this._propertyTracks[opt_trackName][0].millisecond);
    } else {
      _.each(this._propertyTracks, function (propertyTrack) {
        if (propertyTrack.length) {
          starts.push(propertyTrack[0].millisecond);
        }
      });
    }

    if (starts.length === 0) {
      starts = [0];
    }

    return Math.min.apply(Math, starts);
  };


  /**
   * Get the millisecond of the last state of an `Actor` (when it is done animating).  You can get the last state for a specific track with `opt_trackName`.
   *
   * __[Example](../../../../docs/examples/actor_get_end.html)__
   * @param {string} opt_trackName
   * @return {number}
   */
  Actor.prototype.getEnd = function (opt_trackName) {
    var latest = 0;
    var tracksToInspect = this._propertyTracks;

    if (opt_trackName) {
      tracksToInspect = {};
      tracksToInspect[opt_trackName] = this._propertyTracks[opt_trackName];
    }

    _.each(tracksToInspect, function (propertyTrack) {
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
   * Get the length of time in milliseconds that an `Actor` animates for.  You can get the length of time that a specific track animates for with `opt_trackName`.
   *
   * __[Example](../../../../docs/examples/actor_get_length.html)__
   * @param {string} opt_trackName
   * @return {number}
   */
  Actor.prototype.getLength = function (opt_trackName) {
    return this.getEnd(opt_trackName) - this.getStart(opt_trackName);
  };


  /*
   * Determines if an actor has a keyframe set at a given millisecond.  Can optionally scope the lookup to a specific property name.
   *
   * @param {number} millisecond Point on the timeline to query.
   * @param {string} opt_trackName Optional name of a property track.
   * @return {boolean}
   */
  Actor.prototype.hasKeyframeAt = function(millisecond, opt_trackName) {
    var tracks = this._propertyTracks;

    if (opt_trackName) {
      if (!_.has(tracks, opt_trackName)) {
        return false;
      }
      tracks = _.pick(tracks, opt_trackName);
    }

    return _.find(tracks, function (propertyTrack, trackName) {
      var retrievedProperty =
          findPropertyAtMillisecondInTrack(this, trackName, millisecond);
      return retrievedProperty !== undefined;
    }, this) !== undefined;
  };


  /**
   * Moves a Keyframe from one point on the timeline to another.  Although this method does error checking for you to make sure the operation can be safely performed, an effective pattern is to use [`hasKeyframeAt`](#hasKeyframeAt) to see if there is already a keyframe at the requested `to` destination.
   *
   * __[Example](../../../../docs/examples/actor_move_keyframe.html)__
   * @param {number} from The millisecond of the keyframe to be moved.
   * @param {number} to The millisecond of where the keyframe should be moved to.
   * @return {boolean} Whether or not the keyframe was successfully moved.
   */
  Actor.prototype.moveKeyframe = function (from, to) {
    if (!this.hasKeyframeAt(from) || this.hasKeyframeAt(to)) {
      return false;
    }

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var property = findPropertyAtMillisecondInTrack(this, trackName, from);

      if (property) {
        property.modifyWith({
          'millisecond': to
        });
      }
    }, this);

    cleanupAfterKeyframeModification(this);

    return true;
  };


  /**
   * Augment the `value` or `easing` of the [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s at a given millisecond.  Any [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s omitted in `stateModification` or `opt_easing` are not modified.  Here's how you might use it:
   *
   * ```javascript
   * actor.keyframe(0, {
   *   'x': 10,
   *   'y': 20
   * }).keyframe(1000, {
   *   'x': 20,
   *   'y': 40
   * }).keyframe(2000, {
   *   'x': 30,
   *   'y': 60
   * })
   *
   * // Changes the state of the keyframe at millisecond 1000.
   * // Modifies the value of 'y' and the easing of 'x.'
   * actor.modifyKeyframe(1000, {
   *   'y': 150
   * }, {
   *   'x': 'easeFrom'
   * });
   * ```
   *
   * __[Example](../../../../docs/examples/actor_modify_keyframe.html)__
   * @param {number} millisecond
   * @param {Object} stateModification
   * @param {Object} opt_easingModification
   * @return {Kapi.Actor}
   */
  Actor.prototype.modifyKeyframe = function (
      millisecond, stateModification, opt_easingModification) {
    opt_easingModification = opt_easingModification || {};

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var property = findPropertyAtMillisecondInTrack(
          this, trackName, millisecond);

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
   * Remove all [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s at a given millisecond in the animation.
   *
   * __[Example](../../../../docs/examples/actor_remove_keyframe.html)__
   * @param {number} millisecond The location on the timeline of the keyframe to remove.
   * @return {Kapi.Actor}
   */
  Actor.prototype.removeKeyframe = function (millisecond) {
    _.each(this._propertyTracks, function (propertyTrack, propertyName) {
      var i = -1;
      var foundProperty = false;

      _.find(propertyTrack, function (keyframeProperty) {
        i++;
        foundProperty = (millisecond === keyframeProperty.millisecond);
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
      recalculateAnimationLength(this.kapi, _);
    }

    invalidatePropertyCache(this);

    return this;
  };


  /**
   * Remove all `KeyframeProperty`s set on the `Actor`.
   *
   * __[Example](../../../../docs/examples/actor_remove_all_keyframe_properties.html)__
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
   * Calculate and set the `Actor`'s position at `millisecond` in the animation.
   *
   * __[Example](../../../../docs/examples/actor_update_state.html)__
   * @param {number} millisecond
   * @return {Kapi.Actor}
   */
  Actor.prototype.updateState = function (millisecond) {
    var startMs = this.getStart();
    var endMs = this.getEnd();

    millisecond = Math.min(endMs, millisecond);

    if (startMs <= millisecond) {
      var latestCacheId = getPropertyCacheIdForMillisecond(this, millisecond);
      var propertiesToInterpolate =
          this._timelinePropertyCaches[this._timelinePropertyCacheIndex[
          latestCacheId]];
      var interpolatedObject = {};

      _.each(propertiesToInterpolate, function (keyframeProperty, propName) {
        // TODO: Try to get rid of this null check
        if (keyframeProperty) {
          if (this._beforeKeyframePropertyInterpolate !== noop) {
            this._beforeKeyframePropertyInterpolate(keyframeProperty);
          }

          interpolatedObject[propName] =
              keyframeProperty.getValueAt(millisecond);

          if (this._afterKeyframePropertyInterpolate !== noop) {
            this._afterKeyframePropertyInterpolate(
                keyframeProperty, interpolatedObject);
          }
        }
      }, this);

      this.set(interpolatedObject);
    }

    return this;
  };


  /*!
   * @param {Kapi.KeyframeProperty} keyframeProperty
   * @abstract
   */
  Actor.prototype._beforeKeyframePropertyInterpolate = noop;


  /*!
   * @param {Kapi.KeyframeProperty} keyframeProperty
   * @param {Object} interpolatedObject
   * @abstract
   */
  Actor.prototype._afterKeyframePropertyInterpolate = noop;


  /**
   * Export a serializable `Object` of this `Actor`'s timeline property tracks and [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s.
   *
   * __[Example](../../../../docs/examples/actor_export_timeline.html)__
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
   * Represents an individual component of a `Kapi.Actor`'s keyframe state.  In many cases you won't need to deal with this directly, `Kapi.Actor` abstracts a lot of what this Object does away for you.
   *
   * __[Example](../../../../docs/examples/keyprop.html)__
   * @param {Kapi.Actor} ownerActor The Actor to which this KeyframeProperty is associated.
   * @param {number} millisecond Where in the animation this KeyframeProperty lives.
   * @param {string} name The property's name, such as "x" or "opacity."
   * @param {number|string} value The value of `name`.  This is the value to animate to.
   * @param {string=} opt_easing The easing at which to animate to `value`.  Defaults to linear.
   * @constructor
   */
  Kapi.KeyframeProperty = function (
      ownerActor, millisecond, name, value, opt_easing) {
    this.id = _.uniqueId('keyframeProperty_');
    this.ownerActor = ownerActor;
    this.millisecond = millisecond;
    this.name = name;
    this.value = value;
    this.easing = opt_easing || DEFAULT_EASING;
    this.nextProperty = null;

    return this;
  };
  var KeyframeProperty = Kapi.KeyframeProperty;


  /**
   * Modify a `KeyframeProperty`.  Any of the following are valid properties of `newProperties` and correspond to the formal parameters of `Kapi.KeyframeProperty`:
   *
   * - _millisecond_ (__number__)
   * - _easing_ (__string__)
   * - _value_ (__number,string__)
   *
   * __[Example](../../../../docs/examples/keyprop_modify_with.html)__
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
   * Create the reference to the next KeyframeProperty in an `Actor`'s `KeyframeProperty` track.  Tracks are linked lists of `Kapi.KeyframeProperty`s.
   *
   * __[Example](../../../../docs/examples/keyprop_link_to_next.html)__
   * @param {KeyframeProperty} nextProperty The KeyframeProperty that immediately follows this one in an animation.
   */
  KeyframeProperty.prototype.linkToNext = function (nextProperty) {
    this.nextProperty = nextProperty || null;
  };


  /**
   * Calculate the midpoint between this `Kapi.KeyframeProperty` and the next `Kapi.KeyframeProperty` in a `Kapi.Actor`'s `Kapi.KeyframeProperty` track.
   *
   * __[Example](../../../../docs/examples/keyprop_get_value_at.html)__
   * @param {number} millisecond The point in the animation to compute.
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
      value = Tweenable.interpolate(fromObj, toObj, interpolatedPosition,
          this.nextProperty.easing)[this.name];
    } else {
      value =  this.value;
    }

    return value;
  };


  /**
   * Export a serializable `Object` of this `Kapi.KeyframeProperty`'s state data.
   *
   * __[Example](../../../../docs/examples/keyprop_export_property_data.html)__
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


  // PRIVATE UTILITY FUNCTIONS
  //

  /*!
   * Gets (and optionally sets) height or width on a canvas.
   * @param {HTMLCanvas} context
   * @param {string} heightOrWidth The dimension (either "height" or "width")
   * to get or set.
   * @param {number} opt_newSize The new value to set for `dimension`.
   * @return {number}
   */
  function dimension (context, heightOrWidth, opt_newSize) {
    if (typeof opt_newSize !== 'undefined') {
      context[heightOrWidth] = opt_newSize;
      context.style[heightOrWidth] = opt_newSize + 'px';
    }

    return context[heightOrWidth];
  }


  /*!
   * Takes care of some pre-drawing tasks for canvas animations.
   * @param {Kapi}
   */
  function beforeDraw (kapi) {
    if (kapi.config.clearOnUpdate) {
      kapi.canvas.clear();
    }
  }


  /*!
   * Draw all the `Actor`s at whatever position they are currently in.
   * @param {Kapi}
   * @return {Kapi}
   */
  function draw (kapi) {
    fireEvent(kapi, 'beforeDraw', _);
    var len = kapi.canvas._drawOrder.length;
    var drawOrder;

    if (kapi.canvas._drawOrderSorter) {
      var orderedActors =
          _.sortBy(kapi.canvas._canvasActors, kapi.canvas._drawOrderSorter);
      drawOrder = _.pluck(orderedActors, 'id');
    } else {
      drawOrder = kapi.canvas._drawOrder;
    }

    var currentActor, canvas_context;

    var i;
    for (i = 0; i < len; i++) {
      currentActor = kapi.canvas._canvasActors[drawOrder[i]];
      canvas_context = currentActor.context();
      currentActor.draw(canvas_context, currentActor.get());
    }
    fireEvent(kapi, 'afterDraw', _);

    return kapi;
  }


  /*!
   * @param {Kapi} kapi
   * @param {Kapi.Actor} actor
   */
  function addActor (kapi, actor) {
    if (actor instanceof Kapi.CanvasActor) {
      kapi.canvas._drawOrder.push(actor.id);
      kapi.canvas._canvasActors[actor.id] = actor;
    }
  }


  /*!
   * @param {Kapi} kapi
   * @param {Kapi.Actor} actor
   */
  function removeActor (kapi, actor) {
    if (actor instanceof Kapi.CanvasActor) {
      kapi.canvas._drawOrder = _.without(kapi.canvas._drawOrder, actor.id);
      delete kapi.canvas._canvasActors[actor.id];
    }
  }


  /*!
   * Sets up an instance of CanvasRenderer and attaches it to a `Kapi`
   * instance.  Also augments the Kapi instance with canvas-specific
   * functions.
   */
  Kapi.prototype._contextInitHook.canvas = function () {
    if (!this.context.getContext) {
      return;
    }

    this.canvas = new CanvasRenderer(this);
    this.config.clearOnUpdate = true;

    _.extend(this._events, {
      'beforeDraw': []
      ,'afterDraw': []
    });

    // Set the dimensions on the <canvas> element based on Kapi constructor
    // parameters
    _.each(['Height', 'Width'], function (dimension) {
      var dimensionLower = dimension.toLowerCase();
      if (this.config[dimensionLower]) {
        this.canvas[dimensionLower](this.config[dimensionLower]);
        delete this.config[dimension];
      }
    }, this);

    this.on('afterUpdate', draw);
    this.on('addActor', addActor);
    this.on('removeActor', removeActor);
    this.on('beforeDraw', beforeDraw);
  };


  // CANVAS RENDERER OBJECT
  //

  /**
   * You can use Rekapi to render to an HTML5 `<canvas>`.  The Canvas renderer does a few things:
   *
   *   1. It subclasses `Kapi.Actor` as `Kapi.CanvasActor`.
   *   2. If the  `Kapi` constructor is given a `<canvas>` as a `context`, the Canvas renderer attaches an instance of `Kapi.CanvasRenderer` to the `Kapi` instance, named `canvas`, at initialization time.  So:
   *   3. It maintains a layer list that defines draw order for [`Kapi.CanvasActor`](rekapi.canvas.actor.js.html)s.
   *
   * ```
   * // With the Rekapi Canvas renderer loaded
   * var kapi = new Kapi({ context: document.createElement('canvas') });
   * kapi.canvas instanceof Kapi.CanvasRenderer; // true
   * ```
   *
   * __Note:__ This `Kapi.CanvasRenderer` constructor is called for you automatically - there is no need to call it explicitly.
   *
   * The Canvas renderer adds some new events you can bind to with [`Kapi#on`](../../src/rekapi.core.js.html#on) (and unbind from with [`Kapi#off`](../../src/rekapi.core.js.html#off)).
   *
   *  - __beforeDraw__: Fires just before an actor is drawn to the screen.
   *  - __afterDraw__: Fires just after an actor is drawn to the screen.
   *
   * @param {Kapi} kapi
   * @constructor
   */
  Kapi.CanvasRenderer = function (kapi) {
    this.kapi = kapi;
    this._drawOrder = [];
    this._drawOrderSorter = null;
    this._canvasActors = {};
    return this;
  };
  var CanvasRenderer = Kapi.CanvasRenderer;


  /**
   * Get and optionally set the height of the associated `<canvas>` element.
   *
   * @param {number} opt_height
   * @return {number}
   */
  CanvasRenderer.prototype.height = function (opt_height) {
    return dimension(this.kapi.context, 'height', opt_height);
  };


  /**
   * Get and optionally set the width of the associated `<canvas>` element.
   *
   * @param {number} opt_width
   * @return {number}
   */
  CanvasRenderer.prototype.width = function (opt_width) {
    return dimension(this.kapi.context, 'width', opt_width);
  };


  /**
   * Erase the `<canvas>`.
   *
   * @return {Kapi}
   */
  CanvasRenderer.prototype.clear = function () {
    // TODO: Is this check necessary?
    if (this.kapi.context.getContext) {
      this.context().clearRect(
          0, 0, this.width(), this.height());
    }

    return this.kapi;
  };


  /**
   * Retrieve the 2d context of the `<canvas>` that is set as the `Kapi` instance's rendering context.  This is needed for all rendering operations.  It is also provided to a [`Kapi.CanvasActor`](rekapi.canvas.actor.js.html)'s `draw` method, so you mostly won't need to call it directly.  See the [MDN](https://developer.mozilla.org/en/Drawing_Graphics_with_Canvas) for info on the Canvas context APIs.
   * @return {CanvasRenderingContext2D}
   */
  CanvasRenderer.prototype.context = function () {
    return this.kapi.context.getContext('2d');
  };


  /**
   * Move a [`Kapi.CanvasActor`](rekapi.canvas.actor.js.html) around in the layer list.  Each layer has one [`Kapi.CanvasActor`](rekapi.canvas.actor.js.html), and [`Kapi.CanvasActor`](rekapi.canvas.actor.js.html)s are drawn in order of their layer.  Lower layers (starting with 0) are drawn earlier.  If `layer` is higher than the number of layers (which can be found with [`actorCount`](../../src/rekapi.core.js.html#actorCount)) or lower than 0, this method will return `undefined`.  Otherwise `actor` is returned.
   *
   * __[Example](../../../../docs/examples/canvas_move_actor_to_layer.html)__
   * @param {Kapi.Actor} actor
   * @param {number} layer
   * @return {Kapi.Actor|undefined}
   */
  CanvasRenderer.prototype.moveActorToLayer = function (actor, layer) {
    if (layer < this._drawOrder.length) {
      this._drawOrder = _.without(this._drawOrder, actor.id);
      this._drawOrder.splice(layer, 0, actor.id);

      return actor;
    }

    return;
  };


  /**
   * Set a function that defines the draw order of the [`Kapi.CanvasActor`](rekapi.canvas.actor.js.html)s.  This is called each frame before the [`Kapi.CanvasActor`](rekapi.canvas.actor.js.html)s are drawn.  The following example assumes that all [`Kapi.CanvasActor`](rekapi.canvas.actor.js.html)s are circles that have a `radius` [`Kapi.KeyframeProperty`](../../src/rekapi.keyframeprops.js.html).  The circles will be drawn in order of the value of their `radius`, from smallest to largest.  This has the effect of layering larger circles on top of smaller circles, giving a sense of perspective.
   *
   * ```
   * kapi.canvas.setOrderFunction(function (actor) {
   *   return actor.get().radius;
   * });
   * ```
   * @param {function(Kapi.Actor,number)} sortFunction
   * @return {Kapi}
   */
  CanvasRenderer.prototype.setOrderFunction = function (sortFunction) {
    this._drawOrderSorter = sortFunction;
    return this.kapi;
  };


  /**
   * Remove the sort order function set by [`setOrderFunction`](#setOrderFunction).  Draw order defaults back to the order in which [`Kapi.CanvasActor`](rekapi.canvas.actor.js.html)s were added.
   *
   * __[Example](../../../../docs/examples/canvas_unset_order_function.html)__
   * @return {Kapi}
   */
  CanvasRenderer.prototype.unsetOrderFunction = function () {
    this._drawOrderSorter = null;
    return this.kapi;
  };

};

var rekapiCanvasActor = function (context, _) {

  'use strict';

  var Kapi = context.Kapi;

  /**
   * Constructor for rendering Actors to a `<canvas>`.  Extends [`Kapi.Actor`](../../src/rekapi.actor.js.html).  Valid options for `opt_config` are the same as those for [`Kapi.Actor`](../../src/rekapi.actor.js.html), with the following additions:
   *
   *  - __draw__ _(function(CanvasRenderingContext2D, Object))_: A function that renders something to a canvas.
   *
   * _Note_: `context` is inherited from the `Kapi` instance if it is not provided here.
   * @param {Object=} opt_config
   * @constructor
   */
  Kapi.CanvasActor = function (opt_config) {
    Kapi.Actor.call(this, opt_config);

    opt_config = opt_config || {};
    this.draw = opt_config.draw || noop;

    return this;
  };
  var CanvasActor = Kapi.CanvasActor;

  function CanvasActorMethods () {}
  CanvasActorMethods.prototype = Kapi.Actor.prototype;
  CanvasActor.prototype = new CanvasActorMethods();


  /*!
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
   * Move this `Kapi.CanvasActor` to a different layer in the `Kapi` instance that it belongs to.  This returns `undefined` if the operation was unsuccessful.  This is just a wrapper for [moveActorToLayer](rekapi.canvas.context.js.html#moveActorToLayer).
   * @param {number} layer
   * @return {Kapi.Actor|undefined}
   */
  CanvasActor.prototype.moveToLayer = function (layer) {
    return this.kapi.canvas.moveActorToLayer(this, layer);
  };
};

var rekapiDOM = function (context, _) {

  'use strict';

  var Kapi = context.Kapi;
  var vendorTransforms = [
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


  /*!
   * @param {string} name A transform function name
   * @return {boolean}
   */
  function isTransformFunction (name) {
    return _.contains(transformFunctions, name);
  }


  /*!
   * Builds a concatenated string of given transform property values in order.
   *
   * @param {Array.<string>} orderedFunctions Array of ordered transform
   *     function names
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


  /*!
   * Sets value for all vendor prefixed transform properties on a given context
   *
   * @param {Object} context The actor's DOM context
   * @param {string} transformValue The transform style value
   */
  function setTransformStyles (context, transformValue) {
    _.each(vendorTransforms, function(prefixedTransform) {
      setStyle(context, prefixedTransform, transformValue);
    });
  }


  /**
   * `Kapi.DOMActor` is a subclass of [`Kapi.Actor`](../../src/rekapi.actor.js.html).  Please note that `Kapi.DOMActor` accepts `opt_config` as the second parameter, not the first.  Instantiate a `Kapi.DOMActor` with an `HTMLElement`, and then add it to the animation:
   *
   * ```
   * var kapi = new Kapi();
   * var actor = new Kapi.DOMActor(document.getElementById('actor'));
   *
   * kapi.addActor(actor);
   * ```
   *
   * Now you can keyframe `actor` like you would any Actor.
   *
   * ```
   * actor
   *   .keyframe(0, {
   *     'left': '0px'
   *     ,'top': '0px'
   *   })
   *   .keyframe(1500, {
   *     'left': '200px'
   *     ,'top': '200px'
   *   }, 'easeOutExpo');
   *
   * kapi.play();
   * ```
   *
   * ## Transforms
   *
   * `Kapi.DOMActor` supports CSS3 transforms as keyframe properties. Here's an example:
   *
   * ```
   * actor
   *   .keyframe(0, {
   *     'translateX': '0px'
   *     ,'translateY': '0px'
   *     ,'rotate': '0deg'
   *   })
   *   .keyframe(1500, {
   *     'translateX': '200px'
   *     ,'translateY': '200px'
   *     ,'rotate': '90deg'
   *   }, 'easeOutExpo');
   * ```
   *
   * The list of supported transforms is: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `skewX`, `skewY`.
   *
   * Internally, this builds a CSS3 `transform` rule that gets applied to the `Kapi.DOMActor`'s DOM node on each animation update.
   *
   * Typically, when writing a `transform` rule, it is necessary to write the same rule multiple times, in order to support the vendor prefixes for all of the browser rendering engines. `Kapi.DOMActor` takes care of the cross browser inconsistencies for you.
   *
   * You can also use the `transform` property directly:
   *
   * ```
   * actor
   *   .keyframe(0, {
   *     'transform': 'translateX(0px) translateY(0px) rotate(0deg)'
   *   })
   *   .keyframe(1500, {
   *     'transform': 'translateX(200px) translateY(200px) rotate(90deg)'
   *   }, 'easeOutExpo');
   * ```
   * @param {HTMLElement} element
   * @param {Object} opt_config
   * @constructor
   */
  Kapi.DOMActor = function (element, opt_config) {
    Kapi.Actor.call(this, opt_config);
    this._context = element;
    var className = this.getCSSName();

    // Add the class if it's not already there.
    // Using className instead of classList to make IE happy.
    if (!this._context.className.match(className)) {
      this._context.className += ' ' + className;
    }

    this._transformOrder = transformFunctions.slice(0);

    // Remove the instance's update method to allow the DOMActor.prototype
    // methods to be accessible.
    delete this.update;
    delete this.teardown;

    return this;
  };
  var DOMActor = Kapi.DOMActor;


  function DOMActorMethods () {}
  DOMActorMethods.prototype = Kapi.Actor.prototype;
  DOMActor.prototype = new DOMActorMethods();


  /*!
   * @param {HTMLElement} context
   * @param {Object} state
   * @override
   */
  DOMActor.prototype.update = function (context, state) {
    var propertyNames = _.keys(state);
    // TODO:  Optimize the following code so that propertyNames is not looped
    // over twice.
    var transformFunctionNames = _.filter(propertyNames, isTransformFunction);
    var otherPropertyNames = _.reject(propertyNames, isTransformFunction);
    var otherProperties = _.pick(state, otherPropertyNames);

    if (transformFunctionNames.length) {
      var transformProperties = _.pick(state, transformFunctionNames);
      var builtStyle = buildTransformValue(this._transformOrder,
          transformProperties);
      setTransformStyles(context, builtStyle);
    } else if (state.transform) {
      setTransformStyles(context, state.transform);
    }

    _.each(otherProperties, function (styleValue, styleName) {
      setStyle(context, styleName, styleValue);
    }, this);
  };


  /*!
   * transform properties like translate3d and rotate3d break the cardinality
   * of multi-ease easing strings, because the "3" gets treated like a
   * tweenable value.  Transform "3d(" to "__THREED__" to prevent this, and
   * transform it back in _afterKeyframePropertyInterpolate.
   *
   * @param {Kapi.KeyframeProperty} keyframeProperty
   * @override
   */
  DOMActor.prototype._beforeKeyframePropertyInterpolate =
      function (keyframeProperty) {
    if (keyframeProperty.name !== 'transform') {
      return;
    }

    var value = keyframeProperty.value;
    var nextProp = keyframeProperty.nextProperty;

    if (nextProp && value.match(/3d\(/g)) {
      keyframeProperty.value = value.replace(/3d\(/g, '__THREED__');
      nextProp.value = nextProp.value.replace(/3d\(/g, '__THREED__');
    }
  };


  /*!
   * @param {Kapi.KeyframeProperty} keyframeProperty
   * @param {Object} interpolatedObject
   * @override
   */
  DOMActor.prototype._afterKeyframePropertyInterpolate =
      function (keyframeProperty, interpolatedObject) {
    if (keyframeProperty.name !== 'transform') {
      return;
    }

    var value = keyframeProperty.value;
    var nextProp = keyframeProperty.nextProperty;

    if (nextProp && value.match(/__THREED__/g)) {
      keyframeProperty.value = value.replace(/__THREED__/g, '3d(');
      nextProp.value = nextProp.value.replace(/__THREED__/g, '3d(');
      var keyPropName = keyframeProperty.name;
      interpolatedObject[keyPropName] =
          interpolatedObject[keyPropName].replace(/__THREED__/g, '3d(');
    }
  };


  // TODO:  Make this a private method.
  DOMActor.prototype.teardown = function (context, state) {
    var classList = this._context.className.match(/\S+/g);
    var sanitizedClassList = _.without(classList, this.getCSSName());
    this._context.className = sanitizedClassList;
  };


  /**
   * This can be useful when used with [toCSS](../to-css/rekapi.to-css.js.html).  You might not ever need to use this directly, as the class is attached to an element when you create a `Kapi.DOMActor` from said element.
   * @return {string}
   */
  DOMActor.prototype.getCSSName = function () {
    return 'actor-' + this.id;
  };


  /**
   * Overrides the default transform function order.
   *
   * @param {Array} orderedFunctions The Array of transform function names
   * @return {Kapi.DOMActor}
   */
  DOMActor.prototype.setTransformOrder = function (orderedFunctions) {
    // TODO: Document this better...
    var unknownFunctions = _.reject(orderedFunctions, isTransformFunction);

    if (unknownFunctions.length) {
      throw 'Unknown or unsupported transform functions: ' +
        unknownFunctions.join(', ');
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

  var DEFAULT_FPS = 30;
  var TRANSFORM_TOKEN = 'TRANSFORM';
  var VENDOR_TOKEN = 'VENDOR';
  var VENDOR_PREFIXES = Kapi.util.VENDOR_PREFIXES = {
    'microsoft': '-ms-'
    ,'mozilla': '-moz-'
    ,'opera': '-o-'
    ,'w3': ''
    ,'webkit': '-webkit-'
  };
  var BEZIERS = {
    linear: '.25,.25,.75,.75'
    ,easeInQuad: '.55,.085,.68,.53'
    ,easeInCubic: '.55,.055,.675,.19'
    ,easeInQuart: '.895,.03,.685,.22'
    ,easeInQuint: '.755,.05,.855,.06'
    ,easeInSine: '.47,0,.745,.715'
    ,easeInExpo: '.95,.05,.795,.035'
    ,easeInCirc: '.6,.04,.98, .335'
    ,easeOutQuad: '.25,.46,.45,.94'
    ,easeOutCubic: '.215,.61,.355,1'
    ,easeOutQuart: '.165,.84,.44,1'
    ,easeOutQuint: '.23,1,.32,1'
    ,easeOutSine: '.39,.575,.565,1'
    ,easeOutExpo: '.19,1,.22,1'
    ,easeOutCirc: '.075,.82,.165,1'
    ,easeInOutQuad: '.455,.03,.515,.955'
    ,easeInOutCubic: '.645,.045,.355,1'
    ,easeInOutQuart: '.77,0,.175,1'
    ,easeInOutQuint: '.86,0.07,1'
    ,easeInOutSine: '.445,.05,.55,.95'
    ,easeInOutExpo: '1,0,0,1'
    ,easeInOutCirc: '.785,.135,.15,.86'
  };


  // TEMPLATES
  //

  /*!
   * [0]: vendor
   * [1]: animation name
   * [2]: keyframes
   */
  var KEYFRAME_TEMPLATE = [
    '@%skeyframes %s-keyframes {'
    ,'%s'
    ,'}'
  ].join('\n');

  /*!
   * [0] class name
   * [1] class attributes
   */
  var CLASS_BOILERPLATE = [
    '.%s {'
    ,'%s'
    ,'}'
  ].join('\n');


  // PROTOTYPE EXTENSIONS
  //

  /**
   * With `toCSS`, Rekapi can export your animations as CSS `@keyframes`.  `toCSS` depends on [`Kapi.DOMActor`](../dom/rekapi.dom.actor.js.html).  This function only builds and returns a string of CSS, it has no other side effects.  To actually run a CSS `@keyframe` animation, see [`CSSRenderer`](/dist/doc/ext/css-animate/rekapi.css-animate.context.js.html#CSSRenderer) (which wraps this function).
   *
   * ## Exporting
   *
   * To create a CSS string:
   *
   * ```
   * var container = document.getElementById('container');
   * var animation = new Kapi(container);
   *
   * var css = animation.toCSS();
   * ```
   *
   * Remember, all `toCSS` does is render a string.  The most useful thing to do with this string is to stick it into a `<style>` element somewhere on your page.  Continuing from  above:
   *
   * ```
   * var style = document.createElement('style');
   * style.innerHTML = css;
   * document.head.appendChild(style);
   * ```
   *
   * Please be aware that [`CSSRenderer`](/dist/doc/ext/css-animate/rekapi.css-animate.context.js.html#CSSRenderer) makes this process much simpler.
   *
   * ## `opts`
   *
   * You can specify some parameters for your CSS animation.  They are all optional. Just supply them in the `opts` parameter when calling `toCSS`:
   *
   *  - __vendors__ _(Array)_: Defaults to `['w3']`.  The browser vendors you want this CSS to support. Valid values are:
   *    - `'microsoft'`
   *    - `'mozilla'`
   *    - `'opera'`
   *    - `'w3'`
   *    - `'webkit'`
   *  - __fps__ _(number)_: Defaults to 30.  Defines the "resolution" of an exported animation.  CSS `@keyframes` are comprised of a series of explicitly defined keyframe steps, and more steps will allow for a more complex animation.  More steps will also result in a larger CSS string, and more time needed to generate the string.  There's no reason to go beyond 60, as the human eye cannot perceive motion smoother than that.
   *  - __name__ _(string)_: Define a custom name for your animation.  This becomes the class name targeted by the generated CSS.  If omitted, the value is the same as the CSS class that was added when the DOM element was used to initialize its `Kapi.DOMActor`.
   *  - __isCentered__ _(boolean)_: If `true`, the generated CSS will contain `transform-origin: 0 0;`, which centers the DOM element along the path of motion.  If `false` or omitted, no `transform-origin` rule is specified and the element is aligned to the path of motion with its top-left corner.
   *  - __iterations__ _(number)_: How many times the generated animation should repeat.  If omitted, the animation will loop indefinitely.
   *
   * @param {Object} opts
   * @return {string}
   */
  Kapi.prototype.toCSS = function (opts) {
    opts = opts || {};
    var animationCSS = [];

    _.each(this.getAllActors(), function (actor) {
      if (actor instanceof Kapi.DOMActor) {
        animationCSS.push(actor.toCSS(opts));
      }
    });

    return animationCSS.join('\n');
  };


  /*!
   * Exports the CSS `@keyframes` for an individual Actor.
   * @param {Object} opts Same as opts for Kapi.prototype.toCSS.
   * @return {string}
   */
  Kapi.Actor.prototype.toCSS = function (opts) {
    opts = opts || {};
    var actorCSS = [];
    var animName = opts.name || this.getCSSName();
    var fps = opts.fps || DEFAULT_FPS;
    var steps = Math.ceil((this.kapi.animationLength() / 1000) * fps);
    var combineProperties = !canOptimizeAnyKeyframeProperties(this);
    var actorClass = generateCSSClass(
        this, animName, combineProperties, opts.vendors, opts.iterations,
        opts.isCentered);
    var boilerplatedKeyframes = generateBoilerplatedKeyframes(
        this, animName, steps, combineProperties, opts.vendors);

    actorCSS.push(actorClass);
    actorCSS.push(boilerplatedKeyframes);

    return actorCSS.join('\n');
  };


  // UTILITY FUNCTIONS
  //

  /*!
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


  /*!
   * http://stackoverflow.com/a/3886106
   *
   * @param {number} number
   */
  function isInt (number) {
    return number % 1 === 0;
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @param {number} steps
   * @param {boolean} combineProperties
   * @param {Array.<string>=} opt_vendors
   * @return {string}
   */
  function generateBoilerplatedKeyframes (
      actor, animName, steps, combineProperties, opt_vendors) {

    var trackNames = actor.getTrackNames();
    var cssTracks = [];

    if (combineProperties) {
      cssTracks.push(generateCombinedActorKeyframes(actor, steps));
    } else {
      _.each(trackNames, function (trackName) {
        cssTracks.push(
          generateActorKeyframes(actor, steps, trackName));
      });
    }

    var boilerplatedKeyframes = [];

    if (combineProperties) {
      boilerplatedKeyframes.push(applyVendorBoilerplates(
        cssTracks[0], (animName), opt_vendors));
    } else {
      _.each(trackNames, function (trackName, i) {
        boilerplatedKeyframes.push(applyVendorBoilerplates(
          cssTracks[i], (animName + '-' + trackName), opt_vendors));
      });
    }

    boilerplatedKeyframes = boilerplatedKeyframes.join('\n');

    return boilerplatedKeyframes;
  }


  /*!
   * @param {string} toKeyframes Generated keyframes to wrap in boilerplates
   * @param {string} animName
   * @param {Array.<string>} opt_vendors Vendor boilerplates to be applied.
   *     Should be any of the values in Kapi.util.VENDOR_PREFIXES.
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


  /*!
   * @param {string} keyframes
   * @param {vendor} vendor
   * @return {string}
   */
  function applyVendorPropertyPrefixes (keyframes, vendor) {
    var transformRegExp = new RegExp(TRANSFORM_TOKEN, 'g');
    var prefixedTransformKey = VENDOR_PREFIXES[vendor] + 'transform';
    var generalPrefixRegExp = new RegExp(VENDOR_TOKEN, 'g');
    var generalPrefixedKey = VENDOR_PREFIXES[vendor];
    var prefixedKeyframes = keyframes
        .replace(generalPrefixRegExp, generalPrefixedKey)
        .replace(transformRegExp, prefixedTransformKey);

    return prefixedKeyframes;
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @param {boolean} combineProperties
   * @param {Array.<string>=} opt_vendors
   * @param {number|string=} opt_iterations
   * @param {boolean=} opt_isCentered
   * @return {string}
   */
  function generateCSSClass (
      actor, animName, combineProperties, opt_vendors, opt_iterations,
      opt_isCentered) {

    opt_vendors = opt_vendors || ['w3'];
    var classAttrs = [];
    var vendorAttrs;

    _.each(opt_vendors, function (vendor) {
      vendorAttrs = generateCSSAnimationProperties(
          actor, animName, vendor, combineProperties, opt_iterations,
          opt_isCentered);
      classAttrs.push(vendorAttrs);
    });

    var boilerplatedClass = printf(CLASS_BOILERPLATE
        ,[animName, classAttrs.join('\n')]);

    return boilerplatedClass;
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @param {string} vendor
   * @param {boolean} combineProperties
   * @param {number|string=} opt_iterations
   * @param {boolean=} opt_isCentered
   * @return {string}
   */
  function generateCSSAnimationProperties (
      actor, animName, vendor, combineProperties, opt_iterations, opt_isCentered) {
    var generatedProperties = [];
    var prefix = VENDOR_PREFIXES[vendor];

    generatedProperties.push(generateAnimationNameProperty(
          actor, animName, prefix, combineProperties));
    generatedProperties.push(
        generateAnimationDurationProperty(actor, prefix));
    generatedProperties.push(generateAnimationDelayProperty(actor, prefix));
    generatedProperties.push(generateAnimationFillModeProperty(prefix));
    generatedProperties.push(generateAnimationTimingFunctionProperty(prefix));
    generatedProperties.push(generateAnimationIterationProperty(
        actor.kapi, prefix, opt_iterations));

    if (opt_isCentered) {
      generatedProperties.push(generateAnimationCenteringRule(prefix));
    }

    return generatedProperties.join('\n');
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @param {string} prefix
   * @param {boolean} combineProperties
   * @return {string}
   */
  function generateAnimationNameProperty (
      actor, animName, prefix, combineProperties) {

    var animationName = printf('  %sanimation-name:', [prefix]);

    var tracks = actor.getTrackNames();

    if (combineProperties) {
      animationName += printf(' %s-keyframes;', [animName]);
    } else {
      _.each(tracks, function (trackName) {
        animationName += printf(' %s-%s-keyframes,', [animName, trackName]);
      });
      animationName = animationName.slice(0, animationName.length - 1);
      animationName += ';';
    }

    return animationName;
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @return {string}
   */
  function generateAnimationDurationProperty (actor, prefix) {
    return printf('  %sanimation-duration: %sms;'
        ,[prefix, actor.getEnd() - actor.getStart()]);
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {number|string} delay
   * @return {string}
   */
  function generateAnimationDelayProperty (actor, prefix) {
    return printf('  %sanimation-delay: %sms;', [prefix, actor.getStart()]);
  }


  /*!
   * @param {string} prefix
   * @return {string}
   */
  function generateAnimationFillModeProperty (prefix) {
    return printf('  %sanimation-fill-mode: forwards;', [prefix]);
  }


  /*!
   * @param {string} prefix
   * @return {string}
   */
  function generateAnimationTimingFunctionProperty (prefix) {
    return printf('  %sanimation-timing-function: linear;', [prefix]);
  }


  /*!
   * @param {Kapi} kapi
   * @param {string} prefix
   * @param {number|string} opt_iterations
   * @return {string}
   */
  function generateAnimationIterationProperty (kapi, prefix, opt_iterations) {
    var iterationCount;
    if (opt_iterations) {
      iterationCount = opt_iterations;
    } else {
      iterationCount = kapi._timesToIterate === -1
        ? 'infinite'
        : kapi._timesToIterate;
    }

    var ruleTemplate = '  %sanimation-iteration-count: %s;';

    return printf(ruleTemplate, [prefix, iterationCount]);
  }


  /*!
   * @param {string} prefix
   * @return {string}
   */
  function generateAnimationCenteringRule (prefix) {
    return printf('  %stransform-origin: 0 0;', [prefix]);
  }


  // OPTIMIZED GENERATOR FUNCTIONS
  //

  /*!
   * @param {Kapi.KeyframeProperty} property
   * @return {boolean}
   */
  function canOptimizeKeyframeProperty (property) {
    var canOptimize = false;

    if (property.nextProperty) {
      var easingChunks = property.nextProperty.easing.split(' ');

      var i = 0, len = easingChunks.length;
      var previousChunk = easingChunks[0];
      var currentChunk;
      for (i; i < len; i++) {
        currentChunk = easingChunks[i];
        if (!(BEZIERS[currentChunk])
            || previousChunk !== currentChunk) {
          canOptimize = false;
          break;
        } else {
          canOptimize = true;
        }

        previousChunk = currentChunk;
      }
    }

    return canOptimize;
  }


  /*!
   * @param {Kapi.Actor} actor
   * @return {boolean}
   */
  function canOptimizeAnyKeyframeProperties (actor) {
    return _.any(actor._keyframeProperties, canOptimizeKeyframeProperty);
  }


  /*!
   * @param {Kapi.KeyframeProperty} property
   * @param {number} fromPercent
   * @param {number} toPercent
   * @return {string}
   */
  function generateOptimizedKeyframeSegment (
      property, fromPercent, toPercent) {

    var accumulator = [];
    var generalName = property.name;

    if (property.name === 'transform') {
      generalName = TRANSFORM_TOKEN;
    }

    var easingFormula = BEZIERS[property.nextProperty.easing.split(' ')[0]];
    var timingFnChunk = printf('cubic-bezier(%s)', [easingFormula]);

    var adjustedFromPercent = isInt(fromPercent) ?
        fromPercent : fromPercent.toFixed(2);
    var adjustedToPercent = isInt(toPercent) ?
        toPercent : toPercent.toFixed(2);

    accumulator.push(printf('  %s% {%s:%s;%sanimation-timing-function: %s;}',
          [adjustedFromPercent, generalName, property.value, VENDOR_TOKEN
          ,timingFnChunk]));
    accumulator.push(printf('  %s% {%s:%s;}',
          [adjustedToPercent, generalName, property.nextProperty.value]));

    return accumulator.join('\n');
  }


  // GENERAL-USE GENERATOR FUNCTIONS
  //

  /*!
   * @param {Kapi.Actor} actor
   * @param {number} steps
   * @param {string} track
   * @return {string}
   */
  function generateActorKeyframes (actor, steps, track) {
    var accumulator = [];
    var actorEnd = actor.getEnd();
    var actorStart = actor.getStart();
    var actorLength = actor.getLength();
    var leadingWait = simulateLeadingWait(actor, track, actorStart);

    if (leadingWait) {
      accumulator.push(leadingWait);
    }

    var previousSegmentWasOptimized = false;
    _.each(actor._propertyTracks[track], function (prop, propName) {
      var fromPercent = calculateStepPercent(prop, actorStart, actorLength);
      var nextProp = prop.nextProperty;

      var toPercent, increments, incrementSize;
      if (nextProp) {
        toPercent = calculateStepPercent(nextProp, actorStart, actorLength);
        var delta = toPercent - fromPercent;
        increments = Math.floor((delta / 100) * steps) || 1;
        incrementSize = delta / increments;
      } else {
        toPercent = 100;
        increments = 1;
        incrementSize = 1;
      }

      var trackSegment;
      if (canOptimizeKeyframeProperty(prop)) {
        trackSegment = generateOptimizedKeyframeSegment(
            prop, fromPercent, toPercent);

        // If this and the previous segment are optimized, remove the
        // destination keyframe of the previous step.  The starting keyframe of
        // the newest segment makes it redundant.
        if (previousSegmentWasOptimized) {
          var accumulatorLength = accumulator.length;
          var previousTrackSegment = accumulator[accumulatorLength - 1];
          var optimizedPreviousTrackSegment =
              previousTrackSegment.split('\n')[0];
          accumulator[accumulatorLength - 1] = optimizedPreviousTrackSegment;
        }

        previousSegmentWasOptimized = true;
      } else {
        trackSegment = generateActorTrackSegment(
            actor, increments, incrementSize, actorStart, fromPercent, prop);

        if (previousSegmentWasOptimized) {
          trackSegment.shift();
        }

        if (trackSegment.length) {
          trackSegment = trackSegment.join('\n');
        }

        previousSegmentWasOptimized = false;
      }

      if (trackSegment.length) {
        accumulator.push(trackSegment);
      }
    });

    var trailingWait =
        simulateTrailingWait(actor, track, actorStart, actorEnd);

    if (trailingWait) {
      accumulator.push(trailingWait);
    }

    return accumulator.join('\n');
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {number} steps
   * @return {string}
   */
  function generateCombinedActorKeyframes (actor, steps) {
    return generateActorTrackSegment(
        actor, steps + 1, 100 / steps, 0, 0).join('\n');
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} track
   * @param {number} actorStart
   * @return {string|undefined}
   */
  function simulateLeadingWait (actor, track, actorStart) {
    var firstProp = actor._propertyTracks[track][0];

    if (firstProp.millisecond !== actorStart) {
      var fakeFirstProp = generateActorTrackSegment(
          actor, 1, 1, firstProp.millisecond, 0, firstProp);
      return fakeFirstProp.join('\n');
    }
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} track
   * @param {number} actorStart
   * @param {number} actorEnd
   * @return {string|undefined}
   */
  function simulateTrailingWait (actor, track, actorStart, actorEnd) {
    var lastProp = _.last(actor._propertyTracks[track]);

    if (lastProp.millisecond !== actorEnd) {
      var fakeLastProp = generateActorTrackSegment(
          actor, 1, 1, actorStart, 100, lastProp);
      return fakeLastProp.join('\n');
    }
  }


  /*!
   * @param {Kapi.KeyframeProperty} property
   * @param {number} actorStart
   * @param {number} actorLength
   * @return {number}
   */
  function calculateStepPercent (property, actorStart, actorLength) {
    return ((property.millisecond - actorStart) / actorLength) * 100;
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {number} increments
   * @param {number} incrementSize
   * @param {number} actorStart
   * @param {number} fromPercent
   * @param {Kapi.KeyframeProperty=} opt_fromProp
   * @return {Array.<string>}
   */
  function generateActorTrackSegment (
      actor, increments, incrementSize, actorStart, fromPercent,
      opt_fromProp) {

    var accumulator = [];
    var actorLength = actor.getLength();
    var i, adjustedPercent, stepPrefix;

    for (i = 0; i < increments; i++) {
      adjustedPercent = fromPercent + (i * incrementSize);
      actor.updateState(
          ((adjustedPercent / 100) * actorLength) + actorStart);
      stepPrefix = +adjustedPercent.toFixed(2) + '% ';

      if (opt_fromProp) {
        accumulator.push(
            '  ' + stepPrefix + serializeActorStep(actor, opt_fromProp.name));
      } else {
        accumulator.push('  ' + stepPrefix + serializeActorStep(actor));
      }
    }

    return accumulator;
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string=} opt_targetProp
   * @return {string}
   */
  function serializeActorStep (actor, opt_targetProp) {
    var serializedProps = ['{'];

    var propsToSerialize;
    if (opt_targetProp) {
      propsToSerialize = {};

      var currentPropState = actor.get()[opt_targetProp];
      if (typeof currentPropState !== 'undefined') {
        propsToSerialize[opt_targetProp] = currentPropState;
      }
    } else {
      propsToSerialize = actor.get();
    }

    var printVal;
    _.each(propsToSerialize, function (val, key) {
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

  if (KAPI_DEBUG) {
    Kapi._private.toCSS = {
      'TRANSFORM_TOKEN': TRANSFORM_TOKEN
      ,'VENDOR_TOKEN': VENDOR_TOKEN
      ,'applyVendorBoilerplates': applyVendorBoilerplates
      ,'applyVendorPropertyPrefixes': applyVendorPropertyPrefixes
      ,'generateBoilerplatedKeyframes': generateBoilerplatedKeyframes
      ,'generateCSSClass': generateCSSClass
      ,'generateCSSAnimationProperties': generateCSSAnimationProperties
      ,'generateActorKeyframes': generateActorKeyframes
      ,'generateActorTrackSegment': generateActorTrackSegment
      ,'serializeActorStep': serializeActorStep
      ,'generateAnimationNameProperty': generateAnimationNameProperty
      ,'generateAnimationDurationProperty': generateAnimationDurationProperty
      ,'generateAnimationDelayProperty': generateAnimationDelayProperty
      ,'generateAnimationFillModeProperty': generateAnimationFillModeProperty
      ,'generateAnimationTimingFunctionProperty':
          generateAnimationTimingFunctionProperty
      ,'generateAnimationIterationProperty': generateAnimationIterationProperty
      ,'generateAnimationCenteringRule': generateAnimationCenteringRule
      ,'simulateLeadingWait': simulateLeadingWait
      ,'simulateTrailingWait': simulateTrailingWait
      ,'canOptimizeKeyframeProperty': canOptimizeKeyframeProperty
      ,'canOptimizeAnyKeyframeProperties': canOptimizeAnyKeyframeProperties
      ,'generateOptimizedKeyframeSegment': generateOptimizedKeyframeSegment
    };
  }

};

var rekapiCSSContext = function (root, _, Tweenable) {

  'use strict';

  var Kapi = root.Kapi;


  // CONSTANTS
  //

  // The timer to remove an injected style isn't likely to match the actual
  // length of the CSS animation, so give it some extra time to complete so it
  // doesn't cut off the end.
  var INJECTED_STYLE_REMOVAL_BUFFER_MS = 250;


  // PRIVATE UTILITY FUNCTIONS
  //

  Kapi.prototype._contextInitHook.cssAnimate = function () {
    this.css = new CSSRenderer(this);
  };


  /*!
   * @return {string}
   */
  function getVendorPrefix () {
    var style = document.body.style;

    if ('-webkit-animation' in style) {
      return 'webkit';
    } else if ('-moz-animation' in style) {
      return 'mozilla';
    } else if ('-ms-animation' in style) {
      return 'microsoft';
    } else if ('-o-animation' in style) {
      return 'opera';
    } else if ('animation' in style) {
      return 'w3';
    }

    return '';
  }


  var styleID = 0;
  /*!
   * @param {string} css The css content that the <style> element should have.
   * @return {HTMLStyleElement} The unique ID of the injected <style> element.
   */
  function injectStyle (css) {
    var style = document.createElement('style');
    var id = 'rekapi-' + styleID++;
    style.id = id;
    style.innerHTML = css;
    document.head.appendChild(style);

    return style;
  }


  /*!
   * Fixes a really bizarre issue that only seems to affect Presto/Opera.  In
   * some situations, DOM nodes will not detect dynamically injected <style>
   * elements.  Explicitly re-inserting DOM nodes seems to fix the issue.  Not
   * sure what causes this issue.  Not sure why this fixes it.  Not sure if
   * this affects Blink-based Opera browsers.
   *
   * @param {Kapi} kapi
   */
  function forceStyleInjection (kapi) {
    var dummyDiv = document.createElement('div');

    _.each(kapi.getAllActors(), function (actor) {
      if (actor instanceof Kapi.DOMActor) {
        var actorEl = actor._context;
        var actorElParent = actorEl.parentElement;

        actorElParent.replaceChild(dummyDiv, actorEl);
        actorElParent.replaceChild(actorEl, dummyDiv);
      }
    });

    dummyDiv = null;
  }


  // CSS RENDERER OBJECT
  //

  /**
   * The `CSSRenderer` module allows you to run a Rekapi animation as a CSS `@keyframe` animation.  Standard Rekapi animations are powered by JavaScript, but in many cases using CSS `@keyframes` is smoother.
   *
   * __Note!__ This is an experimental feature.  If you encounter any issues, please report them with the [Rekapi issue tracker](https://github.com/jeremyckahn/rekapi/issues?page=1&state=open).
   *
   * Advantages of playing an animation with CSS `@keyframes` instead of JavaScript:
   *
   *   - Smoother animations in modern browsers (particularly noticeable in Webkit and mobile browsers).
   *   - The JavaScript thread is freed from performing animation updates, resulting in more resources for other logic.
   *
   * Disadvantages of CSS `@keyframes`:
   *
   *   - No start/stop/goto control - once the animation runs, it runs from start to finish.
   *   - Prerending animations can take a non-trivial amount of time, so you may have to be clever with how to spend the cycles to do it.
   *   - Currently, no `Kapi` [events](../../src/rekapi.core.js.html#on) can be bound to CSS animations.
   *
   * This module requires both the [`toCSS`](/dist/doc/ext/to-css/rekapi.to-css.js.html) and [`Kapi.DOMActor`](/dist/doc/ext/dom/rekapi.dom.actor.js.html) modules (they are included in the standard Rekapi distribution).  Functionally, `CSSRenderer` works by prerendering a CSS animation and injecting it into the DOM.  You'll never have to call the `CSSRenderer` constructor explicitly, that is done for you when a Rekapi instance is initialized.
   *
   * An advantage of this module is that CSS animations are not always available, but JavaScript animations are.  Keyframes are defined the same way, but you can choose what method of animation is appropriate at runtime:
   *
   * ```
   *  var kapi = new Kapi();
   *  var actor = new Kapi.DOMActor(document.getElementById('actor-1'));
   *
   *  kapi.addActor(actor);
   *  actor.keyframe(0,    { left: '0px'   });
   *  actor.keyframe(1000, { left: '250px' }, 'easeOutQuad');
   *
   *  // Feature detect for @keyframe support
   *  if (kapi.css.canAnimateWithCSS()) {
   *    kapi.css.play();
   *  } else {
   *    kapi.play();
   *  }
   * ```
   *
   * __[Example](/ext/css-animate/sample/play-many-actors.html)__
   *
   * @param {Kapi} kapi
   * @constructor
   */
  Kapi.CSSRenderer = function (kapi) {
    if (!Kapi.DOMActor && !Kapi.prototype.toCSS) {
      throw 'CSSRenderer requires the DOMActor and toCSS modules.';
    }

    this.kapi = kapi;

    // @private {number}
    this._playTimestamp = null;

    // @private {string}
    this._cachedCSS = null;

    // The HTMLStyleElement that gets injected into the DOM.
    // @private {HTMLStyleElement)
    this._styleElement = null;

    // @private {number}
    this._stopSetTimeoutHandle = null;

    kapi.on('timelineModified', _.bind(function () {
      this._cachedCSS = null;
    }, this));

    return this;
  };
  var CSSRenderer = Kapi.CSSRenderer;


  /**
   * Whether or not the browser supports CSS `@keyframe` animations.
   *
   * @return {boolean}
   */
  CSSRenderer.prototype.canAnimateWithCSS = function () {
    return !!getVendorPrefix();
  };


  /**
   * Prerender and cache CSS so that it is ready to be used when it is needed in the future.  The function signature is identical to [`CSSRenderer#play`](#play).  This is necessary to run a CSS animation and will be called for you if you don't call it manually, but calling this ahead of time (such as on page load) will prevent any perceived lag when a CSS animation starts.  The prerendered animation is cached for reuse until the timeline is modified (by adding, removing or modifying a keyframe).
   *
   * @param {number=} opt_iterations How many times the animation should loop.  This can be null or 0 if you want to loop the animation endlessly but also specify a value for opt_fps.
   * @param {number=} opt_fps How many @keyframes to prerender per second of the animation.  The higher this number, the smoother the CSS animation will be, but the longer it will take to prerender.  The default value is 30, and you should not need to go higher than 60.
   * @return {string} The prerendered CSS string.  You likely won't need this, as it is also cached internally.
   */
  CSSRenderer.prototype.prerender = function (opt_iterations, opt_fps) {
    return this._cachedCSS = this.kapi.toCSS({
      'vendors': [getVendorPrefix()]
      ,'fps': opt_fps
      ,'iterations': opt_iterations
    });
  };


  /**
   * Play the Rekapi animation as a `@keyframe` animation.
   *
   * @param {number=} opt_iterations How many times the animation should loop.  This can be null or 0 if you want to loop the animation endlessly but also specify a value for opt_fps.
   * @param {number=} opt_fps How many @keyframes to prerender per second of the animation.  The higher this number, the smoother the CSS animation will be, but the longer it will take to prerender.  The default value is 30, and you should not need to go higher than 60.
   */
  CSSRenderer.prototype.play = function (opt_iterations, opt_fps) {
    if (this.isPlaying()) {
      this.stop();
    }

    var css = this._cachedCSS || this.prerender.apply(this, arguments);
    this._styleElement = injectStyle(css);
    this._playTimestamp = Tweenable.now();

    if (navigator.userAgent.match(/Presto/)) {
      forceStyleInjection(this.kapi);
    }

    if (opt_iterations) {
      var animationLength = (opt_iterations * this.kapi.animationLength());
      this._stopSetTimeoutHandle = setTimeout(
          _.bind(this.stop, this, true),
          animationLength + INJECTED_STYLE_REMOVAL_BUFFER_MS);
    }

    fireEvent(this.kapi, 'play', _);
  };


  /**
   * Stop a CSS animation.  This also removes any `<style>` elements that were dynamically injected into the DOM.  This method sets inline styles on Actor elements to stay either in their target or current position.
   *
   * @param {boolean} opt_goToEnd If true, set the elements to their target position (in other words, skip to the end of the animation).  If false or omitted, set the Actor elements to stay in their current position.
   */
  CSSRenderer.prototype.stop = function (opt_goToEnd) {
    if (this.isPlaying()) {
      clearTimeout(this._stopSetTimeoutHandle);

      // Forces a style update in WebKit/Presto
      this._styleElement.innerHTML = '';

      document.head.removeChild(this._styleElement);
      this._styleElement = null;

      var updateTime;
      if (opt_goToEnd) {
        updateTime = this.kapi.animationLength();
      } else {
        updateTime = (Tweenable.now() - this._playTimestamp)
            % this.kapi.animationLength();
      }

      this.kapi.update(updateTime);
      fireEvent(this.kapi, 'stop', _);
    }
  };


  /**
   * Whether or not a CSS animation is running.
   *
   * @return {boolean}
   */
  CSSRenderer.prototype.isPlaying = function () {
    return !!this._styleElement;
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
  if (typeof rekapiCSSContext === 'function') {
    rekapiCSSContext(context, _, Tweenable);
  }

  return context.Kapi;
};


if (typeof define === 'function' && define.amd) {
  var underscoreAlreadyInUse = (typeof _ !== 'undefined');

  // Expose Rekapi as an AMD module if it's loaded with RequireJS or similar.
  // Shifty and Underscore are set as dependencies of this module.
  //
  // The rekapi module is anonymous so that it can be required with any name.
  // Example: define(['vendor/rekapi.min'], function(Kapi) { ... });
  define(['shifty', 'underscore'], function (Tweenable, Underscore) {
    var underscoreSupportsAMD = (Underscore != null);
    var deps = {  Tweenable: Tweenable,
                  // Some versions of Underscore.js support AMD, others don't.
                  // If not, use the `_` global.
                  underscore: underscoreSupportsAMD ? Underscore : _ };
    var Kapi = rekapi({}, deps);

    if (KAPI_DEBUG) {
      Kapi.underscore_version = deps.underscore.VERSION;
    }

    if (!underscoreAlreadyInUse && underscoreSupportsAMD) {
      // Prevent Underscore from polluting the global scope.
      // This global can be safely removed since Rekapi keeps its own reference
      // to Underscore via the `deps` object passed earlier as an argument.
      this._ = undefined;
    }

    return Kapi;
  });
} else {
  // Load Rekapi normally (creating a Kapi global) if not using an AMD loader.

  // Note: `global` is not defined when running unit tests. Pass `this` instead.
  rekapi(this);
}

} (this));
