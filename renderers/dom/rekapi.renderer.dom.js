import _ from 'lodash';
import { Tweenable } from 'shifty';
import Rekapi, {
  rendererInitHooks,
  fireEvent
} from '../../src/rekapi.core';

const { now } = Tweenable;

const vendorTransforms = [
  'transform',
  'webkitTransform',
  'MozTransform',
  'oTransform',
  'msTransform'
];

const transformFunctions = [
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
  'skewY'
];

const DEFAULT_FPS = 30;
const TRANSFORM_TOKEN = 'TRANSFORM';
const R_TRANSFORM_TOKEN = new RegExp(TRANSFORM_TOKEN, 'g');
const VENDOR_TOKEN = 'VENDOR';
const R_VENDOR_TOKEN = new RegExp(VENDOR_TOKEN, 'g');
const VENDOR_PREFIXES = {
  microsoft: '-ms-',
  mozilla: '-moz-',
  opera: '-o-',
  w3: '',
  webkit: '-webkit-'
};
const BEZIERS = {
  linear: '.25,.25,.75,.75',
  easeInQuad: '.55,.085,.68,.53',
  easeInCubic: '.55,.055,.675,.19',
  easeInQuart: '.895,.03,.685,.22',
  easeInQuint: '.755,.05,.855,.06',
  easeInSine: '.47,0,.745,.715',
  easeInExpo: '.95,.05,.795,.035',
  easeInCirc: '.6,.04,.98, .335',
  easeOutQuad: '.25,.46,.45,.94',
  easeOutCubic: '.215,.61,.355,1',
  easeOutQuart: '.165,.84,.44,1',
  easeOutQuint: '.23,1,.32,1',
  easeOutSine: '.39,.575,.565,1',
  easeOutExpo: '.19,1,.22,1',
  easeOutCirc: '.075,.82,.165,1',
  easeInOutQuad: '.455,.03,.515,.955',
  easeInOutCubic: '.645,.045,.355,1',
  easeInOutQuart: '.77,0,.175,1',
  easeInOutQuint: '.86,0.07,1',
  easeInOutSine: '.445,.05,.55,.95',
  easeInOutExpo: '1,0,0,1',
  easeInOutCirc: '.785,.135,.15,.86'
};

// The timer to remove an injected style isn't likely to match the actual
// length of the CSS animation, so give it some extra time to complete so it
// doesn't cut off the end.
const INJECTED_STYLE_REMOVAL_BUFFER_MS = 250;

