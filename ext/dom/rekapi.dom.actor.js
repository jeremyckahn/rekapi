var rekapiDOM = function (context, _) {

  'use strict';

  var Kapi = context.Kapi;
  // TODO:  Change the name of this array to a clearer name, e.g. `vendorTransforms`
  var transforms = [
    'transform'
    ,'webkitTransform'
    ,'MozTransform'
    ,'oTransform'
    ,'msTransform'];
  var transformFunctions = [
    'translateX',
    'translateY',
    'scale',
    'scaleX',
    'scaleY',
    'rotate',
    'skewX',
    'skewY'];


  function setStyle (forElement, styleName, styleValue) {
    forElement.style[styleName] = styleValue;
  }


  /**
   * @param {string} name A transform function name
   * @return {boolean}
   */
  function isTransformFunction (name) {
    return _.contains(transformFunctions, name);
  }


  /**
   * Builds a concatenated string of given transform property values in order.
   *
   * @param {Array.<string>} orderedFunctions Array of ordered transform function names
   * @param {Object} transformProperties Transform properties to build together
   * @return {string}
   */
  function buildTransformValue (orderedFunctions, transformProperties) {
    var transformComponents = [];

    _.each(orderedFunctions, function(functionName) {
      if (transformProperties[functionName]) {
        transformComponents.push(functionName + '(' +
          transformProperties[functionName] + ')');
      }
    });

    return transformComponents.join(' ');
  }


  /**
   * Sets value for all vendor prefixed transform properties on a given context
   *
   * @param {Object} context The actor's DOM context
   * @param {string} transformValue The transform style value
   */
  function setTransformStyles (context, transformValue) {
    _.each(transforms, function(prefixedTransform) {
      setStyle(context, prefixedTransform, transformValue);
    });
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

    this._transformOrder = transformFunctions.slice(0);

    // Remove the instance's update method to allow the
    // ActorMethods.prototype.update method to be accessible.
    delete this.update;
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
  DOMActorMethods.prototype.update = function (context, state) {
    var propertyNames = _.keys(state);
    // TODO:  Optimize the following code so that propertyNames is not looped over twice.
    var transformFunctionNames = _.filter(propertyNames, isTransformFunction);
    var otherPropertyNames = _.reject(propertyNames, isTransformFunction);
    var otherProperties = _.pick(state, otherPropertyNames);

    if (transformFunctionNames.length) {
      var transformProperties = _.pick(state, transformFunctionNames);
      var builtStyle = buildTransformValue(this._transformOrder, transformProperties);
      setTransformStyles(context, builtStyle);
    } else if (state.transform) {
      setTransformStyles(context, state.transform);
    }

    _.each(otherProperties, function (styleValue, styleName) {
      setStyle(context, styleName, styleValue);
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


  /**
   * Overrides the default transform function order.
   * 
   * @param {Array} orderedFunctions The Array of transform function names
   * @return {Kapi}
   */
  DOMActorMethods.prototype.setTransformOrder = function (orderedFunctions) {
    var unknownFunctions = _.reject(orderedFunctions, isTransformFunction);

    if (unknownFunctions.length) {
      throw 'Unknown or unsupported transform functions: ' + unknownFunctions.join(', ');
    }
    // Ignore duplicate transform function names in the array
    this._transformOrder = _.uniq(orderedFunctions);

    return this;
  };

};
