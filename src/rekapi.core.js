;(function rekapiCore (global) {
  
  if (!_) {
    throw 'underscore.js is required for Kapi.';
  }
  
  if (!Tweenable) {
    throw 'shifty.js is required for Kapi.';
  }
  
  var gk
      ,defaultConfig
      ,now
      ,playState;
  
  
  /**
   * Sorts an array numerically, from smallest to largest.
   * @param {Array} array The Array to sort.
   * @returns {Array} The sorted Array.
   */
  function sortNumerically (array) {
    return array.sort(function (a, b) {
      return a - b;
    });
  }
  
  
  /**
   * Calculate how far in the animation loop `kapi` is, in milliseconds, based 
   * on the current time.  Also overflows into a new loop in necessary.
   * @param {Kapi} kapi
   * @returns {number}
   */
  function calculateCurrentMillisecond (kapi) {
    var currentMillisecond;
    
    //TODO: Some more work needs to be done in order to prevent auto-looping.
    currentMillisecond = (now() - kapi._loopTimestamp) % kapi._animationLength;
    
    return currentMillisecond;
  }
  
  
  /**
   * Calculate how far in the animation loop `kapi` is, in milliseconds, and
   * render based on that time.
   * @param {Kapi} kapi
   */
  function renderCurrentMillisecond (kapi) {
    var currentMillisecond;
    
    currentMillisecond = calculateCurrentMillisecond(kapi);
    kapi.render(currentMillisecond);
  }
  
  
  /**
   * This is the heartbeat of an animation.  Renders a frame and then calls
   * itself based on the framerate of the supplied Kapi.
   * @param {Kapi} kapi
   */
  function tick (kapi) {
    kapi._loopId = setTimeout(function () {
      renderCurrentMillisecond(kapi);
      tick(kapi);
    }, 1000 / kapi.config.fps);
  }
  
  
  /**
   * Does nothing.  Absolutely nothing at all.
   */
  function noop () {
    // NOOP!
  }
  
  
  defaultConfig = {
    'fps': 30
  };
  
  playState = {
    'STOPPED': 'stopped'
    ,'PAUSED': 'paused'
    ,'PLAYING': 'playing'
  };
  
  if (typeof KAPI_DEBUG !== 'undefined' && typeof KAPI_DEBUG_NOW !== 'undefined') {
    now = KAPI_DEBUG_NOW;
  } else {
    now = Tweenable.util.now;
  }
  
  /**
   * @param {HTMLCanvas} canvas
   * @param {Object} config
   * @param {Object} events
   */
  gk = global.Kapi || function Kapi (canvas, config, events) {
    this.canvas = canvas;
    this.canvas_context = canvas.getContext('2d');
    
    this.config = {};
    this._actors = {};
    this._drawOrder = [];
    this._playState = playState.STOPPED;
    
    // The setTimeout ID of `tick`
    this._loopId = null;
    
    // The UNIX time at which the animation loop started
    this._loopTimestamp = null;
    
    // Millisecond duration of the animation
    this._animationLength = null;
    
    // Used for maintaining position when the animation is paused. 
    this._pausedAtTime = null;
    
    
    _.extend(this.config, config);
    _.defaults(this.config, defaultConfig);
    
    return this;
  };
  
  
  gk.prototype.animationLength = function () {
    return this._animationLength;
  };
  
  
  /**
   * @param {number} millisecond
   */
  gk.prototype.render = function (millisecond) {
    var i, len
        ,currentActor
        ,curr
        ,canvas_context;
    
    len = this._drawOrder.length;
    curr = now();
    canvas_context = this.context();
    this.canvas_clear();
    
    // Having two loops here is horrifically inefficient, yes.  However, having
    // position updates occur in tandem with draws could cause weird 
    // synchronicity issues.  For example, if the `draw` method of one actor
    // modifies the state of an actor that is drawn later in the loop.
    for (i = 0; i < len; i++) {
      currentActor = this._actors[this._drawOrder[i]];
      currentActor.calculatePosition(millisecond);
    }
    
    for (i = 0; i < len; i++) {
      currentActor = this._actors[this._drawOrder[i]];
      currentActor.draw(canvas_context, currentActor.get());
    }
  };
  
  
  /**
   * Performs a "refresh" of the internal state.
   * @returns {Kapi}
   */
  gk.prototype.updateInternalState = function () {
    var allKeyframeLists;
        
    allKeyframeLists = [];
        
    _.each(this._drawOrder, function (i) {
      allKeyframeLists = allKeyframeLists.concat(allKeyframeLists,
          this._actors[i].keyframeList());
    }, this);
    
    this._animationLength = Math.max.apply(Math, allKeyframeLists);
    
    return this;
  };
  
  
  /**
   * Add an Actor to the Kapi.
   * @param {Kapi.Actor} actor
   * @param {Object} opt_initialState
   */
  gk.prototype.add = function (actor, opt_initialState) {
    actor.set(opt_initialState);
    this._actors[actor.id] = actor;
    this._drawOrder.push(actor.id);
  };
  
  
  /**
   * Starts or resumes an animation.
   * @returns {Kapi}
   */
  gk.prototype.play = function () {
    if (this._playState === playState.PAUSED) {
      this._loopTimestamp += now() - this._pausedAtTime;
    } else {
      this._loopTimestamp = now();
    }
    
    this._playState = playState.PLAYING;
    tick(this);
    
    return this;
  };
  
  
  gk.prototype.pause = function () {
    this._playState = playState.PAUSED;
    clearTimeout(this._loopId);
    this._pausedAtTime = now();
  };
  
  
  /**
   * Stops an animation completely.
   * @param {boolean} alsoClear Whether to also clear the canvas.
   * @returns {Kapi}
   */
  gk.prototype.stop = function (alsoClear) {
    this._playState = playState.STOPPED;
    clearTimeout(this._loopId);
    
    if (alsoClear === true) {
      this.canvas_clear();
    }
    
    return this;
  };
  
  
  gk.util = {};
  
  _.extend(gk.util, {
    'noop': noop
    ,'sortNumerically': sortNumerically
  });
  
  if (typeof KAPI_DEBUG !== 'undefined' && KAPI_DEBUG === true) {
    gk._private = {
      'sortNumerically': sortNumerically
      ,'calculateCurrentMillisecond': calculateCurrentMillisecond
      ,'renderCurrentMillisecond': renderCurrentMillisecond
      ,'tick': tick
    }
  }
  
  global.Kapi = gk;
  
} (this));