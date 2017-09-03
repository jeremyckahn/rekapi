/*! 2.0.0-alpha.1 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("rekapi", [], factory);
	else if(typeof exports === 'object')
		exports["rekapi"] = factory();
	else
		root["rekapi"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/assets/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Rekapi = exports.rendererBootstrappers = exports.updateToCurrentMillisecond = exports.updateToMillisecond = exports.calculateLoopPosition = exports.updatePlayState = exports.isAnimationComplete = exports.calculateTimeSinceStart = exports.determineCurrentLoopIteration = exports.invalidateAnimationLength = exports.fireEvent = exports.DEFAULT_EASING = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = __webpack_require__(1);

var _lodash2 = _interopRequireDefault(_lodash);

var _shifty = __webpack_require__(2);

var _actor = __webpack_require__(4);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UPDATE_TIME = 1000 / 60;

var DEFAULT_EASING = exports.DEFAULT_EASING = 'linear';

/*!
 * Fire an event bound to a Rekapi.
 * @param {Rekapi} rekapi
 * @param {string} eventName
 * @param {Object} [data={}] Optional event-specific data
 */
var fireEvent = exports.fireEvent = function fireEvent(rekapi, eventName) {
  var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return rekapi._events[eventName].forEach(function (handler) {
    return handler(rekapi, data);
  });
};

/*!
 * @param {Rekapi} rekapi
 */
var invalidateAnimationLength = exports.invalidateAnimationLength = function invalidateAnimationLength(rekapi) {
  return rekapi._animationLengthValid = false;
};

/*!
 * Determines which iteration of the loop the animation is currently in.
 * @param {Rekapi} rekapi
 * @param {number} timeSinceStart
 */
var determineCurrentLoopIteration = exports.determineCurrentLoopIteration = function determineCurrentLoopIteration(rekapi, timeSinceStart) {
  var animationLength = rekapi.getAnimationLength();

  if (animationLength === 0) {
    return timeSinceStart;
  }

  return Math.floor(timeSinceStart / animationLength);
};

/*!
 * Calculate how many milliseconds since the animation began.
 * @param {Rekapi} rekapi
 * @return {number}
 */
var calculateTimeSinceStart = exports.calculateTimeSinceStart = function calculateTimeSinceStart(rekapi) {
  return _shifty.Tweenable.now() - rekapi._loopTimestamp;
};

/*!
 * Determines if the animation is complete or not.
 * @param {Rekapi} rekapi
 * @param {number} currentLoopIteration
 * @return {boolean}
 */
var isAnimationComplete = exports.isAnimationComplete = function isAnimationComplete(rekapi, currentLoopIteration) {
  return currentLoopIteration >= rekapi._timesToIterate && rekapi._timesToIterate !== -1;
};

/*!
 * Stops the animation if it is complete.
 * @param {Rekapi} rekapi
 * @param {number} currentLoopIteration
 */
var updatePlayState = exports.updatePlayState = function updatePlayState(rekapi, currentLoopIteration) {
  if (isAnimationComplete(rekapi, currentLoopIteration)) {
    rekapi.stop();
    fireEvent(rekapi, 'animationComplete');
  }
};

/*!
 * Calculate how far in the animation loop `rekapi` is, in milliseconds,
 * based on the current time.  Also overflows into a new loop if necessary.
 * @param {Rekapi} rekapi
 * @param {number} forMillisecond
 * @param {number} currentLoopIteration
 * @return {number}
 */
var calculateLoopPosition = exports.calculateLoopPosition = function calculateLoopPosition(rekapi, forMillisecond, currentLoopIteration) {
  var animationLength = rekapi.getAnimationLength();

  return animationLength === 0 ? 0 : isAnimationComplete(rekapi, currentLoopIteration) ? animationLength : forMillisecond % animationLength;
};

/*!
 * Calculate the timeline position and state for a given millisecond.
 * Updates the `rekapi` state internally and accounts for how many loop
 * iterations the animation runs for.
 * @param {Rekapi} rekapi
 * @param {number} forMillisecond
 */
var updateToMillisecond = exports.updateToMillisecond = function updateToMillisecond(rekapi, forMillisecond) {
  var currentIteration = determineCurrentLoopIteration(rekapi, forMillisecond);
  var loopPosition = calculateLoopPosition(rekapi, forMillisecond, currentIteration);

  rekapi._loopPosition = loopPosition;

  var keyframeResetList = [];

  if (currentIteration > rekapi._latestIteration) {
    (function () {
      fireEvent(rekapi, 'animationLooped');

      // Reset function keyframes
      var lookupObject = { name: 'function' };

      rekapi._actors.forEach(function (actor) {
        var fnKeyframes = _lodash2.default.where(actor._keyframeProperties, lookupObject);
        var lastFnKeyframe = _lodash2.default.last(fnKeyframes);

        if (lastFnKeyframe && !lastFnKeyframe.hasFired) {
          lastFnKeyframe.invoke();
        }

        keyframeResetList = keyframeResetList.concat(fnKeyframes);
      });
    })();
  }

  rekapi._latestIteration = currentIteration;
  rekapi.update(loopPosition, true);
  updatePlayState(rekapi, currentIteration);

  _lodash2.default.each(keyframeResetList, function (fnKeyframe) {
    fnKeyframe.hasFired = false;
  });
};

/*!
 * Calculate how far into the animation loop `rekapi` is, in milliseconds,
 * and update based on that time.
 * @param {Rekapi} rekapi
 */
var updateToCurrentMillisecond = exports.updateToCurrentMillisecond = function updateToCurrentMillisecond(rekapi) {
  return updateToMillisecond(rekapi, calculateTimeSinceStart(rekapi));
};

/*!
 * This is the heartbeat of an animation.  This updates `rekapi`'s state and
 * then calls itself continuously.
 * @param {Rekapi} rekapi
 */
var tick = function tick(rekapi) {
  return (
    // Need to check for .call presence to get around an IE limitation.  See
    // annotation for cancelLoop for more info.
    rekapi._loopId = rekapi._scheduleUpdate.call ? rekapi._scheduleUpdate.call(global, rekapi._updateFn, UPDATE_TIME) : setTimeout(rekapi._updateFn, UPDATE_TIME)
  );
};

/*!
 * @return {Function}
 */
var getUpdateMethod = function getUpdateMethod() {
  return (
    // requestAnimationFrame() shim by Paul Irish (modified for Rekapi)
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    global.requestAnimationFrame || global.webkitRequestAnimationFrame || global.oRequestAnimationFrame || global.msRequestAnimationFrame || global.mozCancelRequestAnimationFrame && global.mozRequestAnimationFrame || global.setTimeout
  );
};

/*!
 * @return {Function}
 */
var getCancelMethod = function getCancelMethod() {
  return global.cancelAnimationFrame || global.webkitCancelAnimationFrame || global.oCancelAnimationFrame || global.msCancelAnimationFrame || global.mozCancelRequestAnimationFrame || global.clearTimeout;
};

/*!
 * Cancels an update loop.  This abstraction is needed to get around the fact
 * that in IE, clearTimeout is not technically a function
 * (https://twitter.com/kitcambridge/status/206655060342603777) and thus
 * Function.prototype.call cannot be used upon it.
 * @param {Rekapi} rekapi
 */
var cancelLoop = function cancelLoop(rekapi) {
  return rekapi._cancelUpdate.call ? rekapi._cancelUpdate.call(global, rekapi._loopId) : clearTimeout(rekapi._loopId);
};

var STOPPED = 'stopped';
var PAUSED = 'paused';
var PLAYING = 'playing';

/*!
 * @type {Object.<function>} Contains the context init function to be called in
 * the Rekapi constructor.  This array is populated by modules in the
 * renderers/ directory.
 */
var rendererBootstrappers = exports.rendererBootstrappers = [];

/**
 * If this is a rendered animation, the appropriate renderer is accessible as
 * `this.renderer`.  If provided, a reference to `context` is accessible
 * as `this.context`.
 * @param {(Object|CanvasRenderingContext2D|HTMLElement)} [context={}] Sets
 * {@link rekapi.Rekapi#context}. This determines how to render the animation.
 * {@link rekapi.Rekapi} will also automatically set up all necessary {@link
 * rekapi.Rekapi#renderers} based on this value:
 *
 * * If this is not provided or is a plain object (`{}`), the animation will
 * not render anything and {@link rekapi.Rekapi#renderers} will be empty.
 * * If this is a
 * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D),
 * {@link rekapi.Rekapi#renderers} will contain a {@link
 * rekapi.CanvasRenderer}.
 * * If this is a DOM element, {@link rekapi.Rekapi#renderers} will contain a
 * {@link rekapi.DOMRenderer}.
 * @constructs rekapi.Rekapi
 */

