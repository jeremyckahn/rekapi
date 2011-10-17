;(function rekapiCore (global) {
  
  if (!_) {
    throw 'underscore.js is required for Rekapi.';
  }
  
  if (!Tweenable) {
    throw 'shifty.js is required for Rekapi.';
  }
  
  var gr;
  
  /**
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
   * @param {HTMLCanvas} canvas
   * @param {Object} params
   * @param {Object} events
   */
  gr = global.Rekapi || function Rekapi (canvas, params, events) {
    this.canvas = canvas;
    this.canvas_context = canvas.getContext('2d');
    
    return this;
  };
  
  gr.prototype.height = function (opt_height) {
    return canvas_dimension(this.canvas, 'height', opt_height);
  };
  
  gr.prototype.width = function (opt_width) {
    return canvas_dimension(this.canvas, 'width', opt_width);
  };
  
  /**
   * Get or set a style on the Rekapi canvas.
   * @param {string} styleName
   * @param {number|string} opt_styleValue The value to set for `styleName`
   */
  gr.prototype.canvas_style = function (styleName, opt_styleValue) {
    if (typeof opt_styleValue !== 'undefined') {
      this.canvas.style[styleName] = opt_styleValue;
    }
    
    return this.canvas.style[styleName];
  }
  
  /**
   * Gets the 2d context of the Rekapi's canvas.
   */
  gr.prototype.context = function () {
    return this.canvas_context;
  };
  
  global.Rekapi = gr;
  
} (this));