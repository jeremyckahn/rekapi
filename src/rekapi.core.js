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
  
  if (typeof KAPI_DEBUG !== 'undefined' 
      && typeof KAPI_DEBUG_NOW !== 'undefined') {
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
    this._context = canvas.getContext('2d');
    
    this.config = {};
    this._actors = {};
    this._drawOrder = [];
    this._playState = playState.STOPPED;
    
    // Millisecond duration of the animation
    this._animationLength = 0;

    // The setTimeout ID of `tick`
    this._loopId = null;
    
    // The UNIX time at which the animation loop started
    this._loopTimestamp = null;
    
    
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
   * @returns {Kapi}
   */
  gk.prototype.render = function (millisecond) {
    this.calculateActorPositions(millisecond);
    this.draw();
    
    return this;
  };
  
  
  /**
   * Updates the position (state) of all the actors.
   * @param {number} millisecond The position in the animation to "go" to.
   * @returns {Kapi}
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
   * Draws all the actors.
   * @returns {Kapi}
   */
  gk.prototype.draw = function () {
    var i, len
        ,currentActor
        ,canvas_context;
    
    this.canvas_clear();
    len = this._drawOrder.length;
    canvas_context = this.canvas_context();
    
    for (i = 0; i < len; i++) {
      currentActor = this._actors[this._drawOrder[i]];
      currentActor.draw(canvas_context, currentActor.get());
    }
    
    return this;
  };
  
  
  /**
   * Performs a "refresh" of the internal state.
   * @returns {Kapi}
   */
  gk.prototype.updateInternalState = function () {
    var allKeyframeLists;
        
    allKeyframeLists = [0];
        
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
   * @returns {Kapi}
   */
  gk.prototype.addActor = function (actor, opt_initialState) {
    // You can't add an actor more than once.
    if (!_.contains(this._actors, actor)) {
      actor.set(opt_initialState || {});
      this._actors[actor.id] = actor;
      this._drawOrder.push(actor.id);
    }
    
    return this;
  };
  
  
  /**
   * @param {number} actorId The Actor ID of the actor to fetch
   * @returns {Kapi.Actor}
   */
  gk.prototype.getActor = function (actorId) {
    return this._actors[actorId];
  };
  
  
  gk.prototype.removeActor = function (actor) {
    delete this._actors[actor.id];
    this._drawOrder = _.without(this._drawOrder, actor.id);
    
    return this;
  };
  
  
  /**
   * Starts or resumes an animation.
   * @returns {Kapi}
   */
  gk.prototype.play = function () {
    clearTimeout(this._loopId);
    
    if (this._playState === playState.PAUSED) {
      this._loopTimestamp += now() - this._pausedAtTime;
    } else {
      this._loopTimestamp = now();
    }
    
    this._playState = playState.PLAYING;
    tick(this);
    
    return this;
  };
  
  
  /**
   * Pauses an animation.
   * @returns {Kapi}
   */
  gk.prototype.pause = function () {
    this._playState = playState.PAUSED;
    clearTimeout(this._loopId);
    this._pausedAtTime = now();
    
    return this;
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


  /**
   * Move an actor from one layer to another.  Higher layers are drawn later
   *    (on top of lower layers).
   * @param {Kapi.Actor} actor The actor to move within the list.
   * @param {number} layer The 0-based layer to move `actor` to.
   * @returns {Kapi.Actor|undefined} If successful, the actor is returned.  If
   *    the operation fails, `undefined` is returned.
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
   * Returns whether or not the animation is playing (meaning not paused or 
   * stopped).
   * @returns {boolean}
   */
  gk.prototype.isPlaying = function () {
    return this._playState === playState.PLAYING;
  };
  
  
  gk.util = {};
  
  _.extend(gk.util, {
    'noop': noop
    ,'sortNumerically': sortNumerically
  });
  
  // Some hooks for testing.
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
