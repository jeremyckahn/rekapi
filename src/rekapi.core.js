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
