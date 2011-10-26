;(function rekapiCore (global) {
  
  if (!_) {
    throw 'underscore.js is required for Kapi.';
  }
  
  if (!Tweenable) {
    throw 'shifty.js is required for Kapi.';
  }
  
  var gk
      ,defaultConfig
      ,now;
  
  
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
  
  
  function calculateCurrentMillisecond (kapi) {
    var currentMillisecond;
    
    //TODO: Some more work needs to be done in order to prevent auto-looping.
    currentMillisecond = (now() - kapi._loopTimestamp) % kapi._animationLength;
    
    return currentMillisecond;
  }
  
  
  function renderCurrentMillisecond (kapi) {
    var currentMillisecond;
    
    currentMillisecond = calculateCurrentMillisecond(kapi);
    kapi.render(currentMillisecond);
  }
  
  
  function tick (kapi) {
    kapi._loopId = setTimeout(function () {
      renderCurrentMillisecond(kapi);
      tick(kapi);
    }, 1000 / kapi.config.fps);
  }
  
  
  function noop () {
    // NOOP!
  }
  
  
  defaultConfig = {
    'fps': 30
  };
  
  if (KAPI_DEBUG === true && KAPI_DEBUG_NOW) {
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
    
    // The setTimeout ID of `tick`
    this._loopId = null;
    
    // The UNIX time at which the animation loop started
    this._loopTimestamp = null;
    
    // Millisecond duration of the animation
    this._animationLength = null;
    
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
   * @param {Kapi.Actor} actor
   * @param {Object} opt_initialState
   */
  gk.prototype.add = function (actor, opt_initialState) {
    actor.set(opt_initialState);
    this._actors[actor.id] = actor;
    this._drawOrder.push(actor.id);
  };
  
  
  gk.prototype.play = function () {
    this._loopTimestamp = now();
    tick(this);
  };
  
  gk.prototype.stop = function (alsoClear) {
    clearTimeout(this._loopId);
    
    if (alsoClear === true) {
      this.canvas_clear();
    }
  };
  
  
  gk.util = {};
  
  _.extend(gk.util, {
    'noop': noop
    ,'sortNumerically': sortNumerically
  });
  
  if (KAPI_DEBUG === true) {
    gk._private = {
      'sortNumerically': sortNumerically
      ,'calculateCurrentMillisecond': calculateCurrentMillisecond
      ,'renderCurrentMillisecond': renderCurrentMillisecond
      ,'tick': tick
    }
  }
  
  global.Kapi = gk;
  
} (this));