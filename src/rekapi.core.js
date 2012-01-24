;(function rekapiCore (global) {

  if (!_) {
    throw 'underscore.js is required for Kapi.';
  }

  if (!Tweenable) {
    throw 'shifty.js is required for Kapi.';
  }


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
   * Determines which iteration of the loop the animation is currently in.
   * @param {Kapi} kapi
   * @param {number} timeSinceStart
   */
  function determineCurrentLoopIteration (kapi, timeSinceStart) {
    var currentIteration;

    currentIteration = Math.floor((timeSinceStart) / kapi._animationLength);
    return currentIteration;
  }


  /**
   * Calculate how many milliseconds since the animation began.
   * @param {Kapi} kapi
   * @return {number}
   */
  function calculateTimeSinceStart (kapi) {
    var timeSinceStart;

    timeSinceStart = now() - kapi._loopTimestamp;
    return timeSinceStart;
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
      fireEvent(kapi, 'onAnimationComplete');
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
   * Calculate the position and state for a given millisecond and render it.
   * Also updates the state internally and accounts for how many loop
   * iterations the animation runs for.
   * @param {Kapi} kapi
   * @param {number} forMillisecond The millisecond to render
   */
  function renderMillisecond (kapi, forMillisecond) {
    var currentIteration
        ,loopPosition;

    currentIteration = determineCurrentLoopIteration(kapi, forMillisecond);
    loopPosition = calculateLoopPosition(kapi, forMillisecond,
        currentIteration);
    updatePlayState(kapi, currentIteration);
    kapi.render(loopPosition);
  }


  /**
   * Calculate how far in the animation loop `kapi` is, in milliseconds, and
   * render based on that time.
   * @param {Kapi} kapi
   */
  function renderCurrentMillisecond (kapi) {
    renderMillisecond(kapi, calculateTimeSinceStart(kapi));
  }


  /**
   * This is the heartbeat of an animation.  Renders a frame and then calls
   * itself based on the framerate of the supplied Kapi.
   * @param {Kapi} kapi
   */
  function tick (kapi) {
    kapi._loopId = setTimeout(function () {
      // First, schedule the next update.  renderCurrentMillisecond can cancel
      // the update if necessary.
      tick(kapi);
      renderCurrentMillisecond(kapi);
    }, 1000 / kapi.config.fps);
  }


  /**
   * Fire an event bound to a Kapi.
   * @param {Kapi} kapi
   * @param {string} eventName
   */
  function fireEvent (kapi, eventName) {
    _.each(kapi._events[eventName], function (handler) {
      handler(kapi);
    });
  }


  /**
   * Does nothing.  Absolutely nothing at all.
   */
  function noop () {
    // NOOP!
  }


  var defaultConfig = {
    'fps': 30
    ,'height': 150
    ,'width': 300
  };

  var playState = {
    'STOPPED': 'stopped'
    ,'PAUSED': 'paused'
    ,'PLAYING': 'playing'
  };

  var now = Tweenable.util.now;

  /**
   * @param {HTMLCanvas} canvas
   * @param {Object} opt_config
   * @constructor
   */
  var gk = global.Kapi || function Kapi (canvas, opt_config) {
    this.canvas = canvas;
    this._contextType = null;
    this.canvas_setContext(canvas);
    this.config = {};
    this._actors = {};
    this._drawOrder = [];
    this._playState = playState.STOPPED;
    this._drawOrderSorter = null;

    this._events = {
      'onFrameRender': []
      ,'onAnimationComplete': []
      ,'onPlayStateChange': []
      ,'onPlay': []
      ,'onPause': []
      ,'onStop': []
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

    // The last millisecond position that was drawn
    this._lastRenderedMillisecond = 0;

    _.extend(this.config, opt_config);
    _.defaults(this.config, defaultConfig);

    // Apply the height and width if they were passed in the`config` Object.
    // Also delete them from the internal config - we won't need them anymore.
    _.each(['height', 'width'], function (dimension) {
      if (this.config[dimension]) {
        this['canvas_' + dimension](this.config[dimension]);
        delete this.config[dimension];
      }
    }, this);

    return this;
  };


  /**
   * @param {Kapi.Actor} actor
   * @return {Kapi}
   */
  gk.prototype.addActor = function (actor) {
    // You can't add an actor more than once.
    if (!_.contains(this._actors, actor)) {
      actor.kapi = this;
      actor.fps = this.framerate();
      this._actors[actor.id] = actor;
      this._drawOrder.push(actor.id);
      actor.setup();
    }

    return this;
  };


  /**
   * @param {number} actorId
   * @return {Kapi.Actor}
   */
  gk.prototype.getActor = function (actorId) {
    return this._actors[actorId];
  };


  /**
   * @returns {Array}
   */
  gk.prototype.getActorIds = function () {
    return _.pluck(this._actors, 'id');
  };


  /**
   * @returns {Array}
   */
  gk.prototype.getAllActors = function () {
    return _.clone(this._actors);
  };


  /**
   * @param {Kapi.Actor} actor
   * @return {Kapi}
   */
  gk.prototype.removeActor = function (actor) {
    delete this._actors[actor.id];
    delete actor.kapi;
    this._drawOrder = _.without(this._drawOrder, actor.id);
    actor.teardown();
    this.updateInternalState();

    return this;
  };


  /**
   * @param {number} opt_howManyTimes
   * @return {Kapi}
   */
  gk.prototype.play = function (opt_howManyTimes) {
    clearTimeout(this._loopId);

    if (this._playState === playState.PAUSED) {
      this._loopTimestamp += now() - this._pausedAtTime;
    } else {
      this._loopTimestamp = now();
    }

    this._timesToIterate = opt_howManyTimes || -1;
    this._playState = playState.PLAYING;
    tick(this);

    // also resume any shifty tweens that are paused.
    _.each(this._actors, function (actor) {
      if (actor._state.isPaused ) {
        actor.resume();
      }
    });

    fireEvent(this, 'onPlayStateChange');
    fireEvent(this, 'onPlay');

    return this;
  };


  /**
   * @param {number} millisecond
   * @param {number} opt_howManyTimes
   * @return {Kapi}
   */
  gk.prototype.playFrom = function (millisecond, opt_howManyTimes) {
    this.play(opt_howManyTimes);
    this._loopTimestamp = now() - millisecond;

    return this;
  };


  /**
   * @param {number} opt_howManyTimes
   * @return {Kapi}
   */
  gk.prototype.playFromCurrent = function (opt_howManyTimes) {
    return this.playFrom(this._lastRenderedMillisecond, opt_howManyTimes);
  };


  /**
   * @return {Kapi}
   */
  gk.prototype.pause = function () {
    if (this._playState === playState.PAUSED) {
      return this;
    }

    this._playState = playState.PAUSED;
    clearTimeout(this._loopId);
    this._pausedAtTime = now();

    // also pause any shifty tweens that are running.
    _.each(this._actors, function (actor) {
      if (actor._state.isTweening) {
        actor.pause();
      }
    });

    fireEvent(this, 'onPlayStateChange');
    fireEvent(this, 'onPause');

    return this;
  };


  /**
   * @param {boolean} alsoClear
   * @return {Kapi}
   */
  gk.prototype.stop = function (alsoClear) {
    this._playState = playState.STOPPED;
    clearTimeout(this._loopId);

    if (alsoClear === true) {
      this.canvas_clear();
    }

    // also kill any shifty tweens that are running.
    _.each(this._actors, function (actor) {
      actor.stop();

      if (alsoClear === true) {
        actor.hide();
      }
    });

    fireEvent(this, 'onPlayStateChange');
    fireEvent(this, 'onStop');

    return this;
  };


  /**
   * @return {boolean}
   */
  gk.prototype.isPlaying = function () {
    return this._playState === playState.PLAYING;
  };


  /**
   * @return {number}
   */
  gk.prototype.animationLength = function () {
    return this._animationLength;
  };


  /**
   * @return {number}
   */
  gk.prototype.actorCount = function () {
    return this._drawOrder.length;
  };


  /**
   * @param {number} opt_newFramerate
   * @return {number}
   */
  gk.prototype.framerate = function (opt_newFramerate) {
    if (opt_newFramerate) {
      this.config.fps = opt_newFramerate;
    }

    return this.config.fps;
  };


  /**
   * @param {number} millisecond
   * @return {Kapi}
   */
  gk.prototype.render = function (millisecond) {
    this.calculateActorPositions(millisecond);
    this.draw();
    this._lastRenderedMillisecond = millisecond;
    fireEvent(this, 'onFrameRender');

    return this;
  };


  /**
   * @return {Kapi}
   */
  gk.prototype.redraw = function () {
    this.render(this._lastRenderedMillisecond);

    return this;
  };


  /**
   * @param {number} millisecond
   * @return {Kapi}
   */
  gk.prototype.calculateActorPositions = function (millisecond) {
    var i, len;

    len = this._drawOrder.length;

    for (i = 0; i < len; i++) {
      this._actors[this._drawOrder[i]].calculatePosition(millisecond);
    }

    return this;
  };


  /**
   * @return {Kapi}
   */
  gk.prototype.draw = function () {
    var i, len
        ,currentActor
        ,canvas_context
        ,orderedActors
        ,drawOrder;

    this.canvas_clear();
    len = this._drawOrder.length;
    canvas_context = this.canvas_getContext();

    if (this._drawOrderSorter) {
      orderedActors = drawOrder =
          _.sortBy(this._actors, this._drawOrderSorter);
      drawOrder = _.pluck(orderedActors, 'id');
    } else {
      drawOrder = this._drawOrder;
    }

    for (i = 0; i < len; i++) {
      currentActor = this._actors[drawOrder[i]];
      if (currentActor.isShowing()) {
        currentActor.draw(canvas_context, currentActor.get());
      }
    }

    return this;
  };


  /**
   * @return {Kapi}
   */
  gk.prototype.updateInternalState = function () {
    var actorLengths = [];

    _.each(this._actors, function (actor) {
      actorLengths.push(actor.getEnd());
    });

    this._animationLength = Math.max.apply(Math, actorLengths);

    return this;
  };


  /**
   * @param {Kapi.Actor} actor
   * @param {number} layer
   * @return {Kapi.Actor|undefined}
   */
  gk.prototype.moveActorToLayer = function (actor, layer) {
    if (layer < this._drawOrder.length) {
      this._drawOrder = _.without(this._drawOrder, actor.id);
      this._drawOrder.splice(layer, 0, actor.id);

      return actor;
    }

    return undefined;
  };


  /**
   * @param {string} eventName
   * @param {Function} handler
   * @return {Kapi}
   */
  gk.prototype.bind = function (eventName, handler) {
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
  gk.prototype.unbind = function (eventName, opt_handler) {
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
   * @param {function(Kapi.Actor, number)} sortFunction
   * @return {Kapi}
   */
  gk.prototype.setOrderFunction = function (sortFunction) {
    this._drawOrderSorter = sortFunction;
    return this;
  };


  /**
   * @return {Kapi}
   */
  gk.prototype.unsetOrderFunction = function () {
    this._drawOrderSorter = null;
    return this;
  };


  /**
   * @return {Object}
   */
  gk.prototype.exportTimeline = function () {
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


  gk.util = {};

  //TODO:  There are some duplicates in gk.util and gk._private, clean up the
  // references in the tests.
  _.extend(gk.util, {
    'noop': noop
    ,'sortNumerically': sortNumerically
    ,'calculateLoopPosition': calculateLoopPosition
    ,'calculateTimeSinceStart': calculateTimeSinceStart
  });

  // Some hooks for testing.
  if (typeof KAPI_DEBUG !== 'undefined' && KAPI_DEBUG === true) {
    gk._private = {
      'sortNumerically': sortNumerically
      ,'calculateLoopPosition': calculateLoopPosition
      ,'renderCurrentMillisecond': renderCurrentMillisecond
      ,'tick': tick
      ,'determineCurrentLoopIteration': determineCurrentLoopIteration
      ,'calculateTimeSinceStart': calculateTimeSinceStart
      ,'isAnimationComplete': isAnimationComplete
      ,'updatePlayState': updatePlayState
    }
  }

  global.Rekapi = global.Kapi = gk;

} (this));