const R_3D_RULE = /3d\(/g;
const R_3D_TOKEN = /__THREED__/g;
const _3D_RULE = '3d(';
const _3D_TOKEN = '__THREED__';

// PRIVATE UTILITY FUNCTIONS
//

/*!
 * http://stackoverflow.com/a/3886106
 *
 * @param {number} number
 */
const isInt = number => number % 1 === 0;

/*!
 * @param {Rekapi} rekapi
 */
rendererInitHooks.cssAnimate = rekapi => {
  // Node.nodeType 1 is an ELEMENT_NODE.
  // https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeType
  if (rekapi.context.nodeType === 1) {
    rekapi.renderer = new DOMRenderer(rekapi);
  }
};

/*!
 * @return {string}
 */
const vendorPrefix = (() => {
  const { style } = document.body;

  return (
    '-webkit-animation' in style ? 'webkit'    :
    '-moz-animation'    in style ? 'mozilla'   :
    '-ms-animation'     in style ? 'microsoft' :
    '-o-animation'      in style ? 'opera'     :
    'animation'         in style ? 'w3'        :
    ''
  );
})();

/*!
 * Fixes a really bizarre issue that only seems to affect Presto and Blink.
 * In some situations, DOM nodes will not detect dynamically injected <style>
 * elements.  Explicitly re-inserting DOM nodes seems to fix the issue.  Not
 * sure what causes this issue.  Not sure why this fixes it.
 *
 * @param {Rekapi} rekapi
 */
const forceStyleReset = rekapi => {
  const dummyDiv = document.createElement('div');

  _.each(rekapi.getAllActors(), actor => {
    if (actor.context.nodeType === 1) {
      const { context } = actor;
      const { parentElement } = context;

      parentElement.replaceChild(dummyDiv, context);
      parentElement.replaceChild(context, dummyDiv);
    }
  });
};

let styleID = 0;
/*!
 * @param {Rekapi} rekapi
 * @param {string} css The css content that the <style> element should have.
 * @return {HTMLStyleElement} The unique ID of the injected <style> element.
 */
const injectStyle = (rekapi, css) => {
  const style = document.createElement('style');
  const id = `rekapi-${styleID++}`;
  style.id = id;
  style.innerHTML = css;
  document.head.appendChild(style);
  forceStyleReset(rekapi);

  return style;
};

/*!
 * @param {HTMLElement} element
 * @param {string} styleName
 * @param {string|number} styleValue
 */
const setStyle = (element, styleName, styleValue) =>
  element.style[styleName] = styleValue;

/*!
 * @param {string} name A transform function name
 * @return {boolean}
 */
const isTransformFunction = name => _.contains(transformFunctions, name);

/*!
 * Builds a concatenated string of given transform property values in order.
 *
 * @param {Array.<string>} orderedTransforms Array of ordered transform
 *     function names
 * @param {Object} transformProperties Transform properties to build together
 * @return {string}
 */
const buildTransformValue = (orderedTransforms, transformProperties) => {
  const transformComponents = [];

  _.each(orderedTransforms, functionName => {
    if (transformProperties[functionName] !== undefined) {
      transformComponents.push(
        `${functionName}(${transformProperties[functionName]})`
      );
    }
  });

  return transformComponents.join(' ');
};

/*!
 * Sets value for all vendor prefixed transform properties on an element
 *
 * @param {HTMLElement} element The actor's DOM element
 * @param {string} transformValue The transform style value
 */
const setTransformStyles = (element, transformValue) =>
  vendorTransforms.forEach(prefixedTransform =>
    setStyle(element, prefixedTransform, transformValue)
  );

/*!
 * @param {Rekapi.Actor} actor
 * @param {HTMLElement} element
 * @param {Object} state
 */
const actorRender = (actor, element, state) => {
  const propertyNames = Object.keys(state);
  // TODO:  Optimize the following code so that propertyNames is not looped
  // over twice.
  const transformFunctionNames = propertyNames.filter(isTransformFunction);
  const otherProperties = _.pick(
    state,
    _.reject(propertyNames, isTransformFunction)
  );

  if (transformFunctionNames.length) {
    setTransformStyles(element,
      buildTransformValue(
        actor._transformOrder,
        _.pick(state, transformFunctionNames)
      )
    );
  } else if (state.transform) {
    setTransformStyles(element, state.transform);
  }

  _.each(otherProperties, (styleValue, styleName) =>
    setStyle(element, styleName, styleValue)
  );
};

/*!
 * @param {Rekapi.Actor} actor
 */
const actorTeardown = actor => {
  const { context } = actor;
  const classList = context.className.match(/\S+/g);
  const sanitizedClassList =
    _.without(classList, DOMRenderer.getActorClassName(actor));
  context.className = sanitizedClassList.join(' ');
};

/*!
 * transform properties like translate3d and rotate3d break the cardinality
 * of multi-ease easing strings, because the "3" gets treated like a
 * tweenable value.  Transform "3d(" to "__THREED__" to prevent this, and
 * transform it back in _afterKeyframePropertyInterpolate.
 *
 * @param {Rekapi.KeyframeProperty} keyframeProperty
 */
const _beforeKeyframePropertyInterpolate = keyframeProperty => {
  if (keyframeProperty.name !== 'transform') {
    return;
  }

  const { value, nextProperty } = keyframeProperty;

  if (nextProperty && value.match(R_3D_RULE)) {
    keyframeProperty.value = value.replace(R_3D_RULE, _3D_TOKEN);
    nextProperty.value = nextProperty.value.replace(R_3D_RULE, _3D_TOKEN);
  }
};

/*!
 * @param {Rekapi.KeyframeProperty} keyframeProperty
 * @param {Object} interpolatedObject
 */
const _afterKeyframePropertyInterpolate = (keyframeProperty, interpolatedObject) => {
  if (keyframeProperty.name !== 'transform') {
    return;
  }

  const { value, nextProperty, name } = keyframeProperty;

  if (nextProperty && value.match(_3D_TOKEN)) {
    keyframeProperty.value = value.replace(_3D_TOKEN, _3D_RULE);
    nextProperty.value = nextProperty.value.replace(_3D_TOKEN, _3D_RULE);
    interpolatedObject[name] =
      interpolatedObject[name].replace(_3D_TOKEN, _3D_RULE);
  }
};

/*!
 * @param {Rekapi} rekapi
 * @param {Rekapi.Actor} actor
 */
const onAddActor = (rekapi, actor) => {
  const { context } = actor;

  if (context.nodeType !== 1) {
    return;
  }

  const className = DOMRenderer.getActorClassName(actor);

  // Add the class if it's not already there.
  // Using className instead of classList to make IE happy.
  if (!context.className.match(className)) {
    context.className += ` ${className}`;
  }

  Object.assign(actor, {
    render: actorRender.bind(actor, actor),
    teardown: actorTeardown.bind(actor, actor),
    _transformOrder: transformFunctions.slice(0),
    _beforeKeyframePropertyInterpolate,
    _afterKeyframePropertyInterpolate
  });
};

export default class DOMRenderer {
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
  constructor (rekapi) {

    Object.assign(this, {
      rekapi,

      // @private {number}
      _playTimestamp: null,

      // @private {string}
      _cachedCSS: null,

      // The HTMLStyleElement that gets injected into the DOM.
      // @private {HTMLStyleElement)
      _styleElement: null,

      // @private {number}
      _stopSetTimeoutHandle: null
    });

    rekapi.on('timelineModified', _.bind(function () {
      this._cachedCSS = null;
    }, this));

    rekapi.on('addActor', onAddActor);
  }

  /**
   * @method canAnimateWithCSS
   * @return {boolean} Whether or not the browser supports CSS `@keyframe`
   * animations.
   */
  canAnimateWithCSS () {
    return !!vendorPrefix;
  }

  /**
   * Play the Rekapi animation as a CSS `@keyframe` animation.
   *
   * Note that this is different from `{{#crossLink
   * "Rekapi/play:method"}}{{/crossLink}}`.  This method only applies to CSS
   * `@keyframe` animations.
   * @method play
   * @param {number=} iterations How many times the animation should loop.
   * This can be `null` or `0` if you want to loop the animation endlessly but
   * also specify a value for `fps`.
   * @param {number=} fps How many `@keyframes` to generate per second of
   * the animation.  A higher value results in a more precise CSS animation,
   * but it will take longer to generate.  The default value is `30`.  You
   * should not need to go higher than `60`.
   */
  play (iterations = undefined, fps = undefined) {
    if (this.isPlaying()) {
      this.stop();
    }

    this._styleElement = injectStyle(
      this.rekapi,
      this._cachedCSS || this.prerender.apply(this, arguments)
    );

    this._playTimestamp = now();

    if (iterations) {
      const animationLength = (iterations * this.rekapi.getAnimationLength());
      this._stopSetTimeoutHandle = setTimeout(
        this.stop.bind(this, true),
        animationLength + INJECTED_STYLE_REMOVAL_BUFFER_MS
      );
    }

    fireEvent(this.rekapi, 'play');
  }

  /**
   * Stop a CSS `@keyframe` animation.  This also removes any `<style>`
   * elements that were dynamically injected into the DOM.
   *
   * Note that this is different from
   * `{{#crossLink "Rekapi/stop:method"}}{{/crossLink}}`.  This method only
   * applies to CSS `@keyframe` animations.
   * @method stop
   * @param {boolean=} goToEnd If true, skip to the end of the animation.
   * If false or omitted, set inline styles on the actor elements to keep them
   * in their current position.
   */
  stop (goToEnd = undefined) {
    if (this.isPlaying()) {
      clearTimeout(this._stopSetTimeoutHandle);

      // Forces a style update in WebKit/Presto
      this._styleElement.innerHTML = '';

      document.head.removeChild(this._styleElement);
      this._styleElement = null;
      const animationLength = this.rekapi.getAnimationLength();

      this.rekapi.update(
        goToEnd ?
          animationLength :
          (now() - this._playTimestamp) % animationLength
      );

      fireEvent(this.rekapi, 'stop');
    }
  }

  /**
   * @method isPlaying
   * @return {boolean} Whether or not a CSS `@keyframe` animation is running.
   */
  isPlaying () {
    return !!this._styleElement;
  }

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
   * @param {number=} iterations How many times the animation should loop.
   * This can be `null` or `0` if you want to loop the animation endlessly but
   * also specify a value for `fps`.
   * @param {number=} fps How many `@keyframes` to generate per second of
   * the animation.  A higher value results in a more precise CSS animation,
   * but it will take longer to generate.  The default value is `30`.  You
   * should not need to go higher than `60`.
   * @return {string} The prerendered CSS string.  You likely won't need this,
   * as it is also cached internally.
   */
  prerender (iterations = undefined, fps = undefined) {
    return this._cachedCSS = this.toString({
      vendors: [vendorPrefix],
      fps,
      iterations
    });
  }

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
  setActorTransformOrder (actor, orderedTransforms) {
    const unrecognizedTransforms = _.reject(orderedTransforms, isTransformFunction);

    if (unrecognizedTransforms.length) {
      throw `Unknown or unsupported transform functions: ${unrecognizedTransforms.join(', ')}`;
    }

    // Ignore duplicate transform function names in the array
    actor._transformOrder = _.uniq(orderedTransforms);

    return this.rekapi;
  }

  // FIXME: Don't redefine toString with a method that takes parameters.  Name
  // this something else and deprecate DOMRenderer#toString.
  /**
   * Converts Rekapi animations to CSS `@keyframes`.
   * @method toString
   * @param {Object=} options
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
  toString (options = {}) {
    const animationCSS = [];

    _.each(this.rekapi.getAllActors(), actor => {
      if (actor.context.nodeType === 1) {
        animationCSS.push(getActorCSS(actor, options));
      }
    });

    return animationCSS.join('\n');
  }
}

/**
 * @method getActorClassName
 * @param {Rekapi.Actor} actor
 * @return {string} The default CSS class that is targeted by `{{#crossLink
 * "Rekapi.DOMRenderer/toString:method"}}{{/crossLink}}` if a custom class is
 * not specified.  This may be useful for getting a standard and consistent
 * CSS class name for an actor's DOM element.
 */
DOMRenderer.getActorClassName = actor => `actor-${actor.id}`;

/*!
 * Creates the CSS `@keyframes` for an individual actor.
 * @param {Rekapi.Actor} actor
 * @param {Object=} options Same as options for Rekapi.prototype.toCSS.
 * @return {string}
 */
const getActorCSS = (actor, options = {}) => {
  const { name, vendors, iterations, isCentered } = options;

  const animName = name ?
    (actor.rekapi.getActorCount() > 1 ?
      `${name}-${actor.id}` :
      name
    ) :
    DOMRenderer.getActorClassName(actor);

  const steps = Math.ceil(
    (actor.rekapi.getAnimationLength() / 1000) * (options.fps || DEFAULT_FPS)
  );

  const doCombineProperties = !canOptimizeAnyKeyframeProperties(actor);

  return [
    generateCSSClass(
      actor,
      animName,
      doCombineProperties,
      vendors,
      iterations,
      isCentered
    ),
    generateBoilerplatedKeyframes(
      actor,
      animName,
      steps,
      doCombineProperties,
      vendors
    )
  ].join('\n');
};

// toString-SPECIFIC PRIVATE UTILITY FUNCTIONS
//

/*!
 * @param {Rekapi.Actor} actor
 * @param {string} animName
 * @param {number} steps
 * @param {boolean} doCombineProperties
 * @param {Array.<string>=} vendors
 * @return {string}
 */
const generateBoilerplatedKeyframes = (
  actor,
  animName,
  steps,
  doCombineProperties,
  vendors = undefined
) =>

  doCombineProperties ?
    applyVendorBoilerplates(
      generateCombinedActorKeyframes(actor, steps),
      animName,
      vendors
    ) :
    actor.getTrackNames().map(trackName =>
      applyVendorBoilerplates(
        generateActorKeyframes(actor, steps, trackName),
        `${animName}-${trackName}`,
        vendors
      )
    ).join('\n');

/*!
 * @param {string} toKeyframes Generated keyframes to wrap in boilerplates
 * @param {string} animName
 * @param {Array.<string>=} vendors Vendor boilerplates to be applied.
 *     Should be any of the values in Rekapi.util.VENDOR_PREFIXES.
 * @return {string}
 */
const applyVendorBoilerplates = (toKeyframes, animName, vendors = ['w3']) =>
  vendors.map(vendor =>
    applyVendorPropertyPrefixes(
      `@${VENDOR_PREFIXES[vendor]}keyframes ${animName}-keyframes {
${''  }${toKeyframes}
${''  }}`,
      vendor)
  ).join('\n');

/*!
 * @param {string} keyframes
 * @param {vendor} vendor
 * @return {string}
 */
const applyVendorPropertyPrefixes = (keyframes, vendor) =>
  keyframes
    .replace(
      R_VENDOR_TOKEN,
      VENDOR_PREFIXES[vendor]
    )
    .replace(
      R_TRANSFORM_TOKEN,
      `${VENDOR_PREFIXES[vendor]}transform`
    );

/*!
 * @param {Rekapi.Actor} actor
 * @param {string} animName
 * @param {boolean} doCombineProperties
 * @param {Array.<string>=} vendors
 * @param {number|string=} iterations
 * @param {boolean=} isCentered
 * @return {string}
 */
const generateCSSClass = (
    actor,
    animName,
    doCombineProperties,
    vendors = ['w3'],
    iterations = undefined,
    isCentered = undefined
  ) =>

  `.${animName} {
${  vendors.map(vendor =>
      generateCSSAnimationProperties(
        actor,
        animName,
        vendor,
        doCombineProperties,
        iterations,
        isCentered
      )
    ).join('\n')}
}`;

/*!
 * @param {Rekapi.Actor} actor
 * @param {string} animName
 * @param {string} vendor
 * @param {boolean} doCombineProperties
 * @param {number|string=} iterations
 * @param {boolean=} isCentered
 * @return {string}
 */
const generateCSSAnimationProperties = (
  actor,
  animName,
  vendor,
  doCombineProperties,
  iterations = undefined,
  isCentered = false
) => {
  const prefix = VENDOR_PREFIXES[vendor];
  const start = actor.getStart();
  const end = actor.getEnd();

  const generatedProperties = [
    generateAnimationNameProperty(actor, animName, prefix, doCombineProperties),
    `  ${prefix}animation-duration: ${end - start}ms;`,
    `  ${prefix}animation-delay: ${start}ms;`,
    `  ${prefix}animation-fill-mode: forwards;`,
    `  ${prefix}animation-timing-function: linear;`,
    generateAnimationIterationProperty(actor.rekapi, prefix, iterations),
  ];

  if (isCentered) {
    generatedProperties.push(`  ${prefix}transform-origin: 0 0;`);
  }

  return generatedProperties.join('\n');
};

/*!
 * @param {Rekapi.Actor} actor
 * @param {string} animName
 * @param {string} prefix
 * @param {boolean} doCombineProperties
 * @return {string}
 */
const generateAnimationNameProperty = (
  actor,
  animationName,
  prefix,
  doCombineProperties
) => {

  let renderedName = `  ${prefix}animation-name:`;

  if (doCombineProperties) {
    renderedName += ` ${animationName}-keyframes;`;
  } else {
    const trackNames = actor.getTrackNames();

    const trackNamesToPrint = _.intersection(trackNames, transformFunctions).length ?
      _.difference(trackNames, transformFunctions).concat('transform') :
      trackNames;

    renderedName = trackNamesToPrint.reduce(
      (renderedName, trackName) =>
        `${renderedName} ${animationName}-${trackName}-keyframes,`,
      renderedName
    ).replace(/.$/, ';');
  }

  return renderedName;
};

/*!
 * @param {Rekapi} rekapi
 * @param {string} prefix
 * @param {number|string=} iterations
 * @return {string}
 */
const generateAnimationIterationProperty = (
  rekapi,
  prefix,
  iterations = undefined
) =>
  `  ${prefix}animation-iteration-count: ${iterations !== undefined ?
    iterations :
    rekapi._timesToIterate === -1 ?
      'infinite' :
      rekapi._timesToIterate
   };`;

// OPTIMIZED OUTPUT GENERATOR FUNCTIONS
//

/*!
 * @param {Rekapi.KeyframeProperty} property
 * @return {boolean}
 */
const canOptimizeKeyframeProperty = property =>
  !property.nextProperty ?
    false :
    isSegmentAWait(property, property.nextProperty) ?
      true :
      property.nextProperty.easing.split(' ').every((easing, i, easings) =>
        !(!BEZIERS[easing] || (i > 0 && easings[i - 1] !== easing))
      );

/*!
 * @param {Rekapi.KeyframeProperty} property
 * @param {Rekapi.KeyframeProperty} nextProperty
 * @return {boolean}
 */
const isSegmentAWait = (property, nextProperty) =>
  property.name === nextProperty.name &&
    property.value === nextProperty.value;

/*!
 * @param {Rekapi.Actor} actor
 * @return {boolean}
 */
const canOptimizeAnyKeyframeProperties = (actor) =>
  _.any(
    actor._keyframeProperties,
    canOptimizeKeyframeProperty
  ) &&
  !_.intersection(
    Object.keys(actor._propertyTracks),
    transformFunctions
  ).length;

/*!
 * @param {Rekapi.KeyframeProperty} property
 * @param {number} fromPercent
 * @param {number} toPercent
 * @return {string}
 */
const generateOptimizedKeyframeSegment = (
  property,
  fromPercent,
  toPercent
) => {
  const name = property.name === 'transform' ?
    TRANSFORM_TOKEN :
    property.name;

  const { nextProperty, value } = property;
  const from = isInt(fromPercent) ? fromPercent : fromPercent.toFixed(2);
  const to = isInt(toPercent) ? toPercent : toPercent.toFixed(2);
  const bezier = BEZIERS[nextProperty.easing.split(' ')[0]];

  return (
 `  ${from}% {${name}:${value};${''
  }${VENDOR_TOKEN}animation-timing-function: cubic-bezier(${bezier});${''
  }}
  ${to}% {${name}:${nextProperty.value};}`
  );
};

// UN-OPTIMIZED OUTPUT GENERATOR FUNCTIONS
//

/*!
 * @param {Rekapi.Actor} actor
 * @param {number} steps
 * @param {string} track
 * @return {string}
 */
const generateActorKeyframes = (actor, steps, track) => {
  // This function is completely crazy.  Simplify it?
  const accumulator = [];
  const end = actor.getEnd();
  const start = actor.getStart();
  const length = actor.getLength();
  const leadingWait = simulateLeadingWait(actor, track, start);

  if (leadingWait) {
    accumulator.push(leadingWait);
  }

  let previousSegmentWasOptimized = false;
  actor._propertyTracks[track].forEach(prop => {
    const fromPercent = calculateStepPercent(prop, start, length);
    const { nextProperty } = prop;

    let toPercent, increments, incrementSize;

    if (nextProperty) {
      toPercent = calculateStepPercent(nextProperty, start, length);
      const delta = toPercent - fromPercent;
      increments = Math.floor((delta / 100) * steps) || 1;
      incrementSize = delta / increments;
    } else {
      toPercent = 100;
      increments = 1;
      incrementSize = 1;
    }

    let trackSegment;
    if (nextProperty && isSegmentAWait(prop, nextProperty)) {
      trackSegment = generateActorTrackWaitSegment(
        actor,
        start,
        prop,
        nextProperty,
        fromPercent,
        toPercent
      );

      if (previousSegmentWasOptimized) {
        trackSegment.shift();
      }

      previousSegmentWasOptimized = false;

    } else if (canOptimizeKeyframeProperty(prop)) {
      trackSegment = generateOptimizedKeyframeSegment(
        prop,
        fromPercent,
        toPercent
      );

      // If this and the previous segment are optimized, remove the
      // destination keyframe of the previous step.  The starting keyframe of
      // the newest segment makes it redundant.
      if (previousSegmentWasOptimized) {
        accumulator[accumulator.length - 1] =
          accumulator[accumulator.length - 1].split('\n')[0];
      }

      previousSegmentWasOptimized = true;
    } else {
      trackSegment = generateActorTrackSegment(
        actor,
        increments,
        incrementSize,
        start,
        fromPercent,
        prop
      );

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

  const trailingWait = simulateTrailingWait(actor, track, start, end);

  if (trailingWait) {
    accumulator.push(trailingWait);
  }

  return accumulator.join('\n');
};

/*!
 * @param {Rekapi.Actor} actor
 * @param {number} steps
 * @return {string}
 */
const generateCombinedActorKeyframes = (actor, steps) =>
  generateActorTrackSegment(actor, steps + 1, 100 / steps, 0, 0).join('\n');

/*!
 * @param {Rekapi.Actor} actor
 * @param {string} track
 * @param {number} actorStart
 * @return {string|undefined}
 */
const simulateLeadingWait = (actor, track, actorStart) => {
  const firstProp = actor._propertyTracks[track][0];

  if (firstProp !== undefined && firstProp.millisecond !== actorStart) {
    return generateActorTrackSegment(
      actor,
      1,
      1,
      firstProp.millisecond,
      0,
      firstProp
    ).join('\n');
  }
};

/*!
 * @param {Rekapi.Actor} actor
 * @param {string} track
 * @param {number} actorStart
 * @param {number} actorEnd
 * @return {string|undefined}
 */
const simulateTrailingWait = (actor, track, actorStart, actorEnd) => {
  const lastProp = _.last(actor._propertyTracks[track]);

  if (lastProp !== undefined && lastProp.millisecond !== actorEnd) {
    return generateActorTrackSegment(
      actor,
      1,
      1,
      actorStart,
      100,
      lastProp
    ).join('\n');
  }
};

/*!
 * @param {Rekapi.KeyframeProperty} property
 * @param {number} actorStart
 * @param {number} actorLength
 * @return {number}
 */
const calculateStepPercent = (property, actorStart, actorLength) =>
  ((property.millisecond - actorStart) / actorLength) * 100;

/*!
 * @param {Rekapi.Actor} actor
 * @param {number} increments
 * @param {number} incrementSize
 * @param {number} actorStart
 * @param {number} fromPercent
 * @param {Rekapi.KeyframeProperty=} fromProp
 * @return {Array.<string>}
 */
const generateActorTrackSegment = (
  actor,
  increments,
  incrementSize,
  actorStart,
  fromPercent,
  fromProp = undefined
) => {

  const accumulator = [];
  const length = actor.getLength();

  for (let i = 0; i < increments; i++) {
    const percent = fromPercent + (i * incrementSize);

    actor._updateState(
      ((percent / 100) * length) + actorStart,
      true
    );

    const step = serializeActorStep(actor, fromProp && fromProp.name);

    accumulator.push(`  ${+percent.toFixed(2)}% ${step}`);
  }

  return accumulator;
};

/*!
 * @param {Rekapi.Actor} actor
 * @param {number} actorStart
 * @param {Rekapi.KeyframeProperty} fromProp
 * @param {Rekapi.KeyframeProperty} toProp
 * @param {number} fromPercent
 * @param {number} toPercent
 * @return {Array.<string>}
 */
const generateActorTrackWaitSegment = (
  actor,
  actorStart,
  fromProp,
  toProp,
  fromPercent,
  toPercent
) =>
  generateActorTrackSegment(
    actor,
    1,
    toPercent - fromPercent,
    actorStart,
    fromPercent,
    fromProp
  );

/**
 * @param {Object} propsToSerialize
 * @param {Array.<string>} transformNames
 * @return {Object}
 */
const combineTranfromProperties = (propsToSerialize, transformNames) => {
  if (_.isEmpty(
    _.pick.apply(_, [propsToSerialize].concat(transformFunctions))
    )
  ) {
    return propsToSerialize;
  } else {
    const serializedProps = _.clone(propsToSerialize);

    serializedProps[TRANSFORM_TOKEN] = transformNames.reduce(
      (combinedProperties, transformFunction) => {
      if (_.has(serializedProps, transformFunction)) {
        combinedProperties +=
          ` ${transformFunction}(${serializedProps[transformFunction]})`;

        delete serializedProps[transformFunction];
      }

      return combinedProperties;
    }, '').slice(1);

    return serializedProps;
  }
};

/*!
 * @param {Rekapi.Actor} actor
 * @param {string=} targetProp
 * @return {string}
 */
const serializeActorStep = (actor, targetProp = undefined) =>
  JSON.stringify(_.reduce(
    combineTranfromProperties(
      targetProp ? { [targetProp]: actor.get()[targetProp] } : actor.get(),
      actor._transformOrder
    ),
    (serializedProps, val, key) => {
      serializedProps[key === 'transform' ? TRANSFORM_TOKEN : key] = val;
      return serializedProps;
    },
    {}));

// Expose helper functions for unit testing.
// FIXME: Don't include this in optimized builds.
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
  ,'generateAnimationIterationProperty': generateAnimationIterationProperty
  ,'simulateLeadingWait': simulateLeadingWait
  ,'simulateTrailingWait': simulateTrailingWait
  ,'canOptimizeKeyframeProperty': canOptimizeKeyframeProperty
  ,'canOptimizeAnyKeyframeProperties': canOptimizeAnyKeyframeProperties
  ,'generateOptimizedKeyframeSegment': generateOptimizedKeyframeSegment
  ,'getActorCSS': getActorCSS
  ,'transformFunctions': transformFunctions
};
