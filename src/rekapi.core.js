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
   * @param {Object} params
   * @param {Object} events
   */
  gr = global.Rekapi || function Rekapi (canvas, params, events) {
    this.canvas = canvas;
    this.canvas_context = canvas.getContext('2d');
    
    return this;
  };
  
  /**
   * Gets the 2d context of the Rekapi's canvas.
   */
  gr.prototype.context = function () {
    return this.canvas.getContext('2d');
  };
  
  global.Rekapi = gr;
  
} (this));