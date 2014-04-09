rekapiModules.push(function (context) {

  'use strict';

  var DEFAULT_EASING = 'linear';
  var Rekapi = context.Rekapi;
  var Tweenable = Rekapi.Tweenable;
  var _ = Rekapi._;
  var interpolate = Tweenable.interpolate;

  /**
   * Represents an individual component of an actor's keyframe state.  In most cases you won't need to deal with this object directly, as the [`Rekapi.Actor`](rekapi.actor.js.html#Actor) APIs abstract a lot of what this Object does away for you.
   * @param {number} millisecond Where on the animation timeline this KeyframeProperty is.
   * @param {string} name The property's name, such as "x" or "opacity."
   * @param {number|string} value The value that this KeyframeProperty represents.
   * @param {string=} opt_easing The easing curve at which this KeyframeProperty should be animated to.  Defaults to "linear".
   * @constructor
   */
  Rekapi.KeyframeProperty = function (millisecond, name, value, opt_easing) {
    this.id = _.uniqueId('keyframeProperty_');
    this.millisecond = millisecond;
    this.name = name;
    this.value = value;
    this.easing = opt_easing || DEFAULT_EASING;
    this.nextProperty = null;

    return this;
  };
  var KeyframeProperty = Rekapi.KeyframeProperty;

  /**
   * Modify a [`Rekapi.KeyframeProperty`](#KeyframeProperty).  Any of the following are valid properties of `newProperties` and correspond to the parameters of the [`Rekapi.KeyframeProperty`](#KeyframeProperty) constructor:
   *
   * - _millisecond_ (__number__)
   * - _name_ (__string__)
   * - _value_ (__number|string__)
   * - _easing_ (__string__)
   * @param {Object} newProperties
   */
  KeyframeProperty.prototype.modifyWith = function (newProperties) {
    var modifiedProperties = {};

    _.each(['millisecond', 'easing', 'value'], function (str) {
      modifiedProperties[str] = typeof(newProperties[str]) === 'undefined' ?
          this[str] : newProperties[str];
    }, this);

    _.extend(this, modifiedProperties);
  };

  /**
   * Calculate the midpoint between this [`Rekapi.KeyframeProperty`](#KeyframeProperty) and the next [`Rekapi.KeyframeProperty`](#KeyframeProperty) in a actor's property track.
   *
   * In just about all cases, `millisecond` should be between this [`Rekapi.KeyframeProperty`](#KeyframeProperty)'s `millisecond` and the `millisecond` of the [`Rekapi.KeyframeProperty`](#KeyframeProperty) that follows it in the animation timeline, but it is valid to specify a value outside of this range.
   * @param {number} millisecond The millisecond in the animation timeline to compute the state value for.
   * @return {number}
   */
  KeyframeProperty.prototype.getValueAt = function (millisecond) {
    var fromObj = {};
    var toObj = {};
    var value;
    var nextProperty = this.nextProperty;
    var correctedMillisecond = Math.max(millisecond, this.millisecond);

    if (nextProperty) {
      correctedMillisecond =
          Math.min(correctedMillisecond, nextProperty.millisecond);

      fromObj[this.name] = this.value;
      toObj[this.name] = nextProperty.value;

      var delta = nextProperty.millisecond - this.millisecond;
      var interpolatedPosition =
          (correctedMillisecond - this.millisecond) / delta;

      value = interpolate(fromObj, toObj, interpolatedPosition,
          nextProperty.easing)[this.name];
    } else {
      value = this.value;
    }

    return value;
  };

  /**
   * Create the reference to the [`Rekapi.KeyframeProperty`](#KeyframeProperty) that follows this one on an actor's property track.  Property tracks are just linked lists of [`Rekapi.KeyframeProperty`](#KeyframeProperty)s.
   * @param {Rekapi.KeyframeProperty} nextProperty The KeyframeProperty that should immediately follow this one on the animation timeline.
   */
  KeyframeProperty.prototype.linkToNext = function (nextProperty) {
    this.nextProperty = nextProperty || null;
  };

  /**
   * Disassociates this [`Rekapi.KeyframeProperty`](#KeyframeProperty) from its [`Rekapi.Actor`](rekapi.actor.js.html#Actor), if it has one.  This is called automatically by various [`Rekapi.Actor`](rekapi.actor.js.html#Actor) methods and triggers the [`removeKeyframeProperty`](rekapi.core.js.html#on) event on the associated [`Rekapi`](rekapi.core.js.html#Rekapi) instance, if there is one.
   * @return {Rekapi.KeyframeProperty}
   */
  KeyframeProperty.prototype.detach = function () {
    var actor = this.actor;
    if (actor) {
      if (actor.rekapi) {
        fireEvent(actor.rekapi, 'removeKeyframeProperty', _, this);
        delete actor._keyframeProperties[this.id];
        this.actor = null;
      }
    }

    return this;
  };

  /**
   * Export a serializable Object of this [`Rekapi.KeyframeProperty`](#KeyframeProperty)'s state data.
   *
   * __[Example](../../../../docs/examples/keyprop_export_property_data.html)__
   * @return {Object}
   */
  KeyframeProperty.prototype.exportPropertyData = function () {
    return {
     'millisecond': this.millisecond
     ,'name': this.name
     ,'value': this.value
     ,'easing': this.easing
    };
  };

});
