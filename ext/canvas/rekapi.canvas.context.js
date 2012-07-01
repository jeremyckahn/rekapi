var rekapiCanvasContext = function (context, _) {

  'use strict';

  var Kapi = context.Kapi;


  // PRIVATE UTILITY FUNCTIONS
  //

  /**
   * Gets (and optionally sets) height or width on a canvas.
   * @param {HTMLCanvas} context
   * @param {string} dimension The dimension (either "height" or "width") to
   *    get or set.
   * @param {number} opt_newSize The new value to set for `dimension`.
   * @return {number}
   */
  function dimension (context, dimension, opt_newSize) {
    if (typeof opt_newSize !== 'undefined') {
      context[dimension] = opt_newSize;
      context.style[dimension] = opt_newSize + 'px';
    }

    return context[dimension];
  }


  /**
   * Takes care of some pre-drawing tasks for canvas animations.
  * @param {Kapi}
   */
  function beforeDraw (kapi) {
    if (kapi.config.clearOnUpdate) {
      kapi.canvas.clear();
    }
  }


  /**
   * Draw all the `Actor`s at whatever position they are currently in.
   * @param {Kapi}
   * @return {Kapi}
   */
  function draw (kapi) {
    fireEvent(kapi, 'beforeDraw', _);
    var len = kapi.canvas._drawOrder.length;
    var drawOrder;

    if (kapi.canvas._drawOrderSorter) {
      var orderedActors =
          _.sortBy(kapi.canvas._canvasActors, kapi.canvas._drawOrderSorter);
      drawOrder = _.pluck(orderedActors, 'id');
    } else {
      drawOrder = kapi.canvas._drawOrder;
    }

    var currentActor, canvas_context;

    var i;
    for (i = 0; i < len; i++) {
      currentActor = kapi.canvas._canvasActors[drawOrder[i]];
      canvas_context = currentActor.context();
      currentActor.draw(canvas_context, currentActor.get());
    }
    fireEvent(kapi, 'afterDraw', _);

    return kapi;
  }


  /**
   * @param {Kapi} kapi
   * @param {Kapi.Actor} actor
   */
  function addActor (kapi, actor) {
    if (actor instanceof Kapi.CanvasActor) {
      kapi.canvas._drawOrder.push(actor.id);
      kapi.canvas._canvasActors[actor.id] = actor;
    }
  }


  /**
   * @param {Kapi} kapi
   * @param {Kapi.Actor} actor
   */
  function removeActor (kapi, actor) {
    if (actor instanceof Kapi.CanvasActor) {
      kapi.canvas._drawOrder = _.without(kapi.canvas._drawOrder, actor.id);
      delete kapi.canvas._canvasActors[actor.id];
    }
  }


  /**
   * Sets up an instance of CanvasRenderer and attaches it to a `Kapi`
   * instance.  Also augments the Kapi instance with canvas-specific
   * functions.
   */
  Kapi.prototype._contextInitHook.canvas = function () {
    this.canvas = new CanvasRenderer(this);
    this.config.clearOnUpdate = true;

    _.extend(this._events, {
      'beforeDraw': []
      ,'afterDraw': []
    });

    // Set the dimensions on the <canvas> element based on Kapi constructor
    // parameters
    _.each(['Height', 'Width'], function (dimension) {
      var dimensionLower = dimension.toLowerCase();
      if (this.config[dimensionLower]) {
        this.canvas[dimensionLower](this.config[dimensionLower]);
        delete this.config[dimension];
      }
    }, this);

    this.on('afterUpdate', draw);
    this.on('addActor', addActor);
    this.on('removeActor', removeActor);
    this.on('beforeDraw', beforeDraw);
  };


  // CANVAS RENDERER OBJECT
  //

  /**
   * @param {Kapi} kapi
   * @constructor
   */
  var CanvasRenderer = Kapi.CanvasRenderer = function (kapi) {
    this.kapi = kapi;
    this._drawOrder = [];
    this._drawOrderSorter = null;
    this._canvasActors = {};
    return this;
  };


  /**
   * @param {number} opt_height
   * @return {number}
   */
  CanvasRenderer.prototype.height = function (opt_height) {
    return dimension(this.kapi.context, 'height', opt_height);
  };


  /**
   * @param {number} opt_width
   * @return {number}
   */
  CanvasRenderer.prototype.width = function (opt_width) {
    return dimension(this.kapi.context, 'width', opt_width);
  };


  /**
   * @return {Kapi}
   */
  CanvasRenderer.prototype.clear = function () {
    // TODO: Is this check necessary?
    if (this.kapi.context.getContext) {
      this.context().clearRect(
          0, 0, this.width(), this.height());
    }

    return this.kapi;
  };


  /**
   * @return {CanvasRenderingContext2D}
   */
  CanvasRenderer.prototype.context = function () {
    return this.kapi.context.getContext('2d');
  };


  /**
   * @param {Kapi.Actor} actor
   * @param {number} layer
   * @return {Kapi.Actor|undefined}
   */
  CanvasRenderer.prototype.moveActorToLayer = function (actor, layer) {
    if (layer < this._drawOrder.length) {
      this._drawOrder = _.without(this._drawOrder, actor.id);
      this._drawOrder.splice(layer, 0, actor.id);

      return actor;
    }

    return;
  };


  /**
   * @param {function(Kapi.Actor, number)} sortFunction
   * @return {Kapi}
   */
  CanvasRenderer.prototype.setOrderFunction = function (sortFunction) {
    this._drawOrderSorter = sortFunction;
    return this.kapi;
  };


  /**
   * @return {Kapi}
   */
  CanvasRenderer.prototype.unsetOrderFunction = function () {
    this._drawOrderSorter = null;
    return this.kapi;
  };

};