var Rekapi = exports.Rekapi = function () {
  function Rekapi() {
    var _this = this;

    var context = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Rekapi);

    /**
     * @member {(Object|CanvasRenderingContext2D|HTMLElement)}
     * rekapi.Rekapi#context The rendering context for an animation.
     * @default {}
     */
    this.context = context;
    this._actors = [];
    this._playState = STOPPED;

    /**
     * @member {(rekapi.actorSortFunction|null)} rekapi.Rekapi#sort Optional
     * function for sorting the render order of {@link rekapi.Actor}s.  If set,
     * this is called each frame before the {@link rekapi.Actor}s are rendered.
     * If not set, {@link rekapi.Actor}s will render in the order they were
     * added via {@link rekapi.Rekapi#addActor}.
     *
     * The following example assumes that all {@link rekapi.Actor}s are circles
     * that have a `radius` {@link rekapi.KeyframeProperty}.  The circles will
     * be rendered in order of the value of their `radius`, from smallest to
     * largest.  This has the effect of layering larger circles on top of
     * smaller circles, thus giving a sense of perspective.
     *
     *     const rekapi = new Rekapi();
     *     rekapi.sort = actor => actor.get().radius;
     * @default null
     */
    this.sort = null;

    this._events = {
      animationComplete: [],
      playStateChange: [],
      play: [],
      pause: [],
      stop: [],
      beforeUpdate: [],
      afterUpdate: [],
      addActor: [],
      removeActor: [],
      beforeAddKeyframeProperty: [],
      addKeyframeProperty: [],
      removeKeyframeProperty: [],
      removeKeyframePropertyComplete: [],
      beforeRemoveKeyframeProperty: [],
      addKeyframePropertyTrack: [],
      removeKeyframePropertyTrack: [],
      timelineModified: [],
      animationLooped: []
    };

    // How many times to loop the animation before stopping
    this._timesToIterate = -1;

    // Millisecond duration of the animation
    this._animationLength = 0;
    this._animationLengthValid = false;

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

    this._updateFn = function () {
      tick(_this);
      updateToCurrentMillisecond(_this);
    };

    /**
     * @member {Array.<rekapi.renderer>} rekapi.Rekapi#renderers Instances of
     * {@link rekapi.renderer} classes, as inferred by the `context`
     * parameter provided to the {@link rekapi.Rekapi} constructor.  You can
     * add more renderers to this list manually; see the {@tutorial
     * multiple-renderers} tutorial for an example.
     */
    this.renderers = rendererBootstrappers.map(function (renderer) {
      return renderer(_this);
    }).filter(function (_) {
      return _;
    });
  }

  /**
   * Add a {@link rekapi.Actor} to the animation.  Decorates the added {@link
   * rekapi.Actor} with a reference to this {@link rekapi.Rekapi} instance as
   * {@link rekapi.Actor#rekapi}.
   *
   * @method rekapi.Rekapi#addActor
   * @param {(rekapi.Actor|Object)} [actor={}] If this is an `Object`, it is used to as
   * the constructor parameters for a new {@link rekapi.Actor} instance that
   * is created by this method.
   * @return {rekapi.Actor} The {@link rekapi.Actor} that was added.
   */


  _createClass(Rekapi, [{
    key: 'addActor',
    value: function addActor() {
      var actor = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var rekapiActor = actor instanceof _actor.Actor ? actor : new _actor.Actor(actor);

      // You can't add an actor more than once.
      if (_lodash2.default.contains(this._actors, rekapiActor)) {
        return rekapiActor;
      }

      rekapiActor.context = rekapiActor.context || this.context;
      rekapiActor.rekapi = this;

      // Store a reference to the actor internally
      this._actors.push(rekapiActor);

      invalidateAnimationLength(this);
      rekapiActor.setup();

      fireEvent(this, 'addActor', rekapiActor);

      return rekapiActor;
    }

    /**
     * @method rekapi.Rekapi#getActor
     * @param {number} actorId
     * @return {rekapi.Actor} A reference to an actor from the animation by its
     * `id`.  You can use {@link rekapi.Rekapi#getActorIds} to get a list of IDs
     * for all actors in the animation.
     */

  }, {
    key: 'getActor',
    value: function getActor(actorId) {
      return this._actors.filter(function (actor) {
        return actor.id === actorId;
      })[0];
    }

    /**
     * @method rekapi.Rekapi#getActorIds
     * @return {Array.<number>} The `id`s of all {@link rekapi.Actor}`s in the
     * animation.
     */

  }, {
    key: 'getActorIds',
    value: function getActorIds() {
      return this._actors.map(function (actor) {
        return actor.id;
      });
    }

    /**
     * @method rekapi.Rekapi#getAllActors
     * @return {Array.<rekapi.Actor>} All {@link rekapi.Actor}s in the animation.
     */

  }, {
    key: 'getAllActors',
    value: function getAllActors() {
      return this._actors.slice();
    }

    /**
     * @method rekapi.Rekapi#getActorCount
     * @return {number} The number of {@link rekapi.Actor}s in the animation.
     */

  }, {
    key: 'getActorCount',
    value: function getActorCount() {
      return this._actors.length;
    }

    /**
     * Remove an actor from the animation.  This does not destroy the actor, it
     * only removes the link between it and this {@link rekapi.Rekapi} instance.
     * This method calls the actor's {@link rekapi.Actor#teardown} method, if
     * defined.
     * @method rekapi.Rekapi#removeActor
     * @param {rekapi.Actor} actor
     * @return {rekapi.Actor} The {@link rekapi.Actor} that was removed.
     */

  }, {
    key: 'removeActor',
    value: function removeActor(actor) {
      // Remove the link between Rekapi and actor
      this._actors = _lodash2.default.without(this._actors, actor);
      delete actor.rekapi;

      actor.teardown();
      invalidateAnimationLength(this);

      fireEvent(this, 'removeActor', actor);

      return actor;
    }

    /**
     * Remove all {@link rekapi.Actor}s from the animation.
     * @method rekapi.Rekapi#removeAllActors
     * @return {Array.<rekapi.Actor>} The {@link rekapi.Actor}s that were
     * removed.
     */

  }, {
    key: 'removeAllActors',
    value: function removeAllActors() {
      var _this2 = this;

      return this.getAllActors().map(function (actor) {
        return _this2.removeActor(actor);
      });
    }

    /**
     * Play the animation.
     *
     * @method rekapi.Rekapi#play
     * @param {number} [iterations=-1] If omitted, the animation will loop
     * endlessly.
     * @return {rekapi.Rekapi}
     */

  }, {
    key: 'play',
    value: function play() {
      var iterations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;

      cancelLoop(this);

      if (this._playState === PAUSED) {
        // Move the playhead to the correct position in the timeline if resuming
        // from a pause
        this._loopTimestamp += _shifty.Tweenable.now() - this._pausedAtTime;
      } else {
        this._loopTimestamp = _shifty.Tweenable.now();
      }

      this._timesToIterate = iterations;
      this._playState = PLAYING;

      // Start the update loop
      tick(this);

      fireEvent(this, 'playStateChange');
      fireEvent(this, 'play');

      return this;
    }

    /**
     * Move to a specific millisecond on the timeline and play from there.
     *
     * @method rekapi.Rekapi#playFrom
     * @param {number} millisecond
     * @param {number} [iterations] Works as it does in {@link
     * rekapi.Rekapi#play}.
     * @return {rekapi.Rekapi}
     */

  }, {
    key: 'playFrom',
    value: function playFrom(millisecond, iterations) {
      this.play(iterations);
      this._loopTimestamp = _shifty.Tweenable.now() - millisecond;

      this._actors.forEach(function (actor) {
        return actor._resetFnKeyframesFromMillisecond(millisecond);
      });

      return this;
    }

    /**
     * Play from the last frame that was rendered with {@link
     * rekapi.Rekapi#update}.
     *
     * @method rekapi.Rekapi#playFromCurrent
     * @param {number} [iterations] Works as it does in {@link
     * rekapi.Rekapi#play}.
     * @return {rekapi.Rekapi}
     */

  }, {
    key: 'playFromCurrent',
    value: function playFromCurrent(iterations) {
      return this.playFrom(this._lastUpdatedMillisecond, iterations);
    }

    /**
     * Pause the animation.  A "paused" animation can be resumed from where it
     * left off with {@link rekapi.Rekapi#play}.
     *
     * @method rekapi.Rekapi#pause
     * @return {rekapi.Rekapi}
     */

  }, {
    key: 'pause',
    value: function pause() {
      if (this._playState === PAUSED) {
        return this;
      }

      this._playState = PAUSED;
      cancelLoop(this);
      this._pausedAtTime = _shifty.Tweenable.now();

      fireEvent(this, 'playStateChange');
      fireEvent(this, 'pause');

      return this;
    }

    /**
     * Stop the animation.  A "stopped" animation will start from the beginning
     * if {@link rekapi.Rekapi#play} is called.
     *
     * @method rekapi.Rekapi#stop
     * @return {rekapi.Rekapi}
     */

  }, {
    key: 'stop',
    value: function stop() {
      this._playState = STOPPED;
      cancelLoop(this);

      // Also kill any shifty tweens that are running.
      this._actors.forEach(function (actor) {
        return actor._resetFnKeyframesFromMillisecond(0);
      });

      fireEvent(this, 'playStateChange');
      fireEvent(this, 'stop');

      return this;
    }

    /**
     * @method rekapi.Rekapi#isPlaying
     * @return {boolean} Whether or not the animation is playing (meaning not paused or
     * stopped).
     */

  }, {
    key: 'isPlaying',
    value: function isPlaying() {
      return this._playState === PLAYING;
    }

    /**
     * @method rekapi.Rekapi#isPaused
     * @return {boolean} Whether or not the animation is paused (meaning not playing or
     * stopped).
     */

  }, {
    key: 'isPaused',
    value: function isPaused() {
      return this._playState === PAUSED;
    }

    /**
     * @method rekapi.Rekapi#isStopped
     * @return {boolean} Whether or not the animation is stopped (meaning not playing or
     * paused).
     */

  }, {
    key: 'isStopped',
    value: function isStopped() {
      return this._playState === STOPPED;
    }

    /**
     * Render an animation frame at a specific point in the timeline.
     *
     * @method rekapi.Rekapi#update
     * @param {number} [millisecond=this._lastUpdatedMillisecond] The point in
     * the timeline at which to render.  If omitted, this renders the last
     * millisecond that was rendered (it's a re-render).
     * @param {boolean} [doResetLaterFnKeyframes=false] If `true`, allow all
     * {@link rekapi.keyframeFunction}s later in the timeline to be run again.
     * This is a low-level feature, it should not be `true` (or even provided)
     * for most use cases.
     * @return {rekapi.Rekapi}
     */

  }, {
    key: 'update',
    value: function update() {
      var millisecond = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._lastUpdatedMillisecond;
      var doResetLaterFnKeyframes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      fireEvent(this, 'beforeUpdate');

      var renderOrder = this.sort ? _lodash2.default.sortBy(this._actors, this.sort) : this._actors;

      // Update and render each of the actors
      renderOrder.forEach(function (actor) {
        actor._updateState(millisecond, doResetLaterFnKeyframes);

        if (actor.wasActive) {
          actor.render(actor.context, actor.get());
        }
      });

      this._lastUpdatedMillisecond = millisecond;
      fireEvent(this, 'afterUpdate');

      return this;
    }

    /**
     * @method rekapi.Rekapi#getLastPositionUpdated
     * @return {number} The normalized timeline position (between 0 and 1) that
     * was last rendered.
     */

  }, {
    key: 'getLastPositionUpdated',
    value: function getLastPositionUpdated() {
      return this._lastUpdatedMillisecond / this.getAnimationLength();
    }

    /**
     * @method rekapi.Rekapi#getLastMillisecondUpdated
     * @return {number} The millisecond that was last rendered.
     */

  }, {
    key: 'getLastMillisecondUpdated',
    value: function getLastMillisecondUpdated() {
      return this._lastUpdatedMillisecond;
    }

    /**
     * @method rekapi.Rekapi#getAnimationLength
     * @return {number} The length of the animation timeline, in milliseconds.
     */

  }, {
    key: 'getAnimationLength',
    value: function getAnimationLength() {
      if (!this._animationLengthValid) {
        this._animationLength = Math.max.apply(Math, this._actors.map(function (actor) {
          return actor.getEnd();
        }));

        this._animationLengthValid = true;
      }

      return this._animationLength;
    }

    /**
     * Bind a {@link rekapi.eventHandler} function to a Rekapi event.
     * @method rekapi.Rekapi#on
     * @param {string} eventName Valid values are:
     *
     * - `"animationComplete"`: Fires when all animation loops have completed.
     * - `"playStateChange"`: Fires when the animation is played, paused, or
     *   stopped.
     * - `"play"`: Fires when the animation is {@link rekapi.Rekapi#play}ed.
     * - `"pause"`: Fires when the animation is {@link rekapi.Rekapi#pause}d.
     * - `"stop"`: Fires when the animation is {@link rekapi.Rekapi#stop}ped.
     * - `"beforeUpdate"`: Fires each frame before all actors are rendered.
     * - `"afterUpdate"`: Fires each frame after all actors are rendered.
     * - `"addActor"`: Fires when an actor is added.  `data` is the
     *   {@link rekapi.Actor} that was added.
     * - `"removeActor"`: Fires when an actor is removed.  `data` is the {@link
     *   rekapi.Actor} that was removed.
     * - `"beforeAddKeyframeProperty"`: Fires just before the point where a
     *   {@link rekapi.KeyframeProperty} is added to the timeline.  This event is
     *   called before any modifications to the timeline are done.
     * - `"addKeyframeProperty"`: Fires when a keyframe property is added.
     *   `data` is the {@link rekapi.KeyframeProperty} that was added.
     * - `"beforeRemoveKeyframeProperty"`: Fires just before the point where a
     *   {@link rekapi.KeyframeProperty} is removed.  This
     *   event is called before any modifications to the timeline are done.
     * - `"removeKeyframeProperty"`: Fires when a {@link rekapi.KeyframeProperty}
     *   is removed.  This event is fired _before_ the internal state of the
     *   keyframe (but not the timeline, in contrast to the
     *   `beforeRemoveKeyframeProperty` event) has been updated to reflect the
     *   keyframe property removal (this is in contrast to
     *   `removeKeyframePropertyComplete`).  `data` is the {@link
     *   rekapi.KeyframeProperty} that was removed.
     * - `"removeKeyframePropertyComplete"`: Fires when a {@link
     *   rekapi.KeyframeProperty} has finished being removed from the timeline.
     *   Unlike `removeKeyframeProperty`, this is fired _after_ the internal
     *   state of Rekapi has been updated to reflect the removal of the keyframe
     *   property. `data` is the {@link rekapi.KeyframeProperty} that was
     *   removed.
     * - `"addKeyframePropertyTrack"`: Fires when the a keyframe is added to an
     *   actor that creates a new keyframe property track.  `data` is the {@link
     *   rekapi.KeyframeProperty} that was added to create the property track.  A
     *   reference to the actor that the keyframe property is associated with can
     *   be accessed via `data.actor` and the track name that was added can be
     *   determined via `data.name`.
     * - `"removeKeyframePropertyTrack"`: Fires when the last keyframe property
     *   in an actor's keyframe property track is removed.  Rekapi automatically
     *   removes property tracks when they are emptied out, which causes this
     *   event to be fired.  `data` is the name of the track that was
     *   removed.
     * - `"timelineModified"`: Fires when a keyframe is added, modified or
     *   removed.
     * - `"animationLooped"`: Fires when an animation loop ends and a new one
     *   begins.
     * @param {rekapi.eventHandler} handler The event handler function.
     * @return {rekapi.Rekapi}
     */

  }, {
    key: 'on',
    value: function on(eventName, handler) {
      if (!this._events[eventName]) {
        return this;
      }

      this._events[eventName].push(handler);

      return this;
    }

    /**
     * Manually fire a Rekapi event, thereby calling all {@link
     * rekapi.eventHandler}s bound to that event.
     * @param {string} eventName The name of the event to trigger.
     * @param {any} [data] Optional data to provide to the `eventName` {@link
     * rekapi.eventHandler}s.
     * @method rekapi.Rekapi#trigger
     * @return {rekapi.Rekapi}
     */

  }, {
    key: 'trigger',
    value: function trigger(eventName, data) {
      fireEvent(this, eventName, data);

      return this;
    }

    /**
     * Unbind one or more handlers from a Rekapi event.
     * @method rekapi.Rekapi#off
     * @param {string} eventName Valid values correspond to the list under
     * {@link rekapi.Rekapi#on}.
     * @param {rekapi.eventHandler} [handler] A reference to the {@link
     * rekapi.eventHandler} to unbind.  If omitted, all {@link
     * rekapi.eventHandler}s bound to `eventName` are unbound.
     * @return {rekapi.Rekapi}
     */

  }, {
    key: 'off',
    value: function off(eventName, handler) {
      if (!this._events[eventName]) {
        return this;
      }

      this._events[eventName] = handler ? _lodash2.default.without(this._events[eventName], handler) : [];

      return this;
    }

    /**
     * Export the timeline to a `JSON.stringify`-friendly `Object`.
     *
     * @method rekapi.Rekapi#exportTimeline
     * @return {Object} This data can later be consumed by {@link
     * rekapi.Rekapi#importTimeline}.
     */

  }, {
    key: 'exportTimeline',
    value: function exportTimeline() {
      var exportData = {
        duration: this.getAnimationLength(),
        actors: this._actors.map(function (actor) {
          return actor.exportTimeline();
        })
      };

      var curves = {};

      _lodash2.default.chain(_shifty.Tweenable.formulas).filter(function (formula) {
        return typeof formula.x1 === 'number';
      }).each(function (curve) {
        return curves[curve.displayName] = _lodash2.default.pick(curve, 'displayName', 'x1', 'y1', 'x2', 'y2');
      }).value();

      exportData.curves = curves;

      return exportData;
    }

    /**
     * Import data that was created by {@link rekapi.Rekapi#exportTimeline}.
     * This sets up all actors, keyframes, and custom easing curves specified in
     * the `rekapiData` parameter.  These two methods collectively allow you
     * serialize an animation (for sending to a server for persistence, for
     * example) and later recreating an identical animation.
     *
     * @method rekapi.Rekapi#importTimeline
     * @param {Object} rekapiData Any object that has the same data format as the
     * object generated from {@link rekapi.Rekapi#exportTimeline}.
     */

  }, {
    key: 'importTimeline',
    value: function importTimeline(rekapiData) {
      var _this3 = this;

      _lodash2.default.each(rekapiData.curves, function (curve, curveName) {
        return (0, _shifty.setBezierFunction)(curveName, curve.x1, curve.y1, curve.x2, curve.y2);
      });

      _lodash2.default.each(rekapiData.actors, function (actorData) {
        var actor = new _actor.Actor();
        actor.importTimeline(actorData);
        _this3.addActor(actor);
      });
    }

    /**
     * @method rekapi.Rekapi#getEventNames
     * @return {Array.<string>} The list of event names that this Rekapi instance
     * supports.
     */

  }, {
    key: 'getEventNames',
    value: function getEventNames() {
      return Object.keys(this._events);
    }

    /**
     * Get a reference to a {@link rekapi.renderer} that was initialized for this
     * animation.
     * @method rekapi.Rekapi#getRendererInstance
     * @param {rekapi.renderer} rendererConstructor The type of {@link
     * rekapi.renderer} subclass (such as {@link rekapi.CanvasRenderer} or {@link
     * rekapi.DOMRenderer}) to look up an instance of.
     * @return {rekapi.renderer|undefined} The matching {@link rekapi.renderer},
     * if any.
     */

  }, {
    key: 'getRendererInstance',
    value: function getRendererInstance(rendererConstructor) {
      return this.renderers.filter(function (renderer) {
        return renderer instanceof rendererConstructor;
      })[0];
    }

    /**
     * Move a {@link rekapi.Actor} around within the internal render order list.
     * By default, a {@link rekapi.Actor} is rendered in the order it was added
     * with {@link rekapi.Rekapi#addActor}.
     *
     * This method has no effect if {@link rekapi.Rekapi#sort} is set.
     *
     * @method rekapi.Rekapi#moveActorToPosition
     * @param {rekapi.Actor} actor
     * @param {number} layer This should be within `0` and the total number of
     * {@link rekapi.Actor}s in the animation.  That number can be found with
     * {@link rekapi.Rekapi#getActorCount}.
     * @return {rekapi.Rekapi}
     */

  }, {
    key: 'moveActorToPosition',
    value: function moveActorToPosition(actor, position) {
      if (position < this._actors.length && position > -1) {
        this._actors = _lodash2.default.without(this._actors, actor);
        this._actors.splice(position, 0, actor);
      }

      return this;
    }
  }]);

  return Rekapi;
}();
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module, global) {var __WEBPACK_AMD_DEFINE_RESULT__;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * @license
 * Lo-Dash 2.4.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
;(function () {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date() + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace =
  // whitespace
  ' \t\x0B\f\xA0\uFEFF' +

  // line terminators
  '\n\r\u2028\u2029' +

  // unicode category "Zs" space separators
  '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000';

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = ['Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object', 'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN', 'parseInt', 'setTimeout'];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] = cloneableClasses[boolClass] = cloneableClasses[dateClass] = cloneableClasses[numberClass] = cloneableClasses[objectClass] = cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = objectTypes[typeof window === 'undefined' ? 'undefined' : _typeof(window)] && window || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[ false ? 'undefined' : _typeof(exports)] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[ false ? 'undefined' : _typeof(module)] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global === 'undefined' ? 'undefined' : _typeof(global)] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object' ? cache && baseIndexOf(cache, value) > -1 ? 0 : -1 : cache ? 0 : -1;
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value === 'undefined' ? 'undefined' : _typeof(value);

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[length / 2 | 0],
        last = array[length - 1];

    if (first && (typeof first === 'undefined' ? 'undefined' : _typeof(first)) == 'object' && mid && (typeof mid === 'undefined' ? 'undefined' : _typeof(mid)) == 'object' && last && (typeof last === 'undefined' ? 'undefined' : _typeof(last)) == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' + String(toString).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/toString| for [^\]]+/g, '.*?') + '$');

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = function () {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch (e) {}
      return result;
    }();

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__') ? value : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      } else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function (objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = function () {
        function Object() {}
        return function (prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object();
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }();
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || bindData !== true && bindData[1] & 1) {
        return func;
      }
      switch (argCount) {
        case 1:
          return function (value) {
            return func.call(thisArg, value);
          };
        case 2:
          return function (a, b) {
            return func.call(thisArg, a, b);
          };
        case 3:
          return function (value, index, collection) {
            return func.call(thisArg, value, index, collection);
          };
        case 4:
          return function (accumulator, value, index, collection) {
            return func.call(thisArg, accumulator, value, index, collection);
          };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, isCurryBound ? bitmask : bitmask & ~3, args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object' && typeof value.length == 'number' && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || 1 / a == 1 / b;
      }
      var type = typeof a === 'undefined' ? 'undefined' : _typeof(a),
          otherType = typeof b === 'undefined' ? 'undefined' : _typeof(b);

      // exit early for unlike primitive values
      if (a === a && !(a && objectTypes[type]) && !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return a != +a ? b != +b
          // but treat `+0` vs. `-0` as not equal
          : a == 0 ? 1 / a == 1 / b : a == +b;

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB && !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) && 'constructor' in a && 'constructor' in b) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if (result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB)) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      } else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function (value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB);
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function (value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return result = --size > -1;
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function (source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if (found = stackA[stackLength] == source) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if (isShallow = typeof result != 'undefined') {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr ? isArray(value) ? value : [] : isPlainObject(value) ? value : {};
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        } else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = callback || isLarge ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted ? !index || seen[seen.length - 1] !== computed : indexOf(seen, computed) < 0) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function (collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function (value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError();
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = bitmask == 1 || bitmask === 17 ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function (func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
      descriptor.value = null;
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor, result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) || (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function (value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object' && typeof value.length == 'number' && toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function (value) {
      return value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object' && typeof value.length == 'number' && toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function shimKeys(object) {
      var index,
          iterable = object,
          result = [];
      if (!iterable) return result;
      if (!objectTypes[typeof object === 'undefined' ? 'undefined' : _typeof(object)]) return result;
      for (index in iterable) {
        if (hasOwnProperty.call(iterable, index)) {
          result.push(index);
        }
      }
      return result;
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function (object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function assign(object, source, guard) {
      var index,
          iterable = object,
          result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable === 'undefined' ? 'undefined' : _typeof(iterable)]) {
          var ownIndex = -1,
              ownProps = objectTypes[typeof iterable === 'undefined' ? 'undefined' : _typeof(iterable)] && keys(iterable),
              length = ownProps ? ownProps.length : 0;

          while (++ownIndex < length) {
            index = ownProps[ownIndex];
            result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
          }
        }
      }
      return result;
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function defaults(object, source, guard) {
      var index,
          iterable = object,
          result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable === 'undefined' ? 'undefined' : _typeof(iterable)]) {
          var ownIndex = -1,
              ownProps = objectTypes[typeof iterable === 'undefined' ? 'undefined' : _typeof(iterable)] && keys(iterable),
              length = ownProps ? ownProps.length : 0;

          while (++ownIndex < length) {
            index = ownProps[ownIndex];
            if (typeof result[index] == 'undefined') result[index] = iterable[index];
          }
        }
      }
      return result;
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function (value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function (value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function forIn(collection, callback, thisArg) {
      var index,
          iterable = collection,
          result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable === 'undefined' ? 'undefined' : _typeof(iterable)]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      for (index in iterable) {
        if (callback(iterable[index], index, collection) === false) return result;
      }
      return result;
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function (value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function forOwn(collection, callback, thisArg) {
      var index,
          iterable = collection,
          result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable === 'undefined' ? 'undefined' : _typeof(iterable)]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      var ownIndex = -1,
          ownProps = objectTypes[typeof iterable === 'undefined' ? 'undefined' : _typeof(iterable)] && keys(iterable),
          length = ownProps ? ownProps.length : 0;

      while (++ownIndex < length) {
        index = ownProps[ownIndex];
        if (callback(iterable[index], index, collection) === false) return result;
      }
      return result;
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function (value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false || value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if (className == arrayClass || className == stringClass || className == argsClass || className == objectClass && typeof length == 'number' && isFunction(value.splice)) {
        return !length;
      }
      forOwn(value, function () {
        return result = false;
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value === 'undefined' ? 'undefined' : _typeof(value)]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' || value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function (value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto ? value == objProto || getPrototypeOf(value) == objProto : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' || value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function (value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function (value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function (value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function (value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function (value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = args[2] && args[2][args[1]] === collection ? 1 : props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function (value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function (result, value, key) {
      hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1;
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function (value, index, collection) {
          return result = !!callback(value, index, collection);
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function (value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function (value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function (value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function (value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function (result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function (result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function (value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function (value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = callback == null && isString(collection) ? charAtCallback : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function (value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = callback == null && isString(collection) ? charAtCallback : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function (value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function (value, index, collection) {
          accumulator = noaccum ? (noaccum = false, value) : callback(accumulator, value, index, collection);
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function (value, index, collection) {
        accumulator = noaccum ? (noaccum = false, value) : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function (value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function (value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (result = callback(collection[index], index, collection)) {
            break;
          }
        }
      } else {
        forOwn(collection, function (value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function (value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function (key) {
            return value[key];
          });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0;
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback == null || thisArg ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize && createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer: while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : +step || 1;

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback == null || thisArg ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = low + high >>> 1;
        callback(array[mid]) < value ? low = mid + 1 : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result))) : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError();
      }
      return function () {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2 ? createWrapper(func, 17, slice(arguments, 2), null, thisArg) : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2 ? createWrapper(key, 19, slice(arguments, 2), null, object) : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError();
        }
      }
      return function () {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : +arity || func.length;
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError();
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function delayed() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function maxDelayed() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || maxWait !== wait) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function () {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          } else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        } else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError();
      }
      var args = slice(arguments, 1);
      return setTimeout(function () {
        func.apply(undefined, args);
      }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError();
      }
      var args = slice(arguments, 2);
      return setTimeout(function () {
        func.apply(undefined, args);
      }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError();
      }
      var memoized = function memoized() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key) ? cache[key] : cache[key] = func.apply(this, arguments);
      };
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran, result;

      if (!isFunction(func)) {
        throw new TypeError();
      }
      return function () {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError();
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function () {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func === 'undefined' ? 'undefined' : _typeof(func);
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function (object) {
          var b = object[key];
          return a === b && (a !== 0 || 1 / a == 1 / b);
        };
      }
      return function (object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || !options && !methodNames.length) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function (methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function () {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {}
    // no operation performed


    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function () {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function (value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function (object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        } else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + rand * (max - min + parseFloat('1e-' + ((rand + '').length - 1))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * https://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp((options.escape || reNoMatch).source + '|' + interpolate.source + '|' + (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' + (options.evaluate || reNoMatch).source + '|$', 'g');

      text.replace(reDelimiters, function (match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source).replace(reEmptyStringMiddle, '$1').replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' + (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') + "var __t, __p = '', __e = _.escape" + (isEvaluating ? ', __j = Array.prototype.join;\n' + "function print() { __p += __j.call(arguments, '') }\n" : ';\n') + source + 'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + templateCounter++ + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch (e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function () {
      var source = {};
      forOwn(lodash, function (func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function (func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName] = function (n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || guard && !(callbackable && typeof n == 'function')) ? result : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.2';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function (methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function () {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll ? new lodashWrapper(result, chainAll) : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function (methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function () {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function (methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function () {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if ("function" == 'function' && _typeof(__webpack_require__(7)) == 'object' && __webpack_require__(7)) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    !(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
      return _;
    }.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
      // in Node.js or RingoJS
      if (moduleExports) {
        (freeModule.exports = _)._ = _;
      }
      // in Narwhal or Rhino -require
      else {
          freeExports._ = _;
        }
    } else {
      // in a browser or Rhino
      root._ = _;
    }
}).call(undefined);
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)(module), __webpack_require__(3)))

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*! 2.1.1 */
!function (t, e) {
  "object" == ( false ? "undefined" : _typeof(exports)) && "object" == ( false ? "undefined" : _typeof(module)) ? module.exports = e() :  true ? !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (e),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? exports.shifty = e() : t.shifty = e();
}(undefined, function () {
  return function (t) {
    function e(r) {
      if (n[r]) return n[r].exports;var i = n[r] = { i: r, l: !1, exports: {} };return t[r].call(i.exports, i, i.exports, e), i.l = !0, i.exports;
    }var n = {};return e.m = t, e.c = n, e.i = function (t) {
      return t;
    }, e.d = function (t, n, r) {
      e.o(t, n) || Object.defineProperty(t, n, { configurable: !1, enumerable: !0, get: r });
    }, e.n = function (t) {
      var n = t && t.__esModule ? function () {
        return t.default;
      } : function () {
        return t;
      };return e.d(n, "a", n), n;
    }, e.o = function (t, e) {
      return Object.prototype.hasOwnProperty.call(t, e);
    }, e.p = "/assets/", e(e.s = 7);
  }([function (t, e, n) {
    "use strict";
    (function (t) {
      function r(t, e) {
        if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
      }function i() {
        var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            e = new g(),
            n = e.tween(t);return n.tweenable = e, n;
      }Object.defineProperty(e, "__esModule", { value: !0 }), e.Tweenable = e.composeEasingObject = e.tweenProps = e.clone = e.each = void 0;var o = function () {
        function t(t, e) {
          for (var n = 0; n < e.length; n++) {
            var r = e[n];r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(t, r.key, r);
          }
        }return function (e, n, r) {
          return n && t(e.prototype, n), r && t(e, r), e;
        };
      }(),
          u = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (t) {
        return typeof t === "undefined" ? "undefined" : _typeof(t);
      } : function (t) {
        return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t === "undefined" ? "undefined" : _typeof(t);
      };e.tween = i;var a = n(6),
          s = function (t) {
        if (t && t.__esModule) return t;var e = {};if (null != t) for (var n in t) {
          Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
        }return e.default = t, e;
      }(a),
          c = n(1),
          f = function (t) {
        return t && t.__esModule ? t : { default: t };
      }(c),
          h = "undefined" != typeof window ? window : t,
          l = h.requestAnimationFrame || h.webkitRequestAnimationFrame || h.oRequestAnimationFrame || h.msRequestAnimationFrame || h.mozCancelRequestAnimationFrame && h.mozRequestAnimationFrame || setTimeout,
          p = function p() {},
          d = e.each = function (t, e) {
        Object.keys(t).forEach(e);
      },
          m = e.clone = function (t) {
        return (0, f.default)({}, t);
      },
          _ = m(s),
          v = function v(t, e, n, r) {
        return t + (e - t) * n(r);
      },
          y = e.tweenProps = function (t, e, n, r, i, o, u) {
        var a = t < o ? 0 : (t - o) / i;return d(e, function (t) {
          var i = u[t],
              o = "function" == typeof i ? i : _[i];e[t] = v(n[t], r[t], o, a);
        }), e;
      },
          w = e.composeEasingObject = function (t) {
        var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "linear",
            n = {},
            r = void 0 === e ? "undefined" : u(e);return "string" === r || "function" === r ? d(t, function (t) {
          return n[t] = e;
        }) : d(t, function (t) {
          return n[t] = n[t] || e[t] || "linear";
        }), n;
      },
          g = e.Tweenable = function () {
        function t() {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
              n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : void 0;r(this, t), this._currentState = e, this._configured = !1, this._scheduleFunction = l, void 0 !== n && this.setConfig(n);
        }return o(t, [{ key: "_applyFilter", value: function value(e) {
            var n = this,
                r = t.filters,
                i = this._filterArgs;d(r, function (t) {
              var o = r[t][e];void 0 !== o && o.apply(n, i);
            });
          } }, { key: "_timeoutHandler", value: function value(e) {
            var n = this,
                r = arguments,
                i = this._delay,
                o = this._currentState,
                u = this._timestamp,
                a = this._duration,
                s = this._targetState,
                c = this._step,
                f = u + i + a,
                l = Math.min(e || t.now(), f),
                p = l >= f,
                d = a - (f - l);this.isPlaying() && (p ? (c(s, this._attachment, d), this.stop(!0)) : (this._scheduleId = this._scheduleFunction.call(h, function () {
              return n._timeoutHandler.apply(n, r);
            }, 1e3 / 60), this._applyFilter("beforeTween"), l < u + i ? (l = 1, a = 1, u = 1) : u += i, y(l, o, this._originalState, s, a, u, this._easing), this._applyFilter("afterTween"), c(o, this._attachment, d)));
          } }, { key: "tween", value: function value() {
            var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : void 0;return this._isTweening ? this : (void 0 === e && this._configured || this.setConfig(e), this._timestamp = t.now(), this._start(this.get(), this._attachment), this.resume());
          } }, { key: "setConfig", value: function value() {
            var t = this,
                e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};this._configured = !0, this._attachment = e.attachment, (0, f.default)(this, { _pausedAtTime: null, _scheduleId: null, _delay: e.delay || 0, _start: e.start || p, _step: e.step || p, _duration: e.duration || 500, _currentState: m(e.from || this.get()) }), (0, f.default)(this, { _originalState: this.get(), _targetState: m(e.to || this.get()) });var n = this._currentState;this._targetState = (0, f.default)({}, n, this._targetState), this._easing = w(n, e.easing), this._filterArgs = [n, this._originalState, this._targetState, this._easing], this._applyFilter("tweenCreated");var r = e.promise || Promise;return this._promise = new r(function (e, n) {
              t._resolve = e, t._reject = n;
            }), this._promise.catch(p), this;
          } }, { key: "get", value: function value() {
            return m(this._currentState);
          } }, { key: "set", value: function value(t) {
            this._currentState = t;
          } }, { key: "pause", value: function value() {
            return this._pausedAtTime = t.now(), this._isPaused = !0, this;
          } }, { key: "resume", value: function value() {
            return this._isPaused && (this._timestamp += t.now() - this._pausedAtTime), this._isPaused = !1, this._isTweening = !0, this._timeoutHandler(), this._promise;
          } }, { key: "seek", value: function value(e) {
            e = Math.max(e, 0);var n = t.now();return this._timestamp + e === 0 ? this : (this._timestamp = n - e, this.isPlaying() || (this._isTweening = !0, this._isPaused = !1, this._timeoutHandler(n), this.pause()), this);
          } }, { key: "stop", value: function value(t) {
            return this._isTweening = !1, this._isPaused = !1, (h.cancelAnimationFrame || h.webkitCancelAnimationFrame || h.oCancelAnimationFrame || h.msCancelAnimationFrame || h.mozCancelRequestAnimationFrame || h.clearTimeout)(this._scheduleId), t ? (this._applyFilter("beforeTween"), y(1, this._currentState, this._originalState, this._targetState, 1, 0, this._easing), this._applyFilter("afterTween"), this._applyFilter("afterTweenEnd"), this._resolve(this._currentState, this._attachment)) : this._reject(this._currentState, this._attachment), this;
          } }, { key: "isPlaying", value: function value() {
            return this._isTweening && !this._isPaused;
          } }, { key: "setScheduleFunction", value: function value(t) {
            this._scheduleFunction = t;
          } }, { key: "dispose", value: function value() {
            var t = this;d(this, function (e) {
              return delete t[e];
            });
          } }]), t;
      }();(0, f.default)(g, { formulas: _, filters: {}, now: Date.now || function (t) {
          return +new Date();
        } });
    }).call(e, n(5));
  }, function (t, e, n) {
    "use strict";
    function r(t) {
      if (null === t || void 0 === t) throw new TypeError("Object.assign cannot be called with null or undefined");return Object(t);
    }var i = Object.getOwnPropertySymbols,
        o = Object.prototype.hasOwnProperty,
        u = Object.prototype.propertyIsEnumerable;t.exports = function () {
      try {
        if (!Object.assign) return !1;var t = new String("abc");if (t[5] = "de", "5" === Object.getOwnPropertyNames(t)[0]) return !1;for (var e = {}, n = 0; n < 10; n++) {
          e["_" + String.fromCharCode(n)] = n;
        }if ("0123456789" !== Object.getOwnPropertyNames(e).map(function (t) {
          return e[t];
        }).join("")) return !1;var r = {};return "abcdefghijklmnopqrst".split("").forEach(function (t) {
          r[t] = t;
        }), "abcdefghijklmnopqrst" === Object.keys(Object.assign({}, r)).join("");
      } catch (t) {
        return !1;
      }
    }() ? Object.assign : function (t, e) {
      for (var n, a, s = r(t), c = 1; c < arguments.length; c++) {
        n = Object(arguments[c]);for (var f in n) {
          o.call(n, f) && (s[f] = n[f]);
        }if (i) {
          a = i(n);for (var h = 0; h < a.length; h++) {
            u.call(n, a[h]) && (s[a[h]] = n[a[h]]);
          }
        }
      }return s;
    };
  }, function (t, e, n) {
    "use strict";
    function r(t, e, n, r, i, o) {
      var u = 0,
          a = 0,
          s = 0,
          c = 0,
          f = 0,
          h = 0,
          l = function l(t) {
        return ((u * t + a) * t + s) * t;
      },
          p = function p(t) {
        return ((c * t + f) * t + h) * t;
      },
          d = function d(t) {
        return (3 * u * t + 2 * a) * t + s;
      },
          m = function m(t) {
        return t >= 0 ? t : 0 - t;
      },
          _ = function _(t, e) {
        var n = void 0,
            r = void 0,
            i = void 0,
            o = void 0,
            u = void 0,
            a = void 0;for (i = t, a = 0; a < 8; a++) {
          if (o = l(i) - t, m(o) < e) return i;if (u = d(i), m(u) < 1e-6) break;i -= o / u;
        }if (n = 0, r = 1, (i = t) < n) return n;if (i > r) return r;for (; n < r;) {
          if (o = l(i), m(o - t) < e) return i;t > o ? n = i : r = i, i = .5 * (r - n) + n;
        }return i;
      };return s = 3 * e, a = 3 * (r - e) - s, u = 1 - s - a, h = 3 * n, f = 3 * (i - n) - h, c = 1 - h - f, function (t, e) {
        return p(_(t, e));
      }(t, function (t) {
        return 1 / (200 * t);
      }(o));
    }Object.defineProperty(e, "__esModule", { value: !0 }), e.unsetBezierFunction = e.setBezierFunction = void 0;var i = n(0),
        o = n(1),
        u = function (t) {
      return t && t.__esModule ? t : { default: t };
    }(o),
        a = function a(t, e, n, i) {
      return function (o) {
        return r(o, t, e, n, i, 1);
      };
    };e.setBezierFunction = function (t, e, n, r, o) {
      return i.Tweenable.formulas[t] = (0, u.default)(a(e, n, r, o), { displayName: t, x1: e, y1: n, x2: r, y2: o });
    }, e.unsetBezierFunction = function (t) {
      return delete i.Tweenable.formulas[t];
    };
  }, function (t, e, n) {
    "use strict";
    Object.defineProperty(e, "__esModule", { value: !0 }), e.interpolate = void 0;var r = n(0),
        i = new r.Tweenable();i._filterArgs = [];e.interpolate = function (t, e, n, o) {
      var u = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : 0,
          a = (0, r.clone)(t),
          s = (0, r.composeEasingObject)(t, o);i.set({}), i._filterArgs = [a, t, e, s], i._applyFilter("tweenCreated"), i._applyFilter("beforeTween");var c = (0, r.tweenProps)(n, a, t, e, 1, u, s);return i._applyFilter("afterTween"), c;
    };
  }, function (t, e, n) {
    "use strict";
    function r(t) {
      return parseInt(t, 16);
    }function i(t, e, n) {
      [t, e, n].forEach(_), this._tokenData = g(t);
    }function o(t, e, n, r) {
      var i = this._tokenData;S(r, i), [t, e, n].forEach(function (t) {
        return b(t, i);
      });
    }function u(t, e, n, r) {
      var i = this._tokenData;[t, e, n].forEach(function (t) {
        return F(t, i);
      }), k(r, i);
    }Object.defineProperty(e, "__esModule", { value: !0 }), e.tweenCreated = i, e.beforeTween = o, e.afterTween = u;var a = n(0),
        s = function () {
      var t = /[0-9.\-]+/g.source,
          e = /,\s*/.source;return new RegExp("rgb\\(" + t + e + t + e + t + "\\)", "g");
    }(),
        c = /#([0-9]|[a-f]){3,6}/gi,
        f = function f(t, e) {
      return t.map(function (t, n) {
        return "_" + e + "_" + n;
      });
    },
        h = function h(t) {
      var e = t.match(/([^\-0-9\.]+)/g);return e ? (1 === e.length || t.charAt(0).match(/(\d|\-|\.)/)) && e.unshift("") : e = ["", ""], e.join("VAL");
    },
        l = function l(t) {
      return t = t.replace(/#/, ""), 3 === t.length && (t = t.split(""), t = t[0] + t[0] + t[1] + t[1] + t[2] + t[2]), [r(t.substr(0, 2)), r(t.substr(2, 2)), r(t.substr(4, 2))];
    },
        p = function p(t) {
      return "rgb(" + l(t).join(",") + ")";
    },
        d = function d(t, e, n) {
      var r = e.match(t),
          i = e.replace(t, "VAL");return r && r.forEach(function (t) {
        return i = i.replace("VAL", n(t));
      }), i;
    },
        m = function m(t) {
      return d(c, t, p);
    },
        _ = function _(t) {
      (0, a.each)(t, function (e) {
        var n = t[e];"string" == typeof n && n.match(c) && (t[e] = m(n));
      });
    },
        v = function v(t) {
      var e = t.match(/[0-9.\-]+/g).map(Math.floor);return "" + t.match(/^.*\(/)[0] + e.join(",") + ")";
    },
        y = function y(t) {
      return d(s, t, v);
    },
        w = function w(t) {
      return t.match(/[0-9.\-]+/g);
    },
        g = function g(t) {
      var e = {};return (0, a.each)(t, function (n) {
        var r = t[n];"string" == typeof r && (e[n] = { formatString: h(r), chunkNames: f(w(r), n) });
      }), e;
    },
        b = function b(t, e) {
      (0, a.each)(e, function (n) {
        w(t[n]).forEach(function (r, i) {
          return t[e[n].chunkNames[i]] = +r;
        }), delete t[n];
      });
    },
        M = function M(t, e) {
      var n = {};return e.forEach(function (e) {
        n[e] = t[e], delete t[e];
      }), n;
    },
        O = function O(t, e) {
      return e.map(function (e) {
        return t[e];
      });
    },
        j = function j(t, e) {
      return e.forEach(function (e) {
        return t = t.replace("VAL", +e.toFixed(4));
      }), t;
    },
        F = function F(t, e) {
      (0, a.each)(e, function (n) {
        var r = e[n],
            i = r.chunkNames,
            o = r.formatString,
            u = j(o, O(M(t, i), i));t[n] = y(u);
      });
    },
        S = function S(t, e) {
      (0, a.each)(e, function (n) {
        var r = e[n].chunkNames,
            i = t[n];"string" == typeof i ? function () {
          var e = i.split(" "),
              n = e[e.length - 1];r.forEach(function (r, i) {
            return t[r] = e[i] || n;
          });
        }() : r.forEach(function (e) {
          return t[e] = i;
        }), delete t[n];
      });
    },
        k = function k(t, e) {
      (0, a.each)(e, function (n) {
        var r = e[n].chunkNames,
            i = (r.length, t[r[0]]);t[n] = "string" == typeof i ? r.map(function (e) {
          var n = t[e];return delete t[e], n;
        }).join(" ") : i;
      });
    };
  }, function (t, e, n) {
    "use strict";
    var r,
        i = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (t) {
      return typeof t === "undefined" ? "undefined" : _typeof(t);
    } : function (t) {
      return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t === "undefined" ? "undefined" : _typeof(t);
    };r = function () {
      return this;
    }();try {
      r = r || Function("return this")() || (0, eval)("this");
    } catch (t) {
      "object" === ("undefined" == typeof window ? "undefined" : i(window)) && (r = window);
    }t.exports = r;
  }, function (t, e, n) {
    "use strict";
    Object.defineProperty(e, "__esModule", { value: !0 });e.linear = function (t) {
      return t;
    }, e.easeInQuad = function (t) {
      return Math.pow(t, 2);
    }, e.easeOutQuad = function (t) {
      return -(Math.pow(t - 1, 2) - 1);
    }, e.easeInOutQuad = function (t) {
      return (t /= .5) < 1 ? .5 * Math.pow(t, 2) : -.5 * ((t -= 2) * t - 2);
    }, e.easeInCubic = function (t) {
      return Math.pow(t, 3);
    }, e.easeOutCubic = function (t) {
      return Math.pow(t - 1, 3) + 1;
    }, e.easeInOutCubic = function (t) {
      return (t /= .5) < 1 ? .5 * Math.pow(t, 3) : .5 * (Math.pow(t - 2, 3) + 2);
    }, e.easeInQuart = function (t) {
      return Math.pow(t, 4);
    }, e.easeOutQuart = function (t) {
      return -(Math.pow(t - 1, 4) - 1);
    }, e.easeInOutQuart = function (t) {
      return (t /= .5) < 1 ? .5 * Math.pow(t, 4) : -.5 * ((t -= 2) * Math.pow(t, 3) - 2);
    }, e.easeInQuint = function (t) {
      return Math.pow(t, 5);
    }, e.easeOutQuint = function (t) {
      return Math.pow(t - 1, 5) + 1;
    }, e.easeInOutQuint = function (t) {
      return (t /= .5) < 1 ? .5 * Math.pow(t, 5) : .5 * (Math.pow(t - 2, 5) + 2);
    }, e.easeInSine = function (t) {
      return 1 - Math.cos(t * (Math.PI / 2));
    }, e.easeOutSine = function (t) {
      return Math.sin(t * (Math.PI / 2));
    }, e.easeInOutSine = function (t) {
      return -.5 * (Math.cos(Math.PI * t) - 1);
    }, e.easeInExpo = function (t) {
      return 0 === t ? 0 : Math.pow(2, 10 * (t - 1));
    }, e.easeOutExpo = function (t) {
      return 1 === t ? 1 : 1 - Math.pow(2, -10 * t);
    }, e.easeInOutExpo = function (t) {
      return 0 === t ? 0 : 1 === t ? 1 : (t /= .5) < 1 ? .5 * Math.pow(2, 10 * (t - 1)) : .5 * (2 - Math.pow(2, -10 * --t));
    }, e.easeInCirc = function (t) {
      return -(Math.sqrt(1 - t * t) - 1);
    }, e.easeOutCirc = function (t) {
      return Math.sqrt(1 - Math.pow(t - 1, 2));
    }, e.easeInOutCirc = function (t) {
      return (t /= .5) < 1 ? -.5 * (Math.sqrt(1 - t * t) - 1) : .5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    }, e.easeOutBounce = function (t) {
      return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
    }, e.easeInBack = function (t) {
      var e = 1.70158;return t * t * ((e + 1) * t - e);
    }, e.easeOutBack = function (t) {
      var e = 1.70158;return (t -= 1) * t * ((e + 1) * t + e) + 1;
    }, e.easeInOutBack = function (t) {
      var e = 1.70158;return (t /= .5) < 1 ? t * t * ((1 + (e *= 1.525)) * t - e) * .5 : .5 * ((t -= 2) * t * ((1 + (e *= 1.525)) * t + e) + 2);
    }, e.elastic = function (t) {
      return -1 * Math.pow(4, -8 * t) * Math.sin((6 * t - 1) * (2 * Math.PI) / 2) + 1;
    }, e.swingFromTo = function (t) {
      var e = 1.70158;return (t /= .5) < 1 ? t * t * ((1 + (e *= 1.525)) * t - e) * .5 : .5 * ((t -= 2) * t * ((1 + (e *= 1.525)) * t + e) + 2);
    }, e.swingFrom = function (t) {
      var e = 1.70158;return t * t * ((e + 1) * t - e);
    }, e.swingTo = function (t) {
      var e = 1.70158;return (t -= 1) * t * ((e + 1) * t + e) + 1;
    }, e.bounce = function (t) {
      return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
    }, e.bouncePast = function (t) {
      return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 2 - (7.5625 * (t -= 1.5 / 2.75) * t + .75) : t < 2.5 / 2.75 ? 2 - (7.5625 * (t -= 2.25 / 2.75) * t + .9375) : 2 - (7.5625 * (t -= 2.625 / 2.75) * t + .984375);
    }, e.easeFromTo = function (t) {
      return (t /= .5) < 1 ? .5 * Math.pow(t, 4) : -.5 * ((t -= 2) * Math.pow(t, 3) - 2);
    }, e.easeFrom = function (t) {
      return Math.pow(t, 4);
    }, e.easeTo = function (t) {
      return Math.pow(t, .25);
    };
  }, function (t, e, n) {
    "use strict";
    Object.defineProperty(e, "__esModule", { value: !0 }), e.unsetBezierFunction = e.setBezierFunction = e.interpolate = e.tween = e.Tweenable = void 0;var r = n(0),
        i = n(3),
        o = n(2),
        u = n(4),
        a = function (t) {
      if (t && t.__esModule) return t;var e = {};if (null != t) for (var n in t) {
        Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
      }return e.default = t, e;
    }(u);r.Tweenable.filters.token = a, e.Tweenable = r.Tweenable, e.tween = r.tween, e.interpolate = i.interpolate, e.setBezierFunction = o.setBezierFunction, e.unsetBezierFunction = o.unsetBezierFunction;
  }]);
});
//# sourceMappingURL=shifty.js.map
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)(module)))

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var g;

// This works in non-strict mode
g = function () {
	return this;
}();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1, eval)("this");
} catch (e) {
	// This works if the window reference is available
	if ((typeof window === "undefined" ? "undefined" : _typeof(window)) === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Actor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = __webpack_require__(1);

var _lodash2 = _interopRequireDefault(_lodash);

var _shifty = __webpack_require__(2);

var _tweenable = __webpack_require__(13);

var _keyframeProperty = __webpack_require__(5);

var _rekapi = __webpack_require__(0);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*!
 * @param {Object} obj
 * @return {number} millisecond
 */
var getMillisecond = function getMillisecond(obj) {
  return obj.millisecond;
};

// TODO: Make this a prototype method
/*!
 * @param {Actor} actor
 * @param {string} event
 * @param {any} [data]
 */
var fire = function fire(actor, event, data) {
  return actor.rekapi && (0, _rekapi.fireEvent)(actor.rekapi, event, data);
};

/*!
 * Retrieves the most recent property cache entry for a given millisecond.
 * @param {Actor} actor
 * @param {number} millisecond
 * @return {(Object|undefined)} undefined if there is no property cache for
 * the millisecond, i.e. an empty cache.
 */
var getPropertyCacheEntryForMillisecond = function getPropertyCacheEntryForMillisecond(actor, millisecond) {
  var _timelinePropertyCache = actor._timelinePropertyCache;

  var index = _lodash2.default.sortedIndex(_timelinePropertyCache, { _millisecond: millisecond }, function (obj) {
    return obj._millisecond;
  });

  if (!_timelinePropertyCache[index]) {
    return;
  }

  return _timelinePropertyCache[index]._millisecond === millisecond ? _timelinePropertyCache[index] : index >= 1 ? _timelinePropertyCache[index - 1] : _timelinePropertyCache[0];
};

/*!
 * Search property track `track` and find the correct index to insert a
 * new element at `millisecond`.
 * @param {Array(KeyframeProperty)} track
 * @param {number} millisecond
 * @return {number} index
 */
var insertionPointInTrack = function insertionPointInTrack(track, millisecond) {
  return _lodash2.default.sortedIndex(track, { millisecond: millisecond }, getMillisecond);
};

/*!
 * Gets all of the current and most recent Rekapi.KeyframeProperties for a
 * given millisecond.
 * @param {Actor} actor
 * @param {number} forMillisecond
 * @return {Object} An Object containing Rekapi.KeyframeProperties
 */
var getLatestProperties = function getLatestProperties(actor, forMillisecond) {
  var latestProperties = {};

  _lodash2.default.each(actor._propertyTracks, function (propertyTrack, propertyName) {
    var index = insertionPointInTrack(propertyTrack, forMillisecond);

    latestProperties[propertyName] = propertyTrack[index] && propertyTrack[index].millisecond === forMillisecond ?
    // Found forMillisecond exactly.
    propertyTrack[index] : index >= 1 ?
    // forMillisecond doesn't exist in the track and index is
    // where we'd need to insert it, therefore the previous
    // keyframe is the most recent one before forMillisecond.
    propertyTrack[index - 1] :
    // Return first property.  This is after forMillisecond.
    propertyTrack[0];
  });

  return latestProperties;
};

/*!
 * Search property track `track` and find the index to the element that is
 * at `millisecond`.  Returns `undefined` if not found.
 * @param {Array(KeyframeProperty)} track
 * @param {number} millisecond
 * @return {number} index or -1 if not present
 */
var propertyIndexInTrack = function propertyIndexInTrack(track, millisecond) {
  var index = insertionPointInTrack(track, millisecond);

  return track[index] && track[index].millisecond === millisecond ? index : -1;
};

/*!
 * Mark the cache of internal KeyframeProperty data as invalid.  The cache
 * will be rebuilt on the next call to ensurePropertyCacheValid.
 * @param {Actor}
 */
var invalidateCache = function invalidateCache(actor) {
  return actor._timelinePropertyCacheValid = false;
};

/*!
 * Empty out and rebuild the cache of internal KeyframeProperty data if it
 * has been marked as invalid.
 * @param {Actor}
 */
var ensurePropertyCacheValid = function ensurePropertyCacheValid(actor) {
  if (actor._timelinePropertyCacheValid) {
    return;
  }

  actor._timelinePropertyCache = [];
  actor._timelineFunctionCache = [];

  var _timelinePropertyCache = actor._timelinePropertyCache,
      _timelineFunctionCache = actor._timelineFunctionCache;

  // Build the cache map

  var props = Object.values(actor._keyframeProperties).sort(function (a, b) {
    return a.millisecond - b.millisecond;
  });

  var curCacheEntry = getLatestProperties(actor, 0);

  curCacheEntry._millisecond = 0;
  _timelinePropertyCache.push(curCacheEntry);

  props.forEach(function (property) {
    if (property.millisecond !== curCacheEntry._millisecond) {
      curCacheEntry = _lodash2.default.clone(curCacheEntry);
      curCacheEntry._millisecond = property.millisecond;
      _timelinePropertyCache.push(curCacheEntry);
    }

    curCacheEntry[property.name] = property;

    if (property.name === 'function') {
      _timelineFunctionCache.push(property);
    }
  });

  actor._timelinePropertyCacheValid = true;
};

/*!
 * Remove any property tracks that are empty.
 *
 * @param {Actor} actor
 */
var removeEmptyPropertyTracks = function removeEmptyPropertyTracks(actor) {
  var _propertyTracks = actor._propertyTracks;


  Object.keys(_propertyTracks).forEach(function (trackName) {
    if (!_propertyTracks[trackName].length) {
      delete _propertyTracks[trackName];
      fire(actor, 'removeKeyframePropertyTrack', trackName);
    }
  });
};

/*!
 * Stably sort all of the property tracks of an actor
 * @param {Actor} actor
 */
var sortPropertyTracks = function sortPropertyTracks(actor) {
  _lodash2.default.each(actor._propertyTracks, function (propertyTrack, trackName) {
    propertyTrack = _lodash2.default.sortBy(propertyTrack, 'millisecond');

    propertyTrack.forEach(function (keyframeProperty, i) {
      return keyframeProperty.linkToNext(propertyTrack[i + 1]);
    });

    actor._propertyTracks[trackName] = propertyTrack;
  });
};

/*!
 * Updates internal Rekapi and Actor data after a KeyframeProperty
 * modification method is called.
 *
 * @param {Actor} actor
 */
var cleanupAfterKeyframeModification = function cleanupAfterKeyframeModification(actor) {
  sortPropertyTracks(actor);
  invalidateCache(actor);

  if (actor.rekapi) {
    (0, _rekapi.invalidateAnimationLength)(actor.rekapi);
  }

  fire(actor, 'timelineModified');
};

/**
 * A {@link rekapi.Actor} represents an individual component of an animation.
 * An animation may have one or many {@link rekapi.Actor}s.
 *
 * @param {Object} [config={}]
 * @param {(Object|CanvasRenderingContext2D|HTMLElement)} [config.context] Sets
 * {@link rekapi.Actor#context}.
 * @param {Function} [config.setup] Sets {@link rekapi.Actor#setup}.
 * @param {rekapi.render} [config.render] Sets {@link rekapi.Actor#render}.
 * @param {Function} [config.teardown] Sets {@link rekapi.Actor#teardown}.
 * @constructs rekapi.Actor
 */

var Actor = exports.Actor = function (_Tweenable) {
  _inherits(Actor, _Tweenable);

  function Actor() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Actor);

    /**
     * @member {rekapi.Rekapi|undefined} rekapi.Actor#rekapi The {@link
     * rekapi.Rekapi} instance to which this {@link rekapi.Actor} belongs, if
     * any.
     */

    var _this = _possibleConstructorReturn(this, (Actor.__proto__ || Object.getPrototypeOf(Actor)).call(this));

    Object.assign(_this, {
      _propertyTracks: {},
      _timelinePropertyCache: [],
      _timelineFunctionCache: [],
      _timelinePropertyCacheValid: false,
      _keyframeProperties: {},

      /**
       * @member {string} rekapi.Actor#id The unique ID of this {@link rekapi.Actor}.
       */
      id: _lodash2.default.uniqueId(),

      /**
        * @member {(Object|CanvasRenderingContext2D|HTMLElement|undefined)}
        * [rekapi.Actor#context] If this {@link rekapi.Actor} was created by or
        * provided as an argument to {@link rekapi.Rekapi#addActor}, then this
        * member is a reference to that {@link rekapi.Rekapi}'s {@link
        * rekapi.Rekapi#context}.
        */
      context: config.context,

      /**
       * @member {Function} rekapi.Actor#setup Gets called when an actor is
       * added to an animation by {@link rekapi.Rekapi#addActor}.
       */
      setup: config.setup || _lodash.noop,

      /**
       * @member {rekapi.render} rekapi.Actor#render The function that renders
       * this {@link rekapi.Actor}.
       */
      render: config.render || _lodash.noop,

      /**
       * @member {Function} rekapi.Actor#teardown Gets called when an actor is
       * removed from an animation by {@link rekapi.Rekapi#removeActor}.
       */
      teardown: config.teardown || _lodash.noop,

      /**
       * @member {boolean} rekapi.Actor#wasActive A flag that records whether
       * this {@link rekapi.Actor} had any state in the previous updated cycle.
       * Handy for immediate-mode renderers (such as {@link
       * rekapi.CanvasRenderer}) to prevent unintended renders after the actor
       * has no state. Also used to prevent redundant {@link
       * rekapi.keyframeFunction} calls.
       */
      wasActive: true
    });
    return _this;
  }

  /**
   * Create a keyframe for the actor.  The animation timeline begins at `0`.
   * The timeline's length will automatically "grow" to accommodate new
   * keyframes as they are added.
   *
   * `state` should contain all of the properties that define this keyframe's
   * state.  These properties can be any value that can be tweened by
   * [Shifty](http://jeremyckahn.github.io/shifty/doc/) (numbers,
   * RGB/hexadecimal color strings, and CSS property strings).  `state` can
   * also be a [function]{@link rekapi.keyframeFunction}, but
   * [this works differently]{@tutorial keyframes-in-depth}.
   *
   * __Note:__ Internally, this creates {@link rekapi.KeyframeProperty}s and
   * places them on a "track." Tracks are automatically named to match the
   * relevant {@link rekapi.KeyframeProperty#name}s.  These {@link
   * rekapi.KeyframeProperty}s are managed for you by the {@link rekapi.Actor}
   * APIs.
   *
   * ## [Click to learn about keyframes in depth]{@tutorial keyframes-in-depth}
   * @method rekapi.Actor#keyframe
   * @param {number} millisecond Where on the timeline to set the keyframe.
   * @param {(Object|rekapi.keyframeFunction)} state The state properties of
   * the keyframe.  If this is an Object, the properties will be interpolated
   * between this and those of the following keyframe for a given point on the
   * animation timeline.  If this is a function ({@link
   * rekapi.keyframeFunction}), it will be called at the keyframe specified by
   * `millisecond`.
   * @param {(string|Object)} [easing] Optional easing string or Object.  If
   * `state` is a function, this is ignored.
   * @return {rekapi.Actor}
   */


  _createClass(Actor, [{
    key: 'keyframe',
    value: function keyframe(millisecond, state) {
      var _this2 = this;

      var easing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _rekapi.DEFAULT_EASING;

      if (state instanceof Function) {
        state = { 'function': state };
      }

      var easingObject = (0, _tweenable.composeEasingObject)(state, easing);

      _lodash2.default.each(state, function (value, name) {
        return _this2.addKeyframeProperty(new _keyframeProperty.KeyframeProperty(millisecond, name, value, easingObject[name]));
      });

      if (this.rekapi) {
        (0, _rekapi.invalidateAnimationLength)(this.rekapi);
      }

      invalidateCache(this);
      fire(this, 'timelineModified');

      return this;
    }

    /**
     * @method rekapi.Actor#hasKeyframeAt
     * @param {number} millisecond Point on the timeline to query.
     * @param {rekapi.KeyframeProperty#name} [trackName] Optionally scope the
     * lookup to a particular track.
     * @return {boolean} Whether or not the actor has any {@link
     * rekapi.KeyframeProperty}s set at `millisecond`.
     */

  }, {
    key: 'hasKeyframeAt',
    value: function hasKeyframeAt(millisecond) {
      var _this3 = this;

      var trackName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
      var _propertyTracks = this._propertyTracks;


      if (trackName && !_propertyTracks[trackName]) {
        return false;
      }

      var propertyTracks = trackName ? _lodash2.default.pick(_propertyTracks, trackName) : _propertyTracks;

      return Object.keys(propertyTracks).some(function (track) {
        return propertyTracks.hasOwnProperty(track) && !!_this3.getKeyframeProperty(track, millisecond);
      });
    }

    /**
     * Copies all of the {@link rekapi.KeyframeProperty}s from one point on the
     * actor's timeline to another. This is particularly useful for animating an
     * actor back to its original position.
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
     *     actor.copyKeyframe(0, 2000);
     *
     * @method rekapi.Actor#copyKeyframe
     * @param {number} copyFrom The timeline millisecond to copy {@link
     * rekapi.KeyframeProperty}s from.
     * @param {number} copyTo The timeline millisecond to copy {@link
     * rekapi.KeyframeProperty}s to.
     * @return {rekapi.Actor}
     */

  }, {
    key: 'copyKeyframe',
    value: function copyKeyframe(copyFrom, copyTo) {
      var _this4 = this;

      // Build the configuation objects to be passed to Actor#keyframe
      var sourcePositions = {};
      var sourceEasings = {};

      _lodash2.default.each(this._propertyTracks, function (propertyTrack, trackName) {
        var keyframeProperty = _this4.getKeyframeProperty(trackName, copyFrom);

        if (keyframeProperty) {
          sourcePositions[trackName] = keyframeProperty.value;
          sourceEasings[trackName] = keyframeProperty.easing;
        }
      });

      this.keyframe(copyTo, sourcePositions, sourceEasings);

      return this;
    }

    /**
     * Moves all of the {@link rekapi.KeyframeProperty}s from one point on the
     * actor's timeline to another.  Although this method does error checking for
     * you to make sure the operation can be safely performed, an effective
     * pattern is to use {@link rekapi.Actor#hasKeyframeAt} to see if there is
     * already a keyframe at the requested `to` destination.
     *
     * @method rekapi.Actor#moveKeyframe
     * @param {number} from The millisecond of the keyframe to be moved.
     * @param {number} to The millisecond of where the keyframe should be moved
     * to.
     * @return {boolean} Whether or not the keyframe was successfully moved.
     */

  }, {
    key: 'moveKeyframe',
    value: function moveKeyframe(from, to) {
      if (!this.hasKeyframeAt(from) || this.hasKeyframeAt(to)) {
        return false;
      }

      // Move each of the relevant KeyframeProperties to the new location in the
      // timeline
      _lodash2.default.each(this._propertyTracks, function (propertyTrack, trackName) {
        var oldIndex = propertyIndexInTrack(propertyTrack, from);

        if (oldIndex !== -1) {
          propertyTrack[oldIndex].millisecond = to;
        }
      });

      cleanupAfterKeyframeModification(this);

      return true;
    }

    /**
     * Augment the `value` or `easing` of the {@link rekapi.KeyframeProperty}s
     * at a given millisecond.  Any {@link rekapi.KeyframeProperty}s omitted in
     * `state` or `easing` are not modified.
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
     * @method rekapi.Actor#modifyKeyframe
     * @param {number} millisecond
     * @param {Object} state
     * @param {Object} [easing={}]
     * @return {rekapi.Actor}
     */

  }, {
    key: 'modifyKeyframe',
    value: function modifyKeyframe(millisecond, state) {
      var _this5 = this;

      var easing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      _lodash2.default.each(this._propertyTracks, function (propertyTrack, trackName) {
        var property = _this5.getKeyframeProperty(trackName, millisecond);

        if (property) {
          property.modifyWith({
            value: state[trackName],
            easing: easing[trackName]
          });
        } else if (state[trackName]) {
          _this5.addKeyframeProperty(new _keyframeProperty.KeyframeProperty(millisecond, trackName, state[trackName], easing[trackName]));
        }
      });

      cleanupAfterKeyframeModification(this);

      return this;
    }

    /**
     * Remove all {@link rekapi.KeyframeProperty}s set
     * on the actor at a given millisecond in the animation.
     *
     * @method rekapi.Actor#removeKeyframe
     * @param {number} millisecond The location on the timeline of the keyframe
     * to remove.
     * @return {rekapi.Actor}
     */

  }, {
    key: 'removeKeyframe',
    value: function removeKeyframe(millisecond) {
      var _this6 = this;

      _lodash2.default.each(this._propertyTracks, function (propertyTrack, propertyName) {
        var index = propertyIndexInTrack(propertyTrack, millisecond);

        if (index !== -1) {
          var keyframeProperty = propertyTrack[index];
          _this6._deleteKeyframePropertyAt(propertyTrack, index);
          keyframeProperty.detach();
        }
      });

      removeEmptyPropertyTracks(this);
      cleanupAfterKeyframeModification(this);
      fire(this, 'timelineModified');

      return this;
    }

    /**
     * Remove all {@link rekapi.KeyframeProperty}s set
     * on the actor.
     *
     * **NOTE**: This method does _not_ fire the `beforeRemoveKeyframeProperty`
     * or `removeKeyframePropertyComplete` events.  This method is a bulk
     * operation that is more efficient than calling {@link
     * rekapi.Actor#removeKeyframeProperty} many times individually, but
     * foregoes firing events.
     *
     * @method rekapi.Actor#removeAllKeyframes
     * @return {rekapi.Actor}
     */

  }, {
    key: 'removeAllKeyframes',
    value: function removeAllKeyframes() {
      _lodash2.default.each(this._propertyTracks, function (propertyTrack) {
        return propertyTrack.length = 0;
      });

      _lodash2.default.each(this._keyframeProperties, function (keyframeProperty) {
        return keyframeProperty.detach();
      });

      removeEmptyPropertyTracks(this);
      this._keyframeProperties = {};

      // Calling removeKeyframe performs some necessary post-removal cleanup, the
      // earlier part of this method skipped all of that for the sake of
      // efficiency.
      return this.removeKeyframe(0);
    }

    /**
     * @method rekapi.Actor#getKeyframeProperty
     * @param {string} property The name of the property track.
     * @param {number} millisecond The millisecond of the property in the
     * timeline.
     * @return {(rekapi.KeyframeProperty|undefined)} A {@link
     * rekapi.KeyframeProperty} that is stored on the actor, as specified by the
     * `property` and `millisecond` parameters. This is `undefined` if no
     * properties were found.
     */

  }, {
    key: 'getKeyframeProperty',
    value: function getKeyframeProperty(property, millisecond) {
      var propertyTrack = this._propertyTracks[property];

      return propertyTrack[propertyIndexInTrack(propertyTrack, millisecond)];
    }

    /**
     * Modify a {@link rekapi.KeyframeProperty} stored on an actor.
     * Internally, this calls {@link rekapi.KeyframeProperty#modifyWith} and
     * then performs some cleanup.
     *
     * @method rekapi.Actor#modifyKeyframeProperty
     * @param {string} property The name of the {@link rekapi.KeyframeProperty}
     * to modify.
     * @param {number} millisecond The timeline millisecond of the {@link
     * rekapi.KeyframeProperty} to modify.
     * @param {Object} newProperties The properties to augment the {@link
     * rekapi.KeyframeProperty} with.
     * @return {rekapi.Actor}
     */

  }, {
    key: 'modifyKeyframeProperty',
    value: function modifyKeyframeProperty(property, millisecond, newProperties) {
      var keyframeProperty = this.getKeyframeProperty(property, millisecond);

      if (keyframeProperty) {
        if ('millisecond' in newProperties && this.hasKeyframeAt(newProperties.millisecond, property)) {
          throw new Error('Tried to move ' + property + ' to ' + newProperties.millisecond + 'ms, but a keyframe property already exists there');
        }

        keyframeProperty.modifyWith(newProperties);
        cleanupAfterKeyframeModification(this);
      }

      return this;
    }

    /**
     * Remove a single {@link rekapi.KeyframeProperty}
     * from the actor.
     * @method rekapi.Actor#removeKeyframeProperty
     * @param {string} property The name of the {@link rekapi.KeyframeProperty}
     * to remove.
     * @param {number} millisecond Where in the timeline the {@link
     * rekapi.KeyframeProperty} to remove is.
     * @return {(rekapi.KeyframeProperty|undefined)} The removed
     * KeyframeProperty, if one was found.
     */

  }, {
    key: 'removeKeyframeProperty',
    value: function removeKeyframeProperty(property, millisecond) {
      var _propertyTracks = this._propertyTracks;


      if (_propertyTracks[property]) {
        var propertyTrack = _propertyTracks[property];
        var index = propertyIndexInTrack(propertyTrack, millisecond);
        var keyframeProperty = propertyTrack[index];

        (0, _rekapi.fireEvent)(this.rekapi, 'beforeRemoveKeyframeProperty', keyframeProperty);
        this._deleteKeyframePropertyAt(propertyTrack, index);
        keyframeProperty.detach();

        removeEmptyPropertyTracks(this);
        cleanupAfterKeyframeModification(this);
        (0, _rekapi.fireEvent)(this.rekapi, 'removeKeyframePropertyComplete', keyframeProperty);

        return keyframeProperty;
      }
    }

    /**
     *
     * @method rekapi.Actor#getTrackNames
     * @return {Array.<rekapi.KeyframeProperty#name>} A list of all the track
     * names for a {@link rekapi.Actor}.
     */

  }, {
    key: 'getTrackNames',
    value: function getTrackNames() {
      return Object.keys(this._propertyTracks);
    }

    /**
     * Get all of the {@link rekapi.KeyframeProperty}s for a track.
     * @method rekapi.Actor#getPropertiesInTrack
     * @param {rekapi.KeyframeProperty#name} trackName The track name to query.
     * @return {Array(rekapi.KeyframeProperty)}
     */

  }, {
    key: 'getPropertiesInTrack',
    value: function getPropertiesInTrack(trackName) {
      return (this._propertyTracks[trackName] || []).slice(0);
    }

    /**
     * @method rekapi.Actor#getStart
     * @param {rekapi.KeyframeProperty#name} [trackName] Optionally scope the
     * lookup to a particular track.
     * @return {number} The millisecond of the first animating state of a {@link
     * rekapi.Actor} (for instance, if the first keyframe is later than
     * millisecond `0`).  If there are no keyframes, this is `0`.
     */

  }, {
    key: 'getStart',
    value: function getStart() {
      var trackName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
      var _propertyTracks = this._propertyTracks;

      var starts = [];

      // Null check to see if trackName was provided and is valid
      if (_propertyTracks.hasOwnProperty(trackName)) {
        var firstKeyframeProperty = _propertyTracks[trackName][0];

        if (firstKeyframeProperty) {
          starts.push(firstKeyframeProperty.millisecond);
        }
      } else {
        // Loop over all property tracks and accumulate the first
        // keyframeProperties from non-empty tracks
        _lodash2.default.each(_propertyTracks, function (propertyTrack) {
          if (propertyTrack.length) {
            starts.push(propertyTrack[0].millisecond);
          }
        });
      }

      return starts.length > 0 ? Math.min.apply(Math, starts) : 0;
    }

    /**
     * @method rekapi.Actor#getEnd
     * @param {rekapi.KeyframeProperty#name} [trackName] Optionally scope the
     * lookup to a particular keyframe track.
     * @return {number} The millisecond of the last state of an actor (the point
     * in the timeline in which it is done animating).  If there are no
     * keyframes, this is `0`.
     */

  }, {
    key: 'getEnd',
    value: function getEnd() {
      var trackName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      var endingTracks = [0];

      var tracksToInspect = trackName ? _defineProperty({}, trackName, this._propertyTracks[trackName]) : this._propertyTracks;

      _lodash2.default.each(tracksToInspect, function (propertyTrack) {
        if (propertyTrack.length) {
          endingTracks.push(propertyTrack[propertyTrack.length - 1].millisecond);
        }
      });

      return Math.max.apply(Math, endingTracks);
    }

    /**
     * @method rekapi.Actor#getLength
     * @param {rekapi.KeyframeProperty#name} [trackName] Optionally scope the
     * lookup to a particular track.
     * @return {number} The length of time in milliseconds that the actor
     * animates for.
     */

  }, {
    key: 'getLength',
    value: function getLength() {
      var trackName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      return this.getEnd(trackName) - this.getStart(trackName);
    }

    /**
     * Extend the last state on this actor's timeline to simulate a pause.
     * Internally, this method copies the final state of the actor in the
     * timeline to the millisecond defined by `until`.
     *
     * @method rekapi.Actor#wait
     * @param {number} until At what point in the animation the Actor should wait
     * until (relative to the start of the animation timeline).  If this number
     * is less than the value returned from {@link rekapi.Actor#getLength},
     * this method does nothing.
     * @return {rekapi.Actor}
     */

  }, {
    key: 'wait',
    value: function wait(until) {
      var end = this.getEnd();

      if (until <= end) {
        return this;
      }

      var latestProps = getLatestProperties(this, this.getEnd());
      var serializedProps = {};
      var serializedEasings = {};

      _lodash2.default.each(latestProps, function (latestProp, propName) {
        serializedProps[propName] = latestProp.value;
        serializedEasings[propName] = latestProp.easing;
      });

      this.modifyKeyframe(end, serializedProps, serializedEasings);
      this.keyframe(until, serializedProps, serializedEasings);

      return this;
    }

    /*!
     * Insert a `KeyframeProperty` into a property track at `index`.  The linked
     * list structure of the property track is maintained.
     * @method rekapi.Actor#_insertKeyframePropertyAt
     * @param {KeyframeProperty} keyframeProperty
     * @param {Array(KeyframeProperty)} propertyTrack
     * @param {number} index
     */

  }, {
    key: '_insertKeyframePropertyAt',
    value: function _insertKeyframePropertyAt(keyframeProperty, propertyTrack, index) {
      propertyTrack.splice(index, 0, keyframeProperty);
    }

    /*!
     * Remove the `KeyframeProperty` at `index` from a property track.  The linked
     * list structure of the property track is maintained.  The removed property
     * is not modified or unlinked internally.
     * @method rekapi.Actor#_deleteKeyframePropertyAt
     * @param {Array(KeyframeProperty)} propertyTrack
     * @param {number} index
     */

  }, {
    key: '_deleteKeyframePropertyAt',
    value: function _deleteKeyframePropertyAt(propertyTrack, index) {
      propertyTrack.splice(index, 1);
    }

    /**
     * Associate a {@link rekapi.KeyframeProperty} to this {@link rekapi.Actor}.
     * Updates {@link rekapi.KeyframeProperty#actor} to maintain a link between
     * the two objects.  This is a lower-level method and it is generally better
     * to use {@link rekapi.Actor#keyframe}.  This is mostly useful for adding a
     * {@link rekapi.KeyframeProperty} back to an actor after it was {@link
     * rekapi.KeyframeProperty#detach}ed.
     * @method rekapi.Actor#addKeyframeProperty
     * @param {rekapi.KeyframeProperty} keyframeProperty
     * @return {rekapi.Actor}
     */

  }, {
    key: 'addKeyframeProperty',
    value: function addKeyframeProperty(keyframeProperty) {
      if (this.rekapi) {
        (0, _rekapi.fireEvent)(this.rekapi, 'beforeAddKeyframeProperty', keyframeProperty);
      }

      keyframeProperty.actor = this;
      this._keyframeProperties[keyframeProperty.id] = keyframeProperty;

      var name = keyframeProperty.name;
      var _propertyTracks = this._propertyTracks,
          rekapi = this.rekapi;


      if (!this._propertyTracks[name]) {
        _propertyTracks[name] = [keyframeProperty];

        if (rekapi) {
          (0, _rekapi.fireEvent)(rekapi, 'addKeyframePropertyTrack', keyframeProperty);
        }
      } else {
        var index = insertionPointInTrack(_propertyTracks[name], keyframeProperty.millisecond);

        if (_propertyTracks[name][index]) {
          var newMillisecond = keyframeProperty.millisecond;
          var targetMillisecond = _propertyTracks[name][index].millisecond;

          if (targetMillisecond === newMillisecond) {
            throw new Error('Cannot add duplicate ' + name + ' keyframe property @ ' + newMillisecond + 'ms');
          } else if (rekapi && rekapi._warnOnOutOfOrderKeyframes) {
            console.warn(new Error('Added a keyframe property before end of ' + name + ' track @ ' + newMillisecond + 'ms (< ' + targetMillisecond + 'ms)'));
          }
        }

        this._insertKeyframePropertyAt(keyframeProperty, _propertyTracks[name], index);
        cleanupAfterKeyframeModification(this);
      }

      if (rekapi) {
        (0, _rekapi.fireEvent)(rekapi, 'addKeyframeProperty', keyframeProperty);
      }

      return this;
    }

    /*!
     * TODO: Explain the use case for this method
     * Set the actor to be active or inactive starting at `millisecond`.
     * @method rekapi.Actor#setActive
     * @param {number} millisecond The time at which to change the actor's active state
     * @param {boolean} isActive Whether the actor should be active or inactive
     * @return {rekapi.Actor}
     */

  }, {
    key: 'setActive',
    value: function setActive(millisecond, isActive) {
      var hasActiveTrack = !!this._propertyTracks._active;
      var activeProperty = hasActiveTrack && this.getKeyframeProperty('_active', millisecond);

      if (activeProperty) {
        activeProperty.value = isActive;
      } else {
        this.addKeyframeProperty(new _keyframeProperty.KeyframeProperty(millisecond, '_active', isActive));
      }

      return this;
    }

    /*!
     * Calculate and set the actor's position at `millisecond` in the animation.
     * @method rekapi.Actor#_updateState
     * @param {number} millisecond
     * @param {boolean} [resetLaterFnKeyframes] If true, allow all function
     * keyframes later in the timeline to be run again.
     */

  }, {
    key: '_updateState',
    value: function _updateState(millisecond) {
      var _this7 = this;

      var resetLaterFnKeyframes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var start = this.getStart();
      var end = this.getEnd();
      var interpolatedObject = {};

      millisecond = Math.min(end, millisecond);

      ensurePropertyCacheValid(this);

      var propertyCacheEntry = _lodash2.default.omit(getPropertyCacheEntryForMillisecond(this, millisecond), '_millisecond');

      // All actors are active at time 0 unless otherwise specified;
      // make sure a future time deactivation doesn't deactive the actor
      // by default.
      if (propertyCacheEntry._active && millisecond >= propertyCacheEntry._active.millisecond) {

        this.wasActive = propertyCacheEntry._active.getValueAt(millisecond);

        if (!this.wasActive) {
          return this;
        }
      } else {
        this.wasActive = true;
      }

      if (start === end) {
        // If there is only one keyframe, use that for the state of the actor
        _lodash2.default.each(propertyCacheEntry, function (keyframeProperty, propName) {
          if (keyframeProperty.shouldInvokeForMillisecond(millisecond)) {
            keyframeProperty.invoke();
            keyframeProperty.hasFired = false;
            return;
          }

          interpolatedObject[propName] = keyframeProperty.value;
        });
      } else {
        _lodash2.default.each(propertyCacheEntry, function (keyframeProperty, propName) {
          if (_this7._beforeKeyframePropertyInterpolate !== _lodash.noop) {
            _this7._beforeKeyframePropertyInterpolate(keyframeProperty);
          }

          if (keyframeProperty.shouldInvokeForMillisecond(millisecond)) {
            keyframeProperty.invoke();
            return;
          }

          interpolatedObject[propName] = keyframeProperty.getValueAt(millisecond);

          if (_this7._afterKeyframePropertyInterpolate !== _lodash.noop) {
            _this7._afterKeyframePropertyInterpolate(keyframeProperty, interpolatedObject);
          }
        });
      }

      this.set(interpolatedObject);

      if (!resetLaterFnKeyframes) {
        this._resetFnKeyframesFromMillisecond(millisecond);
      }

      return this;
    }

    /*!
     * @method rekapi.Actor#_resetFnKeyframesFromMillisecond
     * @param {number} millisecond
     */

  }, {
    key: '_resetFnKeyframesFromMillisecond',
    value: function _resetFnKeyframesFromMillisecond(millisecond) {
      var cache = this._timelineFunctionCache;
      var length = cache.length;

      var index = _lodash2.default.sortedIndex(cache, { millisecond: millisecond }, getMillisecond);

      while (index < length) {
        cache[index++].hasFired = false;
      }
    }

    /**
     * Export this {@link rekapi.Actor} to a `JSON.stringify`-friendly `Object`.
     * @method rekapi.Actor#exportTimeline
     * @return {Object} This data can later be consumed by {@link
     * rekapi.Actor#importTimeline}.
     */

  }, {
    key: 'exportTimeline',
    value: function exportTimeline() {
      var exportData = {
        start: this.getStart(),
        end: this.getEnd(),
        trackNames: this.getTrackNames(),
        propertyTracks: {}
      };

      _lodash2.default.each(this._propertyTracks, function (propertyTrack, trackName) {
        var track = [];

        _lodash2.default.each(propertyTrack, function (keyframeProperty) {
          track.push(keyframeProperty.exportPropertyData());
        });

        exportData.propertyTracks[trackName] = track;
      });

      return exportData;
    }

    /**
     * Import an Object to augment this actor's state.  This does not remove
     * keyframe properties before importing new ones.
     *
     * @method rekapi.Actor#importTimeline
     * @param {Object} actorData Any object that has the same data format as the
     * object generated from {@link rekapi.Actor#exportTimeline}.
     */

  }, {
    key: 'importTimeline',
    value: function importTimeline(actorData) {
      var _this8 = this;

      _lodash2.default.each(actorData.propertyTracks, function (propertyTrack) {
        _lodash2.default.each(propertyTrack, function (property) {
          _this8.keyframe(property.millisecond, _defineProperty({}, property.name, property.value), property.easing);
        });
      });
    }
  }]);

  return Actor;
}(_shifty.Tweenable);

Object.assign(Actor.prototype, {
  /*!
   * @method rekapi.Actor#_beforeKeyframePropertyInterpolate
   * @param {KeyframeProperty} keyframeProperty
   * @abstract
   */
  _beforeKeyframePropertyInterpolate: _lodash.noop,

  /*!
   * @method rekapi.Actor#_afterKeyframePropertyInterpolate
   * @param {KeyframeProperty} keyframeProperty
   * @param {Object} interpolatedObject
   * @abstract
   */
  _afterKeyframePropertyInterpolate: _lodash.noop
});

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KeyframeProperty = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = __webpack_require__(1);

var _lodash2 = _interopRequireDefault(_lodash);

var _shifty = __webpack_require__(2);

var _rekapi = __webpack_require__(0);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_EASING = 'linear';

/**
 * Represents an individual component of an {@link rekapi.Actor}'s keyframe
 * state.  In most cases you won't need to deal with this object directly, as
 * the {@link rekapi.Actor} APIs abstract a lot of what this Object does away
 * for you.
 * @param {number} millisecond Sets {@link
 * rekapi.KeyframeProperty#millisecond}.
 * @param {string} name Sets {@link rekapi.KeyframeProperty#name}.
 * @param {(number|string|boolean|rekapi.keyframeFunction)} value Sets {@link
 * rekapi.KeyframeProperty#value}.
 * @param {string} [easing="linear"] Sets {@link
 * rekapi.KeyframeProperty#easing}.
 * @constructs rekapi.KeyframeProperty
 */

var KeyframeProperty = exports.KeyframeProperty = function () {
  function KeyframeProperty(millisecond, name, value) {
    var easing = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : DEFAULT_EASING;

    _classCallCheck(this, KeyframeProperty);

    /**
     * @member {string} rekapi.KeyframeProperty#id The unique ID of this {@link
     * rekapi.KeyframeProperty}.
     */
    this.id = _lodash2.default.uniqueId('keyframeProperty_');

    /**
     * @member {boolean} rekapi.KeyframeProperty#hasFired Flag to determine if
     * this {@link rekapi.KeyframeProperty}'s {@link rekapi.keyframeFunction}
     * should be invoked in the current animation loop.
     */
    this.hasFired = null;

    /**
     * @member {(rekapi.Actor|undefined)} rekapi.KeyframeProperty#actor The
     * {@link rekapi.Actor} to which this {@link rekapi.KeyframeProperty}
     * belongs, if any.
     */

    /**
     * @member {(rekapi.KeyframeProperty|null)}
     * rekapi.KeyframeProperty#nextProperty A reference to the {@link
      * rekapi.KeyframeProperty} that follows this one in a {@link
      * rekapi.Actor}'s property track.
     */
    this.nextProperty = null;

    Object.assign(this, {
      /**
       * @member {number} rekapi.KeyframeProperty#millisecond Where on the
       * animation timeline this {@link rekapi.KeyframeProperty} is.
       */
      millisecond: millisecond,
      /**
       * @member {string} rekapi.KeyframeProperty#name This {@link
       * rekapi.KeyframeProperty}'s name, such as `"x"` or `"opacity"`.
       */
      name: name,
      /**
       * @member {number|string|boolean|rekapi.keyframeFunction}
       * rekapi.KeyframeProperty#value The value that this {@link
       * rekapi.KeyframeProperty} represents.
       */
      value: value,
      /**
       * @member {string} rekapi.KeyframeProperty#easing The easing curve by
       * which this {@link rekapi.KeyframeProperty} should be animated.
       */
      easing: easing
    });
  }

  /**
   * Modify this {@link rekapi.KeyframeProperty}.
   * @method rekapi.KeyframeProperty#modifyWith
   * @param {Object} newProperties Valid values are:
   * @param {number} [newProperties.millisecond] Sets {@link
   * rekapi.KeyframeProperty#millisecond}.
   * @param {string} [newProperties.name] Sets {@link rekapi.KeyframeProperty#name}.
   * @param {(number|string|boolean|rekapi.keyframeFunction)} [newProperties.value] Sets {@link
   * rekapi.KeyframeProperty#value}.
   * @param {string} [newProperties.easing] Sets {@link
   * rekapi.KeyframeProperty#easing}.
   */


  _createClass(KeyframeProperty, [{
    key: 'modifyWith',
    value: function modifyWith(newProperties) {
      Object.assign(this, newProperties);
    }

    /**
     * Calculate the midpoint between this {@link rekapi.KeyframeProperty} and
     * the next {@link rekapi.KeyframeProperty} in a {@link rekapi.Actor}'s
     * property track.
     *
     * In just about all cases, `millisecond` should be between this {@link
     * rekapi.KeyframeProperty}'s `millisecond` and the `millisecond` of the
     * {@link rekapi.KeyframeProperty} that follows it in the animation
     * timeline, but it is valid to specify a value outside of this range.
     * @method rekapi.KeyframeProperty#getValueAt
     * @param {number} millisecond The millisecond in the animation timeline to
     * compute the state value for.
     * @return {(number|string|boolean|rekapi.keyframeFunction|rekapi.KeyframeProperty#value)}
     */

  }, {
    key: 'getValueAt',
    value: function getValueAt(millisecond) {
      var nextProperty = this.nextProperty;

      if (typeof this.value === 'boolean') {
        return this.value;
      } else if (nextProperty) {
        var boundedMillisecond = Math.min(Math.max(millisecond, this.millisecond), nextProperty.millisecond);

        var name = this.name;

        var delta = nextProperty.millisecond - this.millisecond;
        var interpolatePosition = (boundedMillisecond - this.millisecond) / delta;

        return (0, _shifty.interpolate)(_defineProperty({}, name, this.value), _defineProperty({}, name, nextProperty.value), interpolatePosition, nextProperty.easing)[name];
      } else {
        return this.value;
      }
    }

    /**
     * Create the reference to the {@link rekapi.KeyframeProperty} that follows
     * this one on a {@link rekapi.Actor}'s property track.  Property tracks
     * are just linked lists of {@link rekapi.KeyframeProperty}s.
     * @method rekapi.KeyframeProperty#linkToNext
     * @param {KeyframeProperty=} nextProperty The {@link
     * rekapi.KeyframeProperty} that should immediately follow this one on the
     * animation timeline.
     */

  }, {
    key: 'linkToNext',
    value: function linkToNext() {
      var nextProperty = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      this.nextProperty = nextProperty;
    }

    /**
     * Disassociates this {@link rekapi.KeyframeProperty} from its {@link
     * rekapi.Actor}.  This is called by various {@link rekapi.Actor} methods
     * and triggers the [removeKeyframeProperty]{@link rekapi.Rekapi#on} event
     * on the associated {@link rekapi.Rekapi} instance.
     * @method rekapi.KeyframeProperty#detach
     */

  }, {
    key: 'detach',
    value: function detach() {
      var actor = this.actor;


      if (actor && actor.rekapi) {
        (0, _rekapi.fireEvent)(actor.rekapi, 'removeKeyframeProperty', this);
        delete actor._keyframeProperties[this.id];
        this.actor = null;
      }

      return this;
    }

    /**
     * Export this {@link rekapi.KeyframeProperty} to a `JSON.stringify`-friendly
     * `Object`.
     * @method rekapi.KeyframeProperty#exportPropertyData
     * @return {Object}
     */

  }, {
    key: 'exportPropertyData',
    value: function exportPropertyData() {
      return _lodash2.default.pick(this, ['millisecond', 'name', 'value', 'easing']);
    }

    /*!
     * Whether or not this is a function keyframe and should be invoked for the
     * current frame.  Helper method for Actor.
     * @method rekapi.KeyframeProperty#shouldInvokeForMillisecond
     * @return {boolean}
     */

  }, {
    key: 'shouldInvokeForMillisecond',
    value: function shouldInvokeForMillisecond(millisecond) {
      return millisecond >= this.millisecond && this.name === 'function' && !this.hasFired;
    }

    /**
     * Calls {@link rekapi.KeyframeProperty#value} if it is a {@link
     * rekapi.keyframeFunction}.
     * @method rekapi.KeyframeProperty#invoke
     * @return {any} Whatever value is returned for this {@link
     * rekapi.KeyframeProperty}'s {@link rekapi.keyframeFunction}.
     */

  }, {
    key: 'invoke',
    value: function invoke() {
      var drift = this.actor.rekapi._loopPosition - this.millisecond;
      var returnValue = this.value(this.actor, drift);
      this.hasFired = true;

      return returnValue;
    }
  }]);

  return KeyframeProperty;
}();

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (module) {
	if (!module.webpackPolyfill) {
		module.deprecate = function () {};
		module.paths = [];
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function get() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function get() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};

/***/ }),
/* 7 */
/***/ (function(module, exports) {

/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {/* globals __webpack_amd_options__ */
module.exports = __webpack_amd_options__;

/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CanvasRenderer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = __webpack_require__(1);

var _lodash2 = _interopRequireDefault(_lodash);

var _rekapi = __webpack_require__(0);

var _rekapi2 = _interopRequireDefault(_rekapi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// PRIVATE UTILITY FUNCTIONS
//

/*!
 * Gets (and optionally sets) height or width on a canvas.
 * @param {HTMLCanvas} canvas
 * @param {string} heightOrWidth The dimension (either "height" or "width")
 * to get or set.
 * @param {number=} newSize The new value to set for `dimension`.
 * @return {number}
 */
var dimension = function dimension(canvas, heightOrWidth) {
  var newSize = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

  if (newSize !== undefined) {
    canvas[heightOrWidth] = newSize;
    canvas.style[heightOrWidth] = newSize + 'px';
  }

  return canvas[heightOrWidth];
};

// CANVAS RENDERER OBJECT
//

/**
 * You can use Rekapi to render animations to an HTML5 `<canvas>`.  To do so,
 * just provide a
 * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 * instance to the {@link rekapi.Rekapi} constructor to
 * automatically set up the renderer:
 *
 *     const rekapi = new Rekapi(document.createElement('canvas').getContext('2d'));
 *
 *  To use this renderer's API, get a reference to the initialized object:
 *
 *     const canvasRenderer = rekapi.getRendererInstance(CanvasRenderer);
 *
 * __Note__: {@link rekapi.CanvasRenderer} is added to {@link
 * rekapi.Rekapi#renderers} automatically, there is no reason to call the
 * constructor yourself in most cases.
 * @param {rekapi.Rekapi} rekapi The {@link rekapi.Rekapi} instance to render for.
 * @param {CanvasRenderingContext2D=} context See [the canvas
 * docs](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D).
 * @constructor rekapi.CanvasRenderer
 * @extends {rekapi.renderer}
 */

var CanvasRenderer = function () {
  function CanvasRenderer(rekapi) {
    var _this = this;

    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

    _classCallCheck(this, CanvasRenderer);

    Object.assign(this, {
      rekapi: rekapi,
      canvasContext: context || rekapi.context
    });

    rekapi.on('beforeUpdate', function () {
      return _this.clear();
    });
  }

  /**
   * Get and optionally set the height of the associated `<canvas>` element.
   * @method rekapi.CanvasRenderer#height
   * @param {number} [height] The height to optionally set.
   * @return {number}
   */


  _createClass(CanvasRenderer, [{
    key: 'height',
    value: function height() {
      var _height = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      return dimension(this.canvasContext.canvas, 'height', _height);
    }

    /**
     * Get and optionally set the width of the associated `<canvas>` element.
     * @method rekapi.CanvasRenderer#width
     * @param {number} [width] The width to optionally set.
     * @return {number}
     */

  }, {
    key: 'width',
    value: function width() {
      var _width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      return dimension(this.canvasContext.canvas, 'width', _width);
    }

    /**
     * Erase the `<canvas>`.
     * @method rekapi.CanvasRenderer#clear
     * @return {rekapi.CanvasRenderer}
     */

  }, {
    key: 'clear',
    value: function clear() {
      this.canvasContext.clearRect(0, 0, this.width(), this.height());

      return this;
    }
  }]);

  return CanvasRenderer;
}();

/*!
 * Sets up an instance of CanvasRenderer and attaches it to a `Rekapi`
 * instance.  Also augments the Rekapi instance with canvas-specific
 * functions.
 * @param {Rekapi} rekapi
 */


exports.CanvasRenderer = CanvasRenderer;
_rekapi.rendererBootstrappers.push(function (rekapi) {
  if (typeof CanvasRenderingContext2D === 'undefined' || !(rekapi.context instanceof CanvasRenderingContext2D)) {

    return;
  }

  return new CanvasRenderer(rekapi);
});

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DOMRenderer = exports.getActorCSS = exports.canOptimizeAnyKeyframeProperties = exports.generateCSSClass = exports.generateCSSAnimationProperties = exports.generateAnimationIterationProperty = exports.generateAnimationNameProperty = exports.generateBoilerplatedKeyframes = exports.generateActorKeyframes = exports.canOptimizeKeyframeProperty = exports.simulateTrailingWait = exports.simulateLeadingWait = exports.generateActorTrackSegment = exports.serializeActorStep = exports.combineTranfromProperties = exports.generateOptimizedKeyframeSegment = exports.applyVendorBoilerplates = exports.applyVendorPropertyPrefixes = exports.VENDOR_TOKEN = exports.TRANSFORM_TOKEN = exports.transformFunctions = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _lodash = __webpack_require__(1);

var _lodash2 = _interopRequireDefault(_lodash);

var _shifty = __webpack_require__(2);

var _rekapi = __webpack_require__(0);

var _rekapi2 = _interopRequireDefault(_rekapi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var now = _shifty.Tweenable.now;


var vendorTransforms = ['transform', 'webkitTransform', 'MozTransform', 'oTransform', 'msTransform'];

var transformFunctions = exports.transformFunctions = ['translateX', 'translateY', 'translateZ', 'scale', 'scaleX', 'scaleY', 'perspective', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY'];

var DEFAULT_FPS = 30;
var TRANSFORM_TOKEN = exports.TRANSFORM_TOKEN = 'TRANSFORM';
var VENDOR_TOKEN = exports.VENDOR_TOKEN = 'VENDOR';
var R_TRANSFORM_TOKEN = new RegExp(TRANSFORM_TOKEN, 'g');
var R_VENDOR_TOKEN = new RegExp(VENDOR_TOKEN, 'g');
var VENDOR_PREFIXES = {
  microsoft: '-ms-',
  mozilla: '-moz-',
  opera: '-o-',
  w3: '',
  webkit: '-webkit-'
};
var BEZIERS = {
  linear: '.25,.25,.75,.75',
  easeInQuad: '.55,.085,.68,.53',
  easeInCubic: '.55,.055,.675,.19',
  easeInQuart: '.895,.03,.685,.22',
  easeInQuint: '.755,.05,.855,.06',
  easeInSine: '.47,0,.745,.715',
  easeInExpo: '.95,.05,.795,.035',
  easeInCirc: '.6,.04,.98, .335',
  easeOutQuad: '.25,.46,.45,.94',
  easeOutCubic: '.215,.61,.355,1',
  easeOutQuart: '.165,.84,.44,1',
  easeOutQuint: '.23,1,.32,1',
  easeOutSine: '.39,.575,.565,1',
  easeOutExpo: '.19,1,.22,1',
  easeOutCirc: '.075,.82,.165,1',
  easeInOutQuad: '.455,.03,.515,.955',
  easeInOutCubic: '.645,.045,.355,1',
  easeInOutQuart: '.77,0,.175,1',
  easeInOutQuint: '.86,0.07,1',
  easeInOutSine: '.445,.05,.55,.95',
  easeInOutExpo: '1,0,0,1',
  easeInOutCirc: '.785,.135,.15,.86'
};

// The timer to remove an injected style isn't likely to match the actual
// length of the CSS animation, so give it some extra time to complete so it
// doesn't cut off the end.
var INJECTED_STYLE_REMOVAL_BUFFER_MS = 250;

var R_3D_RULE = /3d\(/g;
var _3D_RULE = '3d(';
var _3D_TOKEN = '__THREED__';

// PRIVATE UTILITY FUNCTIONS
//

/*!
 * http://stackoverflow.com/a/3886106
 *
 * @param {number} number
 */
var isInt = function isInt(number) {
  return number % 1 === 0;
};

/*!
 * @return {string}
 */
var vendorPrefix = function () {
  var style = document.body.style;


  return '-webkit-animation' in style ? 'webkit' : '-moz-animation' in style ? 'mozilla' : '-ms-animation' in style ? 'microsoft' : '-o-animation' in style ? 'opera' : 'animation' in style ? 'w3' : '';
}();

/*!
 * @param {Actor} actor
 * @return {string} The default CSS class that is targeted by {@link
 * rekapi.DOMRenderer#getCss} if a custom class is not specified.  This may be
 * useful for getting a standard and consistent CSS class name for an actor's
 * DOM element.
 */
var getActorClassName = function getActorClassName(actor) {
  return 'actor-' + actor.id;
};

/*!
 * Fixes a really bizarre issue that only seems to affect Presto and Blink.
 * In some situations, DOM nodes will not detect dynamically injected <style>
 * elements.  Explicitly re-inserting DOM nodes seems to fix the issue.  Not
 * sure what causes this issue.  Not sure why this fixes it.
 *
 * @param {Rekapi} rekapi
 */
var forceStyleReset = function forceStyleReset(rekapi) {
  var dummyDiv = document.createElement('div');

  _lodash2.default.each(rekapi.getAllActors(), function (actor) {
    if (actor.context.nodeType === 1) {
      var context = actor.context;
      var parentElement = context.parentElement;


      parentElement.replaceChild(dummyDiv, context);
      parentElement.replaceChild(context, dummyDiv);
    }
  });
};

var styleID = 0;
/*!
 * @param {Rekapi} rekapi
 * @param {string} css The css content that the <style> element should have.
 * @return {HTMLStyleElement} The unique ID of the injected <style> element.
 */
var injectStyle = function injectStyle(rekapi, css) {
  var style = document.createElement('style');
  var id = 'rekapi-' + styleID++;
  style.id = id;
  style.innerHTML = css;
  document.head.appendChild(style);
  forceStyleReset(rekapi);

  return style;
};

/*!
 * @param {HTMLElement} element
 * @param {string} styleName
 * @param {string|number} styleValue
 */
var setStyle = function setStyle(element, styleName, styleValue) {
  return element.style[styleName] = styleValue;
};

/*!
 * @param {string} name A transform function name
 * @return {boolean}
 */
var isTransformFunction = function isTransformFunction(name) {
  return _lodash2.default.contains(transformFunctions, name);
};

/*!
 * Builds a concatenated string of given transform property values in order.
 *
 * @param {Array.<string>} orderedTransforms Array of ordered transform
 *     function names
 * @param {Object} transformProperties Transform properties to build together
 * @return {string}
 */
var buildTransformValue = function buildTransformValue(orderedTransforms, transformProperties) {
  var transformComponents = [];

  _lodash2.default.each(orderedTransforms, function (functionName) {
    if (transformProperties[functionName] !== undefined) {
      transformComponents.push(functionName + '(' + transformProperties[functionName] + ')');
    }
  });

  return transformComponents.join(' ');
};

/*!
 * Sets value for all vendor prefixed transform properties on an element
 *
 * @param {HTMLElement} element The actor's DOM element
 * @param {string} transformValue The transform style value
 */
var setTransformStyles = function setTransformStyles(element, transformValue) {
  return vendorTransforms.forEach(function (prefixedTransform) {
    return setStyle(element, prefixedTransform, transformValue);
  });
};

/*!
 * @param {Actor} actor
 * @param {HTMLElement} element
 * @param {Object} state
 */
var actorRender = function actorRender(actor, element, state) {
  var propertyNames = Object.keys(state);
  // TODO:  Optimize the following code so that propertyNames is not looped
  // over twice.
  var transformFunctionNames = propertyNames.filter(isTransformFunction);
  var otherProperties = _lodash2.default.pick(state, _lodash2.default.reject(propertyNames, isTransformFunction));

  if (transformFunctionNames.length) {
    setTransformStyles(element, buildTransformValue(actor._transformOrder, _lodash2.default.pick(state, transformFunctionNames)));
  } else if (state.transform) {
    setTransformStyles(element, state.transform);
  }

  _lodash2.default.each(otherProperties, function (styleValue, styleName) {
    return setStyle(element, styleName, styleValue);
  });
};

/*!
 * @param {Actor} actor
 */
var actorTeardown = function actorTeardown(actor) {
  var context = actor.context;

  var classList = context.className.match(/\S+/g);
  var sanitizedClassList = _lodash2.default.without(classList, getActorClassName(actor));
  context.className = sanitizedClassList.join(' ');
};

/*!
 * transform properties like translate3d and rotate3d break the cardinality
 * of multi-ease easing strings, because the "3" gets treated like a
 * tweenable value.  Transform "3d(" to "__THREED__" to prevent this, and
 * transform it back in _afterKeyframePropertyInterpolate.
 *
 * @param {KeyframeProperty} keyframeProperty
 */
var _beforeKeyframePropertyInterpolate = function _beforeKeyframePropertyInterpolate(keyframeProperty) {
  if (keyframeProperty.name !== 'transform') {
    return;
  }

  var value = keyframeProperty.value,
      nextProperty = keyframeProperty.nextProperty;


  if (nextProperty && value.match(R_3D_RULE)) {
    keyframeProperty.value = value.replace(R_3D_RULE, _3D_TOKEN);
    nextProperty.value = nextProperty.value.replace(R_3D_RULE, _3D_TOKEN);
  }
};

/*!
 * @param {KeyframeProperty} keyframeProperty
 * @param {Object} interpolatedObject
 */
var _afterKeyframePropertyInterpolate = function _afterKeyframePropertyInterpolate(keyframeProperty, interpolatedObject) {
  if (keyframeProperty.name !== 'transform') {
    return;
  }

  var value = keyframeProperty.value,
      nextProperty = keyframeProperty.nextProperty,
      name = keyframeProperty.name;


  if (nextProperty && value.match(_3D_TOKEN)) {
    keyframeProperty.value = value.replace(_3D_TOKEN, _3D_RULE);
    nextProperty.value = nextProperty.value.replace(_3D_TOKEN, _3D_RULE);
    interpolatedObject[name] = interpolatedObject[name].replace(_3D_TOKEN, _3D_RULE);
  }
};

/*!
 * @param {Rekapi} rekapi
 * @param {Actor} actor
 */
var onAddActor = function onAddActor(rekapi, actor) {
  var context = actor.context;


  if (context.nodeType !== 1) {
    return;
  }

  var className = getActorClassName(actor);

  // Add the class if it's not already there.
  // Using className instead of classList to make IE happy.
  if (!context.className.match(className)) {
    context.className += ' ' + className;
  }

  Object.assign(actor, {
    render: actorRender.bind(actor, actor),
    teardown: actorTeardown.bind(actor, actor),
    _transformOrder: transformFunctions.slice(0),
    _beforeKeyframePropertyInterpolate: _beforeKeyframePropertyInterpolate,
    _afterKeyframePropertyInterpolate: _afterKeyframePropertyInterpolate
  });
};

/*!
 * @param {string} keyframes
 * @param {vendor} vendor
 * @return {string}
 */
var applyVendorPropertyPrefixes = exports.applyVendorPropertyPrefixes = function applyVendorPropertyPrefixes(keyframes, vendor) {
  return keyframes.replace(R_VENDOR_TOKEN, VENDOR_PREFIXES[vendor]).replace(R_TRANSFORM_TOKEN, VENDOR_PREFIXES[vendor] + 'transform');
};

/*!
 * @param {string} toKeyframes Generated keyframes to wrap in boilerplates
 * @param {string} animName
 * @param {Array.<string>=} vendors Vendor boilerplates to be applied.
 *     Should be any of the values in Rekapi.util.VENDOR_PREFIXES.
 * @return {string}
 */
var applyVendorBoilerplates = exports.applyVendorBoilerplates = function applyVendorBoilerplates(toKeyframes, animName) {
  var vendors = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ['w3'];
  return vendors.map(function (vendor) {
    return applyVendorPropertyPrefixes('@' + VENDOR_PREFIXES[vendor] + 'keyframes ' + animName + '-keyframes {\n' + toKeyframes + '\n' + '}', vendor);
  }).join('\n');
};

/*!
 * @param {KeyframeProperty} property
 * @param {number} fromPercent
 * @param {number} toPercent
 * @return {string}
 */
var generateOptimizedKeyframeSegment = exports.generateOptimizedKeyframeSegment = function generateOptimizedKeyframeSegment(property, fromPercent, toPercent) {
  var name = property.name === 'transform' ? TRANSFORM_TOKEN : property.name;

  var nextProperty = property.nextProperty,
      value = property.value;

  var from = isInt(fromPercent) ? fromPercent : fromPercent.toFixed(2);
  var to = isInt(toPercent) ? toPercent : toPercent.toFixed(2);
  var bezier = BEZIERS[nextProperty.easing.split(' ')[0]];

  return '  ' + from + '% {' + name + ':' + value + ';' + VENDOR_TOKEN + 'animation-timing-function: cubic-bezier(' + bezier + ');' + '}\n  ' + to + '% {' + name + ':' + nextProperty.value + ';}';
};

/*!
 * @param {Object} propsToSerialize
 * @param {Array.<string>} transformNames
 * @return {Object}
 */
var combineTranfromProperties = exports.combineTranfromProperties = function combineTranfromProperties(propsToSerialize, transformNames) {
  if (_lodash2.default.isEmpty(_lodash2.default.pick.apply(_lodash2.default, [propsToSerialize].concat(transformFunctions)))) {
    return propsToSerialize;
  } else {
    var _ret = function () {
      var serializedProps = _lodash2.default.clone(propsToSerialize);

      serializedProps[TRANSFORM_TOKEN] = transformNames.reduce(function (combinedProperties, transformFunction) {
        if (_lodash2.default.has(serializedProps, transformFunction)) {
          combinedProperties += ' ' + transformFunction + '(' + serializedProps[transformFunction] + ')';

          delete serializedProps[transformFunction];
        }

        return combinedProperties;
      }, '').slice(1);

      return {
        v: serializedProps
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  }
};

/*!
 * @param {Actor} actor
 * @param {string=} targetProp
 * @return {string}
 */
var serializeActorStep = exports.serializeActorStep = function serializeActorStep(actor) {
  var targetProp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
  return _lodash2.default.reduce(combineTranfromProperties(targetProp ? _defineProperty({}, targetProp, actor.get()[targetProp]) : actor.get(), actor._transformOrder), function (serializedProps, val, key) {
    return '' + serializedProps + (key === 'transform' ? TRANSFORM_TOKEN : key) + ':' + val + ';';
  }, '{') + '}';
};

/*!
 * @param {Actor} actor
 * @param {number} increments
 * @param {number} incrementSize
 * @param {number} actorStart
 * @param {number} fromPercent
 * @param {KeyframeProperty=} fromProp
 * @return {Array.<string>}
 */
var generateActorTrackSegment = exports.generateActorTrackSegment = function generateActorTrackSegment(actor, increments, incrementSize, actorStart, fromPercent) {
  var fromProp = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : undefined;


  var accumulator = [];
  var length = actor.getLength();

  for (var i = 0; i < increments; i++) {
    var percent = fromPercent + i * incrementSize;

    actor._updateState(percent / 100 * length + actorStart, true);

    var step = serializeActorStep(actor, fromProp && fromProp.name);

    accumulator.push('  ' + +percent.toFixed(2) + '% ' + step);
  }

  return accumulator;
};

/*!
 * @param {Actor} actor
 * @param {number} steps
 * @return {string}
 */
var generateCombinedActorKeyframes = function generateCombinedActorKeyframes(actor, steps) {
  return generateActorTrackSegment(actor, steps + 1, 100 / steps, 0, 0).join('\n');
};

/*!
 * @param {Actor} actor
 * @param {string} track
 * @param {number} actorStart
 * @return {string|undefined}
 */
var simulateLeadingWait = exports.simulateLeadingWait = function simulateLeadingWait(actor, track, actorStart) {
  var firstProp = actor._propertyTracks[track][0];

  if (firstProp !== undefined && firstProp.millisecond !== actorStart) {
    return generateActorTrackSegment(actor, 1, 1, firstProp.millisecond, 0, firstProp).join('\n');
  }
};

/*!
 * @param {Actor} actor
 * @param {string} track
 * @param {number} actorStart
 * @param {number} actorEnd
 * @return {string|undefined}
 */
var simulateTrailingWait = exports.simulateTrailingWait = function simulateTrailingWait(actor, track, actorStart, actorEnd) {
  var lastProp = _lodash2.default.last(actor._propertyTracks[track]);

  if (lastProp !== undefined && lastProp.millisecond !== actorEnd) {
    return generateActorTrackSegment(actor, 1, 1, actorStart, 100, lastProp).join('\n');
  }
};

/*!
 * @param {KeyframeProperty} property
 * @param {number} actorStart
 * @param {number} actorLength
 * @return {number}
 */
var calculateStepPercent = function calculateStepPercent(property, actorStart, actorLength) {
  return (property.millisecond - actorStart) / actorLength * 100;
};

/*!
 * @param {Actor} actor
 * @param {number} actorStart
 * @param {KeyframeProperty} fromProp
 * @param {KeyframeProperty} toProp
 * @param {number} fromPercent
 * @param {number} toPercent
 * @return {Array.<string>}
 */
var generateActorTrackWaitSegment = function generateActorTrackWaitSegment(actor, actorStart, fromProp, toProp, fromPercent, toPercent) {
  return generateActorTrackSegment(actor, 1, toPercent - fromPercent, actorStart, fromPercent, fromProp);
};

/*!
 * @param {KeyframeProperty} property
 * @param {KeyframeProperty} nextProperty
 * @return {boolean}
 */
var isSegmentAWait = function isSegmentAWait(property, nextProperty) {
  return property.name === nextProperty.name && property.value === nextProperty.value;
};

/*!
 * @param {KeyframeProperty} property
 * @return {boolean}
 */
var canOptimizeKeyframeProperty = exports.canOptimizeKeyframeProperty = function canOptimizeKeyframeProperty(property) {
  return !property.nextProperty ? false : isSegmentAWait(property, property.nextProperty) ? true : property.nextProperty.easing.split(' ').every(function (easing, i, easings) {
    return !(!BEZIERS[easing] || i > 0 && easings[i - 1] !== easing);
  });
};

/*!
 * @param {Actor} actor
 * @param {number} steps
 * @param {string} track
 * @return {string}
 */
var generateActorKeyframes = exports.generateActorKeyframes = function generateActorKeyframes(actor, steps, track) {
  // This function is completely crazy.  Simplify it?
  var accumulator = [];
  var end = actor.getEnd();
  var start = actor.getStart();
  var length = actor.getLength();
  var leadingWait = simulateLeadingWait(actor, track, start);

  if (leadingWait) {
    accumulator.push(leadingWait);
  }

  var previousSegmentWasOptimized = false;
  actor._propertyTracks[track].forEach(function (prop) {
    var fromPercent = calculateStepPercent(prop, start, length);
    var nextProperty = prop.nextProperty;


    var toPercent = void 0,
        increments = void 0,
        incrementSize = void 0;

    if (nextProperty) {
      toPercent = calculateStepPercent(nextProperty, start, length);
      var delta = toPercent - fromPercent;
      increments = Math.floor(delta / 100 * steps) || 1;
      incrementSize = delta / increments;
    } else {
      toPercent = 100;
      increments = 1;
      incrementSize = 1;
    }

    var trackSegment = void 0;
    if (nextProperty && isSegmentAWait(prop, nextProperty)) {
      trackSegment = generateActorTrackWaitSegment(actor, start, prop, nextProperty, fromPercent, toPercent);

      if (previousSegmentWasOptimized) {
        trackSegment.shift();
      }

      previousSegmentWasOptimized = false;
    } else if (canOptimizeKeyframeProperty(prop)) {
      trackSegment = generateOptimizedKeyframeSegment(prop, fromPercent, toPercent);

      // If this and the previous segment are optimized, remove the
      // destination keyframe of the previous step.  The starting keyframe of
      // the newest segment makes it redundant.
      if (previousSegmentWasOptimized) {
        accumulator[accumulator.length - 1] = accumulator[accumulator.length - 1].split('\n')[0];
      }

      previousSegmentWasOptimized = true;
    } else {
      trackSegment = generateActorTrackSegment(actor, increments, incrementSize, start, fromPercent, prop);

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

  var trailingWait = simulateTrailingWait(actor, track, start, end);

  if (trailingWait) {
    accumulator.push(trailingWait);
  }

  return accumulator.join('\n');
};

/*!
 * @param {Actor} actor
 * @param {string} animName
 * @param {number} steps
 * @param {boolean} doCombineProperties
 * @param {Array.<string>=} vendors
 * @return {string}
 */
var generateBoilerplatedKeyframes = exports.generateBoilerplatedKeyframes = function generateBoilerplatedKeyframes(actor, animName, steps, doCombineProperties) {
  var vendors = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;
  return doCombineProperties ? applyVendorBoilerplates(generateCombinedActorKeyframes(actor, steps), animName, vendors) : actor.getTrackNames().map(function (trackName) {
    return applyVendorBoilerplates(generateActorKeyframes(actor, steps, trackName), animName + '-' + trackName, vendors);
  }).join('\n');
};

/*!
 * @param {Actor} actor
 * @param {string} animName
 * @param {string} prefix
 * @param {boolean} doCombineProperties
 * @return {string}
 */
var generateAnimationNameProperty = exports.generateAnimationNameProperty = function generateAnimationNameProperty(actor, animationName, prefix, doCombineProperties) {

  var renderedName = '  ' + prefix + 'animation-name:';

  if (doCombineProperties) {
    renderedName += ' ' + animationName + '-keyframes;';
  } else {
    var trackNames = actor.getTrackNames();

    var trackNamesToPrint = _lodash2.default.intersection(trackNames, transformFunctions).length ? _lodash2.default.difference(trackNames, transformFunctions).concat('transform') : trackNames;

    renderedName = trackNamesToPrint.reduce(function (renderedName, trackName) {
      return renderedName + ' ' + animationName + '-' + trackName + '-keyframes,';
    }, renderedName).replace(/.$/, ';');
  }

  return renderedName;
};

/*!
 * @param {Rekapi} rekapi
 * @param {string} prefix
 * @param {number|string=} iterations
 * @return {string}
 */
var generateAnimationIterationProperty = exports.generateAnimationIterationProperty = function generateAnimationIterationProperty(rekapi, prefix) {
  var iterations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
  return '  ' + prefix + 'animation-iteration-count: ' + (iterations !== undefined ? iterations : rekapi._timesToIterate === -1 ? 'infinite' : rekapi._timesToIterate) + ';';
};

/*!
 * @param {Actor} actor
 * @param {string} animName
 * @param {string} vendor
 * @param {boolean} doCombineProperties
 * @param {number|string=} iterations
 * @param {boolean=} isCentered
 * @return {string}
 */
var generateCSSAnimationProperties = exports.generateCSSAnimationProperties = function generateCSSAnimationProperties(actor, animName, vendor, doCombineProperties) {
  var iterations = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;
  var isCentered = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;

  var prefix = VENDOR_PREFIXES[vendor];
  var start = actor.getStart();
  var end = actor.getEnd();

  var generatedProperties = [generateAnimationNameProperty(actor, animName, prefix, doCombineProperties), '  ' + prefix + 'animation-duration: ' + (end - start) + 'ms;', '  ' + prefix + 'animation-delay: ' + start + 'ms;', '  ' + prefix + 'animation-fill-mode: forwards;', '  ' + prefix + 'animation-timing-function: linear;', generateAnimationIterationProperty(actor.rekapi, prefix, iterations)];

  if (isCentered) {
    generatedProperties.push('  ' + prefix + 'transform-origin: 0 0;');
  }

  return generatedProperties.join('\n');
};

/*!
 * @param {Actor} actor
 * @param {string} animName
 * @param {boolean} doCombineProperties
 * @param {Array.<string>=} vendors
 * @param {number|string=} iterations
 * @param {boolean=} isCentered
 * @return {string}
 */
var generateCSSClass = exports.generateCSSClass = function generateCSSClass(actor, animName, doCombineProperties) {
  var vendors = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ['w3'];
  var iterations = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;
  var isCentered = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : undefined;
  return '.' + animName + ' {\n' + vendors.map(function (vendor) {
    return generateCSSAnimationProperties(actor, animName, vendor, doCombineProperties, iterations, isCentered);
  }).join('\n') + '\n}';
};

/*!
 * @param {Actor} actor
 * @return {boolean}
 */
var canOptimizeAnyKeyframeProperties = exports.canOptimizeAnyKeyframeProperties = function canOptimizeAnyKeyframeProperties(actor) {
  return _lodash2.default.any(actor._keyframeProperties, canOptimizeKeyframeProperty) && !_lodash2.default.intersection(Object.keys(actor._propertyTracks), transformFunctions).length;
};

/*!
 * Creates the CSS `@keyframes` for an individual actor.
 * @param {Actor} actor
 * @param {Object=} options Same as options for Rekapi.prototype.toCSS.
 * @return {string}
 */
var getActorCSS = exports.getActorCSS = function getActorCSS(actor) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var name = options.name,
      vendors = options.vendors,
      iterations = options.iterations,
      isCentered = options.isCentered;


  var animName = name ? actor.rekapi.getActorCount() > 1 ? name + '-' + actor.id : name : getActorClassName(actor);

  var steps = Math.ceil(actor.rekapi.getAnimationLength() / 1000 * (options.fps || DEFAULT_FPS));

  var doCombineProperties = !canOptimizeAnyKeyframeProperties(actor);

  return [generateCSSClass(actor, animName, doCombineProperties, vendors, iterations, isCentered), generateBoilerplatedKeyframes(actor, animName, steps, doCombineProperties, vendors)].join('\n');
};

/**
 * {@link rekapi.DOMRenderer} allows you to animate DOM elements.  This is
 * achieved either by [CSS `@keyframe`
 * animations](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes), or
 * by per-frame inline style updates — keyframes are defined with the same API
 * in either case.  To render animations with the DOM, just supply any DOM
 * element to the {@link rekapi.Rekapi} constructor.  You may use
 * `document.body`, since it is generally always available:
 *
 *     const rekapi = new Rekapi(document.body);
 *
 *  To use this renderer's API, get a reference to the initialized object:
 *
 *     const domRenderer = rekapi.getRendererInstance(DOMRenderer);
 *
 * There are separate APIs for playing inline style animations and CSS
 * `@keyframe` animations.  For a detailed breakdown of how to choose between
 * these two APIs and use {@link rekapi.DOMRenderer} effectively, check out the
 * {@tutorial dom-rendering-in-depth} tutorial.
 *
 * __Note__: {@link rekapi.DOMRenderer} is added to {@link
 * rekapi.Rekapi#renderers} automatically, there is no reason to call the
 * constructor yourself in most cases.
 * @param {rekapi.Rekapi} rekapi The {@link rekapi.Rekapi} instance to render for.
 * @constructor rekapi.DOMRenderer
 * @extends {rekapi.renderer}
 */

var DOMRenderer = exports.DOMRenderer = function () {
  function DOMRenderer(rekapi) {
    var _this = this;

    _classCallCheck(this, DOMRenderer);

    Object.assign(this, {
      rekapi: rekapi,

      // @private {number}
      _playTimestamp: null,

      // @private {string}
      _cachedCSS: null,

      // The HTMLStyleElement that gets injected into the DOM.
      // @private {HTMLStyleElement)
      _styleElement: null,

      // @private {number}
      _stopSetTimeoutHandle: null
    });

    rekapi.on('timelineModified', function () {
      return _this._cachedCSS = null;
    });
    rekapi.on('addActor', onAddActor);
  }

  /**
   * @method rekapi.DOMRenderer#canAnimateWithCSS
   * @return {boolean} Whether or not the browser supports CSS `@keyframe`
   * animations.
   */


  _createClass(DOMRenderer, [{
    key: 'canAnimateWithCSS',
    value: function canAnimateWithCSS() {
      return !!vendorPrefix;
    }

    /**
     * Play the Rekapi animation as a CSS `@keyframe` animation.
     *
     * Note that this is not the same as {@link rekapi.Rekapi#play}.  That method
     * controls inline style animations, while this method controls CSS
     * `@keyframe` animations.
     * @method rekapi.DOMRenderer#play
     * @param {number} [iterations] How many times the animation should loop.
     * This can be `null` or `0` if you want to loop the animation endlessly but
     * also specify a value for `fps`.
     * @param {number} [fps] How many `@keyframes` to generate per second of the
     * animation.  A higher value results in a more precise CSS animation, but it
     * will take longer to generate.  The default value is `30`.  You should not
     * need to go higher than `60`.
     */

  }, {
    key: 'play',
    value: function play() {
      var iterations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
      var fps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      if (this.isPlaying()) {
        this.stop();
      }

      this._styleElement = injectStyle(this.rekapi, this._cachedCSS || this.prerender.apply(this, arguments));

      this._playTimestamp = now();

      if (iterations) {
        var animationLength = iterations * this.rekapi.getAnimationLength();
        this._stopSetTimeoutHandle = setTimeout(this.stop.bind(this, true), animationLength + INJECTED_STYLE_REMOVAL_BUFFER_MS);
      }

      (0, _rekapi.fireEvent)(this.rekapi, 'play');
    }

    /**
     * Stop a CSS `@keyframe` animation.  This also removes any `<style>`
     * elements that were dynamically injected into the DOM.
     *
     * Note that this is not the same as {@link rekapi.Rekapi#stop}.  That method
     * controls inline style animations, while this method controls CSS
     * `@keyframe` animations.
     * @method rekapi.DOMRenderer#stop
     * @param {boolean=} goToEnd If true, skip to the end of the animation.  If
     * false or omitted, set inline styles on the {@link rekapi.Actor} elements
     * to keep them in their current position.
     */

  }, {
    key: 'stop',
    value: function stop() {
      var goToEnd = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      if (this.isPlaying()) {
        clearTimeout(this._stopSetTimeoutHandle);

        // Forces a style update in WebKit/Presto
        this._styleElement.innerHTML = '';

        document.head.removeChild(this._styleElement);
        this._styleElement = null;
        var animationLength = this.rekapi.getAnimationLength();

        this.rekapi.update(goToEnd ? animationLength : (now() - this._playTimestamp) % animationLength);

        (0, _rekapi.fireEvent)(this.rekapi, 'stop');
      }
    }

    /**
     * @method rekapi.DOMRenderer#isPlaying
     * @return {boolean} Whether or not a CSS `@keyframe` animation is running.
     */

  }, {
    key: 'isPlaying',
    value: function isPlaying() {
      return !!this._styleElement;
    }

    /**
     * Prerender and cache the CSS animation so that it is immediately ready to
     * be used when it is needed in the future.  The function signature is
     * identical to {@link rekapi.DOMRenderer#play}.  This
     * is necessary to play a CSS animation and will be automatically called for
     * you if you don't call it manually, but calling it ahead of time (such as
     * on page load) will prevent any perceived lag when a CSS `@keyframe`
     * animation is started.  The prerendered animation is cached for reuse until
     * the timeline or a keyframe is modified.
     *
     * @method rekapi.DOMRenderer#prerender
     * @param {number=} iterations How many times the animation should loop.
     * This can be `null` or `0` if you want to loop the animation endlessly but
     * also specify a value for `fps`.
     * @param {number=} fps How many `@keyframes` to generate per second of
     * the animation.  A higher value results in a more precise CSS animation,
     * but it will take longer to generate.  The default value is `30`.  You
     * should not need to go higher than `60`.
     * @return {string} The prerendered CSS string.  You likely won't need this,
     * as it is also cached internally.
     */

  }, {
    key: 'prerender',
    value: function prerender() {
      var iterations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
      var fps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      return this._cachedCSS = this.getCss({
        vendors: [vendorPrefix],
        fps: fps,
        iterations: iterations
      });
    }

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
     * properties supplied to {@link rekapi.Actor#keyframe} (as shown above) into
     * a single string when it renders each frame.  This method lets you change
     * that order from the default.
     *
     * However, if you prefer a more standards-oriented approach, Rekapi also
     * supports combining the transform components yourself, obviating the need
     * for {@link rekapi.DOMRenderer#setActorTransformOrder} entirely:
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
     * @method rekapi.DOMRenderer#setActorTransformOrder
     * @param {rekapi.Actor} actor The {@link rekapi.Actor} to apply the new
     * transform order to.
     * @param {Array.<string>} orderedTransforms The array of transform names.
     * The supported array values (and default order) are:
     *
     * - `translateX`
     * - `translateY`
     * - `translateZ`
     * - `scale`
     * - `scaleX`
     * - `scaleY`
     * - `perspective`
     * - `rotate`
     * - `rotateX`
     * - `rotateY`
     * - `rotateZ`
     * - `skewX`
     * - `skewY`
     * @return {rekapi.Rekapi}
     */

  }, {
    key: 'setActorTransformOrder',
    value: function setActorTransformOrder(actor, orderedTransforms) {
      var unrecognizedTransforms = _lodash2.default.reject(orderedTransforms, isTransformFunction);

      if (unrecognizedTransforms.length) {
        throw 'Unknown or unsupported transform functions: ' + unrecognizedTransforms.join(', ');
      }

      // Ignore duplicate transform function names in the array
      actor._transformOrder = _lodash2.default.uniq(orderedTransforms);

      return this.rekapi;
    }

    /**
     * Convert the animation to CSS `@keyframes`.
     * @method rekapi.DOMRenderer#getCss
     * @param {Object} [options={}]
     * @param {Array.<string>} [options.vendors=['w3']] The browser vendors you
     * want to support. Valid values are:
     *   * `'microsoft'`
     *   * `'mozilla'`
     *   * `'opera'`
     *   * `'w3'`
     *   * `'webkit'`
     *
     *
     * @param {number} [options.fps=30]  Defines the number of CSS `@keyframe` frames
     * rendered per second of an animation.  CSS `@keyframes` are comprised of a
     * series of explicitly defined steps, and more steps will allow for a more
     * complex animation.  More steps will also result in a larger CSS string,
     * and more time needed to generate the string.
     * @param {string} [options.name] Define a custom name for your animation.
     * This becomes the class name targeted by the generated CSS.
     * @param {boolean} [options.isCentered] If `true`, the generated CSS will
     * contain `transform-origin: 0 0;`, which centers the DOM element along the
     * path of motion.  If `false` or omitted, no `transform-origin` rule is
     * specified and the element is aligned to the path of motion by its top-left
     * corner.
     * @param {number} [options.iterations] How many times the generated
     * animation should repeat.  If omitted, the animation will loop
     * indefinitely.
     * @return {string}
     */

  }, {
    key: 'getCss',
    value: function getCss() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var animationCSS = [];

      _lodash2.default.each(this.rekapi.getAllActors(), function (actor) {
        if (actor.context.nodeType === 1) {
          animationCSS.push(getActorCSS(actor, options));
        }
      });

      return animationCSS.join('\n');
    }
  }]);

  return DOMRenderer;
}();

/*!
 * @param {Rekapi} rekapi
 */


_rekapi.rendererBootstrappers.push(function (rekapi) {
  return (
    // Node.nodeType 1 is an ELEMENT_NODE.
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeType
    rekapi.context.nodeType === 1 && new DOMRenderer(rekapi)
  );
});

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _rekapi = __webpack_require__(0);

Object.defineProperty(exports, 'Rekapi', {
  enumerable: true,
  get: function get() {
    return _rekapi.Rekapi;
  }
});

var _actor = __webpack_require__(4);

Object.defineProperty(exports, 'Actor', {
  enumerable: true,
  get: function get() {
    return _actor.Actor;
  }
});

var _keyframeProperty = __webpack_require__(5);

Object.defineProperty(exports, 'KeyframeProperty', {
  enumerable: true,
  get: function get() {
    return _keyframeProperty.KeyframeProperty;
  }
});

var _canvas = __webpack_require__(8);

Object.defineProperty(exports, 'CanvasRenderer', {
  enumerable: true,
  get: function get() {
    return _canvas.CanvasRenderer;
  }
});

var _dom = __webpack_require__(9);

Object.defineProperty(exports, 'DOMRenderer', {
  enumerable: true,
  get: function get() {
    return _dom.DOMRenderer;
  }
});

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/


/* eslint-disable no-unused-vars */

var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
/*!
 * All equations are adapted from Thomas Fuchs'
 * [Scripty2](https://github.com/madrobby/scripty2/blob/master/src/effects/transitions/penner.js).
 *
 * Based on Easing Equations (c) 2003 [Robert
 * Penner](http://www.robertpenner.com/), all rights reserved. This work is
 * [subject to terms](http://www.robertpenner.com/easing_terms_of_use.html).
 */

/*!
 *  TERMS OF USE - EASING EQUATIONS
 *  Open source under the BSD License.
 *  Easing Equations (c) 2003 Robert Penner, all rights reserved.
 */
var linear = exports.linear = function linear(pos) {
  return pos;
};

var easeInQuad = exports.easeInQuad = function easeInQuad(pos) {
  return Math.pow(pos, 2);
};

var easeOutQuad = exports.easeOutQuad = function easeOutQuad(pos) {
  return -(Math.pow(pos - 1, 2) - 1);
};

var easeInOutQuad = exports.easeInOutQuad = function easeInOutQuad(pos) {
  return (pos /= 0.5) < 1 ? 0.5 * Math.pow(pos, 2) : -0.5 * ((pos -= 2) * pos - 2);
};

var easeInCubic = exports.easeInCubic = function easeInCubic(pos) {
  return Math.pow(pos, 3);
};

var easeOutCubic = exports.easeOutCubic = function easeOutCubic(pos) {
  return Math.pow(pos - 1, 3) + 1;
};

var easeInOutCubic = exports.easeInOutCubic = function easeInOutCubic(pos) {
  return (pos /= 0.5) < 1 ? 0.5 * Math.pow(pos, 3) : 0.5 * (Math.pow(pos - 2, 3) + 2);
};

var easeInQuart = exports.easeInQuart = function easeInQuart(pos) {
  return Math.pow(pos, 4);
};

var easeOutQuart = exports.easeOutQuart = function easeOutQuart(pos) {
  return -(Math.pow(pos - 1, 4) - 1);
};

var easeInOutQuart = exports.easeInOutQuart = function easeInOutQuart(pos) {
  return (pos /= 0.5) < 1 ? 0.5 * Math.pow(pos, 4) : -0.5 * ((pos -= 2) * Math.pow(pos, 3) - 2);
};

var easeInQuint = exports.easeInQuint = function easeInQuint(pos) {
  return Math.pow(pos, 5);
};

var easeOutQuint = exports.easeOutQuint = function easeOutQuint(pos) {
  return Math.pow(pos - 1, 5) + 1;
};

var easeInOutQuint = exports.easeInOutQuint = function easeInOutQuint(pos) {
  return (pos /= 0.5) < 1 ? 0.5 * Math.pow(pos, 5) : 0.5 * (Math.pow(pos - 2, 5) + 2);
};

var easeInSine = exports.easeInSine = function easeInSine(pos) {
  return -Math.cos(pos * (Math.PI / 2)) + 1;
};

var easeOutSine = exports.easeOutSine = function easeOutSine(pos) {
  return Math.sin(pos * (Math.PI / 2));
};

var easeInOutSine = exports.easeInOutSine = function easeInOutSine(pos) {
  return -0.5 * (Math.cos(Math.PI * pos) - 1);
};

var easeInExpo = exports.easeInExpo = function easeInExpo(pos) {
  return pos === 0 ? 0 : Math.pow(2, 10 * (pos - 1));
};

var easeOutExpo = exports.easeOutExpo = function easeOutExpo(pos) {
  return pos === 1 ? 1 : -Math.pow(2, -10 * pos) + 1;
};

var easeInOutExpo = exports.easeInOutExpo = function easeInOutExpo(pos) {
  if (pos === 0) {
    return 0;
  }

  if (pos === 1) {
    return 1;
  }

  if ((pos /= 0.5) < 1) {
    return 0.5 * Math.pow(2, 10 * (pos - 1));
  }

  return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
};

var easeInCirc = exports.easeInCirc = function easeInCirc(pos) {
  return -(Math.sqrt(1 - pos * pos) - 1);
};

var easeOutCirc = exports.easeOutCirc = function easeOutCirc(pos) {
  return Math.sqrt(1 - Math.pow(pos - 1, 2));
};

var easeInOutCirc = exports.easeInOutCirc = function easeInOutCirc(pos) {
  return (pos /= 0.5) < 1 ? -0.5 * (Math.sqrt(1 - pos * pos) - 1) : 0.5 * (Math.sqrt(1 - (pos -= 2) * pos) + 1);
};

var easeOutBounce = exports.easeOutBounce = function easeOutBounce(pos) {
  if (pos < 1 / 2.75) {
    return 7.5625 * pos * pos;
  } else if (pos < 2 / 2.75) {
    return 7.5625 * (pos -= 1.5 / 2.75) * pos + 0.75;
  } else if (pos < 2.5 / 2.75) {
    return 7.5625 * (pos -= 2.25 / 2.75) * pos + 0.9375;
  } else {
    return 7.5625 * (pos -= 2.625 / 2.75) * pos + 0.984375;
  }
};

var easeInBack = exports.easeInBack = function easeInBack(pos) {
  var s = 1.70158;
  return pos * pos * ((s + 1) * pos - s);
};

var easeOutBack = exports.easeOutBack = function easeOutBack(pos) {
  var s = 1.70158;
  return (pos = pos - 1) * pos * ((s + 1) * pos + s) + 1;
};

var easeInOutBack = exports.easeInOutBack = function easeInOutBack(pos) {
  var s = 1.70158;
  if ((pos /= 0.5) < 1) {
    return 0.5 * (pos * pos * (((s *= 1.525) + 1) * pos - s));
  }
  return 0.5 * ((pos -= 2) * pos * (((s *= 1.525) + 1) * pos + s) + 2);
};

var elastic = exports.elastic = function elastic(pos) {
  return -1 * Math.pow(4, -8 * pos) * Math.sin((pos * 6 - 1) * (2 * Math.PI) / 2) + 1;
};

var swingFromTo = exports.swingFromTo = function swingFromTo(pos) {
  var s = 1.70158;
  return (pos /= 0.5) < 1 ? 0.5 * (pos * pos * (((s *= 1.525) + 1) * pos - s)) : 0.5 * ((pos -= 2) * pos * (((s *= 1.525) + 1) * pos + s) + 2);
};

var swingFrom = exports.swingFrom = function swingFrom(pos) {
  var s = 1.70158;
  return pos * pos * ((s + 1) * pos - s);
};

var swingTo = exports.swingTo = function swingTo(pos) {
  var s = 1.70158;
  return (pos -= 1) * pos * ((s + 1) * pos + s) + 1;
};

var bounce = exports.bounce = function bounce(pos) {
  if (pos < 1 / 2.75) {
    return 7.5625 * pos * pos;
  } else if (pos < 2 / 2.75) {
    return 7.5625 * (pos -= 1.5 / 2.75) * pos + 0.75;
  } else if (pos < 2.5 / 2.75) {
    return 7.5625 * (pos -= 2.25 / 2.75) * pos + 0.9375;
  } else {
    return 7.5625 * (pos -= 2.625 / 2.75) * pos + 0.984375;
  }
};

var bouncePast = exports.bouncePast = function bouncePast(pos) {
  if (pos < 1 / 2.75) {
    return 7.5625 * pos * pos;
  } else if (pos < 2 / 2.75) {
    return 2 - (7.5625 * (pos -= 1.5 / 2.75) * pos + 0.75);
  } else if (pos < 2.5 / 2.75) {
    return 2 - (7.5625 * (pos -= 2.25 / 2.75) * pos + 0.9375);
  } else {
    return 2 - (7.5625 * (pos -= 2.625 / 2.75) * pos + 0.984375);
  }
};

var easeFromTo = exports.easeFromTo = function easeFromTo(pos) {
  return (pos /= 0.5) < 1 ? 0.5 * Math.pow(pos, 4) : -0.5 * ((pos -= 2) * Math.pow(pos, 3) - 2);
};

var easeFrom = exports.easeFrom = function easeFrom(pos) {
  return Math.pow(pos, 4);
};

var easeTo = exports.easeTo = function easeTo(pos) {
  return Math.pow(pos, 0.25);
};

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tweenable = exports.composeEasingObject = exports.tweenProps = exports.clone = exports.each = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.tween = tween;

var _easingFunctions = __webpack_require__(12);

var easingFunctions = _interopRequireWildcard(_easingFunctions);

var _objectAssign = __webpack_require__(11);

var _objectAssign2 = _interopRequireDefault(_objectAssign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// CONSTANTS
var DEFAULT_EASING = 'linear';
var DEFAULT_DURATION = 500;
var UPDATE_TIME = 1000 / 60;
var root = typeof window !== 'undefined' ? window : global;

// requestAnimationFrame() shim by Paul Irish (modified for Shifty)
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
var DEFAULT_SCHEDULE_FUNCTION = root.requestAnimationFrame || root.webkitRequestAnimationFrame || root.oRequestAnimationFrame || root.msRequestAnimationFrame || root.mozCancelRequestAnimationFrame && root.mozRequestAnimationFrame || setTimeout;

var noop = function noop() {};

/**
 * Handy shortcut for doing a for-in loop. This is not a "normal" each
 * function, it is optimized for Shifty.  The iterator function only receives
 * the property name, not the value.
 * @param {Object} obj
 * @param {Function(string)} fn
 * @private
 */
var each = exports.each = function each(obj, fn) {
  Object.keys(obj).forEach(fn);
};

/**
 * @param {Object} obj
 * @return {Object}
 * @private
 */
var clone = exports.clone = function clone(obj) {
  return (0, _objectAssign2.default)({}, obj);
};

/**
 * This object contains all of the tweens available to Shifty.  It is
 * extensible - simply attach properties to the `Tweenable.formulas`
 * Object following the same format as `linear`.
 *
 * `pos` should be a normalized `number` (between 0 and 1).
 * @type {Object(function)}
 * @private
 */
var formulas = clone(easingFunctions);

/**
 * Tweens a single property.
 * @param {number} start The value that the tween started from.
 * @param {number} end The value that the tween should end at.
 * @param {Function} easingFunc The easing curve to apply to the tween.
 * @param {number} position The normalized position (between 0.0 and 1.0) to
 * calculate the midpoint of 'start' and 'end' against.
 * @return {number} The tweened value.
 * @private
 */
var tweenProp = function tweenProp(start, end, easingFunc, position) {
  return start + (end - start) * easingFunc(position);
};

/**
 * Calculates the interpolated tween values of an Object for a given
 * timestamp.
 * @param {Number} forPosition The position to compute the state for.
 * @param {Object} currentState Current state properties.
 * @param {Object} originalState: The original state properties the Object is
 * tweening from.
 * @param {Object} targetState: The destination state properties the Object
 * is tweening to.
 * @param {number} duration: The length of the tween in milliseconds.
 * @param {number} timestamp: The UNIX epoch time at which the tween began.
 * @param {Object} easing: This Object's keys must correspond to the keys in
 * targetState.
 * @private
 */
var tweenProps = exports.tweenProps = function tweenProps(forPosition, currentState, originalState, targetState, duration, timestamp, easing) {
  var normalizedPosition = forPosition < timestamp ? 0 : (forPosition - timestamp) / duration;

  each(currentState, function (key) {
    var easingObjectProp = easing[key];
    var easingFn = typeof easingObjectProp === 'function' ? easingObjectProp : formulas[easingObjectProp];

    currentState[key] = tweenProp(originalState[key], targetState[key], easingFn, normalizedPosition);
  });

  return currentState;
};

/**
 * Creates a usable easing Object from a string, a function or another easing
 * Object.  If `easing` is an Object, then this function clones it and fills
 * in the missing properties with `"linear"`.
 * @param {Object.<string|Function>} fromTweenParams
 * @param {Object|string|Function} easing
 * @return {Object.<string|Function>}
 * @private
 */
var composeEasingObject = exports.composeEasingObject = function composeEasingObject(fromTweenParams) {
  var easing = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_EASING;

  var composedEasing = {};
  var typeofEasing = typeof easing === 'undefined' ? 'undefined' : _typeof(easing);

  if (typeofEasing === 'string' || typeofEasing === 'function') {
    each(fromTweenParams, function (prop) {
      return composedEasing[prop] = easing;
    });
  } else {
    each(fromTweenParams, function (prop) {
      return composedEasing[prop] = composedEasing[prop] || easing[prop] || DEFAULT_EASING;
    });
  }

  return composedEasing;
};

var Tweenable = exports.Tweenable = function () {
  /**
   * @constructs shifty.Tweenable
   * @param {Object=} initialState The values that the initial tween should
   * start at if a `from` object is not provided to `tween` or `setConfig`.
   * @param {Object=} config Configuration object to be passed to
   * [`setConfig`]{@link shifty.Tweenable#setConfig}.
   */
  function Tweenable() {
    var initialState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

    _classCallCheck(this, Tweenable);

    this._currentState = initialState;
    this._configured = false;
    this._scheduleFunction = DEFAULT_SCHEDULE_FUNCTION;

    // To prevent unnecessary calls to setConfig do not set default
    // configuration here.  Only set default configuration immediately before
    // tweening if none has been set.
    if (config !== undefined) {
      this.setConfig(config);
    }
  }

  /**
   * Applies a filter to Tweenable instance.
   * @param {Tweenable} tweenable The `Tweenable` instance to call the filter
   * upon.
   * @param {String} filterName The name of the filter to apply.
   * @private
   */


  _createClass(Tweenable, [{
    key: '_applyFilter',
    value: function _applyFilter(filterName) {
      var _this = this;

      var filters = Tweenable.filters;
      var args = this._filterArgs;

      each(filters, function (name) {
        var filter = filters[name][filterName];

        if (typeof filter !== 'undefined') {
          filter.apply(_this, args);
        }
      });
    }

    /**
     * Handles the update logic for one step of a tween.
     * @param {number=} currentTimeOverride Needed for accurate timestamp in
     * shifty.Tweenable#seek.
     * @private
     */

  }, {
    key: '_timeoutHandler',
    value: function _timeoutHandler(currentTimeOverride) {
      var _this2 = this,
          _arguments = arguments;

      var delay = this._delay;
      var currentState = this._currentState;
      var timestamp = this._timestamp;
      var duration = this._duration;
      var targetState = this._targetState;
      var step = this._step;

      var endTime = timestamp + delay + duration;
      var currentTime = Math.min(currentTimeOverride || Tweenable.now(), endTime);
      var hasEnded = currentTime >= endTime;
      var offset = duration - (endTime - currentTime);

      if (this.isPlaying()) {
        if (hasEnded) {
          step(targetState, this._attachment, offset);
          this.stop(true);
        } else {
          // This function needs to be .call-ed because it is a native method in
          // some environments:
          // http://stackoverflow.com/a/9678166
          this._scheduleId = this._scheduleFunction.call(root, function () {
            return _this2._timeoutHandler.apply(_this2, _arguments);
          }, UPDATE_TIME);

          this._applyFilter('beforeTween');

          // If the animation has not yet reached the start point (e.g., there was
          // delay that has not yet completed), just interpolate the starting
          // position of the tween.
          if (currentTime < timestamp + delay) {
            currentTime = 1;
            duration = 1;
            timestamp = 1;
          } else {
            timestamp += delay;
          }

          tweenProps(currentTime, currentState, this._originalState, targetState, duration, timestamp, this._easing);

          this._applyFilter('afterTween');
          step(currentState, this._attachment, offset);
        }
      }
    }

    /**
     * Configure and start a tween.
     * @method shifty.Tweenable#tween
     * @param {Object=} config See `config` options for `{@link
     * shifty.Tweenable#setConfig}`
     * @return {Promise}
     */

  }, {
    key: 'tween',
    value: function tween() {
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      if (this._isTweening) {
        return this;
      }

      // Only set default config if no configuration has been set previously and
      // none is provided now.
      if (config !== undefined || !this._configured) {
        this.setConfig(config);
      }

      this._timestamp = Tweenable.now();
      this._start(this.get(), this._attachment);
      return this.resume();
    }

    /**
     * Configure a tween that will start at some point in the future.
     *
     * @method shifty.Tweenable#setConfig
     * @param {Object} config See below
     * @property {Object=} config.from Starting position.  If omitted, `{@link
     * shifty.Tweenable#get}` is used.
     * @property {Object=} config.to Ending position.
     * @property {number=} config.duration How many milliseconds to animate for.
     * @property {number=} config.delay  How many milliseconds to wait before
     * starting
     * the tween.
     * @property {Function(Object, *)=} config.start Function to execute when the
     * tween begins.  Receives the state of the tween as the first parameter and
     * `attachment` as the second parameter.
     * @property {Function(Object, *, number)=} config.step Function to execute
     * on every tick.  Receives `get` as the first parameter, `attachment` as the
     * second parameter, and the time elapsed since the start of the tween as the
     * third.  This function is not called on the final step of the animation.
     * @property {Object.<string|Function|string|Function>=} config.easing Easing
     * curve name(s) or function(s) to use for the tween.
     * @property {*=} config.attachment Cached value that is passed to the
     * `step`/`start` functions.
     * @property {Function} config.promise Promise constructor for when you want
     * to use Promise library or polyfill Promises in unsupported environments.
     * @return {Tweenable}
     */

  }, {
    key: 'setConfig',
    value: function setConfig() {
      var _this3 = this;

      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this._configured = true;

      // Attach something to this Tweenable instance (e.g.: a DOM element, an
      // object, a string, etc.);
      this._attachment = config.attachment;

      // Init the internal state
      (0, _objectAssign2.default)(this, {
        _pausedAtTime: null,
        _scheduleId: null,
        _delay: config.delay || 0,
        _start: config.start || noop,
        _step: config.step || noop,
        _duration: config.duration || DEFAULT_DURATION,
        _currentState: clone(config.from || this.get())
      });

      // Separate Object.assign here; it depends on _currentState being set above
      (0, _objectAssign2.default)(this, {
        _originalState: this.get(),
        _targetState: clone(config.to || this.get())
      });

      var currentState = this._currentState;
      // Ensure that there is always something to tween to.
      this._targetState = (0, _objectAssign2.default)({}, currentState, this._targetState);

      this._easing = composeEasingObject(currentState, config.easing);
      this._filterArgs = [currentState, this._originalState, this._targetState, this._easing];
      this._applyFilter('tweenCreated');

      var Promised = config.promise || Promise;
      this._promise = new Promised(function (resolve, reject) {
        _this3._resolve = resolve;
        _this3._reject = reject;
      });

      // Needed to silence (harmless) logged errors when a .catch handler is not
      // added by downsteam code
      this._promise.catch(noop);

      return this;
    }

    /**
     * @method shifty.Tweenable#get
     * @return {Object} The current state.
     */

  }, {
    key: 'get',
    value: function get() {
      return clone(this._currentState);
    }

    /**
     * @method shifty.Tweenable#set
     * @param {Object} state The state to set.
     * @description Set the current state.
     */

  }, {
    key: 'set',
    value: function set(state) {
      this._currentState = state;
    }

    /**
     * Pause a tween.  Paused tweens can be resumed from the point at which they
     * were paused.  This is different from `stop`, as that method causes a tween
     * to start over when it is resumed.
     * @method shifty.Tweenable#pause
     * @return {Tweenable}
     */

  }, {
    key: 'pause',
    value: function pause() {
      this._pausedAtTime = Tweenable.now();
      this._isPaused = true;

      return this;
    }

    /**
     * Resume a paused tween.
     * @method shifty.Tweenable#resume
     * @return {Promise}
     */

  }, {
    key: 'resume',
    value: function resume() {
      if (this._isPaused) {
        this._timestamp += Tweenable.now() - this._pausedAtTime;
      }

      this._isPaused = false;
      this._isTweening = true;
      this._timeoutHandler();

      return this._promise;
    }

    /**
     * Move the state of the animation to a specific point in the tween's
     * timeline.  If the animation is not running, this will cause the `step`
     * handlers to be called.
     * @method shifty.Tweenable#seek
     * @param {millisecond} millisecond The millisecond of the animation to seek
     * to.  This must not be less than `0`.
     * @return {Tweenable}
     */

  }, {
    key: 'seek',
    value: function seek(millisecond) {
      millisecond = Math.max(millisecond, 0);
      var currentTime = Tweenable.now();

      if (this._timestamp + millisecond === 0) {
        return this;
      }

      this._timestamp = currentTime - millisecond;

      if (!this.isPlaying()) {
        this._isTweening = true;
        this._isPaused = false;

        // If the animation is not running, call _timeoutHandler to make sure that
        // any step handlers are run.
        this._timeoutHandler(currentTime);

        this.pause();
      }

      return this;
    }

    /**
     * Stops and cancels a tween.
     * @param {boolean=} gotoEnd If `false` or omitted, the tween just stops at
     * its current state, and the tween promise is not resolved.  If `true`, the
     * tweened object's values are instantly set to the target values, and the
     * promise is resolved.
     * @method shifty.Tweenable#stop
     * @return {Tweenable}
     */

  }, {
    key: 'stop',
    value: function stop(gotoEnd) {
      this._isTweening = false;
      this._isPaused = false;

      (root.cancelAnimationFrame || root.webkitCancelAnimationFrame || root.oCancelAnimationFrame || root.msCancelAnimationFrame || root.mozCancelRequestAnimationFrame || root.clearTimeout)(this._scheduleId);

      if (gotoEnd) {
        this._applyFilter('beforeTween');
        tweenProps(1, this._currentState, this._originalState, this._targetState, 1, 0, this._easing);
        this._applyFilter('afterTween');
        this._applyFilter('afterTweenEnd');
        this._resolve(this._currentState, this._attachment);
      } else {
        this._reject(this._currentState, this._attachment);
      }

      return this;
    }

    /**
     * Whether or not a tween is running.
     * @method shifty.Tweenable#isPlaying
     * @return {boolean}
     */

  }, {
    key: 'isPlaying',
    value: function isPlaying() {
      return this._isTweening && !this._isPaused;
    }

    /**
     * Set a custom schedule function.
     *
     * If a custom function is not set,
     * [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame)
     * is used if available, otherwise
     * [`setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout)
     * is used.
     * @method shifty.Tweenable#setScheduleFunction
     * @param {Function(Function,number)} scheduleFunction The function to be
     * used to schedule the next frame to be rendered.
     */

  }, {
    key: 'setScheduleFunction',
    value: function setScheduleFunction(scheduleFunction) {
      this._scheduleFunction = scheduleFunction;
    }

    /**
     * `delete` all "own" properties.  Call this when the `Tweenable` instance
     * is no longer needed to free memory.
     * @method shifty.Tweenable#dispose
     */

  }, {
    key: 'dispose',
    value: function dispose() {
      var _this4 = this;

      each(this, function (prop) {
        return delete _this4[prop];
      });
    }
  }]);

  return Tweenable;
}();

(0, _objectAssign2.default)(Tweenable, {
  /**
   * @memberof shifty.Tweenable
   * @type {Object.<Function(number)>}
   * @static
   * @description A static Object of easing functions that can by used by
   * Shifty.
   */
  formulas: formulas,
  filters: {},

  /**
   * @memberof shifty.Tweenable
   * @function
   * @static
   * @description Returns the current timestamp
   * @returns {number}
   */
  now: Date.now || function (_) {
    return +new Date();
  }
});

/**
 * @method shifty.tween
 * @param {Object=} config See `config` options for `{@link
 * shifty.Tweenable#setConfig}`
 * @description Standalone convenience method that functions identically to
 * [`shifty.Tweenable#tween`]{@link shifty.Tweenable#tween}.  You can use this to create
 * tweens without needing to set up a `{@link shifty.Tweenable}` instance.
 *
 *     import { tween } from 'shifty';
 *
 *     tween({ from: { x: 0 }, to: { x: 10 } }).then(
 *       () => console.log('All done!')
 *     );
 *
 * @returns {Promise}
 */
function tween() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var tweenable = new Tweenable();
  var promise = tweenable.tween(config);
  promise.tweenable = tweenable;

  return promise;
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ })
/******/ ]);
});
//# sourceMappingURL=rekapi.js.map