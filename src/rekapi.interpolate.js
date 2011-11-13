/*global setTimeout:true, clearTimeout:true */

;(function rekapiInterpolate (global) {
  
  var gk;
  
  gk = global.Kapi;
  
  function getInterpolatedValues (from, to, position, easing) {
    
    var R_COLOR_COMPONENT = /^(__r__|__g__|__b__)/
        ,interpolatedValues;
    
    interpolatedValues = {};
    
    _.each(from, function (val, name) {
      
      var easingFunc;
      
      if (name.match(R_COLOR_COMPONENT)) {
        // The call to `.slice` removes the __color__ prefix that was
        // put there by Shifty.  This causes non-modified color properties
        // easing to be used.
        easingFunc = Tweenable.prototype.formula[easing[name.slice(5)]];
      } else {
        easingFunc = Tweenable.prototype.formula[easing[name]];
      }
      
      if (typeof to[name] !== 'undefined') {
        interpolatedValues[name] = global.Tweenable.util.tweenProp(
            from[name]
            ,to[name]
            ,easingFunc
            ,position);
      }

    });
    
    return interpolatedValues;
  }

  
  /**
   * @param {Object} from
   * @param {Object} to
   * @param {Object} position
   * @param {Object} easing
   * @returns {Object}
   */
  function interpolate (from, to, position, easing) {
    var current,
      interpolatedValues;
    
    current = global.Tweenable.util.simpleCopy({}, from);
    
    // Call any data type filters
    global.Tweenable.util.applyFilter('tweenCreated', current, 
        [current, from, to]);
    global.Tweenable.util.applyFilter('beforeTween', current, 
        [current, from, to]);
    interpolatedValues = getInterpolatedValues(
        from, to, position, easing);
    global.Tweenable.util.applyFilter('afterTween', interpolatedValues, 
        [interpolatedValues, from, to]);
    
    return interpolatedValues;
  }
  
  
  /**
   * @param {Object} to
   * @param {Object} position
   * @param {Object} easing
   * @returns {Object}
   */
  gk.Actor.prototype.interpolate = function (to, position, easing) {
    var interpolatedValues;
    
    interpolatedValues = interpolate(this.get(), to, position, easing);
    this.set(interpolatedValues);
    
    return interpolatedValues;
  };
  
}(this));
