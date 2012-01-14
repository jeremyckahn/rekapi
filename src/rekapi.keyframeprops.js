;(function rekapiKeyframeProperty (global) {
  var gk
      ,DEFAULT_EASING = 'linear'
      ,KeyframePropertyMethods;

  gk = global.Kapi;

  /**
   * @param {Kapi.Actor} ownerActor
   * @param {number} millisecond
   * @param {string} name
   * @param {number} value
   * @param {string} opt_easing
   * @constructor
   */
  gk.KeyframeProperty = function (ownerActor, millisecond, name, value,
      opt_easing) {
    this.id = _.uniqueId('keyframeProperty_');
    this.ownerActor = ownerActor;
    this.millisecond = millisecond;
    this.name = name;
    this.value = value;
    this.easing = opt_easing || DEFAULT_EASING;
    this.nextProperty = null;

    return this;
  };


  /**
   * @param {Object} newProperties
   */
  gk.KeyframeProperty.prototype.modifyWith = function (newProperties) {
    var modifiedProperties = {};

    _.each(['millisecond', 'easing', 'value'], function (str) {
      modifiedProperties[str] = typeof(newProperties[str]) === 'undefined' ?
          this[str] : newProperties[str];
    }, this);

    _.extend(this, modifiedProperties);
  };


  /**
   * @param {KeyframeProperty} nextProperty
   */
  gk.KeyframeProperty.prototype.linkToNext = function (nextProperty) {
    this.nextProperty = nextProperty || null;
  }


  /**
   * @param {number} millisecond
   * @return {number}
   */
  gk.KeyframeProperty.prototype.getValueAt = function (millisecond) {
    var fromObj
        ,toObj
        ,delta
        ,interpolatedPosition
        ,value;

    fromObj = {};
    toObj = {};

    if (this.nextProperty) {
      fromObj[this.name] = this.value;
      toObj[this.name] = this.nextProperty.value;
      delta = this.nextProperty.millisecond - this.millisecond;
      interpolatedPosition = (millisecond - this.millisecond) / delta;
      value = Tweenable.util.interpolate(fromObj, toObj, interpolatedPosition,
          this.nextProperty.easing)[this.name];
    } else {
      value =  null;
    }

    return value;
  }

} (this));
