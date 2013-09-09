rekapiModules.push(function (context) {

  'use strict';

  var Kapi = context.Kapi;
  var _ = Kapi._;
  var now = Kapi.Tweenable.now;


  // CONSTANTS
  //

  // The timer to remove an injected style isn't likely to match the actual
  // length of the CSS animation, so give it some extra time to complete so it
  // doesn't cut off the end.
  var INJECTED_STYLE_REMOVAL_BUFFER_MS = 250;


  // PRIVATE UTILITY FUNCTIONS
  //

  Kapi.prototype._contextInitHook.cssAnimate = function () {
    this.css = new CSSRenderer(this);
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
   * @param {string} css The css content that the <style> element should have.
   * @return {HTMLStyleElement} The unique ID of the injected <style> element.
   */
  function injectStyle (css) {
    var style = document.createElement('style');
    var id = 'rekapi-' + styleID++;
    style.id = id;
    style.innerHTML = css;
    document.head.appendChild(style);

    return style;
  }


  /*!
   * Fixes a really bizarre issue that only seems to affect Presto/Opera.  In
   * some situations, DOM nodes will not detect dynamically injected <style>
   * elements.  Explicitly re-inserting DOM nodes seems to fix the issue.  Not
   * sure what causes this issue.  Not sure why this fixes it.  Not sure if
   * this affects Blink-based Opera browsers.
   *
   * @param {Kapi} kapi
   */
  function forceStyleInjection (kapi) {
    var dummyDiv = document.createElement('div');

    _.each(kapi.getAllActors(), function (actor) {
      if (actor instanceof Kapi.DOMActor) {
        var actorEl = actor._context;
        var actorElParent = actorEl.parentElement;

        actorElParent.replaceChild(dummyDiv, actorEl);
        actorElParent.replaceChild(actorEl, dummyDiv);
      }
    });

    dummyDiv = null;
  }


  // CSS RENDERER OBJECT
  //

  /**
   * The `CSSRenderer` module allows you to run a Rekapi animation as a CSS `@keyframe` animation.  Standard Rekapi animations are powered by JavaScript, but in many cases using CSS `@keyframes` is smoother.
   *
   * __Note!__ This is an experimental feature.  If you encounter any issues, please report them with the [Rekapi issue tracker](https://github.com/jeremyckahn/rekapi/issues?page=1&state=open).
   *
   * Advantages of playing an animation with CSS `@keyframes` instead of JavaScript:
   *
   *   - Smoother animations in modern browsers (particularly noticeable in Webkit and mobile browsers).
   *   - The JavaScript thread is freed from performing animation updates, resulting in more resources for other logic.
   *
   * Disadvantages of CSS `@keyframes`:
   *
   *   - No start/stop/goto control - once the animation runs, it runs from start to finish.
   *   - Prerending animations can take a non-trivial amount of time, so you may have to be clever with how to spend the cycles to do it.
   *   - Currently, no `Kapi` [events](../../src/rekapi.core.js.html#on) can be bound to CSS animations.
   *
   * This module requires both the [`toCSS`](/dist/doc/ext/to-css/rekapi.to-css.js.html) and [`Kapi.DOMActor`](/dist/doc/ext/dom/rekapi.dom.actor.js.html) modules (they are included in the standard Rekapi distribution).  Functionally, `CSSRenderer` works by prerendering a CSS animation and injecting it into the DOM.  You'll never have to call the `CSSRenderer` constructor explicitly, that is done for you when a Rekapi instance is initialized.
   *
   * An advantage of this module is that CSS animations are not always available, but JavaScript animations are.  Keyframes are defined the same way, but you can choose what method of animation is appropriate at runtime:
   *
   * ```
   *  var kapi = new Kapi();
   *  var actor = new Kapi.DOMActor(document.getElementById('actor-1'));
   *
   *  kapi.addActor(actor);
   *  actor.keyframe(0,    { left: '0px'   });
   *  actor.keyframe(1000, { left: '250px' }, 'easeOutQuad');
   *
   *  // Feature detect for @keyframe support
   *  if (kapi.css.canAnimateWithCSS()) {
   *    kapi.css.play();
   *  } else {
   *    kapi.play();
   *  }
   * ```
   *
   * __[Example](/ext/css-animate/sample/play-many-actors.html)__
   *
   * @param {Kapi} kapi
   * @constructor
   */
  Kapi.CSSRenderer = function (kapi) {
    if (!Kapi.DOMActor && !Kapi.prototype.toCSS) {
      throw 'CSSRenderer requires the DOMActor and toCSS modules.';
    }

    this.kapi = kapi;

    // @private {number}
    this._playTimestamp = null;

    // @private {string}
    this._cachedCSS = null;

    // The HTMLStyleElement that gets injected into the DOM.
    // @private {HTMLStyleElement)
    this._styleElement = null;

    // @private {number}
    this._stopSetTimeoutHandle = null;

    kapi.on('timelineModified', _.bind(function () {
      this._cachedCSS = null;
    }, this));

    return this;
  };
  var CSSRenderer = Kapi.CSSRenderer;


  /**
   * Whether or not the browser supports CSS `@keyframe` animations.
   *
   * @return {boolean}
   */
  CSSRenderer.prototype.canAnimateWithCSS = function () {
    return !!getVendorPrefix();
  };


  /**
   * Prerender and cache CSS so that it is ready to be used when it is needed in the future.  The function signature is identical to [`CSSRenderer#play`](#play).  This is necessary to run a CSS animation and will be called for you if you don't call it manually, but calling this ahead of time (such as on page load) will prevent any perceived lag when a CSS animation starts.  The prerendered animation is cached for reuse until the timeline is modified (by adding, removing or modifying a keyframe).
   *
   * @param {number=} opt_iterations How many times the animation should loop.  This can be null or 0 if you want to loop the animation endlessly but also specify a value for opt_fps.
   * @param {number=} opt_fps How many @keyframes to prerender per second of the animation.  The higher this number, the smoother the CSS animation will be, but the longer it will take to prerender.  The default value is 30, and you should not need to go higher than 60.
   * @return {string} The prerendered CSS string.  You likely won't need this, as it is also cached internally.
   */
  CSSRenderer.prototype.prerender = function (opt_iterations, opt_fps) {
    return this._cachedCSS = this.kapi.toCSS({
      'vendors': [getVendorPrefix()]
      ,'fps': opt_fps
      ,'iterations': opt_iterations
    });
  };


  /**
   * Play the Rekapi animation as a `@keyframe` animation.
   *
   * @param {number=} opt_iterations How many times the animation should loop.  This can be null or 0 if you want to loop the animation endlessly but also specify a value for opt_fps.
   * @param {number=} opt_fps How many @keyframes to prerender per second of the animation.  The higher this number, the smoother the CSS animation will be, but the longer it will take to prerender.  The default value is 30, and you should not need to go higher than 60.
   */
  CSSRenderer.prototype.play = function (opt_iterations, opt_fps) {
    if (this.isPlaying()) {
      this.stop();
    }

    var css = this._cachedCSS || this.prerender.apply(this, arguments);
    this._styleElement = injectStyle(css);
    this._playTimestamp = now();

    if (navigator.userAgent.match(/Presto/)) {
      forceStyleInjection(this.kapi);
    }

    if (opt_iterations) {
      var animationLength = (opt_iterations * this.kapi.animationLength());
      this._stopSetTimeoutHandle = setTimeout(
          _.bind(this.stop, this, true),
          animationLength + INJECTED_STYLE_REMOVAL_BUFFER_MS);
    }

    fireEvent(this.kapi, 'play', _);
  };


  /**
   * Stop a CSS animation.  This also removes any `<style>` elements that were dynamically injected into the DOM.  This method sets inline styles on Actor elements to stay either in their target or current position.
   *
   * @param {boolean} opt_goToEnd If true, set the elements to their target position (in other words, skip to the end of the animation).  If false or omitted, set the Actor elements to stay in their current position.
   */
  CSSRenderer.prototype.stop = function (opt_goToEnd) {
    if (this.isPlaying()) {
      clearTimeout(this._stopSetTimeoutHandle);

      // Forces a style update in WebKit/Presto
      this._styleElement.innerHTML = '';

      document.head.removeChild(this._styleElement);
      this._styleElement = null;

      var updateTime;
      if (opt_goToEnd) {
        updateTime = this.kapi.animationLength();
      } else {
        updateTime = (now() - this._playTimestamp)
            % this.kapi.animationLength();
      }

      this.kapi.update(updateTime);
      fireEvent(this.kapi, 'stop', _);
    }
  };


  /**
   * Whether or not a CSS animation is running.
   *
   * @return {boolean}
   */
  CSSRenderer.prototype.isPlaying = function () {
    return !!this._styleElement;
  };

});
