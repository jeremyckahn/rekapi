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
  
  
  gk.prototype.height = function (opt_height) {
    return canvas_dimension(this.canvas, 'height', opt_height);
  };
  
  
  gk.prototype.width = function (opt_width) {
    return canvas_dimension(this.canvas, 'width', opt_width);
  };
  
  
  /**
   * Get (and optionally set) a style on the Kapi canvas.
   * @param {string} styleName
   * @param {number|string} opt_styleValue The value to set for `styleName`
   */
  gk.prototype.canvas_style = function (styleName, opt_styleValue) {
    if (typeof opt_styleValue !== 'undefined') {
      this.canvas.style[styleName] = opt_styleValue;
    }
    
    return this.canvas.style[styleName];
  }
  
  
  gk.prototype.canvas_clear = function () {
    this.context().clearRect(0, 0, this.width(), this.height());
  };
  
  
  /**
   * Gets the 2d context of the Kapi's canvas.
   */
  gk.prototype.context = function () {
    return this.canvas_context;
  };

} (this));