import { Tweenable } from 'shifty';
import { Rekapi, rendererBootstrappers, fireEvent } from '../rekapi';

import {
  clone,
  difference,
  each,
  intersection,
  pick,
  reject,
  uniq,
  without,
} from '../utils';
import { Actor } from '../actor';
import { KeyframeProperty } from '../keyframe-property';

const { now } = Tweenable;

const vendorTransforms = [
  'transform',
  'webkitTransform',
  'MozTransform',
  'oTransform',
  'msTransform'
];

export const transformFunctions = [
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
export const TRANSFORM_TOKEN = 'TRANSFORM';
export const VENDOR_TOKEN = 'VENDOR';
const R_TRANSFORM_TOKEN = new RegExp(TRANSFORM_TOKEN, 'g');
const R_VENDOR_TOKEN = new RegExp(VENDOR_TOKEN, 'g');
const VENDOR_PREFIXES: { [key: string]: string } = {
  microsoft: '-ms-',
  mozilla: '-moz-',
  opera: '-o-',
  w3: '',
  webkit: '-webkit-',
};
const BEZIERS: { [key: string]: string } = {
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
const _3D_RULE = '3d(';
const _3D_TOKEN = '__THREED__';

// PRIVATE UTILITY FUNCTIONS
//

/*!
 * http://stackoverflow.com/a/3886106
 *
 * @param {number} number
 */
const isInt = (number: number) => number % 1 === 0;

/*!
 * @return {string}
 */
const vendorPrefix = (() => {
  if (typeof document === 'undefined') {
    return;
  }

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
 * @param {Actor} actor
 * @return {string} The default CSS class that is targeted by {@link
 * rekapi.DOMRenderer#getCss} if a custom class is not specified.  This may be
 * useful for getting a standard and consistent CSS class name for an actor's
 * DOM element.
 */
const getActorClassName = (actor: Actor) => `actor-${actor.id}`;

/*!
 * Fixes a really bizarre issue that only seems to affect Presto and Blink.
 * In some situations, DOM nodes will not detect dynamically injected <style>
 * elements.  Explicitly re-inserting DOM nodes seems to fix the issue.  Not
 * sure what causes this issue.  Not sure why this fixes it.
 *
 * @param {Rekapi} rekapi
 */
const forceStyleReset = (rekapi: Rekapi) => {
  const dummyDiv = document.createElement('div');

  rekapi.getAllActors().forEach((actor) => {
    if ((actor.context as HTMLElement).nodeType === 1) {
      const { context } = actor;
      const { parentElement } = context as HTMLElement;

      parentElement?.replaceChild(dummyDiv, context as HTMLElement);
      parentElement?.replaceChild(context as HTMLElement, dummyDiv);
    }
  });
};

let styleID = 0;
/*!
 * @param {Rekapi} rekapi
 * @param {string} css The css content that the <style> element should have.
 * @return {HTMLStyleElement} The unique ID of the injected <style> element.
 */
const injectStyle = (rekapi: Rekapi, css: string) => {
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
const setStyle = (
  element: HTMLElement,
  styleName: string,
  styleValue: string | number
) => {
  (element.style as Record<string, unknown>)[styleName] = styleValue;
};

/*!
 * @param {string} name A transform function name
 * @return {boolean}
 */
const isTransformFunction = (name: string): boolean =>
  transformFunctions.includes(name);

/*!
 * Builds a concatenated string of given transform property values in order.
 *
 * @param {Array.<string>} orderedTransforms Array of ordered transform
 *     function names
 * @param {Object} transformProperties Transform properties to build together
 * @return {string}
 */
const buildTransformValue = (
  orderedTransforms: string[],
  transformProperties: Record<string, string>
) => {
  const transformComponents: string[] = [];

  orderedTransforms.forEach((functionName) => {
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
const setTransformStyles = (element: HTMLElement, transformValue: string) =>
  vendorTransforms.forEach((prefixedTransform) =>
    setStyle(element, prefixedTransform, transformValue)
  );

/*!
 * @param {Actor} actor
 * @param {HTMLElement} element
 * @param {Object} state
 */
const actorRender = (
  actor: Actor,
  element: HTMLElement,
  state: Record<string, string>
) => {
  const propertyNames = Object.keys(state);
  // TODO:  Optimize the following code so that propertyNames is not looped
  // over twice.
  const transformFunctionNames = propertyNames.filter(isTransformFunction);
  const otherProperties = pick(
    state,
    reject(propertyNames, (value: string) => isTransformFunction(value))
  );

  if (transformFunctionNames.length) {
    setTransformStyles(
      element,
      buildTransformValue(
        actor._transformOrder!,
        pick(state, transformFunctionNames)
      )
    );
  } else if (state.transform) {
    setTransformStyles(element, state.transform);
  }

  each(otherProperties, (styleValue: string | number, styleName: string) => {
    setStyle(element, styleName, styleValue);
  });
};

/*!
 * @param {Actor} actor
 */
const actorTeardown = (actor: Actor) => {
  const { context } = actor;
  const classList = (context as HTMLElement).className.match(/\S+/g) || [];
  const sanitizedClassList = without(classList, getActorClassName(actor));
  (context as HTMLElement).className = sanitizedClassList.join(' ');
};

/*!
 * transform properties like translate3d and rotate3d break the cardinality
 * of multi-ease easing strings, because the "3" gets treated like a
 * tweenable value.  Transform "3d(" to "__THREED__" to prevent this, and
 * transform it back in _afterKeyframePropertyInterpolate.
 *
 * @param {KeyframeProperty} keyframeProperty
 */
const _beforeKeyframePropertyInterpolate = (
  keyframeProperty: KeyframeProperty
) => {
  if (keyframeProperty.name !== 'transform') {
    return;
  }

  const { value, nextProperty } = keyframeProperty;

  if (nextProperty && (value as string).match(R_3D_RULE)) {
    keyframeProperty.value = (value as string).replace(R_3D_RULE, _3D_TOKEN);
    (nextProperty.value as string) = (nextProperty.value as string).replace(
      R_3D_RULE,
      _3D_TOKEN
    );
  }
};

/*!
 * @param {KeyframeProperty} keyframeProperty
 * @param {Object} interpolatedObject
 */
const _afterKeyframePropertyInterpolate = (
  keyframeProperty: KeyframeProperty,
  interpolatedObject: Record<string, string>
) => {
  if (keyframeProperty.name !== 'transform') {
    return;
  }

  const { value, nextProperty, name } = keyframeProperty;

  if (nextProperty && (value as string).match(_3D_TOKEN)) {
    keyframeProperty.value = (value as string).replace(_3D_TOKEN, _3D_RULE);
    (nextProperty.value as string) = (nextProperty.value as string).replace(
      _3D_TOKEN,
      _3D_RULE
    );
    interpolatedObject[name] = interpolatedObject[name].replace(
      _3D_TOKEN,
      _3D_RULE
    );
  }
};

/*!
 * @param {Rekapi} rekapi
 * @param {Actor} actor
 */
const onAddActor = (rekapi: Rekapi, actor: Actor) => {
  const { context } = actor;

  if ((context as HTMLElement).nodeType !== 1) {
    return;
  }

  const className = getActorClassName(actor);

  // Add the class if it's not already there.
  // Using className instead of classList to make IE happy.
  if (!(context as HTMLElement).className.match(className)) {
    (context as HTMLElement).className += ` ${className}`;
  }

  actor.render = (context, state) => {
    actorRender(
      actor,
      context as HTMLElement,
      state as Record<string, string>
    );
  };

  actor.teardown = () => {
    actorTeardown(actor);
  };

  actor._transformOrder = transformFunctions.slice(0);
  actor._beforeKeyframePropertyInterpolate = _beforeKeyframePropertyInterpolate;
  actor._afterKeyframePropertyInterpolate = _afterKeyframePropertyInterpolate;
};

/*!
 * @param {string} keyframes
 * @param {vendor} vendor
 * @return {string}
 */
export const applyVendorPropertyPrefixes = (
  keyframes: string,
  vendor: string
): string =>
  keyframes
    .replace(R_VENDOR_TOKEN, VENDOR_PREFIXES[vendor])
    .replace(R_TRANSFORM_TOKEN, `${VENDOR_PREFIXES[vendor]}transform`);

/*!
 * @param {string} toKeyframes Generated keyframes to wrap in boilerplates
 * @param {string} animName
 * @param {Array.<string>=} vendors Vendor boilerplates to be applied.
 *     Should be any of the values in Rekapi.util.VENDOR_PREFIXES.
 * @return {string}
 */
export const applyVendorBoilerplates = (
  toKeyframes: string,
  animName: string,
  vendors = ['w3']
): string =>
  vendors
    .map((vendor) =>
      applyVendorPropertyPrefixes(
        `@${VENDOR_PREFIXES[vendor]}keyframes ${animName}-keyframes {\n${toKeyframes}\n}`,
        vendor
      )
    )
    .join('\n');

/*!
 * @param {KeyframeProperty} property
 * @param {number} fromPercent
 * @param {number} toPercent
 * @return {string}
 */
export const generateOptimizedKeyframeSegment = (
  property: KeyframeProperty,
  fromPercent: number,
  toPercent: number
): string => {
  const name = property.name === 'transform' ? TRANSFORM_TOKEN : property.name;

  const { nextProperty, value } = property;
  const from = isInt(fromPercent) ? fromPercent : fromPercent.toFixed(2);
  const to = isInt(toPercent) ? toPercent : toPercent.toFixed(2);
  const bezier = BEZIERS[(nextProperty!.easing as string).split(' ')[0]];

  return `  ${from}% {${name}:${value};${VENDOR_TOKEN}animation-timing-function: cubic-bezier(${bezier});}
  ${to}% {${name}:${nextProperty!.value};}`;
};

/*!
 * @param {Object} propsToSerialize
 * @param {Array.<string>} transformNames
 * @return {Object}
 */
export const combineTransformProperties = (
  propsToSerialize: Record<string, unknown>,
  transformNames: string[]
): Record<string, unknown> => {
  if (Object.keys(pick(propsToSerialize, transformFunctions)).length) {
    const serializedProps = clone(propsToSerialize) as Record<string, unknown>;

    serializedProps[TRANSFORM_TOKEN] = transformNames
      .reduce((combinedProperties, transformFunction) => {
        if (
          Object.prototype.hasOwnProperty.call(
            serializedProps,
            transformFunction
          )
        ) {
          combinedProperties += ` ${transformFunction}(${
            serializedProps[transformFunction]
          })`;

          delete serializedProps[transformFunction];
        }

        return combinedProperties;
      }, '')
      .slice(1);

    return serializedProps;
  } else {
    return propsToSerialize;
  }
};

/*!
 * @param {Actor} actor
 * @param {string=} targetProp
 * @return {string}
 */
export const serializeActorStep = (
  actor: Actor,
  targetProp?: string
): string => {
  const transformProperties = combineTransformProperties(
    targetProp
      ? {
          [targetProp]: (actor.get() as Record<string, unknown>)[
            targetProp
          ],
        }
      : actor.get(),
    actor._transformOrder!
  );

  const data = Object.keys(transformProperties).reduce(
    (acc, key) =>
      `${acc}${key === 'transform' ? TRANSFORM_TOKEN : key}:${
        transformProperties[key]
      };`,
    ''
  );

  return `{${data}}`;
};

/*!
 * @param {Actor} actor
 * @param {number} increments
 * @param {number} incrementSize
 * @param {number} actorStart
 * @param {number} fromPercent
 * @param {KeyframeProperty=} fromProp
 * @return {Array.<string>}
 */
export const generateActorTrackSegment = (
  actor: Actor,
  increments: number,
  incrementSize: number,
  actorStart: number,
  fromPercent: number,
  fromProp?: KeyframeProperty
): string[] => {
  const accumulator: string[] = [];
  const length = actor.getLength();

  for (let i = 0; i < increments; i++) {
    const percent = fromPercent + i * incrementSize;

    actor._updateState((percent / 100) * length + actorStart, true);

    const step = serializeActorStep(actor, fromProp && fromProp.name);

    accumulator.push(`  ${+percent.toFixed(2)}% ${step}`);
  }

  return accumulator;
};

/*!
 * @param {Actor} actor
 * @param {number} steps
 * @return {string}
 */
const generateCombinedActorKeyframes = (actor: Actor, steps: number): string =>
  generateActorTrackSegment(actor, steps + 1, 100 / steps, 0, 0).join('\n');

/*!
 * @param {Actor} actor
 * @param {string} track
 * @param {number} actorStart
 * @return {string|undefined}
 */
export const simulateLeadingWait = (
  actor: Actor,
  track: string,
  actorStart: number
): string | undefined => {
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
 * @param {Actor} actor
 * @param {string} track
 * @param {number} actorStart
 * @param {number} actorEnd
 * @return {string|undefined}
 */
export const simulateTrailingWait = (
  actor: Actor,
  track: string,
  actorStart: number,
  actorEnd: number
): string | undefined => {
  const [lastProp] = actor._propertyTracks[track].slice(-1);

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
 * @param {KeyframeProperty} property
 * @param {number} actorStart
 * @param {number} actorLength
 * @return {number}
 */
const calculateStepPercent = (
  property: KeyframeProperty,
  actorStart: number,
  actorLength: number
): number => ((property.millisecond - actorStart) / actorLength) * 100;

/*!
 * @param {Actor} actor
 * @param {number} actorStart
 * @param {KeyframeProperty} fromProp
 * @param {KeyframeProperty} toProp
 * @param {number} fromPercent
 * @param {number} toPercent
 * @return {Array.<string>}
 */
const generateActorTrackWaitSegment = (
  actor: Actor,
  actorStart: number,
  fromProp: KeyframeProperty,
  toProp: KeyframeProperty,
  fromPercent: number,
  toPercent: number
): string[] =>
  generateActorTrackSegment(
    actor,
    1,
    toPercent - fromPercent,
    actorStart,
    fromPercent,
    fromProp
  );

/*!
 * @param {KeyframeProperty} property
 * @param {KeyframeProperty} nextProperty
 * @return {boolean}
 */
const isSegmentAWait = (
  property: KeyframeProperty,
  nextProperty: KeyframeProperty
): boolean =>
  property.name === nextProperty.name && property.value === nextProperty.value;

/*!
 * @param {KeyframeProperty} property
 * @return {boolean}
 */
export const canOptimizeKeyframeProperty = (
  property: KeyframeProperty
): boolean => {
  if (!property.nextProperty) {
    return false;
  }

  if (isSegmentAWait(property, property.nextProperty)) {
    return true;
  }

  const easings = (property.nextProperty.easing as string).split(' ');
  const firstEasing = easings[0];

  if (!BEZIERS[firstEasing]) {
    return false;
  }

  return easings.every((easing) => easing === firstEasing);
};

/*!
 * @param {Actor} actor
 * @param {number} steps
 * @param {string} track
 * @return {string}
 */
export const generateActorKeyframes = (
  actor: Actor,
  steps: number,
  track: string
): string => {
  // This function is completely crazy.  Simplify it?
  const accumulator: string[] = [];
  const end = actor.getEnd();
  const start = actor.getStart();
  const length = actor.getLength();
  const leadingWait = simulateLeadingWait(actor, track, start);

  if (leadingWait) {
    accumulator.push(leadingWait);
  }

  let previousSegmentWasOptimized = false;
  actor._propertyTracks[track].forEach((prop) => {
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

    let trackSegment: string | string[];
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
      trackSegment = trackSegment.join('\n');
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
      accumulator.push(trackSegment as string);
    }
  });

  const trailingWait = simulateTrailingWait(actor, track, start, end);

  if (trailingWait) {
    accumulator.push(trailingWait);
  }

  return accumulator.join('\n');
};

/*!
 * @param {Actor} actor
 * @param {string} animName
 * @param {number} steps
 * @param {boolean} doCombineProperties
 * @param {Array.<string>=} vendors
 * @return {string}
 */
export const generateBoilerplatedKeyframes = (
  actor: Actor,
  animName: string,
  steps: number,
  doCombineProperties: boolean,
  vendors?: string[]
): string =>
  doCombineProperties
    ? applyVendorBoilerplates(
        generateCombinedActorKeyframes(actor, steps),
        animName,
        vendors
      )
    : actor
        .getTrackNames()
        .map((trackName) =>
          applyVendorBoilerplates(
            generateActorKeyframes(actor, steps, trackName),
            `${animName}-${trackName}`,
            vendors
          )
        )
        .join('\n');

/*!
 * @param {Actor} actor
 * @param {string} animName
 * @param {string} prefix
 * @param {boolean} doCombineProperties
 * @return {string}
 */
export const generateAnimationNameProperty = (
  actor: Actor,
  animationName: string,
  prefix: string,
  doCombineProperties: boolean
): string => {
  let renderedName = `  ${prefix}animation-name:`;

  if (doCombineProperties) {
    renderedName += ` ${animationName}-keyframes;`;
  } else {
    const trackNames = actor.getTrackNames();

    const trackNamesToPrint = intersection(trackNames, transformFunctions)
      .length
      ? difference(trackNames, transformFunctions).concat('transform')
      : trackNames;

    renderedName = trackNamesToPrint
      .reduce(
        (renderedName, trackName) =>
          `${renderedName} ${animationName}-${trackName}-keyframes,`,
        renderedName
      )
      .replace(/.$/, ';');
  }

  return renderedName;
};

/*!
 * @param {Rekapi} rekapi
 * @param {string} prefix
 * @param {number|string=} iterations
 * @return {string}
 */
export const generateAnimationIterationProperty = (
  rekapi: Rekapi,
  prefix: string,
  iterations?: number | string
): string =>
  `  ${prefix}animation-iteration-count: ${
    iterations !== undefined
      ? iterations
      : rekapi._timesToIterate === -1
      ? 'infinite'
      : rekapi._timesToIterate
  };`;

/*!
 * @param {Actor} actor
 * @param {string} animName
 * @param {string} vendor
 * @param {boolean} doCombineProperties
 * @param {number|string=} iterations
 * @param {boolean=} isCentered
 * @return {string}
 */
export const generateCSSAnimationProperties = (
  actor: Actor,
  animName: string,
  vendor: string,
  doCombineProperties: boolean,
  iterations?: number,
  isCentered?: boolean
): string => {
  const prefix = VENDOR_PREFIXES[vendor];
  const start = actor.getStart();
  const end = actor.getEnd();

  const generatedProperties = [
    generateAnimationNameProperty(actor, animName, prefix, doCombineProperties),
    `  ${prefix}animation-duration: ${end - start}ms;`,
    `  ${prefix}animation-delay: ${start}ms;`,
    `  ${prefix}animation-fill-mode: forwards;`,
    `  ${prefix}animation-timing-function: linear;`,
    generateAnimationIterationProperty(actor.rekapi as Rekapi, prefix, iterations),
  ];

  if (isCentered) {
    generatedProperties.push(`  ${prefix}transform-origin: 0 0;`);
  }

  return generatedProperties.join('\n');
};

/*!
 * @param {Actor} actor
 * @param {string} animName
 * @param {boolean} doCombineProperties
 * @param {Array.<string>=} vendors
 * @param {number|string=} iterations
 * @param {boolean=} isCentered
 * @return {string}
 */
export const generateCSSClass = (
  actor: Actor,
  animName: string,
  doCombineProperties: boolean,
  vendors = ['w3'],
  iterations?: number,
  isCentered?: boolean
): string =>
  `.${animName} {\n${vendors
    .map((vendor) =>
      generateCSSAnimationProperties(
        actor,
        animName,
        vendor,
        doCombineProperties,
        iterations,
        isCentered
      )
    )
    .join('\n')}\n}`;

/*!
 * @param {Actor} actor
 * @return {boolean}
 */
export const canOptimizeAnyKeyframeProperties = (actor: Actor): boolean =>
  Object.keys(actor._keyframeProperties).some((property) =>
    canOptimizeKeyframeProperty(actor._keyframeProperties[property])
  ) &&
  !intersection(Object.keys(actor._propertyTracks), transformFunctions).length;

/*!
 * Creates the CSS `@keyframes` for an individual actor.
 * @param {Actor} actor
 * @param {Object=} options Same as options for Rekapi.prototype.toCSS.
 * @return {string}
 */
export const getActorCSS = (
  actor: Actor,
  options: {
    name?: string;
    vendors?: string[];
    iterations?: number;
    isCentered?: boolean;
    fps?: number;
  } = {}
): string => {
  if (!actor.rekapi) {
    return '';
  }

  const { name, vendors, iterations, isCentered } = options;

  const animName = name
    ? actor.rekapi.getActorCount() > 1
      ? `${name}-${actor.id}`
      : name
    : getActorClassName(actor);

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
    ),
  ].join('\n');
};

/**
 * {@link rekapi.DOMRenderer} allows you to animate DOM elements.  This is
 * achieved either by [CSS `@keyframe`
 * animations](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes), or
 * by per-frame inline style updates — keyframes are defined with the same API
 * in either case.  To render animations with the DOM, just supply any DOM
 * element to the {@link rekapi.Rekapi} constructor.  You may use
 * `document.body`, since it is generally always available:
 *
 *     const rekapi = new Rekapi(document.body);
 *
 *  To use this renderer's API, get a reference to the initialized object:
 *
 *     const domRenderer = rekapi.getRendererInstance(DOMRenderer);
 *
 * There are separate APIs for playing inline style animations and CSS
 * `@keyframe` animations.  For a detailed breakdown of how to choose between
 * these two APIs and use {@link rekapi.DOMRenderer} effectively, check out the
 * {@tutorial dom-rendering-in-depth} tutorial.
 *
 * __Note__: {@link rekapi.DOMRenderer} is added to {@link
 * rekapi.Rekapi#renderers} automatically, there is no reason to call the
 * constructor yourself in most cases.
 * @param {rekapi.Rekapi} rekapi The {@link rekapi.Rekapi} instance to render for.
 * @constructor rekapi.DOMRenderer
 * @extends {rekapi.renderer}
 */
export class DOMRenderer {
  rekapi!: Rekapi;
  _playTimestamp: number | null = null;
  _cachedCSS: string | null = null;
  _styleElement: HTMLStyleElement | null = null;
  _stopSetTimeoutHandle: number | null = null;

  constructor(rekapi: Rekapi) {
    this.rekapi = rekapi;
    this._playTimestamp = null;
    this._cachedCSS = null;
    this._styleElement = null;
    this._stopSetTimeoutHandle = null;

    rekapi.on('timelineModified', () => (this._cachedCSS = null));
    rekapi.on('addActor', onAddActor);
  }

  /**
   * @method rekapi.DOMRenderer#canAnimateWithCSS
   * @return {boolean} Whether or not the browser supports CSS `@keyframe`
   * animations.
   */
  canAnimateWithCSS() {
    return !!vendorPrefix;
  }

  /**
   * Play the Rekapi animation as a CSS `@keyframe` animation.
   *
   * Note that this is not the same as {@link rekapi.Rekapi#play}.  That method
   * controls inline style animations, while this method controls CSS
   * `@keyframe` animations.
   * @method rekapi.DOMRenderer#play
   * @param {number} [iterations] How many times the animation should loop.
   * This can be `null` or `0` if you want to loop the animation endlessly but
   * also specify a value for `fps`.
   * @param {number} [fps] How many `@keyframes` to generate per second of the
   * animation.  A higher value results in a more precise CSS animation, but it
   * will take longer to generate.  The default value is `30`.  You should not
   * need to go higher than `60`.
   * @fires rekapi.play
   */
  play(iterations?: number, fps?: number): void {
    if (this.isPlaying()) {
      this.stop();
    }

    this._styleElement = injectStyle(
      this.rekapi,
      this._cachedCSS || this.prerender.apply(this, [iterations, fps])
    );

    this._playTimestamp = now();

    if (iterations) {
      const animationLength = iterations * this.rekapi.getAnimationLength();
      this._stopSetTimeoutHandle = window.setTimeout(
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
   * Note that this is not the same as {@link rekapi.Rekapi#stop}.  That method
   * controls inline style animations, while this method controls CSS
   * `@keyframe` animations.
   * @method rekapi.DOMRenderer#stop
   * @param {boolean=} goToEnd If true, skip to the end of the animation.  If
   * false or omitted, set inline styles on the {@link rekapi.Actor} elements
   * to keep them in their current position.
   * @fires rekapi.stop
   */
  stop(goToEnd?: boolean): void {
    if (this.isPlaying()) {
      clearTimeout(this._stopSetTimeoutHandle as number);
      this._stopSetTimeoutHandle = null;

      if (this._styleElement) {
        // Forces a style update in WebKit/Presto
        this._styleElement.innerHTML = '';
        document.head.removeChild(this._styleElement);
        this._styleElement = null;
      }

      const animationLength = this.rekapi.getAnimationLength();

      this.rekapi.update(
        goToEnd
          ? animationLength
          : (now() - (this._playTimestamp as number)) % animationLength
      );

      fireEvent(this.rekapi, 'stop');
    }
  }

  /**
   * @method rekapi.DOMRenderer#isPlaying
   * @return {boolean} Whether or not a CSS `@keyframe` animation is running.
   */
  isPlaying(): boolean {
    return !!this._styleElement;
  }

  /**
   * Prerender and cache the CSS animation so that it is immediately ready to
   * be used when it is needed in the future.  The function signature is
   * identical to {@link rekapi.DOMRenderer#play}.  This
   * is necessary to play a CSS animation and will be automatically called for
   * you if you don't call it manually, but calling it ahead of time (such as
   * on page load) will prevent any perceived lag when a CSS `@keyframe`
   * animation is started.  The prerendered animation is cached for reuse until
   * the timeline or a keyframe is modified.
   *
   * @method rekapi.DOMRenderer#prerender
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
  prerender(iterations?: number, fps?: number): string {
    if (!this.canAnimateWithCSS()) {
      return '';
    }

    return (this._cachedCSS = this.getCss({
      vendors: [vendorPrefix as string],
      fps,
      iterations,
    }));
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
   * properties supplied to {@link rekapi.Actor#keyframe} (as shown above) into
   * a single string when it renders each frame.  This method lets you change
   * that order from the default.
   *
   * However, if you prefer a more standards-oriented approach, Rekapi also
   * supports combining the transform components yourself, obviating the need
   * for {@link rekapi.DOMRenderer#setActorTransformOrder} entirely:
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
   * @method rekapi.DOMRenderer#setActorTransformOrder
   * @param {rekapi.Actor} actor The {@link rekapi.Actor} to apply the new
   * transform order to.
   * @param {Array.<string>} orderedTransforms The array of transform names.
   * The supported array values (and default order) are:
   *
   * - `translateX`
   * - `translateY`
   * - `translateZ`
   * - `scale`
   * - `scaleX`
   * - `scaleY`
   * - `perspective`
   * - `rotate`
   * - `rotateX`
   * - `rotateY`
   * - `rotateZ`
   * - `skewX`
   * - `skewY`
   * @return {rekapi.Rekapi}
   */
  setActorTransformOrder(
    actor: Actor,
    orderedTransforms: string[]
  ): Rekapi {
    const unrecognizedTransforms = reject(
      orderedTransforms,
      (value: string) => isTransformFunction(value)
    ) as string[];

    if (unrecognizedTransforms.length) {
      throw `Unknown or unsupported transform functions: ${unrecognizedTransforms.join(
        ', '
      )}`;
    }

    // Ignore duplicate transform function names in the array
    actor._transformOrder = uniq(orderedTransforms);

    return this.rekapi;
  }

  /**
   * Convert the animation to CSS `@keyframes`.
   * @method rekapi.DOMRenderer#getCss
   * @param {Object} [options={}]
   * @param {Array.<string>} [options.vendors=['w3']] The browser vendors you
   * want to support. Valid values are:
   *   * `'microsoft'`
   *   * `'mozilla'`
   *   * `'opera'`
   *   * `'w3'`
   *   * `'webkit'`
   *
   *
   * @param {number} [options.fps=30]  Defines the number of CSS `@keyframe` frames
   * rendered per second of an animation.  CSS `@keyframes` are comprised of a
   * series of explicitly defined steps, and more steps will allow for a more
   * complex animation.  More steps will also result in a larger CSS string,
   * and more time needed to generate the string.
   * @param {string} [options.name] Define a custom name for your animation.
   * This becomes the class name targeted by the generated CSS.
   * @param {boolean} [options.isCentered] If `true`, the generated CSS will
   * contain `transform-origin: 0 0;`, which centers the DOM element along the
   * path of motion.  If `false` or omitted, no `transform-origin` rule is
   * specified and the element is aligned to the path of motion by its top-left
   * corner.
   * @param {number} [options.iterations] How many times the generated
   * animation should repeat.  If omitted, the animation will loop
   * indefinitely.
   * @return {string}
   */
  getCss(
    options: {
      name?: string;
      vendors?: string[];
      iterations?: number;
      isCentered?: boolean;
      fps?: number;
    } = {}
  ): string {
    const animationCSS: string[] = [];

    this.rekapi.getAllActors().forEach((actor) => {
      if ((actor.context as HTMLElement)?.nodeType === 1) {
        animationCSS.push(getActorCSS(actor, options));
      }
    });

    return animationCSS.join('\n');
  }
}

/*!
 * @param {Rekapi} rekapi
 */
rendererBootstrappers.push(
  (rekapi: Rekapi) =>
    // Node.nodeType 1 is an ELEMENT_NODE.
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeType
    (rekapi.context as HTMLElement)?.nodeType === 1 && new DOMRenderer(rekapi)
);
