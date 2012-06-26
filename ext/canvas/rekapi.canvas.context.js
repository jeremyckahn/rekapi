var rekapiCanvasContext = function (context, _) {

  'use strict';

  var Kapi = context.Kapi;

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
   * Takes care of some pre-drawing tasks for canvas animations.
  * @param {Kapi}
   */
  function beforeDraw (kapi) {
    if (kapi.config.clearOnUpdate) {
      kapi.canvasClear();
    }
  }


  /**
   * Draw all the `Actor`s at whatever position they are currently in.
   * @param {Kapi}
   * @return {Kapi}
   */
  function draw (kapi) {
    fireEvent(kapi, 'beforeDraw', _);
    var len = kapi._drawOrder.length;
    var drawOrder;

    if (kapi._drawOrderSorter) {
      var orderedActors = _.sortBy(kapi._canvasActors, kapi._drawOrderSorter);
      drawOrder = _.pluck(orderedActors, 'id');
    } else {
      drawOrder = kapi._drawOrder;
    }

    var currentActor, canvas_context;

    var i;
    for (i = 0; i < len; i++) {
      currentActor = kapi._canvasActors[drawOrder[i]];
      canvas_context = currentActor.context();
      currentActor.draw(canvas_context, currentActor.get());
    }
    fireEvent(kapi, 'afterDraw', _);

    return kapi;
  }


  function addActor (kapi, actor) {
    if (actor instanceof Kapi.CanvasActor) {
      kapi._drawOrder.push(actor.id);
      kapi._canvasActors[actor.id] = actor;
    }
  }


  function removeActor (kapi, actor) {
    if (actor instanceof Kapi.CanvasActor) {
      kapi._drawOrder = _.without(kapi._drawOrder, actor.id);
      delete kapi._canvasActors[actor.id];
    }
  }


  Kapi.prototype._contextInitHook.canvas = function () {
    this._drawOrder = [];
    this._drawOrderSorter = null;
    this._canvasActors = {};
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

    this.on('afterUpdate', draw);
    this.on('addActor', addActor);
    this.on('removeActor', removeActor);
    this.on('beforeDraw', beforeDraw);
  };


  /**
   * @param {number} opt_height
   * @return {number}
   */
  Kapi.prototype.canvasHeight = function (opt_height) {
    return canvasDimension(this.context, 'height', opt_height);
  };


  /**
   * @param {number} opt_width
   * @return {number}
   */
  Kapi.prototype.canvasWidth = function (opt_width) {
    return canvasDimension(this.context, 'width', opt_width);
  };


  /**
   * @return {Kapi}
   */
  Kapi.prototype.canvasClear = function () {
    if (this.context.getContext) {
      this.canvasContext().clearRect(
          0, 0, this.canvasWidth(), this.canvasHeight());
    }

    return this;
  };


  /**
   * @return {CanvasRenderingContext2D}
   */
  Kapi.prototype.canvasContext = function () {
    return this.context.getContext('2d');
  };


  /**
   * @param {Kapi.Actor} actor
   * @param {number} layer
   * @return {Kapi.Actor|undefined}
   */
  Kapi.prototype.moveActorToLayer = function (actor, layer) {
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
  Kapi.prototype.setOrderFunction = function (sortFunction) {
    this._drawOrderSorter = sortFunction;
    return this;
  };


  /**
   * @return {Kapi}
   */
  Kapi.prototype.unsetOrderFunction = function () {
    this._drawOrderSorter = null;
    return this;
  };


  /**
   * @return {Object}
   */
  Kapi.prototype.exportTimeline = function () {
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

};
