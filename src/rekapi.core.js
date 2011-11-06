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
   * @returns {number}
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
    }
  }
  
  
  /**
   * Calculate how far in the animation loop `kapi` is, in milliseconds, based 
   * on the current time.  Also overflows into a new loop if necessary.
   * @param {Kapi} kapi
   * @returns {number}
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
      // First, scedule the next update.  renderCurrentMillisecond can cancel
      // the update if necessary.
      tick(kapi);
      renderCurrentMillisecond(kapi);
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
  
  now = Tweenable.util.now;
  
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
    
    _.extend(this.config, config);
    _.defaults(this.config, defaultConfig);
    
    return this;
  };
  
  
  /**
   * Returns the length of the animation, in milliseconds
   * @returns {number}
   */
  gk.prototype.animationLength = function () {
    return this._animationLength;
  };


  /**
   * Get or sets the framterate.  This is the rate per second at which the
   * animation updates.
   * @param {number} opt_newFramerate The framerate to set
   * @returns {number} The current framerate
   */
  gk.prototype.framerate = function (opt_newFramerate) {
    if (opt_newFramerate) {
      this.config.fps = opt_newFramerate;
    }

    return this.config.fps;
  };
  
  
  /**
   * Render a given millisecond position inside the loop
   * @param {number} millisecond
   * @returns {Kapi}
   */
  gk.prototype.render = function (millisecond) {
    this.calculateActorPositions(millisecond);
    this.draw();
    this._lastRenderedMillisecond = millisecond;
    
    return this;
  };
  
  
  /**
   * Re-draws the millisecond position that was drawn.
   * @returns {Kapi}
   */
  gk.prototype.redraw = function () {
    this.render(this._lastRenderedMillisecond);
    
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
   * Returns an Actor based on a given ID.
   * @param {number} actorId The Actor ID of the actor to fetch
   * @returns {Kapi.Actor}
   */
  gk.prototype.getActor = function (actorId) {
    return this._actors[actorId];
  };
  
  
  /**
   * Removes an Actor from the Kapi.
   * @param {Kapi.Actor} actor A reference to the Actor to remove.
   * @returns {Kapi}
   */
  gk.prototype.removeActor = function (actor) {
    delete this._actors[actor.id];
    this._drawOrder = _.without(this._drawOrder, actor.id);
    
    return this;
  };
  
  
  /**
   * Starts or resumes an animation.
   * @param {number} opt_howManyTimes How many times to loop the animation
   *    before stopping.
   * @returns {Kapi}
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
    
    // also pause any shifty tweens that are running.
    _.each(this._actors, function (actor) {
      if (actor._state.isTweening) {
        actor.pause();
      }
    });

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

    // also kill any shifty tweens that are running.
    _.each(this._actors, function (actor) {
      actor.stop();
    });
    
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
      ,'calculateLoopPosition': calculateLoopPosition
      ,'renderCurrentMillisecond': renderCurrentMillisecond
      ,'tick': tick
      ,'determineCurrentLoopIteration': determineCurrentLoopIteration
      ,'calculateTimeSinceStart': calculateTimeSinceStart
      ,'isAnimationComplete': isAnimationComplete
      ,'updatePlayState': updatePlayState
    }
  }
  
  global.Kapi = gk;
  
} (this));
