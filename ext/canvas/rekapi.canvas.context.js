var rekapiCanvasContext = function (context, _) {

  'use strict';

  var gk = context.Kapi;

  /**
   * Gets (and optionally sets) height or width on a canvas.
   * @param {HTMLCanvas} context
   * @param {string} dimension The dimension (either "height" or "width") to
   *    get or set.
   * @param {number} opt_newSize The new value to set for `dimension`.
   * @return {number}
   */
  function canvasDimension (context, dimension, opt_newSize) {
    if (typeof opt_newSize !== 'undefined') {
      context[dimension] = opt_newSize;
      context.style[dimension] = opt_newSize + 'px';
    }

    return context[dimension];
  }


  /**
   * Takes care of some pre-render tasks for canvas animations.  To be called
   * in the context of the Kapi instance.
   */
  function beforeDraw () {
    if (this.config.clearOnUpdate) {
      this.canvasClear();
    }
  }


  /**
   * Draw all the `Actor`s at whatever position they are currently in.
   * @param {Kapi}
   * @return {Kapi}
   */
  function draw () {
    fireEvent(this, 'beforeDraw', _);
    var len = this._drawOrder.length;
    var drawOrder;

    if (this._drawOrderSorter) {
      var orderedActors = _.sortBy(this._actors, this._drawOrderSorter);
      drawOrder = _.pluck(orderedActors, 'id');
    } else {
      drawOrder = this._drawOrder;
    }

    var currentActor, canvas_context;

    var i;
    for (i = 0; i < len; i++) {
      currentActor = this._actors[drawOrder[i]];
      canvas_context = currentActor.context();
      currentActor.draw(canvas_context, currentActor.get());
    }
    fireEvent(this, 'afterDraw', _);

    return this;
  }


  function addActor (kapi, actor) {
    kapi._drawOrder.push(actor.id);
  }


  function removeActor (kapi, actor) {
    kapi._drawOrder = _.without(kapi._drawOrder, actor.id);
  }


  gk.prototype._contextInitHook.canvas = function () {
    if (!(this.config.context && this.config.context.nodeName === 'CANVAS')) {
      return;
    }

    this._drawOrder = [];
    this._drawOrderSorter = null;
    this.config.clearOnUpdate = true;

    _.extend(this._events, {
      'beforeDraw': []
      ,'afterDraw': []
    });

    _.each(['Height', 'Width'], function (dimension) {
      var dimensionLower = dimension.toLowerCase();
      if (this.config[dimensionLower]) {
        this['canvas' + dimension](this.config[dimensionLower]);
        delete this.config[dimension];
      }
    }, this);

    this.on('afterUpdate', _.bind(draw, this));
    this.on('addActor', _.bind(addActor, this));
    this.on('removeActor', _.bind(removeActor, this));
    this.on('beforeDraw', _.bind(beforeDraw, this));
  };


  /**
   * @param {number} opt_height
   * @return {number}
   */
  gk.prototype.canvasHeight = function (opt_height) {
    return canvasDimension(this.context, 'height', opt_height);
  };


  /**
   * @param {number} opt_width
   * @return {number}
   */
  gk.prototype.canvasWidth = function (opt_width) {
    return canvasDimension(this.context, 'width', opt_width);
  };


  /**
   * @return {Kapi}
   */
  gk.prototype.canvasClear = function () {
    this.canvasContext().clearRect(0, 0, this.canvasWidth(),
        this.canvasHeight());

    return this;
  };


  /**
   * @return {CanvasRenderingContext2D}
   */
  gk.prototype.canvasContext = function () {
    return this.context.getContext('2d');
  };


  /**
   * @return {Kapi}
   */
  gk.prototype.redraw = function () {
    _.bind(draw, this)(this._lastUpdatedMillisecond);

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

    return;
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
      ,'actorOrder': this._drawOrder.slice(0) // TODO Move this to the canvas ext
      ,'actors': {}
    };

    _.each(this._drawOrder, function (actorId) {
      exportData.actors[actorId] = this._actors[actorId].exportTimeline();
    }, this);

    return exportData;
  };

};
