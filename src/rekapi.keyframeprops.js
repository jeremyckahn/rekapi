var rekapiKeyframeProperty = function (context, _, Tweenable) {

  'use strict';

  var DEFAULT_EASING = 'linear';
  var Kapi = context.Kapi;


  /**
   * @param {Kapi.Actor} ownerActor
   * @param {number} millisecond
   * @param {string} name
   * @param {number} value
   * @param {string} opt_easing
   * @constructor
   */
  var KeyframeProperty = Kapi.KeyframeProperty = function (ownerActor,
      millisecond, name, value, opt_easing) {
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
  KeyframeProperty.prototype.modifyWith = function (newProperties) {
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
  KeyframeProperty.prototype.linkToNext = function (nextProperty) {
    this.nextProperty = nextProperty || null;
  };


  /**
   * @param {number} millisecond
   * @return {number}
   */
  KeyframeProperty.prototype.getValueAt = function (millisecond) {
    var fromObj = {};
    var toObj = {};
    var value;

    if (this.nextProperty) {
      fromObj[this.name] = this.value;
      toObj[this.name] = this.nextProperty.value;
      var delta = this.nextProperty.millisecond - this.millisecond;
      var interpolatedPosition = (millisecond - this.millisecond) / delta;
      value = Tweenable.interpolate(fromObj, toObj, interpolatedPosition,
          this.nextProperty.easing)[this.name];
    } else {
      value =  this.value;
    }

    return value;
  };


  /**
   * @return {Object}
   */
  KeyframeProperty.prototype.exportPropertyData = function () {
    return {
     'id': this.id
     ,'millisecond': this.millisecond
     ,'name': this.name
     ,'value': this.value
     ,'easing': this.easing
    };
  };

};
