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
