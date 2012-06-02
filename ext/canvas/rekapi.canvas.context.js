var rekapiCanvasContext = function (context, deps) {

  'use strict';

  var gk = context.Kapi;
  var _ = (deps && deps.underscore) ? deps.underscore : context._;


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


  gk.prototype._contextInitHook.canvas = function () {
    if (!(this.config.context && this.config.context.nodeName === 'CANVAS')) {
      return;
    }

    this.config.clearOnUpdate = true;

    _.each(['Height', 'Width'], function (dimension) {
      var dimensionLower = dimension.toLowerCase();
      if (this.config[dimensionLower]) {
        this['canvas' + dimension](this.config[dimensionLower]);
        delete this.config[dimension];
      }
    }, this);

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

};
