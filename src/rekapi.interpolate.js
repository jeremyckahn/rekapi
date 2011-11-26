/*global setTimeout:true, clearTimeout:true */

;(function rekapiInterpolate (global) {
  
  var gk;
  
  gk = global.Kapi;

  /**
   * @param {Object} to
   * @param {Object} position
   * @param {Object} easing
   * @returns {Object}
   */
  gk.Actor.prototype.interpolate = function (to, position, easing) {
    var interpolatedValues;
    
    interpolatedValues = global.Tweenable.prototype.interpolate.apply(
        this, arguments);
    this.set(interpolatedValues);
    
    return interpolatedValues;
  };
  
}(this));
