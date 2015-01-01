/*! rekapi - v1.4.4 - 2015-01-01 - http://rekapi.com */
/*!
 * Rekapi - Rewritten Kapi.
 * http://rekapi.com/
 *
 * By Jeremy Kahn (jeremyckahn@gmail.com)
 *
 * Make fun keyframe animations with JavaScript.
 *
 * Dependencies:
 *   * Underscore.js (https://github.com/documentcloud/underscore) or Lo-Dash (http://lodash.com/)
 *   * Shifty.js (https://github.com/jeremyckahn/shifty).
 *
 * MIT License.  This code free to use, modify, distribute and enjoy.
 */

;(function (global) {

// REKAPI-GLOBALS
// These are global in development, but get wrapped in a closure at build-time.

// A hack for UglifyJS defines.  Gets removes in the build process.
if (typeof REKAPI_DEBUG === 'undefined') {
  REKAPI_DEBUG = true;
}

var rekapiModules = [];

/*!
 * Fire an event bound to a Rekapi.
 * @param {Rekapi} rekapi
 * @param {string} eventName
 * @param {Underscore} _ A reference to the scoped Underscore/Lo-Dash
 * dependency
 * @param {Object=} opt_data Optional event-specific data
 */
function fireEvent (rekapi, eventName, _, opt_data) {
  _.each(rekapi._events[eventName], function (handler) {
    handler(rekapi, opt_data);
  });
}

/*!
 * @param {Rekapi} rekapi
 * @param {Underscore} _
 */
function recalculateAnimationLength (rekapi, _) {
  var actorLengths = [];

  _.each(rekapi._actors, function (actor) {
    actorLengths.push(actor.getEnd());
  });

  rekapi._animationLength = Math.max.apply(Math, actorLengths);
}

/*!
 * Does nothing.  Absolutely nothing at all.
 */
function noop () {
  // NOOP!
}

var rekapiCore = function (root, _, Tweenable) {

  'use strict';

  // CONSTANTS
  //
  var UPDATE_TIME = 1000 / 60;

  /*!
   * Determines which iteration of the loop the animation is currently in.
   * @param {Rekapi} rekapi
   * @param {number} timeSinceStart
   */
  function determineCurrentLoopIteration (rekapi, timeSinceStart) {
    var animationLength = rekapi._animationLength;
    if (animationLength === 0) {
      return timeSinceStart;
    }

    var currentIteration = Math.floor(timeSinceStart / animationLength);
    return currentIteration;
  }

  /*!
   * Calculate how many milliseconds since the animation began.
   * @param {Rekapi} rekapi
   * @return {number}
   */
  function calculateTimeSinceStart (rekapi) {
    return now() - rekapi._loopTimestamp;
  }

  /*!
   * Determines if the animation is complete or not.
   * @param {Rekapi} rekapi
   * @param {number} currentLoopIteration
   * @return {boolean}
   */
  function isAnimationComplete (rekapi, currentLoopIteration) {
    return currentLoopIteration >= rekapi._timesToIterate
       && rekapi._timesToIterate !== -1;
  }

  /*!
   * Stops the animation if it is complete.
   * @param {Rekapi} rekapi
   * @param {number} currentLoopIteration
   */
  function updatePlayState (rekapi, currentLoopIteration) {
    if (isAnimationComplete(rekapi, currentLoopIteration)) {
      rekapi.stop();
      fireEvent(rekapi, 'animationComplete', _);
    }
  }

  /*!
   * Calculate how far in the animation loop `rekapi` is, in milliseconds,
   * based on the current time.  Also overflows into a new loop if necessary.
   * @param {Rekapi} rekapi
   * @param {number} forMillisecond
   * @param {number} currentLoopIteration
   * @return {number}
   */
  function calculateLoopPosition (rekapi, forMillisecond, currentLoopIteration) {
    var currentLoopPosition;
    var animationLength = rekapi._animationLength;

    if (animationLength === 0) {
      return 0;
    }

    if (isAnimationComplete(rekapi, currentLoopIteration)) {
      // Rewind to the end if the playhead has gone past it
      currentLoopPosition = animationLength;
    } else {
      currentLoopPosition = forMillisecond % animationLength;
    }

    return currentLoopPosition;
  }

  /*!
   * Calculate the timeline position and state for a given millisecond.
   * Updates the `rekapi` state internally and accounts for how many loop
   * iterations the animation runs for.
   * @param {Rekapi} rekapi
   * @param {number} forMillisecond
   */
  function updateToMillisecond (rekapi, forMillisecond) {
    var loopPosition = 0;
    var currentIteration = 0;

    currentIteration = determineCurrentLoopIteration(rekapi, forMillisecond);
    loopPosition = calculateLoopPosition(
      rekapi, forMillisecond, currentIteration);
    rekapi._loopPosition = loopPosition;

    var keyframeResetList = [];

    if (currentIteration > rekapi._latestIteration) {
      fireEvent(rekapi, 'animationLooped', _);

      // Reset function keyframes
      var lookupObject = { name: 'function' };
      _.each(rekapi._actors, function (actor) {
        var fnKeyframes = _.where(actor._keyframeProperties, lookupObject);

        var lastFnKeyframe = _.last(fnKeyframes);

        if (lastFnKeyframe && !lastFnKeyframe.hasFired) {
          lastFnKeyframe.invoke();
        }

        keyframeResetList = keyframeResetList.concat(fnKeyframes);
      });
    }

    rekapi._latestIteration = currentIteration;
    rekapi.update(loopPosition);
    updatePlayState(rekapi, currentIteration);

    _.each(keyframeResetList, function (fnKeyframe) {
      fnKeyframe.hasFired = false;
    });
  }

  /*!
   * Calculate how far into the animation loop `rekapi` is, in milliseconds,
   * and update based on that time.
   * @param {Rekapi} rekapi
   */
  function updateToCurrentMillisecond (rekapi) {
    updateToMillisecond(rekapi, calculateTimeSinceStart(rekapi));
  }

  /*!
   * This is the heartbeat of an animation.  This updates `rekapi`'s state and
   * then calls itself continuously.
   * @param {Rekapi} rekapi
   */
  function tick (rekapi) {
    // Need to check for .call presence to get around an IE limitation.  See
    // annotation for cancelLoop for more info.
    if (rekapi._scheduleUpdate.call) {
      rekapi._loopId = rekapi._scheduleUpdate.call(global,
        rekapi._updateFn, UPDATE_TIME);
    } else {
      rekapi._loopId = setTimeout(rekapi._updateFn, UPDATE_TIME);
    }
  }

  /*!
   * @return {Function}
   */
  function getUpdateMethod () {
    // requestAnimationFrame() shim by Paul Irish (modified for Rekapi)
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    return global.requestAnimationFrame  ||
    global.webkitRequestAnimationFrame ||
    global.oRequestAnimationFrame      ||
    global.msRequestAnimationFrame     ||
      (global.mozCancelRequestAnimationFrame
       && global.mozRequestAnimationFrame) ||
    global.setTimeout;
  }

  /*!
   * @return {Function}
   */
  function getCancelMethod () {
    return global.cancelAnimationFrame  ||
    global.webkitCancelAnimationFrame ||
    global.oCancelAnimationFrame      ||
    global.msCancelAnimationFrame     ||
    global.mozCancelRequestAnimationFrame ||
    global.clearTimeout;
  }

  /*!
   * Cancels an update loop.  This abstraction is needed to get around the fact
   * that in IE, clearTimeout is not technically a function
   * (https://twitter.com/kitcambridge/status/206655060342603777) and thus
   * Function.prototype.call cannot be used upon it.
   * @param {Rekapi} rekapi
   */
  function cancelLoop (rekapi) {
    if (rekapi._cancelUpdate.call) {
      rekapi._cancelUpdate.call(global, rekapi._loopId);
    } else {
      clearTimeout(rekapi._loopId);
    }
  }

  // CORE-SPECIFIC VARS AND FUNCTIONS

  var now = Tweenable.now;

  var playState = {
    'STOPPED': 'stopped'
    ,'PAUSED': 'paused'
    ,'PLAYING': 'playing'
  };

  /**
   * If this is a rendered animation, the appropriate renderer is accessible as
   * `this.renderer`.  If provided, a reference to `opt_context` is accessible
   * as `this.context`.
   * @class Rekapi
   * @param {Object|CanvasRenderingContext2D|HTMLElement=} opt_context This
   * determines how to render the animation.  If this is not provided or is a
   * plain object (`{}`), the animation will not render anything and
   * `this.renderer` will be `undefined`.  If this is a reference to a
   * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D),
   * `{{#crossLink "Rekapi.CanvasRenderer"}}{{/crossLink}}` will be initialized
   * as `this.renderer` for HTML5 canvas-based rendering.  This this is a
   * reference to a DOM element, `{{#crossLink
   * "Rekapi.DOMRenderer"}}{{/crossLink}}` will be initialized as
   * `this.renderer` for either a DOM or CSS `@keyframe`-based rendering.
   * @constructor
   * @chainable
   */
  function Rekapi (opt_context) {
    this.context = opt_context || {};
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
      ,'addKeyframeProperty': []
      ,'removeKeyframeProperty': []
      ,'addKeyframePropertyTrack': []
      ,'timelineModified': []
      ,'animationLooped': []
    };

    // How many times to loop the animation before stopping
    this._timesToIterate = -1;

    // Millisecond duration of the animation
    this._animationLength = 0;

    // The setTimeout ID of `tick`
    this._loopId = null;

    // The UNIX time at which the animation loop started
    this._loopTimestamp = null;

    // Used for maintaining position when the animation is paused
    this._pausedAtTime = null;

    // The last millisecond position that was updated
    this._lastUpdatedMillisecond = 0;

    // The most recent loop iteration a frame was calculated for
    this._latestIteration = 0;

    // The most recent millisecond position within the loop that the animation
    // was updated to
    this._loopPosition = null;

    this._scheduleUpdate = getUpdateMethod();
    this._cancelUpdate = getCancelMethod();

    this._updateFn = _.bind(function () {
      tick(this);
      updateToCurrentMillisecond(this);
    }, this);

    _.each(Rekapi._rendererInitHook, function (rendererInitHook) {
      rendererInitHook(this);
    }, this);

    return this;
  }

  // Decorate the Rekapi object with the dependencies so that other modules can
  // access them.
  Rekapi.Tweenable = Tweenable;
  Rekapi._ = _;

  /*!
   * @type {Object.<function>} Contains the context init function to be called
   * in the Rekapi constructor.
   */
  Rekapi._rendererInitHook = {};

  /**
   * Add an actor to the animation.  Decorates the added `actor` with a
   * reference to this `Rekapi` instance as `this.rekapi`.
   *
   * @method addActor
   * @param {Rekapi.Actor|Object} actor If this is an `Object`, it is used to
   * as the constructor parameters for a new `{{#crossLink
   * "Rekapi.Actor"}}{{/crossLink}}` instance that is created by this method.
   * @return {Rekapi.Actor} The actor that was added.
   */
  Rekapi.prototype.addActor = function (actor) {
    var rekapiActor;

    if (actor instanceof Rekapi.Actor) {
      rekapiActor = actor;
    } else {
      rekapiActor = new Rekapi.Actor(actor);
    }

    // You can't add an actor more than once.
    if (!_.contains(this._actors, rekapiActor)) {
      if (typeof rekapiActor.context === 'undefined') {
        rekapiActor.context = this.context;
      }

      rekapiActor.rekapi = this;

      // Store a reference to the actor internally
      this._actors[rekapiActor.id] = rekapiActor;

      recalculateAnimationLength(this, _);
      rekapiActor.setup();

      fireEvent(this, 'addActor', _, rekapiActor);
    }

    return rekapiActor;
  };

  /**
   * Get a reference to an actor from the animation by its `id`.  You can use
   * `{{#crossLink "Rekapi/getActorIds:method"}}{{/crossLink}}` to get a list
   * of IDs for all actors in the animation.
   * @method getActor
   * @param {number} actorId
   * @return {Rekapi.Actor}
   */
  Rekapi.prototype.getActor = function (actorId) {
    return this._actors[actorId];
  };

  /**
   * Retrieve the `id`'s of all actors in an animation.
   *
   * @method getActorIds
   * @return {Array(number)}
   */
  Rekapi.prototype.getActorIds = function () {
    return _.pluck(this._actors, 'id');
  };

  /**
   * Retrieve all actors in the animation as an Object.
   * @method getAllActors
   * @return {Object} The keys of this Object correspond to the Actors' `id`s.
   */
  Rekapi.prototype.getAllActors = function () {
    return _.clone(this._actors);
  };

  /**
   * Return the number of actors in the animation.
   * @method getActorCount
   * @return {number}
   */
  Rekapi.prototype.getActorCount = function () {
    return _.size(this._actors);
  };

  /**
   * Remove an actor from the animation.  This does not destroy the actor, it
   * only removes the link between it and the `Rekapi` instance.  This method
   * calls the actor's `teardown` method, if it is defined.
   * @method removeActor
   * @param {Rekapi.Actor} actor
   * @return {Rekapi.Actor}
   */
  Rekapi.prototype.removeActor = function (actor) {
    // Remove the link between Rekapi and actor
    delete this._actors[actor.id];
    delete actor.rekapi;

    actor.teardown();
    recalculateAnimationLength(this, _);

    fireEvent(this, 'removeActor', _, actor);

    return actor;
  };

  /**
   * Play the animation.
   *
   * __[Example](../../../../docs/examples/play.html)__
   * @method play
   * @param {number=} opt_howManyTimes If omitted, the animation will loop
   * endlessly.
   * @chainable
   */
  Rekapi.prototype.play = function (opt_howManyTimes) {
    cancelLoop(this);

    if (this._playState === playState.PAUSED) {
      // Move the playhead to the correct position in the timeline if resuming
      // from a pause
      this._loopTimestamp += now() - this._pausedAtTime;
    } else {
      this._loopTimestamp = now();
    }

    this._timesToIterate = opt_howManyTimes || -1;
    this._playState = playState.PLAYING;

    // Start the update loop
    tick(this);

    fireEvent(this, 'playStateChange', _);
    fireEvent(this, 'play', _);

    return this;
  };

  /**
   * Move to a specific millisecond on the timeline and play from there.
   *
   * __[Example](../../../../docs/examples/play_from.html)__
   * @method playFrom
   * @param {number} millisecond
   * @param {number=} opt_howManyTimes Works as it does in {{#crossLink
   * "Rekapi/play:method"}}{{/crossLink}}.
   * @chainable
   */
  Rekapi.prototype.playFrom = function (millisecond, opt_howManyTimes) {
    this.play(opt_howManyTimes);
    this._loopTimestamp = now() - millisecond;

    return this;
  };

  /**
   * Play from the last frame that was rendered with {{#crossLink
   * "Rekapi/update:method"}}{{/crossLink}}.
   *
   * __[Example](../../../../docs/examples/play_from_current.html)__
   * @method playFromCurrent
   * @param {number=} opt_howManyTimes Works as it does in {{#crossLink
   * "Rekapi/play:method"}}{{/crossLink}}.
   * @chainable
   */
  Rekapi.prototype.playFromCurrent = function (opt_howManyTimes) {
    return this.playFrom(this._lastUpdatedMillisecond, opt_howManyTimes);
  };

  /**
   * Pause the animation.  A "paused" animation can be resumed from where it
   * left off with {{#crossLink "Rekapi/play:method"}}{{/crossLink}}.
   *
   * __[Example](../../../../docs/examples/pause.html)__
   * @method pause
   * @param pause
   * @chainable
   */
  Rekapi.prototype.pause = function () {
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
   * Stop the animation.  A "stopped" animation will start from the beginning
   * if {{#crossLink "Rekapi/play:method"}}{{/crossLink}} is called.
   *
   * __[Example](../../../../docs/examples/stop.html)__
   * @method stop
   * @chainable
   */
  Rekapi.prototype.stop = function () {
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
   * @method isPlaying
   * @return {boolean} Whether or not the animation is playing (meaning not paused or
   * stopped).
   */
  Rekapi.prototype.isPlaying = function () {
    return this._playState === playState.PLAYING;
  };

  /**
   * Render an animation frame at a specific point in the timeline.
   *
   * __[Example](../../../../docs/examples/update.html)__
   * @method update
   * @param {number=} opt_millisecond The point in the timeline at which to
   * render.  If omitted, this renders the last millisecond that was rendered
   * (it's a re-render).
   * @chainable
   */
  Rekapi.prototype.update = function (opt_millisecond) {
    if (opt_millisecond === undefined) {
      opt_millisecond = this._lastUpdatedMillisecond;
    }

    fireEvent(this, 'beforeUpdate', _);

    // Update and render each of the actors
    _.each(this._actors, function (actor) {
      actor._updateState(opt_millisecond);
      if (typeof actor.render === 'function') {
        actor.render(actor.context, actor.get());
      }
    });

    this._lastUpdatedMillisecond = opt_millisecond;
    fireEvent(this, 'afterUpdate', _);

    return this;
  };

  /**
   * __[Example](../../../../docs/examples/get_last_position_updated.html)__
   * @method getLastPositionUpdated
   * @return {number} The normalized timeline position (between 0 and 1) that
   * was last rendered.
   */
  Rekapi.prototype.getLastPositionUpdated = function () {
    return (this._lastUpdatedMillisecond / this._animationLength);
  };

  /**
   * @method getAnimationLength
   * @return {number} The length of the animation timeline, in milliseconds.
   */
  Rekapi.prototype.getAnimationLength = function () {
    return this._animationLength;
  };

  /**
   * Bind a handler function to a Rekapi event.
   *
   * __[Example](../../../../docs/examples/bind.html)__
   * @method on
   * @param {string} eventName Valid values are:
   *
   * - __animationComplete__: Fires when all animation loops have completed.
   * - __playStateChange__: Fires when the animation is played, paused, or
   *   stopped.
   * - __play__: Fires when the animation is {{#crossLink
   *   "Rekapi/play:method"}}{{/crossLink}}ed.
   * - __pause__: Fires when the animation is {{#crossLink
   *   "Rekapi/pause:method"}}{{/crossLink}}d.
   * - __stop__: Fires when the animation is {{#crossLink
   *   "Rekapi/stop:method"}}{{/crossLink}}ped.
   * - __beforeUpdate__: Fires each frame before all actors are rendered.
   * - __afterUpdate__: Fires each frame after all actors are rendered.
   * - __addActor__: Fires when an actor is added.  `opt_data` is the
   *   {{#crossLink "Rekapi.Actor"}}{{/crossLink}} that was added.
   * - __removeActor__: Fires when an actor is removed.  `opt_data` is the
   *   {{#crossLink "Rekapi.Actor"}}{{/crossLink}} that was removed.
   * - __addKeyframeProperty__: Fires when a keyframe property is added.
   *   `opt_data` is the {{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}
   *   that was added.
   * - __removeKeyframeProperty__: Fires when a {{#crossLink
   *   "Rekapi.KeyframeProperty"}}{{/crossLink}} is removed.  `opt_data` is the
   *   {{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}} that was removed.
   * - __addKeyframePropertyTrack__: Fires when the a keyframe is added to an
   *   actor that creates a new keyframe property track.  `opt_data` is the
   *   {{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}
   *   that was added to create the property track.  A reference to the actor
   *   that the keyframe property is associated with can be accessed via
   *   `opt_data.actor` and the track name that was added can be determined via
   *   `opt_data.name`.
   * - __timelineModified__: Fires when a keyframe is added, modified or
   *   removed.
   * - __animationLooped__: Fires when an animation loop ends and a new one
   *   begins.
   * @param {Function(Rekapi,Object=)} handler Receives the Rekapi instance as
   * the first parameter and event-specific data as the second (`opt_data`).
   * @chainable
   */
  Rekapi.prototype.on = function (eventName, handler) {
    if (!this._events[eventName]) {
      return;
    }

    this._events[eventName].push(handler);

    return this;
  };

  /**
   * Unbind one or more handlers from a Rekapi event.
   *
   * __[Example](../../../../docs/examples/unbind.html)__
   * @method off
   * @param {string} eventName Valid values correspond to the list under
   * {{#crossLink "Rekapi/on:method"}}{{/crossLink}}.
   * @param {Function=} opt_handler If omitted, all handler functions bound to
   * `eventName` are unbound.
   * @chainable
   */
  Rekapi.prototype.off = function (eventName, opt_handler) {
    if (!this._events[eventName]) {
      return;
    }

    if (!opt_handler) {
      // Remove all handlers
      this._events[eventName] = [];
    } else {
      // Remove just the handler specified
      this._events[eventName] = _.without(
        this._events[eventName], opt_handler);
    }

    return this;
  };

  /**
   * Export the timeline to a JSON-serializable `Object`.
   *
   * __[Example](../../../docs/examples/export_timeline.html)__
   * @method exportTimeline
   * @return {Object} This data can later be consumed by {{#crossLink
   * "Rekapi/importTimeline:method"}}{{/crossLink}}.
   */
  Rekapi.prototype.exportTimeline = function () {
    var exportData = {
      'duration': this._animationLength
      ,'actors': []
    };

    _.each(this._actors, function (actor) {
      exportData.actors.push(actor.exportTimeline());
    }, this);

    return exportData;
  };

  /**
   * Import data that was created by {{#crossLink
   * "Rekapi/exportTimeline:method"}}{{/crossLink}}.  This sets up all actors
   * and keyframes specified in the `rekapiData` parameter.  These two methods
   * collectively allow you serialize an animation (for sending to a server for
   * persistence, for example) and later recreating an identical animation.
   *
   * @method importTimeline
   * @param {Object} rekapiData Any object that has the same data format as the
   * object generated from Rekapi#exportTimeline.
   */
  Rekapi.prototype.importTimeline = function (rekapiData) {
    _.each(rekapiData.actors, function (actorData) {
      var actor = new Rekapi.Actor();
      actor.importTimeline(actorData);
      this.addActor(actor);
    }, this);
  };

  Rekapi.util = {};

  // Some hooks for testing.  Gets compiled away at build time.
  if (REKAPI_DEBUG) {
    Rekapi._private = {
      'calculateLoopPosition': calculateLoopPosition
      ,'updateToCurrentMillisecond': updateToCurrentMillisecond
      ,'updateToMillisecond': updateToMillisecond
      ,'tick': tick
      ,'determineCurrentLoopIteration': determineCurrentLoopIteration
      ,'calculateTimeSinceStart': calculateTimeSinceStart
      ,'isAnimationComplete': isAnimationComplete
      ,'updatePlayState': updatePlayState
    };
  }

  root.Rekapi = Rekapi;

};

rekapiModules.push(function (context) {

  'use strict';

  var DEFAULT_EASING = 'linear';
  var Rekapi = context.Rekapi;
  var Tweenable = Rekapi.Tweenable;
  var _ = Rekapi._;

  /*!
   * Sorts an array numerically, from smallest to largest.
   * @param {Array.<number>} array The Array to sort.
   * @return {Array.<number>} The sorted Array.
   */
  function sortNumerically (array) {
    return array.sort(function (a, b) {
      return a - b;
    });
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {string} event
   */
  function fireRekapiEventForActor (actor, event) {
    if (actor.rekapi) {
      fireEvent(actor.rekapi, event, _);
    }
  }

  /*!
   * Retrieves the most recent property cache ID for a given millisecond.
   * @param {Rekapi.Actor} actor
   * @param {number} millisecond
   * @return {number} -1 if there is no property cache for the millisecond
   * (this should never happen).
   */
  function getPropertyCacheIdForMillisecond (actor, millisecond) {
    var list = actor._timelinePropertyCacheKeys;

    var i, len = list.length;

    // If there is only one keyframe, use that
    if (len === 1) {
      return 0;
    }

    //TODO:  Oh noes, this is a linear search!  Maybe optimize it?
    for (i = 1; i < len; i++) {
      if (list[i] >= millisecond) {
        return (i - 1);
      }
    }

    return -1;
  }

  /*!
   * Sort all of an Actor's property tracks so they can be cached.
   * @param {Rekapi.Actor} actor
   */
  function sortPropertyTracks (actor) {
    _.each(actor._propertyTracks, function (track) {
      track.sort(function (current, next) {
        return current.millisecond - next.millisecond;
      });
    });
  }

  /*!
   * Compute and fill all timeline caches.
   * @param {Rekapi.Actor} actor
   */
  function cachePropertiesToSegments (actor) {
    _.each(actor._timelinePropertyCache, function (propertyCache, cacheId) {
      var latestProperties = getLatestPropeties(actor, cacheId);
      _.defaults(propertyCache, latestProperties);
    });
  }

  /*!
   * Gets all of the current and most recent Rekapi.KeyframeProperties for a
   * given millisecond.
   * @param {Rekapi.Actor} actor
   * @param {number} forMillisecond
   * @return {Object} An Object containing Rekapi.KeyframeProperties
   */
  function getLatestPropeties (actor, forMillisecond) {
    var latestProperties = {};

    _.each(actor._propertyTracks, function (propertyTrack, propertyName) {
      var previousKeyframeProperty = propertyTrack[0] || null;
      var i = 0, len = propertyTrack.length, keyframeProperty;

      for (i; i < len; i++) {
        keyframeProperty = propertyTrack[i];

        if (keyframeProperty.millisecond > forMillisecond) {
          // We went to far, use the previous keyframeProperty
          latestProperties[propertyName] = previousKeyframeProperty;
        } else if (keyframeProperty.millisecond === forMillisecond) {
          // Found it!
          latestProperties[propertyName] = keyframeProperty;
        }

        previousKeyframeProperty = keyframeProperty;

        // Quit the loop if something was found.  We can't early-return above,
        // because latestProperties[propertyName] might be null, which is not
        // what we want.
        if (latestProperties[propertyName]) {
          break;
        }
      }

      // If nothing was found, attempt to use the last keyframeProperty in the
      // track.
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
   * Links each KeyframeProperty to the next one in its respective track.
   *
   * They're linked lists!
   * @param {Rekapi.Actor} actor
   */
  function linkTrackedProperties (actor) {
    _.each(actor._propertyTracks, function (propertyTrack) {
      _.each(propertyTrack, function (keyframeProperty, i) {
        keyframeProperty.linkToNext(propertyTrack[i + 1]);
      });
    });
  }

  /*!
   * Returns a requested KeyframeProperty at a millisecond on a specified
   * track.
   * @param {Rekapi.Actor} actor
   * @param {string} trackName
   * @param {number} millisecond
   * @return {Rekapi.KeyframeProperty|undefined}
   */
  function findPropertyAtMillisecondInTrack (actor, trackName, millisecond) {
    return _.findWhere(actor._propertyTracks[trackName], {
      millisecond: millisecond
    });
  }

  /*!
   * Empty out and rebuild the cache of internal KeyframeProperty data.
   * @param {Rekapi.Actor}
   */
  function invalidatePropertyCache (actor) {
    actor._timelinePropertyCache = {};
    var timelinePropertyCache = actor._timelinePropertyCache;

    // Build the cache map
    var millisecond;
    _.each(actor._keyframeProperties, function (keyframeProperty) {
      millisecond = keyframeProperty.millisecond;
      if (!timelinePropertyCache[millisecond]) {
        timelinePropertyCache[millisecond] = {};
      }

      timelinePropertyCache[millisecond][keyframeProperty.name]
         = keyframeProperty;
    });

    actor._timelinePropertyCacheKeys = _.map(timelinePropertyCache,
    function (val, key) {
      return +key;
    });

    // Optimize the cache lookup
    sortNumerically(actor._timelinePropertyCacheKeys);

    // Associate cache map elements to their respective points on the timeline
    cachePropertiesToSegments(actor);

    // Re-link the linked list of keyframeProperties
    linkTrackedProperties(actor);
  }

  /*!
   * Updates internal Rekapi and Actor data after a KeyframeProperty
   * modification method is called.
   *
   * TODO: This should be moved to core.
   *
   * @param {Rekapi.Actor} actor
   */
  function cleanupAfterKeyframeModification (actor) {
    sortPropertyTracks(actor);
    invalidatePropertyCache(actor);
    recalculateAnimationLength(actor.rekapi, _);
    fireRekapiEventForActor(actor, 'timelineModified');
  }

  /**
   * An actor represents an individual component of an animation.  An animation
   * may have one or many actors.
   *
   * @class Rekapi.Actor
   * @param {Object=} opt_config Valid properties:
   *   - __context__ (_Object|CanvasRenderingContext2D|HTMLElement_): The
   *   rendering context for this actor. If omitted, this Actor gets the parent
   *   `{{#crossLink "Rekapi"}}{{/crossLink}}` instance's `context` when it is
   *   added with `{{#crossLink "Rekapi/addActor:method"}}{{/crossLink}}`.
   *   - __setup__ (_Function_): A function that gets called when the actor is
   *     added to an animation with
   *     `{{#crossLink "Rekapi/addActor:method"}}{{/crossLink}}`.
   *   - __render__ (_Function(Object, Object)_): A function that gets called
   *   every time the actor's state is updated (once every frame). This
   *   function should do something meaningful with state of the actor (for
   *   example, visually rendering to the screen).  This function receives two
   *   parameters: The first is a reference to the actor's `context` and the
   *   second is an Object containing the current state properties.
   *   - __teardown__ (_Function_): A function that gets called when the actor
   *   is removed from an animation with
   *   `{{#crossLink "Rekapi/removeActor:method"}}{{/crossLink}}`.
   * @constructor
   */
  Rekapi.Actor = function (opt_config) {

    opt_config = opt_config || {};

    // Steal the `Tweenable` constructor.
    Tweenable.call(this);

    _.extend(this, {
      '_propertyTracks': {}
      ,'_timelinePropertyCache': {}
      ,'_timelinePropertyCacheKeys': []
      ,'_keyframeProperties': {}
      ,'id': _.uniqueId()
      ,'context': opt_config.context // This may be undefined
      ,'setup': opt_config.setup || noop
      ,'render': opt_config.render || noop
      ,'teardown': opt_config.teardown || noop
      ,'data': {}
    });

    return this;
  };
  var Actor = Rekapi.Actor;

  // Kind of a fun way to set up an inheritance chain.  `ActorMethods` prevents
  // methods on `Actor.prototype` from polluting `Tweenable`'s prototype with
  // `Actor` specific methods.
  var ActorMethods = function () {};
  ActorMethods.prototype = Tweenable.prototype;
  Actor.prototype = new ActorMethods();
  // But the magic doesn't stop here!  `Actor`'s constructor steals the
  // `Tweenable` constructor.

  /**
   * Create a keyframe for the actor.  The animation timeline begins at `0`.
   * The timeline's length will automatically "grow" to accommodate new
   * keyframes as they are added.
   *
   * `state` should contain all of the properties that define this
   * keyframe's state.  These properties can be any value that can be tweened
   * by [Shifty](http://jeremyckahn.github.io/shifty/) (numbers,
   * RGB/hexadecimal color strings, and CSS property strings).  `state` can
   * also be a function, but this works differently (see "Function keyframes"
   * below).
   *
   * __Note:__ Internally, this creates `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}`s and places them on a "track."
   * These `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`s are
   * managed for you by the `{{#crossLink "Rekapi.Actor"}}{{/crossLink}}` APIs.
   *
   * ## Keyframe inheritance
   *
   * Keyframes always inherit missing properties from the previous keyframe.
   * For example:
   *
   *     actor.keyframe(0, {
   *       'x': 100
   *     }).keyframe(1000, {
   *       // Implicitly specifies the `x: 100` from above
   *       'y': 50
   *     });
   *
   * Keyframe `1000` will have a `y` of `50`, and an `x` of `100`, because `x`
   * was inherited from keyframe `0`.
   *
   * ## Function keyframes
   *
   * Instead of providing an Object to be used to interpolate state values, you
   * can provide a function to be called at a specific point on the timeline.
   * This function does not need to return a value, as it does not get used to
   * render the actor state.  Function keyframes are called once per animation
   * loop and do not have any tweening relationship with one another.  This is
   * a primarily a mechanism for scheduling arbitrary code to be executed at
   * specific points in an animation.
   *
   *     // drift is the number of milliseconds that this function was executed
   *     // after the scheduled time.  There is typically some amount of delay
   *     // due to the nature of JavaScript timers.
   *     actor.keyframe(1000, function (drift) {
   *       console.log(this); // Logs the actor instance
   *     });
   *
   * ## Easing
   *
   * `opt_easing`, if provided, can be a string or an Object.  If `opt_easing`
   * is a string, all animated properties will have the same easing curve
   * applied to them.  For example:
   *
   *     actor.keyframe(1000, {
   *         'x': 100,
   *         'y': 100
   *       }, 'easeOutSine');
   *
   * Both `x` and `y` will have `easeOutSine` applied to them.  You can also
   * specify multiple easing curves with an Object:
   *
   *     actor.keyframe(1000, {
   *         'x': 100,
   *         'y': 100
   *       }, {
   *         'x': 'easeinSine',
   *         'y': 'easeOutSine'
   *       });
   *
   * `x` will ease with `easeInSine`, and `y` will ease with `easeOutSine`.
   * Any unspecified properties will ease with `linear`.  If `opt_easing` is
   * omitted, all properties will default to `linear`.
   * @method keyframe
   * @param {number} millisecond Where on the timeline to set the keyframe.
   * @param {Object|Function(number)} state The state properties of the
   * keyframe.  If this is an Object, the properties will be interpolated
   * between this and those of the following keyframe for a given point on the
   * animation timeline.  If this is a function, it will be executed at the
   * specified keyframe.  The function will receive a number that represents
   * the delay between when the function is called and when it was scheduled.
   * @param {string|Object=} opt_easing Optional easing string or Object.  If
   * `state` is a function, this is ignored.
   * @chainable
   */
  Actor.prototype.keyframe = function keyframe (
    millisecond, state, opt_easing) {

    if (state instanceof Function) {
      state = { 'function': state };
    }

    opt_easing = opt_easing || DEFAULT_EASING;
    var easing = Tweenable.composeEasingObject(state, opt_easing);
    var newKeyframeProperty;

    // Create and add all of the KeyframeProperties
    _.each(state, function (value, name) {
      newKeyframeProperty = new Rekapi.KeyframeProperty(
        millisecond, name, value, easing[name]);

      this._addKeyframeProperty(newKeyframeProperty);
    }, this);

    if (this.rekapi) {
      recalculateAnimationLength(this.rekapi, _);
    }

    invalidatePropertyCache(this);
    fireRekapiEventForActor(this, 'timelineModified');

    return this;
  };

  /**
   * @method hasKeyframeAt
   * @param {number} millisecond Point on the timeline to query.
   * @param {string=} opt_trackName Optionally scope the lookup to a particular
   * track.
   * @return {boolean} Whether or not the actor has any `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}`s set at `millisecond`.
   */
  Actor.prototype.hasKeyframeAt = function (millisecond, opt_trackName) {
    var tracks = this._propertyTracks;

    if (opt_trackName) {
      if (!_.has(tracks, opt_trackName)) {
        return false;
      }
      tracks = _.pick(tracks, opt_trackName);
    }

    // Search through the tracks and determine if a property can be found.
    var track;
    for (track in tracks) {
      if (tracks.hasOwnProperty(track)
         && findPropertyAtMillisecondInTrack(this, track, millisecond)) {
        return true;
      }
    }

    return false;
  };

  /**
   * Copies all of the `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}`s from one point on the actor's
   * timeline to another. This is particularly useful for animating an actor
   * back to its original position.
   *
   *     actor
   *       .keyframe(0, {
   *         x: 10,
   *         y: 15
   *       }).keyframe(1000, {
   *         x: 50,
   *         y: 75
   *       });
   *
   *     // Return the actor to its original position
   *     actor.copyKeyframe(2000, 0);
   *
   * __[Example](../../../../docs/examples/actor_copy_keyframe.html)__
   * @method copyKeyframe
   * @param {number} copyTo The timeline millisecond to copy KeyframeProperties
   * to.
   * @param {number} copyFrom The timeline millisecond to copy
   * KeyframeProperties from.
   * @chainable
   */
  Actor.prototype.copyKeyframe = function (copyTo, copyFrom) {
    // Build the configuation objects to be passed to Actor#keyframe
    var sourcePositions = {};
    var sourceEasings = {};

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var keyframeProperty =
      findPropertyAtMillisecondInTrack(this, trackName, copyFrom);

      if (keyframeProperty) {
        sourcePositions[trackName] = keyframeProperty.value;
        sourceEasings[trackName] = keyframeProperty.easing;
      }
    }, this);

    this.keyframe(copyTo, sourcePositions, sourceEasings);
    return this;
  };

  /**
   * Moves all of the
   * `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`s from one
   * point on the actor's timeline to another.  Although this method does error
   * checking for you to make sure the operation can be safely performed, an
   * effective pattern is to use `{{#crossLink
   * "Rekapi.Actor/hasKeyframeAt:method"}}{{/crossLink}}` to see if there is
   * already a keyframe at the requested `to` destination.
   *
   * __[Example](../../../../docs/examples/actor_move_keyframe.html)__
   * @method moveKeyframe
   * @param {number} from The millisecond of the keyframe to be moved.
   * @param {number} to The millisecond of where the keyframe should be moved
   * to.
   * @return {boolean} Whether or not the keyframe was successfully moved.
   */
  Actor.prototype.moveKeyframe = function (from, to) {
    if (!this.hasKeyframeAt(from) || this.hasKeyframeAt(to)) {
      return false;
    }

    // Move each of the relevant KeyframeProperties to the new location in the
    // timeline
    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var property = findPropertyAtMillisecondInTrack(this, trackName, from);

      if (property) {
        property.millisecond = to;
      }
    }, this);

    cleanupAfterKeyframeModification(this);

    return true;
  };

  /**
   * Augment the `value` or `easing` of the `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}`s at a given millisecond.  Any
   * `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`s omitted in
   * `stateModification` or `opt_easing` are not modified.
   *
   *     actor.keyframe(0, {
   *       'x': 10,
   *       'y': 20
   *     }).keyframe(1000, {
   *       'x': 20,
   *       'y': 40
   *     }).keyframe(2000, {
   *       'x': 30,
   *       'y': 60
   *     })
   *
   *     // Changes the state of the keyframe at millisecond 1000.
   *     // Modifies the value of 'y' and the easing of 'x.'
   *     actor.modifyKeyframe(1000, {
   *       'y': 150
   *     }, {
   *       'x': 'easeFrom'
   *     });
   *
   * __[Example](../../../../docs/examples/actor_modify_keyframe.html)__
   * @method modifyKeyframe
   * @param {number} millisecond
   * @param {Object} stateModification
   * @param {Object=} opt_easingModification
   * @chainable
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

    cleanupAfterKeyframeModification(this);

    return this;
  };

  /**
   * Remove all `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`s set
   * on the actor at a given millisecond in the animation.
   *
   * __[Example](../../../../docs/examples/actor_remove_keyframe.html)__
   * @method removeKeyframe
   * @param {number} millisecond The location on the timeline of the keyframe
   * to remove.
   * @chainable
   */
  Actor.prototype.removeKeyframe = function (millisecond) {
    var propertyTracks = this._propertyTracks;

    _.each(this._propertyTracks, function (propertyTrack, propertyName) {
      var keyframeProperty = _.findWhere(
        propertyTrack, { millisecond: millisecond });

      if (keyframeProperty) {
        propertyTracks[propertyName] = _.without(
          propertyTrack, keyframeProperty);
        keyframeProperty.detach();
      }
    }, this);

    if (this.rekapi) {
      recalculateAnimationLength(this.rekapi, _);
    }

    invalidatePropertyCache(this);
    fireRekapiEventForActor(this, 'timelineModified');

    return this;
  };

  /**
   * Remove all `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`s set
   * on the actor.
   *
   * __[Example](../../../../docs/examples/actor_remove_all_keyframes.html)__
   * @method removeAllKeyframes
   * @chainable
   */
  Actor.prototype.removeAllKeyframes = function () {
    _.each(this._propertyTracks, function (propertyTrack) {
      propertyTrack.length = 0;
    });

    _.each(this._keyframeProperties, function (keyframeProperty) {
      keyframeProperty.detach();
    }, this);

    this._keyframeProperties = {};

    // Calling removeKeyframe performs some necessary post-removal cleanup, the
    // earlier part of this method skipped all of that for the sake of
    // efficiency.
    return this.removeKeyframe(0);
  };

  /**
   * @method getKeyframeProperty
   * @param {string} property The name of the property track.
   * @param {number} millisecond The millisecond of the property in the
   * timeline.
   * @return {Rekapi.KeyframeProperty|undefined} A `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` that is stored on the actor, as
   * specified by the `property` and `millisecond` parameters. This is
   * `undefined` if no properties were found.
   */
  Actor.prototype.getKeyframeProperty = function (property, millisecond) {
    var propertyTrack = this._propertyTracks[property];
    if (propertyTrack) {
      return _.findWhere(propertyTrack, { millisecond: millisecond });
    }
  };

  /**
   * Modify a `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}` stored
   * on an actor.  Internally, this calls `{{#crossLink
   * "Rekapi.KeyframeProperty/modifyWith:method"}}{{/crossLink}}` and then
   * performs some cleanup.
   *
   * __[Example](../../../../docs/examples/actor_modify_keyframe_property.html)__
   * @method modifyKeyframeProperty
   * @param {string} property The name of the `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` to modify.
   * @param {number} millisecond The timeline millisecond of the `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` to modify.
   * @param {Object} newProperties The properties to augment the `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` with.
   * @chainable
   */
  Actor.prototype.modifyKeyframeProperty = function (
    property, millisecond, newProperties) {

    var keyframeProperty = this.getKeyframeProperty(property, millisecond);
    if (keyframeProperty) {
      keyframeProperty.modifyWith(newProperties);
      cleanupAfterKeyframeModification(this);
    }

    return this;
  };

  /**
   * Remove a single `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`
   * from the actor.
   * @method removeKeyframeProperty
   * @param {string} property The name of the `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` to remove.
   * @param {number} millisecond Where in the timeline the `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` to remove is.
   * @return {Rekapi.KeyframeProperty|undefined} The removed KeyframeProperty,
   * if one was found.
   */
  Actor.prototype.removeKeyframeProperty = function (property, millisecond) {
    var propertyTracks = this._propertyTracks;

    if (typeof propertyTracks[property] !== 'undefined') {
      var keyframeProperty = this.getKeyframeProperty(property, millisecond);
      propertyTracks[property] =
      _.without(propertyTracks[property], keyframeProperty);
      keyframeProperty.detach();

      cleanupAfterKeyframeModification(this);

      return keyframeProperty;
    }
  };

  /**
   *
   * @method getTrackNames
   * @return {Array(string)} A list of all the track names for an actor.
   */
  Actor.prototype.getTrackNames = function () {
    return _.keys(this._propertyTracks);
  };

  /**
   * Get all of the `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`s
   * for a track.
   * @method getPropertiesInTrack
   * @param {string} trackName The track name to query.
   * @return {Rekapi.KeyframeProperty[]|undefined}
   */
  Actor.prototype.getPropertiesInTrack = function (trackName) {
    var propertyTrack = this._propertyTracks[trackName];

    if (propertyTrack) {
      return propertyTrack.slice(0);
    }
  };

  /**
   * @method getStart
   * @param {string=} opt_trackName Optionally scope the lookup to a particular
   * track.
   * @return {number} The millisecond of the first animating state of an actor
   * (for instance, if the actor's first keyframe is later than millisecond
   * `0`).  If there are no keyframes, this returns `0`.
   */
  Actor.prototype.getStart = function (opt_trackName) {
    var starts = [];
    var propertyTracks = this._propertyTracks;

    // Null check to see if opt_trackName was provided and is valid
    if (propertyTracks.hasOwnProperty(opt_trackName)) {
      var firstKeyframeProperty = propertyTracks[opt_trackName][0];

      if (firstKeyframeProperty) {
        starts.push(firstKeyframeProperty.millisecond);
      }
    } else {
      // Loop over all property tracks and accumulate the first
      // keyframeProperties from non-empty tracks
      _.each(propertyTracks, function (propertyTrack) {
        if (propertyTrack.length) {
          starts.push(propertyTrack[0].millisecond);
        }
      });
    }

    if (starts.length === 0) {
      starts = [0];
    }

    var start;
    if (starts.length > 0) {
      start = Math.min.apply(Math, starts);
    } else {
      start = 0;
    }

    return start;
  };

  /**
   * @method getEnd
   * @param {string=} opt_trackName Optionally scope the lookup to a particular
   * keyframe track.
   * @return {number} The millisecond of the last state of an actor (the point
   * in the timeline in which it is done animating).  If there are no
   * keyframes, this is `0`.
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
   * @method getLength
   * @param {string=} opt_trackName Optionally scope the lookup to a particular
   * track.
   * @return {number} The length of time in milliseconds that the actor
   * animates for.
   */
  Actor.prototype.getLength = function (opt_trackName) {
    return this.getEnd(opt_trackName) - this.getStart(opt_trackName);
  };

  /**
   * Extend the last state on this actor's timeline to simulate a pause.
   * Internally, this method copies the final state of the actor in the
   * timeline to the millisecond defined by `until`.
   *
   * __[Example](../../../../docs/examples/actor_wait.html)__
   * @method wait
   * @param {number} until At what point in the animation the Actor should wait
   * until (relative to the start of the animation timeline).  If this number
   * is less than the value returned from `{{#crossLink
   * "Rekapi.Actor/getLength:method"}}{{/crossLink}}`, this method does
   * nothing.
   * @chainable
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

  /*!
   * Associate a `Rekapi.KeyframeProperty` to this actor.  Augments the
   * `Rekapi.KeyframeProperty` to maintain a link between the two objects.
   * @method _addKeyframeProperty
   * @param {Rekapi.KeyframeProperty} keyframeProperty
   * @chainable
   */
  Actor.prototype._addKeyframeProperty = function (keyframeProperty) {
    keyframeProperty.actor = this;
    this._keyframeProperties[keyframeProperty.id] = keyframeProperty;

    var name = keyframeProperty.name;
    var propertyTracks = this._propertyTracks;

    if (typeof this._propertyTracks[name] === 'undefined') {
      propertyTracks[name] = [keyframeProperty];
      if (this.rekapi) {
        fireEvent(this.rekapi, 'addKeyframePropertyTrack', _, keyframeProperty);
      }
    } else {
      propertyTracks[name].push(keyframeProperty);
    }

    sortPropertyTracks(this);

    if (this.rekapi) {
      fireEvent(this.rekapi, 'addKeyframeProperty', _, keyframeProperty);
    }

    return this;
  };

  /*!
   * Calculate and set the actor's position at `millisecond` in the animation.
   * @method _updateState
   * @param {number} millisecond
   * @chainable
   */
  Actor.prototype._updateState = function (millisecond) {
    var startMs = this.getStart();
    var endMs = this.getEnd();
    var interpolatedObject = {};

    millisecond = Math.min(endMs, millisecond);

    var latestCacheId = getPropertyCacheIdForMillisecond(this, millisecond);
    var propertiesToInterpolate =
      this._timelinePropertyCache[this._timelinePropertyCacheKeys[
          latestCacheId]];

    if (startMs === endMs) {

      // If there is only one keyframe, use that for the state of the actor
      _.each(propertiesToInterpolate, function (keyframeProperty, propName) {
        if (keyframeProperty.shouldInvokeForMillisecond(millisecond)) {
          keyframeProperty.invoke();
          keyframeProperty.hasFired = false;
          return;
        }

        interpolatedObject[propName] = keyframeProperty.value;
      }, this);

    } else {

      _.each(propertiesToInterpolate, function (keyframeProperty, propName) {
        if (this._beforeKeyframePropertyInterpolate !== noop) {
          this._beforeKeyframePropertyInterpolate(keyframeProperty);
        }

        if (keyframeProperty.shouldInvokeForMillisecond(millisecond)) {
          keyframeProperty.invoke();
          return;
        }

        interpolatedObject[propName] =
        keyframeProperty.getValueAt(millisecond);

        if (this._afterKeyframePropertyInterpolate !== noop) {
          this._afterKeyframePropertyInterpolate(
            keyframeProperty, interpolatedObject);
        }
      }, this);
    }

    this.set(interpolatedObject);

    return this;
  };

  /*!
   * @method _beforeKeyframePropertyInterpolate
   * @param {Rekapi.KeyframeProperty} keyframeProperty
   * @abstract
   */
  Actor.prototype._beforeKeyframePropertyInterpolate = noop;

  /*!
   * @method _afterKeyframePropertyInterpolate
   * @param {Rekapi.KeyframeProperty} keyframeProperty
   * @param {Object} interpolatedObject
   * @abstract
   */
  Actor.prototype._afterKeyframePropertyInterpolate = noop;

  /**
   * __[Example](../../../../docs/examples/actor_export_timeline.html)__
   * @method exportTimeline
   * @return {Object} A serializable Object of this actor's timeline property
   * tracks and `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`s.
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

  /**
   * Import an Object to augment this actor's state.  This does not remove
   * keyframe properties before importing new ones.
   *
   * @method importTimeline
   * @param {Object} actorData Any object that has the same data format as the
   * object generated from `{{#crossLink
   * "Rekapi.Actor/exportTimeline:method"}}{{/crossLink}}`.
   */
  Actor.prototype.importTimeline = function (actorData) {
    _.each(actorData.propertyTracks, function (propertyTrack) {
      _.each(propertyTrack, function (property) {
        var obj = {};
        obj[property.name] = property.value;
        this.keyframe(property.millisecond, obj, property.easing);
      }, this);
    }, this);
  };

});

rekapiModules.push(function (context) {

  'use strict';

  var DEFAULT_EASING = 'linear';
  var Rekapi = context.Rekapi;
  var Tweenable = Rekapi.Tweenable;
  var _ = Rekapi._;
  var interpolate = Tweenable.interpolate;

  /**
   * Represents an individual component of an actor's keyframe state.  In most
   * cases you won't need to deal with this object directly, as the
   * `{{#crossLink "Rekapi.Actor"}}{{/crossLink}}` APIs abstract a lot of what
   * this Object does away for you.
   * @class Rekapi.KeyframeProperty
   * @param {number} millisecond Where on the animation timeline this
   * `Rekapi.KeyframeProperty` is.
   * @param {string} name The property's name, such as `"x"` or `"opacity"`.
   * @param {number|string|Function} value The value that this
   * `Rekapi.KeyframeProperty` represents.
   * @param {string=} opt_easing The easing curve at which this
   * `Rekapi.KeyframeProperty` should be animated to.  Defaults to `"linear"`.
   * @constructor
   */
  Rekapi.KeyframeProperty = function (millisecond, name, value, opt_easing) {
    this.id = _.uniqueId('keyframeProperty_');
    this.millisecond = millisecond;
    this.name = name;
    this.value = value;
    this.hasFired = null;
    this.easing = opt_easing || DEFAULT_EASING;
    this.nextProperty = null;

    return this;
  };
  var KeyframeProperty = Rekapi.KeyframeProperty;

  /**
   * Modify this `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`.
   * @method modifyWith
   * @param {Object} newProperties Valid values correspond to `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}`'s constructor parameters:
   *   - __millisecond__ (_number_)
   *   - __name__ (_string_)
   *   - __value__ (_number|string_)
   *   - __easing__ (_string_)
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
   * Calculate the midpoint between this `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` and the next `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` in a `{{#crossLink
   * "Rekapi.Actor"}}{{/crossLink}}`'s property track.
   *
   * In just about all cases, `millisecond` should be between this
   * `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`'s `millisecond`
   * and the `millisecond` of the `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` that follows it in the
   * animation timeline, but it is valid to specify a value outside of this
   * range.
   * @method getValueAt
   * @param {number} millisecond The millisecond in the animation timeline to
   * compute the state value for.
   * @return {number}
   */
  KeyframeProperty.prototype.getValueAt = function (millisecond) {
    var fromObj = {};
    var toObj = {};
    var value;
    var nextProperty = this.nextProperty;
    var correctedMillisecond = Math.max(millisecond, this.millisecond);

    if (nextProperty) {
      correctedMillisecond =
      Math.min(correctedMillisecond, nextProperty.millisecond);

      fromObj[this.name] = this.value;
      toObj[this.name] = nextProperty.value;

      var delta = nextProperty.millisecond - this.millisecond;
      var interpolatedPosition =
      (correctedMillisecond - this.millisecond) / delta;

      value = interpolate(fromObj, toObj, interpolatedPosition,
          nextProperty.easing)[this.name];
    } else {
      value = this.value;
    }

    return value;
  };

  /**
   * Create the reference to the `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` that follows this one on a
   * `{{#crossLink "Rekapi.Actor"}}{{/crossLink}}`'s property track.  Property
   * tracks are just linked lists of `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}`s.
   * @method linkToNext
   * @param {Rekapi.KeyframeProperty} nextProperty The `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` that should immediately follow
   * this one on the animation timeline.
   */
  KeyframeProperty.prototype.linkToNext = function (nextProperty) {
    this.nextProperty = nextProperty || null;
  };

  /**
   * Disassociates this `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` from its `{{#crossLink
   * "Rekapi.Actor"}}{{/crossLink}}`.  This is called by various `{{#crossLink
   * "Rekapi.Actor"}}{{/crossLink}}` methods and triggers the `{{#crossLink
   * "Rekapi/on:method"}}removeKeyframeProperty{{/crossLink}}` event on the
   * associated `{{#crossLink "Rekapi"}}{{/crossLink}}` instance.
   * @method detach
   * @chainable
   */
  KeyframeProperty.prototype.detach = function () {
    var actor = this.actor;
    if (actor) {
      if (actor.rekapi) {
        fireEvent(actor.rekapi, 'removeKeyframeProperty', _, this);
        delete actor._keyframeProperties[this.id];
        this.actor = null;
      }
    }

    return this;
  };

  /**
   * __[Example](../../../../docs/examples/keyprop_export_property_data.html)__
   * @method exportPropertyData
   * @return {Object} A serializable Object representation of this
   * `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`.
   */
  KeyframeProperty.prototype.exportPropertyData = function () {
    return {
      'millisecond': this.millisecond
      ,'name': this.name
      ,'value': this.value
      ,'easing': this.easing
    };
  };

  /*!
   * Whether or not this is a function keyframe and should be invoked for the
   * current frame.  Helper method for Rekapi.Actor.
   * @method shouldInvokeForMillisecond
   * @return {boolean}
   */
  KeyframeProperty.prototype.shouldInvokeForMillisecond =
      function (millisecond) {
    return (millisecond >= this.millisecond &&
      this.name === 'function' &&
      !this.hasFired);
  };

  /**
   * Assuming this is a function keyframe, call the function.
   * @method invoke
   * @return {*} Whatever value is returned from the keyframe function that was
   * set for this `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`.
   */
  KeyframeProperty.prototype.invoke = function () {
    var drift = this.actor.rekapi._loopPosition - this.millisecond;
    var returnValue = this.value.call(this.actor, drift);
    this.hasFired = true;
    return returnValue;
  };

});

rekapiModules.push(function (context) {

  'use strict';

  var Rekapi = context.Rekapi;
  var _ = Rekapi._;

  // PRIVATE UTILITY FUNCTIONS
  //

  /*!
   * Gets (and optionally sets) height or width on a canvas.
   * @param {HTMLCanvas} canvas
   * @param {string} heightOrWidth The dimension (either "height" or "width")
   * to get or set.
   * @param {number=} opt_newSize The new value to set for `dimension`.
   * @return {number}
   */
  function dimension (canvas, heightOrWidth, opt_newSize) {
    if (typeof opt_newSize !== 'undefined') {
      canvas[heightOrWidth] = opt_newSize;
      canvas.style[heightOrWidth] = opt_newSize + 'px';
    }

    return canvas[heightOrWidth];
  }

  /*!
   * Takes care of some pre-rendering tasks for canvas animations.
   * @param {Rekapi.CanvasRenderer} canvasRenderer
   */
  function beforeRender (canvasRenderer) {
    canvasRenderer.clear();
  }

  /*!
   * Render all the `Actor`s at whatever position they are currently in.
   * @param {Rekapi}
   * @param {Rekapi.CanvasRenderer} canvasRenderer
   * @return {Rekapi}
   */
  function render (rekapi, canvasRenderer) {
    fireEvent(rekapi, 'beforeRender', _);
    var renderOrderSorter = canvasRenderer._renderOrderSorter;
    var len = canvasRenderer._renderOrder.length;
    var renderOrder;

    if (renderOrderSorter) {
      var orderedActors =
          _.sortBy(canvasRenderer._canvasActors, renderOrderSorter);
      renderOrder = _.pluck(orderedActors, 'id');
    } else {
      renderOrder = canvasRenderer._renderOrder;
    }

    var currentActor;
    var canvasActors = canvasRenderer._canvasActors;

    var i;
    for (i = 0; i < len; i++) {
      currentActor = canvasActors[renderOrder[i]];
      currentActor.render(currentActor.context, currentActor.get());
    }
    fireEvent(rekapi, 'afterRender', _);

    return rekapi;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {Rekapi.CanvasRenderer} canvasRenderer
   */
  function addActor (actor, canvasRenderer) {
    canvasRenderer._renderOrder.push(actor.id);
    canvasRenderer._canvasActors[actor.id] = actor;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {Rekapi.CanvasRenderer} canvasRenderer
   */
  function removeActor (actor, canvasRenderer) {
    canvasRenderer._renderOrder = _.without(canvasRenderer._renderOrder, actor.id);
    delete canvasRenderer._canvasActors[actor.id];
  }

  /*!
   * Sets up an instance of CanvasRenderer and attaches it to a `Rekapi`
   * instance.  Also augments the Rekapi instance with canvas-specific
   * functions.
   * @param {Rekapi} rekapi
   */
  Rekapi._rendererInitHook.canvas = function (rekapi) {
    if (typeof CanvasRenderingContext2D === 'undefined' ||
        !(rekapi.context instanceof CanvasRenderingContext2D)) {
      return;
    }

    rekapi.renderer = new CanvasRenderer(rekapi);
  };

  // CANVAS RENDERER OBJECT
  //

  /**
   * You can use Rekapi to render animations to an HTML5 `<canvas>`.  To do so,
   * just provide a
   * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
   * instance to the `{{#crossLink "Rekapi"}}{{/crossLink}}` constructor to
   * automatically set up the renderer:
   *
   *     var context = document.createElement('canvas').getContext('2d');
   *     var rekapi = new Rekapi(context);
   *     rekapi.renderer instanceof Rekapi.CanvasRenderer; // true
   *
   * `Rekapi.CanvasRenderer` adds some canvas-specific events you can bind to
   * with `{{#crossLink "Rekapi/on:method"}}{{/crossLink}}` (and unbind from
   * with `{{#crossLink "Rekapi/off:method"}}{{/crossLink}}`:
   *
   *  - __beforeRender__: Fires just before an actor is rendered to the canvas.
   *  - __afterRender__: Fires just after an actor is rendered to the canvas.
   *
   * __Note__: `Rekapi.CanvasRenderer` is added to the `{{#crossLink
   * "Rekapi"}}{{/crossLink}}` instance automatically as `this.renderer`, there
   * is no reason to call the constructor yourself in most cases.
   *
   * ## Multiple renderers
   *
   * Rekapi supports multiple renderers per instance.  Do do this, you must not
   * provide a
   * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
   * to the `{{#crossLink "Rekapi"}}{{/crossLink}}` constructor, you must
   * instead initialize the renderer yourself.  The
   * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
   * that would have been provided to the `{{#crossLink
   * "Rekapi"}}{{/crossLink}}` constructor instead is provided as the second
   * parameter to `Rekapi.CanvasRenderer`:
   *
   *
   *     var canvasContext = document.querySelector('canvas').getContext('2d');
   *
   *     // No context gets passed to the Rekapi constructor
   *     var rekapi = new Rekapi();
   *
   *     // Initialize Rekapi.CanvasRenderer manually and give it a
   *     // CanvasRenderingContext2D.  You can name it anything you want on the
   *     // Rekapi instance.
   *     rekapi.canvasRenderer =
   *         new Rekapi.CanvasRenderer(rekapi, canvasContext);
   * @class Rekapi.CanvasRenderer
   * @param {Rekapi} rekapi
   * @param {CanvasRenderingContext2D=} opt_context
   * @constructor
   */
  Rekapi.CanvasRenderer = function (rekapi, opt_context) {
    this.rekapi = rekapi;
    this.canvasContext = opt_context || rekapi.context;
    this._renderOrder = [];
    this._renderOrderSorter = null;
    this._canvasActors = {};

    _.extend(rekapi._events, {
      'beforeRender': []
      ,'afterRender': []
    });

    var self = this;

    rekapi.on('afterUpdate', function () {
      render(rekapi, self);
    });

    rekapi.on('addActor', function (rekapi, actor) {
      addActor(actor, self);
    });

    rekapi.on('removeActor', function (rekapi, actor) {
      removeActor(actor, self);
    });

    rekapi.on('beforeRender', function () {
      beforeRender(self);
    });

    return this;
  };
  var CanvasRenderer = Rekapi.CanvasRenderer;

  /**
   * Get and optionally set the height of the associated `<canvas>` element.
   * @method height
   * @param {number=} opt_height The height to optionally set.
   * @return {number}
   */
  CanvasRenderer.prototype.height = function (opt_height) {
    return dimension(this.canvasContext.canvas, 'height', opt_height);
  };

  /**
   * Get and optionally set the width of the associated `<canvas>` element.
   * @method width
   * @param {number=} opt_width The width to optionally set.
   * @return {number}
   */
  CanvasRenderer.prototype.width = function (opt_width) {
    return dimension(this.canvasContext.canvas, 'width', opt_width);
  };

  /**
   * Erase the `<canvas>`.
   * @method clear
   * @return {Rekapi}
   */
  CanvasRenderer.prototype.clear = function () {
    this.canvasContext.clearRect(0, 0, this.width(), this.height());

    return this.rekapi;
  };

  /**
   * Move an actor around within the render order list.  Each actor is rendered
   * in order of its layer (layers and actors have a 1:1 relationship).  The
   * later an actor is added to an animation (with `{{#crossLink
   * "Rekapi/addActor:method"}}{{/crossLink}}`), the higher its layer.  Lower
   * layers (starting with 0) are rendered earlier.
   *
   *
   * This method has no effect if an order function is set with `{{#crossLink
   * "Rekapi.CanvasRenderer/setOrderFunction:method"}}{{/crossLink}}`.
   *
   * __[Example](../../../../docs/examples/canvas_move_actor_to_layer.html)__
   * @method moveActorToLayer
   * @param {Rekapi.Actor} actor
   * @param {number} layer This should be within `0` and the total number of
   * actors in the animation.  That number can be found with `{{#crossLink
   * "Rekapi/getActorCount:method"}}{{/crossLink}}`.
   * @return {Rekapi.Actor}
   */
  CanvasRenderer.prototype.moveActorToLayer = function (actor, layer) {
    if (layer < this._renderOrder.length && layer > -1) {
      this._renderOrder = _.without(this._renderOrder, actor.id);
      this._renderOrder.splice(layer, 0, actor.id);
    }

    return actor;
  };

  /**
   * Set a function that defines the render order of the actors.  This is
   * called each frame before the actors are rendered.
   *
   * The following example assumes that all actors are circles that have a
   * `radius` `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`.  The
   * circles will be rendered in order of the value of their `radius`, from
   * smallest to largest.  This has the effect of layering larger circles on
   * top of smaller circles, thus giving a sense of perspective.
   *
   * If a render order function is specified, `{{#crossLink
   * "Rekapi.CanvasRenderer/moveActorToLayer:method"}}{{/crossLink}}` will have
   * no effect.
   *
   *     rekapi.renderer.setOrderFunction(function (actor) {
   *       return actor.get().radius;
   *     });
   * __[Example](../../../../docs/examples/canvas_set_order_function.html)__
   * @method setOrderFunction
   * @param {function(Rekapi.Actor)} sortFunction
   * @return {Rekapi}
   */
  CanvasRenderer.prototype.setOrderFunction = function (sortFunction) {
    this._renderOrderSorter = sortFunction;
    return this.rekapi;
  };

  /**
   * Remove the order function set by `{{#crossLink
   * "Rekapi.CanvasRenderer/setOrderFunction:method"}}{{/crossLink}}`.  The
   * render order defaults back to the order in which the actors were added to
   * the animation.
   *
   * __[Example](../../../../docs/examples/canvas_unset_order_function.html)__
   * @method unsetOrderFunction
   * @return {Rekapi}
   */
  CanvasRenderer.prototype.unsetOrderFunction = function () {
    this._renderOrderSorter = null;
    return this.rekapi;
  };

});

rekapiModules.push(function (context) {

  'use strict';

  var Rekapi = context.Rekapi;
  var _ = Rekapi._;
  var now = Rekapi.Tweenable.now;
  var vendorTransforms = [
    'transform'
    ,'webkitTransform'
    ,'MozTransform'
    ,'oTransform'
    ,'msTransform'];
  var transformFunctions = [
    'translateX',
    'translateY',
    'translateZ',
    'scale',
    'scaleX',
    'scaleY',
    'rotate',
    'skewX',
    'skewY'];

  // CONSTANTS
  //

  // The timer to remove an injected style isn't likely to match the actual
  // length of the CSS animation, so give it some extra time to complete so it
  // doesn't cut off the end.
  var INJECTED_STYLE_REMOVAL_BUFFER_MS = 250;

  // PRIVATE UTILITY FUNCTIONS
  //

  /*!
   * @param {string} formatter
   * @param {[string]} args
   * @return {string}
   */
  var printf = function (formatter, args) {
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
   * @param {Rekapi} rekapi
   */
  Rekapi._rendererInitHook.cssAnimate = function (rekapi) {
    // Node.nodeType 1 is an ELEMENT_NODE.
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeType
    if (rekapi.context.nodeType === 1) {
      rekapi.renderer = new DOMRenderer(rekapi);
    }
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
   * @param {Rekapi} rekapi
   * @param {string} css The css content that the <style> element should have.
   * @return {HTMLStyleElement} The unique ID of the injected <style> element.
   */
  function injectStyle (rekapi, css) {
    var style = document.createElement('style');
    var id = 'rekapi-' + styleID++;
    style.id = id;
    style.innerHTML = css;
    document.head.appendChild(style);
    forceStyleReset(rekapi);

    return style;
  }

  /*!
   * Fixes a really bizarre issue that only seems to affect Presto and Blink.
   * In some situations, DOM nodes will not detect dynamically injected <style>
   * elements.  Explicitly re-inserting DOM nodes seems to fix the issue.  Not
   * sure what causes this issue.  Not sure why this fixes it.
   *
   * @param {Rekapi} rekapi
   */
  function forceStyleReset (rekapi) {
    var dummyDiv = document.createElement('div');

    _.each(rekapi.getAllActors(), function (actor) {
      if (actor.context.nodeType === 1) {
        var actorEl = actor.context;
        var actorElParent = actorEl.parentElement;

        actorElParent.replaceChild(dummyDiv, actorEl);
        actorElParent.replaceChild(actorEl, dummyDiv);
      }
    });

    dummyDiv = null;
  }

  /*!
   * @param {HTMLElement} element
   * @param {string} styleName
   * @param {string|number} styleValue
   */
  function setStyle (element, styleName, styleValue) {
    element.style[styleName] = styleValue;
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
   * @param {Array.<string>} orderedTransforms Array of ordered transform
   *     function names
   * @param {Object} transformProperties Transform properties to build together
   * @return {string}
   */
  function buildTransformValue (orderedTransforms, transformProperties) {
    var transformComponents = [];

    _.each(orderedTransforms, function(functionName) {
      if (transformProperties[functionName]) {
        transformComponents.push(functionName + '(' +
          transformProperties[functionName] + ')');
      }
    });

    return transformComponents.join(' ');
  }

  /*!
   * Sets value for all vendor prefixed transform properties on an element
   *
   * @param {HTMLElement} element The actor's DOM element
   * @param {string} transformValue The transform style value
   */
  function setTransformStyles (element, transformValue) {
    _.each(vendorTransforms, function(prefixedTransform) {
      setStyle(element, prefixedTransform, transformValue);
    });
  }


  /*!
   * @param {Rekapi} rekapi
   * @param {Rekapi.Actor} actor
   */
  function onAddActor (rekapi, actor) {
    var actorElement = actor.context;

    if (actorElement.nodeType !== 1) {
      return;
    }

    var className = DOMRenderer.getActorClassName(actor);

    // Add the class if it's not already there.
    // Using className instead of classList to make IE happy.
    if (!actorElement.className.match(className)) {
      actorElement.className += ' ' + className;
    }

    actor._transformOrder = transformFunctions.slice(0);
    actor._beforeKeyframePropertyInterpolate = actorBeforeInterpolate;
    actor._afterKeyframePropertyInterpolate = actorAfterInterpolate;
    actor.render = _.bind(actorRender, actor, actor);
    actor.teardown = _.bind(actorTeardown, actor, actor);
  }

  /*!
   * transform properties like translate3d and rotate3d break the cardinality
   * of multi-ease easing strings, because the "3" gets treated like a
   * tweenable value.  Transform "3d(" to "__THREED__" to prevent this, and
   * transform it back in _afterKeyframePropertyInterpolate.
   *
   * @param {Rekapi.KeyframeProperty} keyframeProperty
   */
  function actorBeforeInterpolate (keyframeProperty) {
    if (keyframeProperty.name !== 'transform') {
      return;
    }

    var value = keyframeProperty.value;
    var nextProp = keyframeProperty.nextProperty;

    if (nextProp && value.match(/3d\(/g)) {
      keyframeProperty.value = value.replace(/3d\(/g, '__THREED__');
      nextProp.value = nextProp.value.replace(/3d\(/g, '__THREED__');
    }
  }

  /*!
   * @param {Rekapi.KeyframeProperty} keyframeProperty
   * @param {Object} interpolatedObject
   */
  function actorAfterInterpolate (keyframeProperty, interpolatedObject) {
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
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {HTMLElement} element
   * @param {Object} state
   */
  function actorRender (actor, element, state) {
    var propertyNames = _.keys(state);
    // TODO:  Optimize the following code so that propertyNames is not looped
    // over twice.
    var transformFunctionNames = _.filter(propertyNames, isTransformFunction);
    var otherPropertyNames = _.reject(propertyNames, isTransformFunction);
    var otherProperties = _.pick(state, otherPropertyNames);

    if (transformFunctionNames.length) {
      var transformProperties = _.pick(state, transformFunctionNames);
      var builtStyle = buildTransformValue(actor._transformOrder,
          transformProperties);
      setTransformStyles(element, builtStyle);
    } else if (state.transform) {
      setTransformStyles(element, state.transform);
    }

    _.each(otherProperties, function (styleValue, styleName) {
      setStyle(element, styleName, styleValue);
    });
  }

  /*!
   * @param {Rekapi.Actor} actor
   */
  function actorTeardown (actor) {
    var element = actor.context;
    var classList = element.className.match(/\S+/g);
    var sanitizedClassList =
        _.without(classList, DOMRenderer.getActorClassName(actor));
    element.className = sanitizedClassList.join(' ');
  }

  // CSS RENDERER OBJECT
  //

  /**
   * `Rekapi.DOMRenderer` allows you to animate DOM elements.  This is achieved
   * either by browser-accelerated [CSS `@keyframe`
   * animations](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes),
   * or by traditional inline style updates on every frame (like how
   * [`jQuery.fn.animate`](http://api.jquery.com/animate/) works).  Animations
   * are defined with the same API in either case, but you can gracefully fall
   * back to the inline style approach if CSS `@keyframe` animations are not
   * supported by the browser or not preferred.  To render animations with the
   * DOM, just supply any DOM element to the `{{#crossLink
   * "Rekapi"}}{{/crossLink}}` constructor.  You may use `document.body`, since
   * it is generally always available:
   *
   *     var rekapi = new Rekapi(document.body);
   *     rekapi.renderer instanceof Rekapi.DOMRenderer; // true
   *
   * There are separate APIs for playing inline style animations and CSS
   * `@keyframe` animations.  Advantages of playing an animation with CSS
   * `@keyframes`:
   *
   *   - Smoother animations in newer browsers.
   *   - The JavaScript thread is freed from performing animation updates,
   *   making it available for other logic.
   *
   * Disadvantages:
   *
   *   - Not all browsers support CSS `@keyframe` animations.
   *   - Limited playback control: You can only play and stop an animation, you
   *   cannot jump to or start from a specific point in the timeline.
   *   - Generating the CSS for `@keyframe` animations can take a noticeable
   *   amount of time.  This blocks all other logic, including rendering, so
   *   you may have to be clever with how to spend the cycles to do it.
   *   - No `{{#crossLink "Rekapi/on:method"}}events{{/crossLink}}` can be
   *   bound to CSS `@keyframe` animations.
   *
   * So, the results are a little more predictable and flexible with inline
   * style animations, but CSS `@keyframe` may give you better performance.
   * Choose whichever approach makes the most sense for your needs.
   *
   * `Rekapi.DOMRenderer` can gracefully fall back to an inline style animation
   * if CSS `@keyframe` animations are not supported by the browser:
   *
   *      var rekapi = new Rekapi(document.body);
   *
   *      // Each actor needs a reference to the DOM element it represents
   *      var actor = rekapi.addActor({
   *        context: document.getElementById('actor-1')
   *      });
   *
   *      actor
   *        .keyframe(0,    { left: '0px'   })
   *        .keyframe(1000, { left: '250px' }, 'easeOutQuad');
   *
   *      // Feature detect for CSS @keyframe support
   *      if (rekapi.renderer.canAnimateWithCSS()) {
   *        // Animate with CSS @keyframes
   *        rekapi.renderer.play();
   *      } else {
   *        // Animate with inline styles instead
   *        rekapi.play();
   *      }
   *
   * ## `@keyframe` animations work differently than inline style animations
   *
   * Inline style animations are compatible with all of the playback and
   * timeline control methods defined by `{{#crossLink
   * "Rekapi"}}{{/crossLink}}`, such as `{{#crossLink
   * "Rekapi/play:method"}}{{/crossLink}}`, `{{#crossLink
   * "Rekapi/playFrom:method"}}{{/crossLink}}` and `{{#crossLink
   * "Rekapi/update:method"}}{{/crossLink}}`.  CSS `@keyframe` playback cannot
   * be controlled in all browsers, so `Rekapi.DOMRenderer` defines analogous,
   * renderer-specific CSS playback methods that you should use:
   *
   *   - {{#crossLink "Rekapi.DOMRenderer/play:method"}}{{/crossLink}}
   *   - {{#crossLink "Rekapi.DOMRenderer/isPlaying:method"}}{{/crossLink}}
   *   - {{#crossLink "Rekapi.DOMRenderer/stop:method"}}{{/crossLink}}
   *
   * __Note__: `Rekapi.DOMRenderer` is added to the `{{#crossLink
   * "Rekapi"}}{{/crossLink}}` instance automatically as `this.renderer`,
   * there is no reason to call the constructor yourself in most cases.
   *
   * __[Example](/renderers/dom/sample/play-many-actors.html)__
   *
   * @class Rekapi.DOMRenderer
   * @param {Rekapi} rekapi
   * @constructor
   */
  Rekapi.DOMRenderer = function (rekapi) {
    this.rekapi = rekapi;

    // @private {number}
    this._playTimestamp = null;

    // @private {string}
    this._cachedCSS = null;

    // The HTMLStyleElement that gets injected into the DOM.
    // @private {HTMLStyleElement)
    this._styleElement = null;

    // @private {number}
    this._stopSetTimeoutHandle = null;

    rekapi.on('timelineModified', _.bind(function () {
      this._cachedCSS = null;
    }, this));

    rekapi.on('addActor', onAddActor);

    return this;
  };
  var DOMRenderer = Rekapi.DOMRenderer;

  /**
   * @method canAnimateWithCSS
   * @return {boolean} Whether or not the browser supports CSS `@keyframe`
   * animations.
   */
  DOMRenderer.prototype.canAnimateWithCSS = function () {
    return !!getVendorPrefix();
  };

  /**
   * Play the Rekapi animation as a CSS `@keyframe` animation.
   *
   * Note that this is different from `{{#crossLink
   * "Rekapi/play:method"}}{{/crossLink}}`.  This method only applies to CSS
   * `@keyframe` animations.
   * @method play
   * @param {number=} opt_iterations How many times the animation should loop.
   * This can be `null` or `0` if you want to loop the animation endlessly but
   * also specify a value for `opt_fps`.
   * @param {number=} opt_fps How many `@keyframes` to generate per second of
   * the animation.  A higher value results in a more precise CSS animation,
   * but it will take longer to generate.  The default value is `30`.  You
   * should not need to go higher than `60`.
   */
  DOMRenderer.prototype.play = function (opt_iterations, opt_fps) {
    if (this.isPlaying()) {
      this.stop();
    }

    var css = this._cachedCSS || this.prerender.apply(this, arguments);
    this._styleElement = injectStyle(this.rekapi, css);
    this._playTimestamp = now();

    if (opt_iterations) {
      var animationLength = (opt_iterations * this.rekapi.getAnimationLength());
      this._stopSetTimeoutHandle = setTimeout(
          _.bind(this.stop, this, true),
          animationLength + INJECTED_STYLE_REMOVAL_BUFFER_MS);
    }

    fireEvent(this.rekapi, 'play', _);
  };

  /**
   * Stop a CSS `@keyframe` animation.  This also removes any `<style>`
   * elements that were dynamically injected into the DOM.
   *
   * Note that this is different from
   * `{{#crossLink "Rekapi/stop:method"}}{{/crossLink}}`.  This method only
   * applies to CSS `@keyframe` animations.
   * @method stop
   * @param {boolean=} opt_goToEnd If true, skip to the end of the animation.
   * If false or omitted, set inline styles on the actor elements to keep them
   * in their current position.
   */
  DOMRenderer.prototype.stop = function (opt_goToEnd) {
    if (this.isPlaying()) {
      clearTimeout(this._stopSetTimeoutHandle);

      // Forces a style update in WebKit/Presto
      this._styleElement.innerHTML = '';

      document.head.removeChild(this._styleElement);
      this._styleElement = null;

      var updateTime;
      if (opt_goToEnd) {
        updateTime = this.rekapi.getAnimationLength();
      } else {
        updateTime = (now() - this._playTimestamp)
            % this.rekapi.getAnimationLength();
      }

      this.rekapi.update(updateTime);
      fireEvent(this.rekapi, 'stop', _);
    }
  };

  /**
   * @method isPlaying
   * @return {boolean} Whether or not a CSS `@keyframe` animation is running.
   */
  DOMRenderer.prototype.isPlaying = function () {
    return !!this._styleElement;
  };

  /**
   * Prerender and cache the CSS animation so that it is immediately ready to
   * be used when it is needed in the future.  The function signature is
   * identical to {{#crossLink
   * "Rekapi.DOMRenderer/play:method"}}{{/crossLink}}.  This is necessary to
   * play a CSS animation and will be automatically called for you if you don't
   * call it manually, but calling it ahead of time (such as on page load) will
   * prevent any perceived lag when a CSS `@keyframe` animation is started.
   * The prerendered animation is cached for reuse until the timeline or a
   * keyframe is modified.
   *
   * @method prerender
   * @param {number=} opt_iterations How many times the animation should loop.
   * This can be `null` or `0` if you want to loop the animation endlessly but
   * also specify a value for `opt_fps`.
   * @param {number=} opt_fps How many `@keyframes` to generate per second of
   * the animation.  A higher value results in a more precise CSS animation,
   * but it will take longer to generate.  The default value is `30`.  You
   * should not need to go higher than `60`.
   * @return {string} The prerendered CSS string.  You likely won't need this,
   * as it is also cached internally.
   */
  DOMRenderer.prototype.prerender = function (opt_iterations, opt_fps) {
    return this._cachedCSS = this.toString({
      'vendors': [getVendorPrefix()]
      ,'fps': opt_fps
      ,'iterations': opt_iterations
    });
  };

  /**
   * You can decouple transform components in order to animate each property
   * with its own easing curve:
   *
   *     actor
   *       .keyframe(0, {
   *         translateX: '0px',
   *         translateY: '0px',
   *         rotate: '0deg'
   *       })
   *       .keyframe(1500, {
   *         translateX: '200px',
   *         translateY: '200px',
   *         rotate: '90deg'
   *       }, {
   *         translateX: 'easeOutExpo',
   *         translateY: 'easeInSine',
   *         rotate: 'elastic'
   *       });
   *
   * CSS transform string components are order-dependent, but JavaScript object
   * properties have an unpredictable order.  Rekapi must combine transform
   * properties supplied to `{{#crossLink
   * "Rekapi.Actor/keyframe:method"}}{{/crossLink}}` (as shown above) into a
   * single string when it renders each frame.  This method lets you change
   * that order from the default.  The supported array values for
   * `orderedTransforms` are:
   *
   * - `translateX`
   * - `translateY`
   * - `translateZ`
   * - `scale`
   * - `scaleX`
   * - `scaleY`
   * - `rotate`
   * - `skewX`
   * - `skewY`
   *
   * If you prefer a more standards-oriented approach, Rekapi also supports
   * combining the transform components yourself:
   *
   *     actor
   *       .keyframe(0, {
   *         transform: 'translateX(0px) translateY(0px) rotate(0deg)'
   *       })
   *       .keyframe(1500, {
   *         transform: 'translateX(200px) translateY(200px) rotate(90deg)'
   *       }, {
   *         transform: 'easeOutExpo easeInSine elastic'
   *       });
   *
   * This example and the one above it are equivalent.
   *
   * __Note__: The decoupled form of `transform` animations is not supported in
   * CSS `@keyframe` animations, only inline style animations.  This is due to
   * the tightly-coupled nature of the CSS `@keyframes` spec.  If you intend to
   * play a CSS-based `@keyframe` animation, __do not__ use the non-standard
   * decoupled API form for `transform` properties.
   *
   * @method setActorTransformOrder
   * @param {Rekapi.Actor} actor
   * @param {Array(string)} orderedTransforms The array of transform names.
   * @return {Rekapi}
   */
  DOMRenderer.prototype.setActorTransformOrder =
      function (actor, orderedTransforms) {
    // TODO: Document this better...
    var unknownFunctions = _.reject(orderedTransforms, isTransformFunction);

    if (unknownFunctions.length) {
      throw 'Unknown or unsupported transform functions: ' +
        unknownFunctions.join(', ');
    }
    // Ignore duplicate transform function names in the array
    actor._transformOrder = _.uniq(orderedTransforms);

    return this.rekapi;
  };

  /**
   * @method getActorClassName
   * @param {Rekapi.Actor} actor
   * @return {string} The default CSS class that is targeted by `{{#crossLink
   * "Rekapi.DOMRenderer/toString:method"}}{{/crossLink}}` if a custom class is
   * not specified.  This may be useful for getting a standard and consistent
   * CSS class name for an actor's DOM element.
   */
  DOMRenderer.getActorClassName = function (actor) {
    return 'actor-' + actor.id;
  };

  /**
   * Converts Rekapi animations to CSS `@keyframes`.
   * @method toString
   * @param {Object=} opts
   *   * __vendors__ _(Array(string))_: Defaults to `['w3']`.  The browser vendors you
   *   want to support. Valid values are:
   *     * `'microsoft'`
   *     * `'mozilla'`
   *     * `'opera'`
   *     * `'w3'`
   *     * `'webkit'`
   *
   *
   *   * __fps__ _(number)_: Defaults to 30.  Defines the number of CSS
   *   `@keyframe` frames rendered per second of an animation.  CSS `@keyframes`
   *   are comprised of a series of explicitly defined steps, and more steps
   *   will allow for a more complex animation.  More steps will also result in
   *   a larger CSS string, and more time needed to generate the string.
   *   * __name__ _(string)_: Define a custom name for your animation.  This
   *   becomes the class name targeted by the generated CSS.  The default value
   *   is determined by a call to {{#crossLink
   *   "Rekapi.DOMRenderer/getActorClassName:method"}}{{/crossLink}}.
   *   * __isCentered__ _(boolean)_: If `true`, the generated CSS will contain
   *   `transform-origin: 0 0;`, which centers the DOM element along the path of
   *   motion.  If `false` or omitted, no `transform-origin` rule is specified
   *   and the element is aligned to the path of motion with its top-left
   *   corner.
   *   * __iterations__ _(number)_: How many times the generated animation
   *   should repeat.  If omitted, the animation will loop indefinitely.
   * @return {string}
   */
  Rekapi.DOMRenderer.prototype.toString = function (opts) {
    opts = opts || {};
    var animationCSS = [];

    _.each(this.rekapi.getAllActors(), function (actor) {
      if (actor.context.nodeType === 1) {
        animationCSS.push(getActorCSS(actor, opts));
      }
    });

    return animationCSS.join('\n');
  };

  // DOMRenderer.prototype.toString-SPECIFIC CODE
  //

  // CONSTANTS
  //

  var DEFAULT_FPS = 30;
  var TRANSFORM_TOKEN = 'TRANSFORM';
  var VENDOR_TOKEN = 'VENDOR';
  var VENDOR_PREFIXES = {
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

  /*!
   * Creates the CSS `@keyframes` for an individual actor.
   * @param {Rekapi.Actor} actor
   * @param {Object=} opts Same as opts for Rekapi.prototype.toCSS.
   * @return {string}
   */
  function getActorCSS (actor, opts) {
    opts = opts || {};
    var actorCSS = [];
    var animName = opts.name || DOMRenderer.getActorClassName(actor);
    var fps = opts.fps || DEFAULT_FPS;
    var steps = Math.ceil((actor.rekapi.getAnimationLength() / 1000) * fps);
    var combineProperties = !canOptimizeAnyKeyframeProperties(actor);
    var actorClass = generateCSSClass(
        actor, animName, combineProperties, opts.vendors, opts.iterations,
        opts.isCentered);
    var boilerplatedKeyframes = generateBoilerplatedKeyframes(
        actor, animName, steps, combineProperties, opts.vendors);

    actorCSS.push(actorClass);
    actorCSS.push(boilerplatedKeyframes);

    return actorCSS.join('\n');
  }

  // toString-SPECIFIC PRIVATE UTILITY FUNCTIONS
  //

  /*!
   * @param {Rekapi.Actor} actor
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
   * @param {Array.<string>=} opt_vendors Vendor boilerplates to be applied.
   *     Should be any of the values in Rekapi.util.VENDOR_PREFIXES.
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
   * @param {Rekapi.Actor} actor
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
   * @param {Rekapi.Actor} actor
   * @param {string} animName
   * @param {string} vendor
   * @param {boolean} combineProperties
   * @param {number|string=} opt_iterations
   * @param {boolean=} opt_isCentered
   * @return {string}
   */
  function generateCSSAnimationProperties (
      actor, animName, vendor, combineProperties, opt_iterations,
      opt_isCentered) {
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
        actor.rekapi, prefix, opt_iterations));

    if (opt_isCentered) {
      generatedProperties.push(generateAnimationCenteringRule(prefix));
    }

    return generatedProperties.join('\n');
  }

  /*!
   * @param {Rekapi.Actor} actor
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
   * @param {Rekapi.Actor} actor
   * @param {string} animName
   * @return {string}
   */
  function generateAnimationDurationProperty (actor, prefix) {
    return printf('  %sanimation-duration: %sms;'
        ,[prefix, actor.getEnd() - actor.getStart()]);
  }

  /*!
   * @param {Rekapi.Actor} actor
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
   * @param {Rekapi} rekapi
   * @param {string} prefix
   * @param {number|string=} opt_iterations
   * @return {string}
   */
  function generateAnimationIterationProperty (rekapi, prefix, opt_iterations) {
    var iterationCount;
    if (opt_iterations) {
      iterationCount = opt_iterations;
    } else {
      iterationCount = rekapi._timesToIterate === -1
        ? 'infinite'
        : rekapi._timesToIterate;
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

  // OPTIMIZED OUTPUT GENERATOR FUNCTIONS
  //

  /*!
   * @param {Rekapi.KeyframeProperty} property
   * @return {boolean}
   */
  function canOptimizeKeyframeProperty (property) {
    var canOptimize = false;
    var nextProperty = property.nextProperty;

    if (nextProperty) {
      if (isSegmentAWait(property, nextProperty)) {
        return true;
      }

      var easingChunks = nextProperty.easing.split(' ');

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
   * @param {Rekapi.KeyframeProperty} property
   * @param {Rekapi.KeyframeProperty} nextProperty
   * @return {boolean}
   */
  function isSegmentAWait (property, nextProperty) {
    if (property.name === nextProperty.name &&
        property.value === nextProperty.value) {
      return true;
    }

    return false;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @return {boolean}
   */
  function canOptimizeAnyKeyframeProperties (actor) {
    return _.any(actor._keyframeProperties, canOptimizeKeyframeProperty);
  }

  /*!
   * @param {Rekapi.KeyframeProperty} property
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

  // UN-OPTIMIZED OUTPUT GENERATOR FUNCTIONS
  //

  /*!
   * @param {Rekapi.Actor} actor
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
      if (nextProp && isSegmentAWait(prop, nextProp)) {
        trackSegment = generateActorTrackWaitSegment(
            actor, actorStart, prop, nextProp, fromPercent, toPercent);

        if (previousSegmentWasOptimized) {
          trackSegment.shift();
        }

        previousSegmentWasOptimized = false;

      } else if (canOptimizeKeyframeProperty(prop)) {
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
   * @param {Rekapi.Actor} actor
   * @param {number} steps
   * @return {string}
   */
  function generateCombinedActorKeyframes (actor, steps) {
    return generateActorTrackSegment(
        actor, steps + 1, 100 / steps, 0, 0).join('\n');
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {string} track
   * @param {number} actorStart
   * @return {string|undefined}
   */
  function simulateLeadingWait (actor, track, actorStart) {
    var firstProp = actor._propertyTracks[track][0];

    if (typeof firstProp !== 'undefined'
        && firstProp.millisecond !== actorStart) {
      var fakeFirstProp = generateActorTrackSegment(
          actor, 1, 1, firstProp.millisecond, 0, firstProp);
      return fakeFirstProp.join('\n');
    }
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {string} track
   * @param {number} actorStart
   * @param {number} actorEnd
   * @return {string|undefined}
   */
  function simulateTrailingWait (actor, track, actorStart, actorEnd) {
    var lastProp = _.last(actor._propertyTracks[track]);

    if (typeof lastProp !== 'undefined'
        && lastProp.millisecond !== actorEnd) {
      var fakeLastProp = generateActorTrackSegment(
          actor, 1, 1, actorStart, 100, lastProp);
      return fakeLastProp.join('\n');
    }
  }

  /*!
   * @param {Rekapi.KeyframeProperty} property
   * @param {number} actorStart
   * @param {number} actorLength
   * @return {number}
   */
  function calculateStepPercent (property, actorStart, actorLength) {
    return ((property.millisecond - actorStart) / actorLength) * 100;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {number} increments
   * @param {number} incrementSize
   * @param {number} actorStart
   * @param {number} fromPercent
   * @param {Rekapi.KeyframeProperty=} opt_fromProp
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
      actor._updateState(
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
   * @param {Rekapi.Actor} actor
   * @param {number} actorStart
   * @param {Rekapi.KeyframeProperty} fromProp
   * @param {Rekapi.KeyframeProperty} toProp
   * @param {number} fromPercent
   * @param {number} toPercent
   * @return {Array.<string>}
   */
  function generateActorTrackWaitSegment (
      actor, actorStart, fromProp, toProp, fromPercent, toPercent) {
    var segment = generateActorTrackSegment(
        actor, 1, toPercent - fromPercent, actorStart, fromPercent, fromProp);
    return segment;
  }

  /*!
   * @param {Rekapi.Actor} actor
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

  // Exposes helper functions for unit testing.  Gets compiled away in build
  // process.
  if (REKAPI_DEBUG) {
    Rekapi._private.cssRenderer = {
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
      ,'getActorCSS': getActorCSS
    };
  }
});

var rekapi = function (global, deps) {

  'use strict';

  // If `deps` is defined, it means that Rekapi is loaded via AMD.
  // Don't use global context in this case so that the global scope
  // is not polluted by the Rekapi object.
  var context = deps ? {} : global;

  var _ = (deps && deps.underscore) ? deps.underscore : context._;
  var Tweenable = (deps && deps.Tweenable) ?
      deps.Tweenable : context.Tweenable;

  rekapiCore(context, _, Tweenable);

  _.each(rekapiModules, function (module) {
    module(context);
  });

  return context.Rekapi;
};

if (typeof define === 'function' && define.amd) {
  var underscoreAlreadyInUse = (typeof _ !== 'undefined');

  // Expose Rekapi as an AMD module if it's loaded with RequireJS or similar.
  // Shifty and Underscore are set as dependencies of this module.
  //
  // The rekapi module is anonymous so that it can be required with any name.
  // Example: define(['vendor/rekapi.min'], function(Rekapi) { ... });
  define(['shifty', 'underscore'], function (Tweenable, Underscore) {
    var underscoreSupportsAMD = (Underscore != null);
    var deps = {Tweenable: Tweenable,
      // Some versions of Underscore.js support AMD, others don't.
      // If not, use the `_` global.
      underscore: underscoreSupportsAMD ? Underscore : _};
    var Rekapi = rekapi({}, deps);

    if (REKAPI_DEBUG) {
      Rekapi.underscore_version = deps.underscore.VERSION;
    }

    if (!underscoreAlreadyInUse && underscoreSupportsAMD) {
      // Prevent Underscore from polluting the global scope.
      // This global can be safely removed since Rekapi keeps its own reference
      // to Underscore via the `deps` object passed earlier as an argument.
      this._ = undefined;
    }

    return Rekapi;
  });
} else {
  // Load Rekapi normally (creating a Rekapi global) if not using an AMD loader.

  // Note: `global` is not defined when running unit tests. Pass `this` instead.
  rekapi(this);
}

} (this));
