var rekapiDOM = function (context, deps) {

  'use strict';

  var Kapi = context.Kapi;
  var _ = (deps && deps.underscore) ? deps.underscore : context._;
  var transforms = [
    'transform'
    ,'webkitTransform'
    ,'MozTransform'
    ,'oTransform'
    ,'msTransform'];


  function setStyle (forElement, styleName, styleValue) {
    forElement.style[styleName] = styleValue;
  }


  /**
   * @param {HTMLElement} element
   * @constructor
   */
  Kapi.DOMActor = function (element) {
    Kapi.Actor.call(this);
    this._context = element;
    var className = this.getCSSName();

    // Add the class if it's not already there.
    // Using className instead of classList to make IE happy.
    if (!this._context.className.match(className)) {
      this._context.className += ' ' + className;
    }

    // Remove the instance's render method to allow the
    // ActorMethods.prototype.render method to be accessible.
    delete this.render;
    delete this.teardown;

    return this;
  };


  function DOMActorMethods () {}
  DOMActorMethods.prototype = Kapi.Actor.prototype;
  Kapi.DOMActor.prototype = new DOMActorMethods();


  /**
   * @param {HTMLElement} context
   * @param {Object} state
   */
  DOMActorMethods.prototype.render = function (context, state) {

    _.each(state, function (styleValue, styleName) {
      if (styleName === 'transform') {
        _.each(transforms, function (transform) {
          setStyle(context, transform, styleValue);
        }, this);
      } else {
        setStyle(context, styleName, styleValue);
      }
    }, this);
  };


  DOMActorMethods.prototype.teardown = function (context, state) {
    var classList = this._context.className.match(/\S+/g);
    var sanitizedClassList = _.without(classList, this.getCSSName());
    this._context.className = sanitizedClassList;
  };


  /**
   * @return {string}
   */
  DOMActorMethods.prototype.getCSSName = function () {
    return 'actor-' + this.id;
  };

};
