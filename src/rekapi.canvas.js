;(function rekapiCanvas (global) {

  var gk;
  
  gk = global.Kapi;
  
  
  /**
   * Gets (and optionally sets) a style on a canvas.
   * @param {HTMLCanvas} canvas
   * @param {string} dimension The dimension (either "height" or "width") to
   *    get or set.
   * @param {number} opt_new_size The new value to set for `dimension`.
   */
  function canvas_dimension (canvas, dimension, opt_new_size) {
    if (typeof opt_new_size !== 'undefined') {
      canvas[dimension] = opt_new_size;
      canvas.style[dimension] = opt_new_size + 'px';
    }
    
    return canvas[dimension];
  }
  
  
  /**
   * @returns {CanvasRenderingContext2D}
   */
  gk.prototype.canvas_context = function () {
    return this._context;
  };
  

  /**
   * @param {number} opt_height
   * @returns {number}
   */
  gk.prototype.canvas_height = function (opt_height) {
    return canvas_dimension(this.canvas, 'height', opt_height);
  };
  
  
  /**
   * @param {number} opt_width
   * @returns {number}
   */
  gk.prototype.canvas_width = function (opt_width) {
    return canvas_dimension(this.canvas, 'width', opt_width);
  };
  
  
  /**
   * @param {string} styleName
   * @param {number|string} opt_styleValue
   * @return {number|string}
   */
  gk.prototype.canvas_style = function (styleName, opt_styleValue) {
    if (typeof opt_styleValue !== 'undefined') {
      this.canvas.style[styleName] = opt_styleValue;
    }
    
    return this.canvas.style[styleName];
  }
  
  
  /**
   * @returns {Kapi}
   */
  gk.prototype.canvas_clear = function () {
    this.canvas_context().clearRect(0, 0, this.canvas_width(),
        this.canvas_height());
    
    return this;
  };

} (this));
