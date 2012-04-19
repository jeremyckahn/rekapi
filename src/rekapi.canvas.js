var rekapiCanvas = function (global) {

  var gk,
      contextTypes = {
        'CANVAS': 'canvas'
        ,'HTML_ELEMENT': 'HTMLElement'
        ,'OTHER': 'other'
      };

  gk = global.Kapi;


  /**
   * Gets (and optionally sets) a style on a canvas.
   * @param {HTMLCanvas|HTMLElement} canvas
   * @param {string} dimension The dimension (either "height" or "width") to
   *    get or set.
   * @param {number} opt_new_size The new value to set for `dimension`.
   * @return {number}
   */
  function canvas_dimension (canvas, contextType, dimension, opt_new_size) {
    if (typeof opt_new_size !== 'undefined') {
      canvas[dimension] = opt_new_size;

      if (!canvas.style) {
        canvas.style = {};
      }

      canvas.style[dimension] = opt_new_size + 'px';
    }

    if (contextType === contextType.HTML_ELEMENT) {
      return canvas.style[dimension]
    }

    return canvas[dimension];
  }


  /**
   * @param {HTMLCanvas|HTMLElement|Object} canvas
   * @return {CanvasRenderingContext2D|HTMLElement|Object}
   */
  gk.prototype.canvas_setContext = function (canvas) {
    var nodeName;

    this._canvas = canvas;
    nodeName = canvas.nodeName;

    if (nodeName === undefined) {
      // There isn't really canvas, just fake the context
      this._context = {};
      this._contextType = contextTypes.OTHER;
    } else if (nodeName === 'CANVAS') {
      this._context = canvas.getContext('2d');
      this._contextType = contextTypes.CANVAS;
    } else {
      // The canvas is a non-<canvas> DOM element, make the element the canvas
      this._context = canvas;
      this._contextType = contextTypes.HTML_ELEMENT;
    }

    return this.canvas_getContext();
  };


  /**
   * @return {CanvasRenderingContext2D|HTMLElement|Object}
   */
  gk.prototype.canvas_getContext = function () {
    return this._context;
  };


  /**
   * @param {number} opt_height
   * @return {number}
   */
  gk.prototype.canvas_height = function (opt_height) {
    return canvas_dimension(this.canvas, this._contextType, 'height',
        opt_height);
  };


  /**
   * @param {number} opt_width
   * @return {number}
   */
  gk.prototype.canvas_width = function (opt_width) {
    return canvas_dimension(this.canvas, this._contextType, 'width',
        opt_width);
  };


  /**
   * @param {string} styleName
   * @param {number|string} opt_styleValue
   * @return {number|string}
   */
  gk.prototype.canvas_style = function (styleName, opt_styleValue) {
    if (typeof opt_styleValue !== 'undefined'
        && this.canvas.style) {
       this.canvas.style[styleName] = opt_styleValue;
    }

    return this.canvas.style[styleName];
  }


  /**
   * @return {Kapi}
   */
  gk.prototype.canvas_clear = function () {
    // Clearing only mades sense if Kapi is bound to a canvas
    if (this._contextType === contextTypes.CANVAS) {
      this.canvas_getContext().clearRect(0, 0, this.canvas_width(),
          this.canvas_height());
    }

    return this;
  };

};
