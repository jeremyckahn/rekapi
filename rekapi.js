/*! 2.0.3 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("lodash"), require("shifty"));
	else if(typeof define === 'function' && define.amd)
		define("rekapi", ["lodash", "shifty"], factory);
	else if(typeof exports === 'object')
		exports["rekapi"] = factory(require("lodash"), require("shifty"));
	else
		root["rekapi"] = factory(root["lodash"], root["shifty"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_2__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
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

var _actor = __webpack_require__(3);

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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)))

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }),
/* 3 */
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

var _keyframeProperty = __webpack_require__(4);

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

  var props = _lodash2.default.values(actor._keyframeProperties).sort(function (a, b) {
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

      _lodash2.default.each(state, function (value, name) {
        return _this2.addKeyframeProperty(new _keyframeProperty.KeyframeProperty(millisecond, name, value, typeof easing === 'string' ? easing : easing[name] || _rekapi.DEFAULT_EASING));
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
/* 4 */
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
/* 5 */
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
/* 6 */
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
  if (typeof document === 'undefined') {
    return;
  }

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
/* 7 */
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
/* 8 */
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

var _actor = __webpack_require__(3);

Object.defineProperty(exports, 'Actor', {
  enumerable: true,
  get: function get() {
    return _actor.Actor;
  }
});

var _keyframeProperty = __webpack_require__(4);

Object.defineProperty(exports, 'KeyframeProperty', {
  enumerable: true,
  get: function get() {
    return _keyframeProperty.KeyframeProperty;
  }
});

var _canvas = __webpack_require__(5);

Object.defineProperty(exports, 'CanvasRenderer', {
  enumerable: true,
  get: function get() {
    return _canvas.CanvasRenderer;
  }
});

var _dom = __webpack_require__(6);

Object.defineProperty(exports, 'DOMRenderer', {
  enumerable: true,
  get: function get() {
    return _dom.DOMRenderer;
  }
});

/***/ })
/******/ ]);
});
//# sourceMappingURL=rekapi.js.map