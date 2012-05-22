var rekapiDOM = function (global, deps) {
  var gk = global.Kapi;
  var _ = (deps && deps.underscore) ? deps.underscore : global._;
  var transforms = [
    'transform'
    ,'webkitTransform'
    ,'MozTransform'
    ,'oTransform'
    ,'msTransform'];


  function setStyle (forElement, styleName, styleValue) {
    forElement.style[styleName] = styleValue;
  }


  function hideElement (element) {
    setStyle(element, 'display', 'none');
  }


  function showElement (element) {
    setStyle(element, 'display', 'block');
  }


  /**
   * @param {HTMLElement} element
   * @constructor
   */
  gk.DOMActor = function (element) {
    gk.Actor.call(this);
    this._context = element;
    this._context.classList.add(this.getCSSName());

    // Remove the instance's render method to allow the
    // ActorMethods.prototype.render method to be accessible.
    delete this.render;

    this.show = function (alsoPersist) {
      gk.Actor.prototype.show.call(this, alsoPersist);
      showElement(this._context);
    };

    this.hide = function (alsoUnpersist) {
      gk.Actor.prototype.hide.call(this, alsoUnpersist);
      hideElement(this._context);
    };

    return this;
  };


  function DOMActorMethods () {}
  DOMActorMethods.prototype = gk.Actor.prototype;
  gk.DOMActor.prototype = new DOMActorMethods();


  /**
   * @param {HTMLElement} context
   * @param {Object} state
   */
  DOMActorMethods.prototype.render = function (context, state) {
    var isShowing;

    isShowing = false;

    _.each(state, function (styleValue, styleName) {
      isShowing = true;

      if (styleName === 'transform') {
        _.each(transforms, function (transform) {
          setStyle(context, transform, styleValue);
        }, this);
      } else {
        setStyle(context, styleName, styleValue);
      }
    }, this);

    isShowing ? this.show() : this.hide();
  };


  /**
   * @return {string}
   */
  DOMActorMethods.prototype.getCSSName = function () {
    return 'actor-' + this.id;
  };

};
