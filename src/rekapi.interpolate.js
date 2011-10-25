/*global setTimeout:true, clearTimeout:true */

;(function rekapiInterpolate (global) {
  
  var gk;
  
  gk = global.Kapi;
	
	function getInterpolatedValues (from, current, to, position, easing) {
	  
	  var R_COLOR_COMPONENT = /^(__r__|__g__|__b__)/
	      ,interpolatedValues;
	  
	  interpolatedValues = {};
	  
	  _.each(from, function (val, name) {
	    
	    // This branching looks weird, but it's done because of the way Shifty
	    // handles color, and how that interferes with Kapi's handling of 
	    // multiple easings per tween.  Essentially, Shifty creates properties to 
	    // tween that do not have corresponding easing strings.
	    if (name.match(R_COLOR_COMPONENT)) {
	      
	      interpolatedValues[name] = global.Tweenable.util.tweenProps(position, {
    			'originalState': from
    			,'to': to
    			,'timestamp': 0
    			,'duration': 1
    			// The call to `.slice` removes the __color__ prefix that was
    			// put there by Shifty.  This causes non-modified color property's
    			// easing to be used. 
    			,'easingFunc': Tweenable.prototype.formula[easing[name.slice(5)]]
    		}, {
    			'current': current
    		})[name];
	      
	    } else {
	      interpolatedValues[name] = global.Tweenable.util.tweenProps(position, {
    			'originalState': from
    			,'to': to
    			,'timestamp': 0
    			,'duration': 1
    			,'easingFunc': Tweenable.prototype.formula[easing[name]]
    		}, {
    			'current': current
    		})[name];
	    }
	    
	    
	  });
	  
		return interpolatedValues;
	}

	
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
		    from, current, to, position, easing);
		global.Tweenable.util.applyFilter('afterTween', interpolatedValues, 
		    [interpolatedValues, from, to]);
		
		return interpolatedValues;
	}
	
	
	gk.Actor.prototype.interpolate = function (to, position, easing) {
		var interpolatedValues;
		
		interpolatedValues = interpolate(this.get(), to, position, easing);
		this.set(interpolatedValues);
		
		return interpolatedValues;
	};
	
}(this));
