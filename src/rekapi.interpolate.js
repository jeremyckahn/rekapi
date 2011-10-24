/*global setTimeout:true, clearTimeout:true */

;(function rekapiInterpolate (global) {
  
  var gk;
  
  gk = global.Kapi;
	
	function getInterpolatedValues (from, current, to, position, easing) {
	  
	  var interpolatedValues;
	  
	  interpolatedValues = {};
	  
	  _.each(from, function (val, name) {
	    interpolatedValues[name] = global.Tweenable.util.tweenProps(position, {
  			'originalState': from
  			,'to': to
  			,'timestamp': 0
  			,'duration': 1
  			,'easingFunc': Tweenable.prototype.formula[easing[name]]
  		}, {
  			'current': current
  		})[name];
	  });
	  
		return interpolatedValues;
	}

	
	function interpolate (from, to, position, easing) {
	  var current,
			interpolatedValues;
		
		// Function was passed a configuration object, extract the values
		if (from && from.from) {
			to = from.to;
			position = from.position;
			easing = from.easing;
			from = from.from;
		}
		
		current = global.Tweenable.util.simpleCopy({}, from);
		
		// Call any data type filters
		global.Tweenable.util.applyFilter('tweenCreated', current, [current, from, to]);
		global.Tweenable.util.applyFilter('beforeTween', current, [current, from, to]);
		interpolatedValues = getInterpolatedValues(from, current, to, position, easing);
		global.Tweenable.util.applyFilter('afterTween', interpolatedValues, [interpolatedValues, from, to]);
		
		return interpolatedValues;
	}
	
	
	gk.Actor.prototype.interpolate = function (to, position, easing) {
		var interpolatedValues;
		
		interpolatedValues = interpolate(this.get(), to, position, easing);
		this.set(interpolatedValues);
		
		return interpolatedValues;
	};
	
}(this));
