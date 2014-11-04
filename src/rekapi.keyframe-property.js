rekapiModules.push(function (context) {

  'use strict';

  var DEFAULT_EASING = 'linear';
  var Rekapi = context.Rekapi;
  var Tweenable = Rekapi.Tweenable;
  var _ = Rekapi._;
  var interpolate = Tweenable.interpolate;

  /**
   * Represents an individual component of an actor's keyframe state.  In most
   * cases you won't need to deal with this object directly, as the
   * `{{#crossLink "Rekapi.Actor"}}{{/crossLink}}` APIs abstract a lot of what
   * this Object does away for you.
   * @class Rekapi.KeyframeProperty
   * @param {number} millisecond Where on the animation timeline this
   * `Rekapi.KeyframeProperty` is.
   * @param {string} name The property's name, such as `"x"` or `"opacity"`.
   * @param {number|string|Function} value The value that this
   * `Rekapi.KeyframeProperty` represents.
   * @param {string=} opt_easing The easing curve at which this
   * `Rekapi.KeyframeProperty` should be animated to.  Defaults to `"linear"`.
   * @constructor
   */
  Rekapi.KeyframeProperty = function (millisecond, name, value, opt_easing) {
    this.id = _.uniqueId('keyframeProperty_');
    this.millisecond = millisecond;
    this.name = name;
    this.value = value;
    this.hasFired = null;
    this.easing = opt_easing || DEFAULT_EASING;
    this.nextProperty = null;

    return this;
  };
  var KeyframeProperty = Rekapi.KeyframeProperty;

  /**
   * Modify this `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`.
   * @method modifyWith
   * @param {Object} newProperties Valid values correspond to `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}`'s constructor parameters:
   *   - __millisecond__ (_number_)
   *   - __name__ (_string_)
   *   - __value__ (_number|string_)
   *   - __easing__ (_string_)
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
   * Calculate the midpoint between this `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` and the next `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` in a `{{#crossLink
   * "Rekapi.Actor"}}{{/crossLink}}`'s property track.
   *
   * In just about all cases, `millisecond` should be between this
   * `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`'s `millisecond`
   * and the `millisecond` of the `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` that follows it in the
   * animation timeline, but it is valid to specify a value outside of this
   * range.
   * @method getValueAt
   * @param {number} millisecond The millisecond in the animation timeline to
   * compute the state value for.
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
   * Create the reference to the `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` that follows this one on a
   * `{{#crossLink "Rekapi.Actor"}}{{/crossLink}}`'s property track.  Property
   * tracks are just linked lists of `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}`s.
   * @method linkToNext
   * @param {Rekapi.KeyframeProperty} nextProperty The `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` that should immediately follow
   * this one on the animation timeline.
   */
  KeyframeProperty.prototype.linkToNext = function (nextProperty) {
    this.nextProperty = nextProperty || null;
  };

  /**
   * Disassociates this `{{#crossLink
   * "Rekapi.KeyframeProperty"}}{{/crossLink}}` from its `{{#crossLink
   * "Rekapi.Actor"}}{{/crossLink}}`.  This is called by various `{{#crossLink
   * "Rekapi.Actor"}}{{/crossLink}}` methods and triggers the `{{#crossLink
   * "Rekapi/on:method"}}removeKeyframeProperty{{/crossLink}}` event on the
   * associated `{{#crossLink "Rekapi"}}{{/crossLink}}` instance.
   * @method detach
   * @chainable
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
   * __[Example](../../../../docs/examples/keyprop_export_property_data.html)__
   * @method exportPropertyData
   * @return {Object} A serializable Object representation of this
   * `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`.
   */
  KeyframeProperty.prototype.exportPropertyData = function () {
    return {
      'millisecond': this.millisecond
      ,'name': this.name
      ,'value': this.value
      ,'easing': this.easing
    };
  };

  /*!
   * Whether or not this is a function keyframe and should be invoked for the
   * current frame.  Helper method for Rekapi.Actor.
   * @method shouldInvokeForMillisecond
   * @return {boolean}
   */
  KeyframeProperty.prototype.shouldInvokeForMillisecond =
      function (millisecond) {
    return (millisecond >= this.millisecond &&
      this.name === 'function' &&
      !this.hasFired);
  };

  /**
   * Assuming this is a function keyframe, call the function.
   * @method invoke
   * @return {*} Whatever value is returned from the keyframe function that was
   * set for this `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`.
   */
  KeyframeProperty.prototype.invoke = function () {
    var drift = this.actor.rekapi._loopPosition - this.millisecond;
    var returnValue = this.value.call(this.actor, drift);
    this.hasFired = true;
    return returnValue;
  };

});
