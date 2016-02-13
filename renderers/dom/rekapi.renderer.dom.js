rekapiModules.push(function (context) {

  'use strict';

  var Rekapi = context.Rekapi;
  var _ = Rekapi._;
  var now = Rekapi.Tweenable.now;
  var vendorTransforms = [
    'transform'
    ,'webkitTransform'
    ,'MozTransform'
    ,'oTransform'
    ,'msTransform'];
  var transformFunctions = [
    'translateX',
    'translateY',
    'translateZ',
    'scale',
    'scaleX',
    'scaleY',
    'perspective',
    'rotate',
    'rotateX',
    'rotateY',
    'rotateZ',
    'skewX',
    'skewY'];

  // CONSTANTS
  //

  // The timer to remove an injected style isn't likely to match the actual
  // length of the CSS animation, so give it some extra time to complete so it
  // doesn't cut off the end.
  var INJECTED_STYLE_REMOVAL_BUFFER_MS = 250;

  // PRIVATE UTILITY FUNCTIONS
  //

  /*!
   * @param {string} formatter
   * @param {[string]} args
   * @return {string}
   */
  var printf = function (formatter, args) {
    var composedStr = formatter;
    _.each(args, function (arg) {
      composedStr = composedStr.replace('%s', arg);
    });

    return composedStr;
  };

  /*!
   * http://stackoverflow.com/a/3886106
   *
   * @param {number} number
   */
  function isInt (number) {
    return number % 1 === 0;
  }

  /*!
   * @param {Rekapi} rekapi
   */
  Rekapi._rendererInitHook.cssAnimate = function (rekapi) {
    // Node.nodeType 1 is an ELEMENT_NODE.
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeType
    if (rekapi.context.nodeType === 1) {
      rekapi.renderer = new DOMRenderer(rekapi);
    }
  };

  /*!
   * @return {string}
   */
  function getVendorPrefix () {
    var style = document.body.style;

    if ('-webkit-animation' in style) {
      return 'webkit';
    } else if ('-moz-animation' in style) {
      return 'mozilla';
    } else if ('-ms-animation' in style) {
      return 'microsoft';
    } else if ('-o-animation' in style) {
      return 'opera';
    } else if ('animation' in style) {
      return 'w3';
    }

    return '';
  }

  var styleID = 0;
  /*!
   * @param {Rekapi} rekapi
   * @param {string} css The css content that the <style> element should have.
   * @return {HTMLStyleElement} The unique ID of the injected <style> element.
   */
  function injectStyle (rekapi, css) {
    var style = document.createElement('style');
    var id = 'rekapi-' + styleID++;
    style.id = id;
    style.innerHTML = css;
    document.head.appendChild(style);
    forceStyleReset(rekapi);

    return style;
  }

  /*!
   * Fixes a really bizarre issue that only seems to affect Presto and Blink.
   * In some situations, DOM nodes will not detect dynamically injected <style>
   * elements.  Explicitly re-inserting DOM nodes seems to fix the issue.  Not
   * sure what causes this issue.  Not sure why this fixes it.
   *
   * @param {Rekapi} rekapi
   */
  function forceStyleReset (rekapi) {
    var dummyDiv = document.createElement('div');

    _.each(rekapi.getAllActors(), function (actor) {
      if (actor.context.nodeType === 1) {
        var actorEl = actor.context;
        var actorElParent = actorEl.parentElement;

        actorElParent.replaceChild(dummyDiv, actorEl);
        actorElParent.replaceChild(actorEl, dummyDiv);
      }
    });

    dummyDiv = null;
  }

  /*!
   * @param {HTMLElement} element
   * @param {string} styleName
   * @param {string|number} styleValue
   */
  function setStyle (element, styleName, styleValue) {
    element.style[styleName] = styleValue;
  }

  /*!
   * @param {string} name A transform function name
   * @return {boolean}
   */
  function isTransformFunction (name) {
    return _.contains(transformFunctions, name);
  }

  /*!
   * Builds a concatenated string of given transform property values in order.
   *
   * @param {Array.<string>} orderedTransforms Array of ordered transform
   *     function names
   * @param {Object} transformProperties Transform properties to build together
   * @return {string}
   */
  function buildTransformValue (orderedTransforms, transformProperties) {
    var transformComponents = [];

    _.each(orderedTransforms, function(functionName) {
      if (typeof transformProperties[functionName] !== 'undefined') {
        transformComponents.push(functionName + '(' +
          transformProperties[functionName] + ')');
      }
    });

    return transformComponents.join(' ');
  }

  /*!
   * Sets value for all vendor prefixed transform properties on an element
   *
   * @param {HTMLElement} element The actor's DOM element
   * @param {string} transformValue The transform style value
   */
  function setTransformStyles (element, transformValue) {
    _.each(vendorTransforms, function(prefixedTransform) {
      setStyle(element, prefixedTransform, transformValue);
    });
  }


  /*!
   * @param {Rekapi} rekapi
   * @param {Rekapi.Actor} actor
   */
  function onAddActor (rekapi, actor) {
    var actorElement = actor.context;

    if (actorElement.nodeType !== 1) {
      return;
    }

    var className = DOMRenderer.getActorClassName(actor);

    // Add the class if it's not already there.
    // Using className instead of classList to make IE happy.
    if (!actorElement.className.match(className)) {
      actorElement.className += ' ' + className;
    }

    actor._transformOrder = transformFunctions.slice(0);
    actor._beforeKeyframePropertyInterpolate = actorBeforeInterpolate;
    actor._afterKeyframePropertyInterpolate = actorAfterInterpolate;
    actor.render = _.bind(actorRender, actor, actor);
    actor.teardown = _.bind(actorTeardown, actor, actor);
  }

  /*!
   * transform properties like translate3d and rotate3d break the cardinality
   * of multi-ease easing strings, because the "3" gets treated like a
   * tweenable value.  Transform "3d(" to "__THREED__" to prevent this, and
   * transform it back in _afterKeyframePropertyInterpolate.
   *
   * @param {Rekapi.KeyframeProperty} keyframeProperty
   */
  function actorBeforeInterpolate (keyframeProperty) {
    if (keyframeProperty.name !== 'transform') {
      return;
    }

    var value = keyframeProperty.value;
    var nextProp = keyframeProperty.nextProperty;

    if (nextProp && value.match(/3d\(/g)) {
      keyframeProperty.value = value.replace(/3d\(/g, '__THREED__');
      nextProp.value = nextProp.value.replace(/3d\(/g, '__THREED__');
    }
  }

  /*!
   * @param {Rekapi.KeyframeProperty} keyframeProperty
   * @param {Object} interpolatedObject
   */
  function actorAfterInterpolate (keyframeProperty, interpolatedObject) {
    if (keyframeProperty.name !== 'transform') {
      return;
    }

    var value = keyframeProperty.value;
    var nextProp = keyframeProperty.nextProperty;

    if (nextProp && value.match(/__THREED__/g)) {
      keyframeProperty.value = value.replace(/__THREED__/g, '3d(');
      nextProp.value = nextProp.value.replace(/__THREED__/g, '3d(');
      var keyPropName = keyframeProperty.name;
      interpolatedObject[keyPropName] =
          interpolatedObject[keyPropName].replace(/__THREED__/g, '3d(');
    }
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {HTMLElement} element
   * @param {Object} state
   */
  function actorRender (actor, element, state) {
    var propertyNames = _.keys(state);
    // TODO:  Optimize the following code so that propertyNames is not looped
    // over twice.
    var transformFunctionNames = _.filter(propertyNames, isTransformFunction);
    var otherPropertyNames = _.reject(propertyNames, isTransformFunction);
    var otherProperties = _.pick(state, otherPropertyNames);

    if (transformFunctionNames.length) {
      var transformProperties = _.pick(state, transformFunctionNames);
      var builtStyle = buildTransformValue(actor._transformOrder,
          transformProperties);
      setTransformStyles(element, builtStyle);
    } else if (state.transform) {
      setTransformStyles(element, state.transform);
    }

    _.each(otherProperties, function (styleValue, styleName) {
      setStyle(element, styleName, styleValue);
    });
  }

  /*!
   * @param {Rekapi.Actor} actor
   */
  function actorTeardown (actor) {
    var element = actor.context;
    var classList = element.className.match(/\S+/g);
    var sanitizedClassList =
        _.without(classList, DOMRenderer.getActorClassName(actor));
    element.className = sanitizedClassList.join(' ');
  }

  // CSS RENDERER OBJECT
  //

  /**
   * `Rekapi.DOMRenderer` allows you to animate DOM elements.  This is achieved
   * either by browser-accelerated [CSS `@keyframe`
   * animations](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes),
   * or by traditional inline style updates on every frame (like how
   * [`jQuery.fn.animate`](http://api.jquery.com/animate/) works).  Animations
   * are defined with the same API in either case, but you can gracefully fall
   * back to the inline style approach if CSS `@keyframe` animations are not
   * supported by the browser or not preferred.  To render animations with the
   * DOM, just supply any DOM element to the `{{#crossLink
   * "Rekapi"}}{{/crossLink}}` constructor.  You may use `document.body`, since
   * it is generally always available:
   *
   *     var rekapi = new Rekapi(document.body);
   *     rekapi.renderer instanceof Rekapi.DOMRenderer; // true
   *
   * There are separate APIs for playing inline style animations and CSS
   * `@keyframe` animations.  Advantages of playing an animation with CSS
   * `@keyframes`:
   *
   *   - Smoother animations in newer browsers.
   *   - The JavaScript thread is freed from performing animation updates,
   *   making it available for other logic.
   *
   * Disadvantages:
   *
   *   - Not all browsers support CSS `@keyframe` animations.
   *   - Limited playback control: You can only play and stop an animation, you
   *   cannot jump to or start from a specific point in the timeline.
   *   - Generating the CSS for `@keyframe` animations can take a noticeable
   *   amount of time.  This blocks all other logic, including rendering, so
   *   you may have to be clever with how to spend the cycles to do it.
   *   - No `{{#crossLink "Rekapi/on:method"}}events{{/crossLink}}` can be
   *   bound to CSS `@keyframe` animations.
   *
   * So, the results are a little more predictable and flexible with inline
   * style animations, but CSS `@keyframe` may give you better performance.
   * Choose whichever approach makes the most sense for your needs.
   *
   * `Rekapi.DOMRenderer` can gracefully fall back to an inline style animation
   * if CSS `@keyframe` animations are not supported by the browser:
   *
   *      var rekapi = new Rekapi(document.body);
   *
   *      // Each actor needs a reference to the DOM element it represents
   *      var actor = rekapi.addActor({
   *        context: document.getElementById('actor-1')
   *      });
   *
   *      actor
   *        .keyframe(0,    { left: '0px'   })
   *        .keyframe(1000, { left: '250px' }, 'easeOutQuad');
   *
   *      // Feature detect for CSS @keyframe support
   *      if (rekapi.renderer.canAnimateWithCSS()) {
   *        // Animate with CSS @keyframes
   *        rekapi.renderer.play();
   *      } else {
   *        // Animate with inline styles instead
   *        rekapi.play();
   *      }
   *
   * ## `@keyframe` animations work differently than inline style animations
   *
   * Inline style animations are compatible with all of the playback and
   * timeline control methods defined by `{{#crossLink
   * "Rekapi"}}{{/crossLink}}`, such as `{{#crossLink
   * "Rekapi/play:method"}}{{/crossLink}}`, `{{#crossLink
   * "Rekapi/playFrom:method"}}{{/crossLink}}` and `{{#crossLink
   * "Rekapi/update:method"}}{{/crossLink}}`.  CSS `@keyframe` playback cannot
   * be controlled in all browsers, so `Rekapi.DOMRenderer` defines analogous,
   * renderer-specific CSS playback methods that you should use:
   *
   *   - {{#crossLink "Rekapi.DOMRenderer/play:method"}}{{/crossLink}}
   *   - {{#crossLink "Rekapi.DOMRenderer/isPlaying:method"}}{{/crossLink}}
   *   - {{#crossLink "Rekapi.DOMRenderer/stop:method"}}{{/crossLink}}
   *
   * __Note__: `Rekapi.DOMRenderer` is added to the `{{#crossLink
   * "Rekapi"}}{{/crossLink}}` instance automatically as `this.renderer`,
   * there is no reason to call the constructor yourself in most cases.
   *
   * __[Example](/renderers/dom/sample/play-many-actors.html)__
   *
   * @class Rekapi.DOMRenderer
   * @param {Rekapi} rekapi
   * @constructor
   */
  Rekapi.DOMRenderer = function (rekapi) {
    this.rekapi = rekapi;

    // @private {number}
    this._playTimestamp = null;

    // @private {string}
    this._cachedCSS = null;

    // The HTMLStyleElement that gets injected into the DOM.
    // @private {HTMLStyleElement)
    this._styleElement = null;

    // @private {number}
    this._stopSetTimeoutHandle = null;

    rekapi.on('timelineModified', _.bind(function () {
      this._cachedCSS = null;
    }, this));

    rekapi.on('addActor', onAddActor);

    return this;
  };
  var DOMRenderer = Rekapi.DOMRenderer;

  /**
   * @method canAnimateWithCSS
   * @return {boolean} Whether or not the browser supports CSS `@keyframe`
   * animations.
   */
  DOMRenderer.prototype.canAnimateWithCSS = function () {
    return !!getVendorPrefix();
  };

  /**
   * Play the Rekapi animation as a CSS `@keyframe` animation.
   *
   * Note that this is different from `{{#crossLink
   * "Rekapi/play:method"}}{{/crossLink}}`.  This method only applies to CSS
   * `@keyframe` animations.
   * @method play
   * @param {number=} opt_iterations How many times the animation should loop.
   * This can be `null` or `0` if you want to loop the animation endlessly but
   * also specify a value for `opt_fps`.
   * @param {number=} opt_fps How many `@keyframes` to generate per second of
   * the animation.  A higher value results in a more precise CSS animation,
   * but it will take longer to generate.  The default value is `30`.  You
   * should not need to go higher than `60`.
   */
  DOMRenderer.prototype.play = function (opt_iterations, opt_fps) {
    if (this.isPlaying()) {
      this.stop();
    }

    var css = this._cachedCSS || this.prerender.apply(this, arguments);
    this._styleElement = injectStyle(this.rekapi, css);
    this._playTimestamp = now();

    if (opt_iterations) {
      var animationLength = (opt_iterations * this.rekapi.getAnimationLength());
      this._stopSetTimeoutHandle = setTimeout(
          _.bind(this.stop, this, true),
          animationLength + INJECTED_STYLE_REMOVAL_BUFFER_MS);
    }

    fireEvent(this.rekapi, 'play', _);
  };

  /**
   * Stop a CSS `@keyframe` animation.  This also removes any `<style>`
   * elements that were dynamically injected into the DOM.
   *
   * Note that this is different from
   * `{{#crossLink "Rekapi/stop:method"}}{{/crossLink}}`.  This method only
   * applies to CSS `@keyframe` animations.
   * @method stop
   * @param {boolean=} opt_goToEnd If true, skip to the end of the animation.
   * If false or omitted, set inline styles on the actor elements to keep them
   * in their current position.
   */
  DOMRenderer.prototype.stop = function (opt_goToEnd) {
    if (this.isPlaying()) {
      clearTimeout(this._stopSetTimeoutHandle);

      // Forces a style update in WebKit/Presto
      this._styleElement.innerHTML = '';

      document.head.removeChild(this._styleElement);
      this._styleElement = null;

      var updateTime;
      if (opt_goToEnd) {
        updateTime = this.rekapi.getAnimationLength();
      } else {
        updateTime = (now() - this._playTimestamp)
            % this.rekapi.getAnimationLength();
      }

      this.rekapi.update(updateTime);
      fireEvent(this.rekapi, 'stop', _);
    }
  };

  /**
   * @method isPlaying
   * @return {boolean} Whether or not a CSS `@keyframe` animation is running.
   */
  DOMRenderer.prototype.isPlaying = function () {
    return !!this._styleElement;
  };

  /**
   * Prerender and cache the CSS animation so that it is immediately ready to
   * be used when it is needed in the future.  The function signature is
   * identical to {{#crossLink
   * "Rekapi.DOMRenderer/play:method"}}{{/crossLink}}.  This is necessary to
   * play a CSS animation and will be automatically called for you if you don't
   * call it manually, but calling it ahead of time (such as on page load) will
   * prevent any perceived lag when a CSS `@keyframe` animation is started.
   * The prerendered animation is cached for reuse until the timeline or a
   * keyframe is modified.
   *
   * @method prerender
   * @param {number=} opt_iterations How many times the animation should loop.
   * This can be `null` or `0` if you want to loop the animation endlessly but
   * also specify a value for `opt_fps`.
   * @param {number=} opt_fps How many `@keyframes` to generate per second of
   * the animation.  A higher value results in a more precise CSS animation,
   * but it will take longer to generate.  The default value is `30`.  You
   * should not need to go higher than `60`.
   * @return {string} The prerendered CSS string.  You likely won't need this,
   * as it is also cached internally.
   */
  DOMRenderer.prototype.prerender = function (opt_iterations, opt_fps) {
    return this._cachedCSS = this.toString({
      'vendors': [getVendorPrefix()]
      ,'fps': opt_fps
      ,'iterations': opt_iterations
    });
  };

  /**
   * You can decouple transform components in order to animate each property
   * with its own easing curve:
   *
   *     actor
   *       .keyframe(0, {
   *         translateX: '0px',
   *         translateY: '0px',
   *         rotate: '0deg'
   *       })
   *       .keyframe(1500, {
   *         translateX: '200px',
   *         translateY: '200px',
   *         rotate: '90deg'
   *       }, {
   *         translateX: 'easeOutExpo',
   *         translateY: 'easeInSine',
   *         rotate: 'elastic'
   *       });
   *
   * CSS transform string components are order-dependent, but JavaScript object
   * properties have an unpredictable order.  Rekapi must combine transform
   * properties supplied to `{{#crossLink
   * "Rekapi.Actor/keyframe:method"}}{{/crossLink}}` (as shown above) into a
   * single string when it renders each frame.  This method lets you change
   * that order from the default.  The supported array values for
   * `orderedTransforms` are:
   *
   * - `translateX`
   * - `translateY`
   * - `translateZ`
   * - `scale`
   * - `scaleX`
   * - `scaleY`
   * - `rotate`
   * - `skewX`
   * - `skewY`
   *
   * If you prefer a more standards-oriented approach, Rekapi also supports
   * combining the transform components yourself:
   *
   *     actor
   *       .keyframe(0, {
   *         transform: 'translateX(0px) translateY(0px) rotate(0deg)'
   *       })
   *       .keyframe(1500, {
   *         transform: 'translateX(200px) translateY(200px) rotate(90deg)'
   *       }, {
   *         transform: 'easeOutExpo easeInSine elastic'
   *       });
   *
   * This example and the one above it are equivalent.
   *
   * @method setActorTransformOrder
   * @param {Rekapi.Actor} actor
   * @param {Array(string)} orderedTransforms The array of transform names.
   * @return {Rekapi}
   */
  DOMRenderer.prototype.setActorTransformOrder =
      function (actor, orderedTransforms) {
    // TODO: Document this better...
    var unknownFunctions = _.reject(orderedTransforms, isTransformFunction);

    if (unknownFunctions.length) {
      throw 'Unknown or unsupported transform functions: ' +
        unknownFunctions.join(', ');
    }
    // Ignore duplicate transform function names in the array
    actor._transformOrder = _.uniq(orderedTransforms);

    return this.rekapi;
  };

  /**
   * @method getActorClassName
   * @param {Rekapi.Actor} actor
   * @return {string} The default CSS class that is targeted by `{{#crossLink
   * "Rekapi.DOMRenderer/toString:method"}}{{/crossLink}}` if a custom class is
   * not specified.  This may be useful for getting a standard and consistent
   * CSS class name for an actor's DOM element.
   */
  DOMRenderer.getActorClassName = function (actor) {
    return 'actor-' + actor.id;
  };

  // TODO: Don't redefine toString with a method that takes parameters.  Name
  // this something else and deprecate DOMRenderer#toString.
  /**
   * Converts Rekapi animations to CSS `@keyframes`.
   * @method toString
   * @param {Object=} opts
   *   * __vendors__ _(Array(string))_: Defaults to `['w3']`.  The browser vendors you
   *   want to support. Valid values are:
   *     * `'microsoft'`
   *     * `'mozilla'`
   *     * `'opera'`
   *     * `'w3'`
   *     * `'webkit'`
   *
   *
   *   * __fps__ _(number)_: Defaults to 30.  Defines the number of CSS
   *   `@keyframe` frames rendered per second of an animation.  CSS `@keyframes`
   *   are comprised of a series of explicitly defined steps, and more steps
   *   will allow for a more complex animation.  More steps will also result in
   *   a larger CSS string, and more time needed to generate the string.
   *   * __name__ _(string)_: Define a custom name for your animation.  This
   *   becomes the class name targeted by the generated CSS.  The default value
   *   is determined by a call to {{#crossLink
   *   "Rekapi.DOMRenderer/getActorClassName:method"}}{{/crossLink}}.
   *   * __isCentered__ _(boolean)_: If `true`, the generated CSS will contain
   *   `transform-origin: 0 0;`, which centers the DOM element along the path of
   *   motion.  If `false` or omitted, no `transform-origin` rule is specified
   *   and the element is aligned to the path of motion with its top-left
   *   corner.
   *   * __iterations__ _(number)_: How many times the generated animation
   *   should repeat.  If omitted, the animation will loop indefinitely.
   * @return {string}
   */
  Rekapi.DOMRenderer.prototype.toString = function (opts) {
    opts = opts || {};
    var animationCSS = [];

    _.each(this.rekapi.getAllActors(), function (actor) {
      if (actor.context.nodeType === 1) {
        animationCSS.push(getActorCSS(actor, opts));
      }
    });

    return animationCSS.join('\n');
  };

  // DOMRenderer.prototype.toString-SPECIFIC CODE
  //

  // CONSTANTS
  //

  var DEFAULT_FPS = 30;
  var TRANSFORM_TOKEN = 'TRANSFORM';
  var VENDOR_TOKEN = 'VENDOR';
  var VENDOR_PREFIXES = {
    'microsoft': '-ms-'
    ,'mozilla': '-moz-'
    ,'opera': '-o-'
    ,'w3': ''
    ,'webkit': '-webkit-'
  };
  var BEZIERS = {
    linear: '.25,.25,.75,.75'
    ,easeInQuad: '.55,.085,.68,.53'
    ,easeInCubic: '.55,.055,.675,.19'
    ,easeInQuart: '.895,.03,.685,.22'
    ,easeInQuint: '.755,.05,.855,.06'
    ,easeInSine: '.47,0,.745,.715'
    ,easeInExpo: '.95,.05,.795,.035'
    ,easeInCirc: '.6,.04,.98, .335'
    ,easeOutQuad: '.25,.46,.45,.94'
    ,easeOutCubic: '.215,.61,.355,1'
    ,easeOutQuart: '.165,.84,.44,1'
    ,easeOutQuint: '.23,1,.32,1'
    ,easeOutSine: '.39,.575,.565,1'
    ,easeOutExpo: '.19,1,.22,1'
    ,easeOutCirc: '.075,.82,.165,1'
    ,easeInOutQuad: '.455,.03,.515,.955'
    ,easeInOutCubic: '.645,.045,.355,1'
    ,easeInOutQuart: '.77,0,.175,1'
    ,easeInOutQuint: '.86,0.07,1'
    ,easeInOutSine: '.445,.05,.55,.95'
    ,easeInOutExpo: '1,0,0,1'
    ,easeInOutCirc: '.785,.135,.15,.86'
  };

  // TEMPLATES
  //

  /*!
   * [0]: vendor
   * [1]: animation name
   * [2]: keyframes
   */
  var KEYFRAME_TEMPLATE = [
    '@%skeyframes %s-keyframes {'
    ,'%s'
    ,'}'
  ].join('\n');

  /*!
   * [0] class name
   * [1] class attributes
   */
  var CLASS_BOILERPLATE = [
    '.%s {'
    ,'%s'
    ,'}'
  ].join('\n');

  /*!
   * Creates the CSS `@keyframes` for an individual actor.
   * @param {Rekapi.Actor} actor
   * @param {Object=} opts Same as opts for Rekapi.prototype.toCSS.
   * @return {string}
   */
  function getActorCSS (actor, opts) {
    opts = opts || {};
    var actorCSS = [];
    var animName;

    if (opts.name) {
      if (actor.rekapi.getActorCount() > 1) {
        animName = opts.name + '-' + actor.id;
      } else {
        animName = opts.name;
      }
    } else {
      animName = DOMRenderer.getActorClassName(actor);
    }


    var fps = opts.fps || DEFAULT_FPS;
    var steps = Math.ceil((actor.rekapi.getAnimationLength() / 1000) * fps);
    var combineProperties = !canOptimizeAnyKeyframeProperties(actor);
    var actorClass = generateCSSClass(
        actor, animName, combineProperties, opts.vendors, opts.iterations,
        opts.isCentered);
    var boilerplatedKeyframes = generateBoilerplatedKeyframes(
        actor, animName, steps, combineProperties, opts.vendors);

    actorCSS.push(actorClass);
    actorCSS.push(boilerplatedKeyframes);

    return actorCSS.join('\n');
  }

  // toString-SPECIFIC PRIVATE UTILITY FUNCTIONS
  //

  /*!
   * @param {Rekapi.Actor} actor
   * @param {string} animName
   * @param {number} steps
   * @param {boolean} combineProperties
   * @param {Array.<string>=} opt_vendors
   * @return {string}
   */
  function generateBoilerplatedKeyframes (
      actor, animName, steps, combineProperties, opt_vendors) {

    var trackNames = actor.getTrackNames();
    var cssTracks = [];

    if (combineProperties) {
      cssTracks.push(generateCombinedActorKeyframes(actor, steps));
    } else {
      _.each(trackNames, function (trackName) {
        cssTracks.push(
          generateActorKeyframes(actor, steps, trackName));
      });
    }

    var boilerplatedKeyframes = [];

    if (combineProperties) {
      boilerplatedKeyframes.push(applyVendorBoilerplates(
        cssTracks[0], (animName), opt_vendors));
    } else {
      _.each(trackNames, function (trackName, i) {
        boilerplatedKeyframes.push(applyVendorBoilerplates(
          cssTracks[i], (animName + '-' + trackName), opt_vendors));
      });
    }

    boilerplatedKeyframes = boilerplatedKeyframes.join('\n');

    return boilerplatedKeyframes;
  }

  /*!
   * @param {string} toKeyframes Generated keyframes to wrap in boilerplates
   * @param {string} animName
   * @param {Array.<string>=} opt_vendors Vendor boilerplates to be applied.
   *     Should be any of the values in Rekapi.util.VENDOR_PREFIXES.
   * @return {string}
   */
  function applyVendorBoilerplates (toKeyframes, animName, opt_vendors) {
    opt_vendors = opt_vendors || ['w3'];
    var renderedKeyframes = [];

    _.each(opt_vendors, function (vendor) {
      var renderedChunk = printf(KEYFRAME_TEMPLATE,
          [VENDOR_PREFIXES[vendor], animName, toKeyframes]);
      var prefixedKeyframes =
          applyVendorPropertyPrefixes(renderedChunk, vendor);
      renderedKeyframes.push(prefixedKeyframes);
    });

    return renderedKeyframes.join('\n');
  }

  /*!
   * @param {string} keyframes
   * @param {vendor} vendor
   * @return {string}
   */
  function applyVendorPropertyPrefixes (keyframes, vendor) {
    var transformRegExp = new RegExp(TRANSFORM_TOKEN, 'g');
    var prefixedTransformKey = VENDOR_PREFIXES[vendor] + 'transform';
    var generalPrefixRegExp = new RegExp(VENDOR_TOKEN, 'g');
    var generalPrefixedKey = VENDOR_PREFIXES[vendor];
    var prefixedKeyframes = keyframes
        .replace(generalPrefixRegExp, generalPrefixedKey)
        .replace(transformRegExp, prefixedTransformKey);

    return prefixedKeyframes;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {string} animName
   * @param {boolean} combineProperties
   * @param {Array.<string>=} opt_vendors
   * @param {number|string=} opt_iterations
   * @param {boolean=} opt_isCentered
   * @return {string}
   */
  function generateCSSClass (
      actor, animName, combineProperties, opt_vendors, opt_iterations,
      opt_isCentered) {

    opt_vendors = opt_vendors || ['w3'];
    var classAttrs = [];
    var vendorAttrs;

    _.each(opt_vendors, function (vendor) {
      vendorAttrs = generateCSSAnimationProperties(
          actor, animName, vendor, combineProperties, opt_iterations,
          opt_isCentered);
      classAttrs.push(vendorAttrs);
    });

    var boilerplatedClass = printf(CLASS_BOILERPLATE
        ,[animName, classAttrs.join('\n')]);

    return boilerplatedClass;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {string} animName
   * @param {string} vendor
   * @param {boolean} combineProperties
   * @param {number|string=} opt_iterations
   * @param {boolean=} opt_isCentered
   * @return {string}
   */
  function generateCSSAnimationProperties (
      actor, animName, vendor, combineProperties, opt_iterations,
      opt_isCentered) {
    var generatedProperties = [];
    var prefix = VENDOR_PREFIXES[vendor];

    generatedProperties.push(generateAnimationNameProperty(
          actor, animName, prefix, combineProperties));
    generatedProperties.push(
        generateAnimationDurationProperty(actor, prefix));
    generatedProperties.push(generateAnimationDelayProperty(actor, prefix));
    generatedProperties.push(generateAnimationFillModeProperty(prefix));
    generatedProperties.push(generateAnimationTimingFunctionProperty(prefix));
    generatedProperties.push(generateAnimationIterationProperty(
        actor.rekapi, prefix, opt_iterations));

    if (opt_isCentered) {
      generatedProperties.push(generateAnimationCenteringRule(prefix));
    }

    return generatedProperties.join('\n');
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {string} animName
   * @param {string} prefix
   * @param {boolean} combineProperties
   * @return {string}
   */
  function generateAnimationNameProperty (
      actor, animName, prefix, combineProperties) {

    var animationName = printf('  %sanimation-name:', [prefix]);

    if (combineProperties) {
      animationName += printf(' %s-keyframes;', [animName]);
    } else {
      var tracks = actor.getTrackNames();
      var transformTracksToCombine = _.intersection(tracks, transformFunctions);
      var nonTransformTracks = _.difference(tracks, transformFunctions);

      var trackNamesToPrint;
      if (transformTracksToCombine.length) {
        trackNamesToPrint = nonTransformTracks;
        trackNamesToPrint.push('transform');
      } else {
        trackNamesToPrint = tracks;
      }

      _.each(trackNamesToPrint, function (trackName) {
        animationName += printf(' %s-%s-keyframes,', [animName, trackName]);
      });

      animationName = animationName.slice(0, animationName.length - 1);
      animationName += ';';
    }

    return animationName;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {string} animName
   * @return {string}
   */
  function generateAnimationDurationProperty (actor, prefix) {
    return printf('  %sanimation-duration: %sms;'
        ,[prefix, actor.getEnd() - actor.getStart()]);
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {number|string} delay
   * @return {string}
   */
  function generateAnimationDelayProperty (actor, prefix) {
    return printf('  %sanimation-delay: %sms;', [prefix, actor.getStart()]);
  }

  /*!
   * @param {string} prefix
   * @return {string}
   */
  function generateAnimationFillModeProperty (prefix) {
    return printf('  %sanimation-fill-mode: forwards;', [prefix]);
  }

  /*!
   * @param {string} prefix
   * @return {string}
   */
  function generateAnimationTimingFunctionProperty (prefix) {
    return printf('  %sanimation-timing-function: linear;', [prefix]);
  }

  /*!
   * @param {Rekapi} rekapi
   * @param {string} prefix
   * @param {number|string=} opt_iterations
   * @return {string}
   */
  function generateAnimationIterationProperty (rekapi, prefix, opt_iterations) {
    var iterationCount;
    if (opt_iterations) {
      iterationCount = opt_iterations;
    } else {
      iterationCount = rekapi._timesToIterate === -1
        ? 'infinite'
        : rekapi._timesToIterate;
    }

    var ruleTemplate = '  %sanimation-iteration-count: %s;';

    return printf(ruleTemplate, [prefix, iterationCount]);
  }

  /*!
   * @param {string} prefix
   * @return {string}
   */
  function generateAnimationCenteringRule (prefix) {
    return printf('  %stransform-origin: 0 0;', [prefix]);
  }

  // OPTIMIZED OUTPUT GENERATOR FUNCTIONS
  //

  /*!
   * @param {Rekapi.KeyframeProperty} property
   * @return {boolean}
   */
  function canOptimizeKeyframeProperty (property) {
    var canOptimize = false;
    var nextProperty = property.nextProperty;

    if (nextProperty) {
      if (isSegmentAWait(property, nextProperty)) {
        return true;
      }

      var easingChunks = nextProperty.easing.split(' ');

      var i = 0, len = easingChunks.length;
      var previousChunk = easingChunks[0];
      var currentChunk;
      for (i; i < len; i++) {
        currentChunk = easingChunks[i];
        if (!(BEZIERS[currentChunk])
            || previousChunk !== currentChunk) {
          canOptimize = false;
          break;
        } else {
          canOptimize = true;
        }

        previousChunk = currentChunk;
      }
    }

    return canOptimize;
  }

  /*!
   * @param {Rekapi.KeyframeProperty} property
   * @param {Rekapi.KeyframeProperty} nextProperty
   * @return {boolean}
   */
  function isSegmentAWait (property, nextProperty) {
    if (property.name === nextProperty.name &&
        property.value === nextProperty.value) {
      return true;
    }

    return false;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @return {boolean}
   */
  function canOptimizeAnyKeyframeProperties (actor) {
    var keyframeProperties = actor._keyframeProperties;
    var propertyNames = _.keys(actor._propertyTracks);

    return _.any(keyframeProperties, canOptimizeKeyframeProperty) &&
      !_.intersection(propertyNames, transformFunctions).length;
  }

  /*!
   * @param {Rekapi.KeyframeProperty} property
   * @param {number} fromPercent
   * @param {number} toPercent
   * @return {string}
   */
  function generateOptimizedKeyframeSegment (
      property, fromPercent, toPercent) {

    var accumulator = [];
    var generalName = property.name;

    if (property.name === 'transform') {
      generalName = TRANSFORM_TOKEN;
    }

    var easingFormula = BEZIERS[property.nextProperty.easing.split(' ')[0]];
    var timingFnChunk = printf('cubic-bezier(%s)', [easingFormula]);

    var adjustedFromPercent = isInt(fromPercent) ?
        fromPercent : fromPercent.toFixed(2);
    var adjustedToPercent = isInt(toPercent) ?
        toPercent : toPercent.toFixed(2);

    accumulator.push(printf('  %s% {%s:%s;%sanimation-timing-function: %s;}',
          [adjustedFromPercent, generalName, property.value, VENDOR_TOKEN
          ,timingFnChunk]));
    accumulator.push(printf('  %s% {%s:%s;}',
          [adjustedToPercent, generalName, property.nextProperty.value]));

    return accumulator.join('\n');
  }

  // UN-OPTIMIZED OUTPUT GENERATOR FUNCTIONS
  //

  /*!
   * @param {Rekapi.Actor} actor
   * @param {number} steps
   * @param {string} track
   * @return {string}
   */
  function generateActorKeyframes (actor, steps, track) {
    var accumulator = [];
    var actorEnd = actor.getEnd();
    var actorStart = actor.getStart();
    var actorLength = actor.getLength();
    var leadingWait = simulateLeadingWait(actor, track, actorStart);

    if (leadingWait) {
      accumulator.push(leadingWait);
    }

    var previousSegmentWasOptimized = false;
    _.each(actor._propertyTracks[track], function (prop, propName) {
      var fromPercent = calculateStepPercent(prop, actorStart, actorLength);
      var nextProp = prop.nextProperty;

      var toPercent, increments, incrementSize;
      if (nextProp) {
        toPercent = calculateStepPercent(nextProp, actorStart, actorLength);
        var delta = toPercent - fromPercent;
        increments = Math.floor((delta / 100) * steps) || 1;
        incrementSize = delta / increments;
      } else {
        toPercent = 100;
        increments = 1;
        incrementSize = 1;
      }

      var trackSegment;
      if (nextProp && isSegmentAWait(prop, nextProp)) {
        trackSegment = generateActorTrackWaitSegment(
            actor, actorStart, prop, nextProp, fromPercent, toPercent);

        if (previousSegmentWasOptimized) {
          trackSegment.shift();
        }

        previousSegmentWasOptimized = false;

      } else if (canOptimizeKeyframeProperty(prop)) {
        trackSegment = generateOptimizedKeyframeSegment(
            prop, fromPercent, toPercent);

        // If this and the previous segment are optimized, remove the
        // destination keyframe of the previous step.  The starting keyframe of
        // the newest segment makes it redundant.
        if (previousSegmentWasOptimized) {
          var accumulatorLength = accumulator.length;
          var previousTrackSegment = accumulator[accumulatorLength - 1];
          var optimizedPreviousTrackSegment =
              previousTrackSegment.split('\n')[0];
          accumulator[accumulatorLength - 1] = optimizedPreviousTrackSegment;
        }

        previousSegmentWasOptimized = true;
      } else {
        trackSegment = generateActorTrackSegment(
            actor, increments, incrementSize, actorStart, fromPercent, prop);

        if (previousSegmentWasOptimized) {
          trackSegment.shift();
        }

        if (trackSegment.length) {
          trackSegment = trackSegment.join('\n');
        }

        previousSegmentWasOptimized = false;
      }

      if (trackSegment.length) {
        accumulator.push(trackSegment);
      }
    });

    var trailingWait =
        simulateTrailingWait(actor, track, actorStart, actorEnd);

    if (trailingWait) {
      accumulator.push(trailingWait);
    }

    return accumulator.join('\n');
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {number} steps
   * @return {string}
   */
  function generateCombinedActorKeyframes (actor, steps) {
    return generateActorTrackSegment(
        actor, steps + 1, 100 / steps, 0, 0).join('\n');
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {string} track
   * @param {number} actorStart
   * @return {string|undefined}
   */
  function simulateLeadingWait (actor, track, actorStart) {
    var firstProp = actor._propertyTracks[track][0];

    if (typeof firstProp !== 'undefined'
        && firstProp.millisecond !== actorStart) {
      var fakeFirstProp = generateActorTrackSegment(
          actor, 1, 1, firstProp.millisecond, 0, firstProp);
      return fakeFirstProp.join('\n');
    }
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {string} track
   * @param {number} actorStart
   * @param {number} actorEnd
   * @return {string|undefined}
   */
  function simulateTrailingWait (actor, track, actorStart, actorEnd) {
    var lastProp = _.last(actor._propertyTracks[track]);

    if (typeof lastProp !== 'undefined'
        && lastProp.millisecond !== actorEnd) {
      var fakeLastProp = generateActorTrackSegment(
          actor, 1, 1, actorStart, 100, lastProp);
      return fakeLastProp.join('\n');
    }
  }

  /*!
   * @param {Rekapi.KeyframeProperty} property
   * @param {number} actorStart
   * @param {number} actorLength
   * @return {number}
   */
  function calculateStepPercent (property, actorStart, actorLength) {
    return ((property.millisecond - actorStart) / actorLength) * 100;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {number} increments
   * @param {number} incrementSize
   * @param {number} actorStart
   * @param {number} fromPercent
   * @param {Rekapi.KeyframeProperty=} opt_fromProp
   * @return {Array.<string>}
   */
  function generateActorTrackSegment (
      actor, increments, incrementSize, actorStart, fromPercent,
      opt_fromProp) {

    var accumulator = [];
    var actorLength = actor.getLength();
    var i, adjustedPercent, stepPrefix;

    for (i = 0; i < increments; i++) {
      adjustedPercent = fromPercent + (i * incrementSize);
      actor._updateState(
          ((adjustedPercent / 100) * actorLength) + actorStart, true);
      stepPrefix = +adjustedPercent.toFixed(2) + '% ';

      if (opt_fromProp) {
        accumulator.push(
            '  ' + stepPrefix + serializeActorStep(actor, opt_fromProp.name));
      } else {
        accumulator.push('  ' + stepPrefix + serializeActorStep(actor));
      }
    }

    return accumulator;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {number} actorStart
   * @param {Rekapi.KeyframeProperty} fromProp
   * @param {Rekapi.KeyframeProperty} toProp
   * @param {number} fromPercent
   * @param {number} toPercent
   * @return {Array.<string>}
   */
  function generateActorTrackWaitSegment (
      actor, actorStart, fromProp, toProp, fromPercent, toPercent) {
    var segment = generateActorTrackSegment(
        actor, 1, toPercent - fromPercent, actorStart, fromPercent, fromProp);
    return segment;
  }

  /**
   * @param {Object} propsToSerialize
   * @param {Array.<string>} transformNames
   * @return {Object}
   */
  function combineTranfromProperties (propsToSerialize, transformNames) {
    var transformProps =
      _.pick.apply(_, [propsToSerialize].concat(transformFunctions));

    if (_.isEmpty(transformProps)) {
      return propsToSerialize;
    } else {
      var serializedProps = _.clone(propsToSerialize);
      serializedProps[TRANSFORM_TOKEN] = [];

      _.each(transformNames, function (transformFunction) {
        if (_.has(serializedProps, transformFunction)) {
          serializedProps[TRANSFORM_TOKEN].push(
            transformFunction + '(' + serializedProps[transformFunction] + ')');
          delete serializedProps[transformFunction];
        }
      });

      serializedProps[TRANSFORM_TOKEN] = serializedProps[TRANSFORM_TOKEN].join(' ');

      return serializedProps;
    }
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {string=} opt_targetProp
   * @return {string}
   */
  function serializeActorStep (actor, opt_targetProp) {
    var serializedProps = ['{'];

    var propsToSerialize;
    if (opt_targetProp) {
      propsToSerialize = {};

      var currentPropState = actor.get()[opt_targetProp];
      if (typeof currentPropState !== 'undefined') {
        propsToSerialize[opt_targetProp] = currentPropState;
      }
    } else {
      propsToSerialize = actor.get();
    }

    var combinedPropsToSerialize =
      combineTranfromProperties(propsToSerialize, actor._transformOrder);

    var printVal;
    _.each(combinedPropsToSerialize, function (val, key) {
      printVal = val;
      var printKey = key;

      if (key === 'transform') {
        printKey = TRANSFORM_TOKEN;
      }

      serializedProps.push(printKey + ':' + printVal + ';');
    });

    serializedProps.push('}');
    return serializedProps.join('');
  }

  // Exposes helper functions for unit testing.  Gets compiled away in build
  // process.
  if (REKAPI_DEBUG) {
    Rekapi._private.cssRenderer = {
      'TRANSFORM_TOKEN': TRANSFORM_TOKEN
      ,'VENDOR_TOKEN': VENDOR_TOKEN
      ,'applyVendorBoilerplates': applyVendorBoilerplates
      ,'applyVendorPropertyPrefixes': applyVendorPropertyPrefixes
      ,'generateBoilerplatedKeyframes': generateBoilerplatedKeyframes
      ,'generateCSSClass': generateCSSClass
      ,'generateCSSAnimationProperties': generateCSSAnimationProperties
      ,'generateActorKeyframes': generateActorKeyframes
      ,'generateActorTrackSegment': generateActorTrackSegment
      ,'combineTranfromProperties': combineTranfromProperties
      ,'serializeActorStep': serializeActorStep
      ,'generateAnimationNameProperty': generateAnimationNameProperty
      ,'generateAnimationDurationProperty': generateAnimationDurationProperty
      ,'generateAnimationDelayProperty': generateAnimationDelayProperty
      ,'generateAnimationFillModeProperty': generateAnimationFillModeProperty
      ,'generateAnimationTimingFunctionProperty':
          generateAnimationTimingFunctionProperty
      ,'generateAnimationIterationProperty': generateAnimationIterationProperty
      ,'generateAnimationCenteringRule': generateAnimationCenteringRule
      ,'simulateLeadingWait': simulateLeadingWait
      ,'simulateTrailingWait': simulateTrailingWait
      ,'canOptimizeKeyframeProperty': canOptimizeKeyframeProperty
      ,'canOptimizeAnyKeyframeProperties': canOptimizeAnyKeyframeProperties
      ,'generateOptimizedKeyframeSegment': generateOptimizedKeyframeSegment
      ,'getActorCSS': getActorCSS
      ,'transformFunctions': transformFunctions
    };
  }
});
