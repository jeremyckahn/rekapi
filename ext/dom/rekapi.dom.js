var rekapiDOM = function (global, deps) {
  var gk = global.Kapi;
  var _ = (deps && deps.underscore) ? deps.underscore : global._;
  var transforms = [
    'transform'
    ,'webkitTransform'
    ,'MozTransform'
    ,'oTransform'
    ,'msTransform'];

  if (!window.getComputedStyle) {
    return;
  }

  function getStyle (forElement, styleName) {
    return window.getComputedStyle(forElement).getPropertyValue(styleName);
  }

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
   * @return {Kapi.Actor}
   */
  gk.DOMActor = function (element) {
    var actor;

    actor = new gk.Actor ({
      'setup': function () {
        if (getStyle(this.kapi.canvas_getContext(), 'position') === 'static') {
          setStyle(this.kapi.canvas_getContext(), 'position', 'relative');
        }

        if (getStyle(element, 'position') === 'static') {
          setStyle(element, 'position', 'absolute');
        }
      }

      ,'draw': function (canvas_context, state) {
        var isShowing;

        isShowing = false;

        _.each(state, function (styleValue, styleName) {
          isShowing = true;

          if (styleName === 'transform') {
            _.each(transforms, function (transform) {
              setStyle(element, transform, styleValue);
            });
          } else {
            setStyle(element, styleName, styleValue);
          }
        });

        isShowing ? this.show() : this.hide();
      }
    });

    element.classList.add(actor.getCSSName());

    actor.show = function (alsoPersist) {
      gk.Actor.prototype.show.call(this, alsoPersist);
      showElement(element);
    };

    actor.hide = function (alsoUnpersist) {
      gk.Actor.prototype.hide.call(this, alsoUnpersist);
      hideElement(element);
    };

    return actor;
  };


  /**
   * @return {string}
   */
  global.Kapi.Actor.prototype.getCSSName = function () {
    return 'actor-' + this.id;
  };

};
