var rekapiToCSS = function (context, _) {

  'use strict';

  var Kapi = context.Kapi;


  // CONSTANTS
  //

  var DEFAULT_FPS = 30;
  var TRANSFORM_TOKEN = 'TRANSFORM';
  var VENDOR_TOKEN = 'VENDOR';
  var VENDOR_PREFIXES = Kapi.util.VENDOR_PREFIXES = {
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


  // PROTOTYPE EXTENSIONS
  //

  /**
   * With `toCSS`, Rekapi can export your animations as CSS `@keyframes`.  `toCSS` depends on [`Kapi.DOMActor`](../dom/rekapi.dom.actor.js.html).  This function only builds and returns a string of CSS, it has no other side effects.  To actually run a CSS `@keyframe` animation, see [`CSSRenderer`](/dist/doc/ext/css-animate/rekapi.css-animate.context.js.html#CSSRenderer) (which wraps this function).
   *
   * ## Exporting
   *
   * To create a CSS string:
   *
   * ```
   * var container = document.getElementById('container');
   * var animation = new Kapi(container);
   *
   * var css = animation.toCSS();
   * ```
   *
   * Remember, all `toCSS` does is render a string.  The most useful thing to do with this string is to stick it into a `<style>` element somewhere on your page.  Continuing from  above:
   *
   * ```
   * var style = document.createElement('style');
   * style.innerHTML = css;
   * document.head.appendChild(style);
   * ```
   *
   * Please be aware that [`CSSRenderer`](/dist/doc/ext/css-animate/rekapi.css-animate.context.js.html#CSSRenderer) makes this process much simpler.
   *
   * ## `opts`
   *
   * You can specify some parameters for your CSS animation.  They are all optional. Just supply them in the `opts` parameter when calling `toCSS`:
   *
   *  - __vendors__ _(Array)_: Defaults to `['w3']`.  The browser vendors you want this CSS to support. Valid values are:
   *    - `'microsoft'`
   *    - `'mozilla'`
   *    - `'opera'`
   *    - `'w3'`
   *    - `'webkit'`
   *  - __fps__ _(number)_: Defaults to 30.  Defines the "resolution" of an exported animation.  CSS `@keyframes` are comprised of a series of explicitly defined keyframe steps, and more steps will allow for a more complex animation.  More steps will also result in a larger CSS string, and more time needed to generate the string.  There's no reason to go beyond 60, as the human eye cannot perceive motion smoother than that.
   *  - __name__ _(string)_: Define a custom name for your animation.  This becomes the class name targeted by the generated CSS.  If omitted, the value is the same as the CSS class that was added when the DOM element was used to initialize its `Kapi.DOMActor`.
   *  - __isCentered__ _(boolean)_: If `true`, the generated CSS will contain `transform-origin: 0 0;`, which centers the DOM element along the path of motion.  If `false` or omitted, no `transform-origin` rule is specified and the element is aligned to the path of motion with its top-left corner.
   *  - __iterations__ _(number)_: How many times the generated animation should repeat.  If omitted, the animation will loop indefinitely.
   *
   * @param {Object} opts
   * @return {string}
   */
  Kapi.prototype.toCSS = function (opts) {
    opts = opts || {};
    var animationCSS = [];

    _.each(this.getAllActors(), function (actor) {
      if (actor instanceof Kapi.DOMActor) {
        animationCSS.push(actor.toCSS(opts));
      }
    });

    return animationCSS.join('\n');
  };


  /*!
   * Exports the CSS `@keyframes` for an individual Actor.
   * @param {Object} opts Same as opts for Kapi.prototype.toCSS.
   * @return {string}
   */
  Kapi.Actor.prototype.toCSS = function (opts) {
    opts = opts || {};
    var actorCSS = [];
    var animName = opts.name || this.getCSSName();
    var fps = opts.fps || DEFAULT_FPS;
    var steps = Math.ceil((this.kapi.animationLength() / 1000) * fps);
    var actorClass = generateCSSClass(
        this, animName, opts.vendors, opts.iterations, opts.isCentered);
    var boilerplatedKeyframes = generateBoilerplatedKeyframes(
        this, animName, steps, opts.vendors);

    actorCSS.push(actorClass);
    actorCSS.push(boilerplatedKeyframes);

    return actorCSS.join('\n');
  };


  // UTILITY FUNCTIONS
  //

  /*!
   * @param {string} formatter
   * @param {[string]} args
   * @return {string}
   */
  var printf = Kapi.util.printf = function (formatter, args) {
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
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @param {number} steps
   * @param {Array.<string>=} opt_vendors
   * @return {string}
   */
  function generateBoilerplatedKeyframes (
      actor, animName, steps, opt_vendors) {

    var trackNames = actor.getTrackNames();
    var cssTracks = [];

    _.each(trackNames, function (trackName) {
      cssTracks.push(
        generateActorKeyframes(actor, steps, trackName));
    });

    var boilerplatedKeyframes = [];

    _.each(trackNames, function (trackName, i) {
      boilerplatedKeyframes.push(applyVendorBoilerplates(
        cssTracks[i], (animName + '-' + trackName), opt_vendors));
    });

    boilerplatedKeyframes = boilerplatedKeyframes.join('\n');

    return boilerplatedKeyframes;
  }


  /*!
   * @param {string} toKeyframes Generated keyframes to wrap in boilerplates
   * @param {string} animName
   * @param {Array.<string>} opt_vendors Vendor boilerplates to be applied.
   *     Should be any of the values in Kapi.util.VENDOR_PREFIXES.
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
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @param {Array.<string>} opt_vendors
   * @param {number|string} opt_iterations
   * @param {boolean} opt_isCentered
   * @return {string}
   */
  function generateCSSClass (
      actor, animName, opt_vendors, opt_iterations, opt_isCentered) {
    opt_vendors = opt_vendors || ['w3'];
    var classAttrs = [];
    var vendorAttrs;

    _.each(opt_vendors, function (vendor) {
      vendorAttrs = generateCSSAnimationProperties(
          actor, animName, vendor, opt_iterations, opt_isCentered);
      classAttrs.push(vendorAttrs);
    });

    var boilerplatedClass = printf(CLASS_BOILERPLATE
        ,[animName, classAttrs.join('\n')]);

    return boilerplatedClass;
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @param {string} vendor
   * @param {number|string} opt_iterations
   * @param {boolean} opt_isCentered
   * @return {string}
   */
  function generateCSSAnimationProperties (
      actor, animName, vendor, opt_iterations, opt_isCentered) {
    var generatedProperties = [];
    var prefix = VENDOR_PREFIXES[vendor];

    generatedProperties.push(generateAnimationNameProperty(
          actor, animName, prefix));
    generatedProperties.push(
        generateAnimationDurationProperty(actor, prefix));
    generatedProperties.push(generateAnimationDelayProperty(actor, prefix));
    generatedProperties.push(generateAnimationFillModeProperty(prefix));
    generatedProperties.push(generateAnimationTimingFunctionProperty(prefix));
    generatedProperties.push(generateAnimationIterationProperty(
        actor.kapi, prefix, opt_iterations));

    if (opt_isCentered) {
      generatedProperties.push(generateAnimationCenteringRule(prefix));
    }

    return generatedProperties.join('\n');
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @param {string} prefix
   * @return {string}
   */
  function generateAnimationNameProperty (actor, animName, prefix) {
    var animationName = printf('  %sanimation-name:', [prefix]);

    var tracks = actor.getTrackNames();
    _.each(tracks, function (trackName) {
      animationName += printf(' %s-%s-keyframes,', [animName, trackName]);
    });

    animationName = animationName.slice(0, animationName.length - 1);
    animationName += ';';

    return animationName;
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @return {string}
   */
  function generateAnimationDurationProperty (actor, prefix) {
    return printf('  %sanimation-duration: %sms;'
        ,[prefix, actor.getEnd() - actor.getStart()]);
  }


  /*!
   * @param {Kapi.Actor} actor
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
   * @param {Kapi} kapi
   * @param {string} prefix
   * @param {number|string} opt_iterations
   * @return {string}
   */
  function generateAnimationIterationProperty (kapi, prefix, opt_iterations) {
    var iterationCount;
    if (opt_iterations) {
      iterationCount = opt_iterations;
    } else {
      iterationCount = kapi._timesToIterate === -1
        ? 'infinite'
        : kapi._timesToIterate;
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


  // OPTIMIZED GENERATOR FUNCTIONS
  //

  /*!
   * @param {Kapi.KeyframeProperty} property
   * @return {boolean}
   */
  function canOptimizeKeyframeProperty (property) {
    var canOptimize = false;

    if (property.nextProperty) {
      var easingChunks = property.nextProperty.easing.split(' ');

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
   * @param {Kapi.KeyframeProperty} property
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


  // GENERAL-USE GENERATOR FUNCTIONS
  //

  /*!
   * @param {Kapi.Actor} actor
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
      if (canOptimizeKeyframeProperty(prop)) {
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
            actor, prop, increments, incrementSize, actorStart, fromPercent);

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
   * @param {Kapi.Actor} actor
   * @param {string} track
   * @param {number} actorStart
   * @return {string|undefined}
   */
  function simulateLeadingWait (actor, track, actorStart) {
    var firstProp = actor._propertyTracks[track][0];

    if (firstProp.millisecond !== actorStart) {
      var fakeFirstProp = generateActorTrackSegment(
          actor, firstProp, 1, 1, firstProp.millisecond, 0);
      return fakeFirstProp.join('\n');
    }
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} track
   * @param {number} actorStart
   * @param {number} actorEnd
   * @return {string|undefined}
   */
  function simulateTrailingWait (actor, track, actorStart, actorEnd) {
    var lastProp = _.last(actor._propertyTracks[track]);

    if (lastProp.millisecond !== actorEnd) {
      var fakeLastProp = generateActorTrackSegment(
          actor, lastProp, 1, 1, actorStart, 100);
      return fakeLastProp.join('\n');
    }
  }


  /*!
   * @param {Kapi.KeyframeProperty} property
   * @param {number} actorStart
   * @param {number} actorLength
   * @return {number}
   */
  function calculateStepPercent (property, actorStart, actorLength) {
    return ((property.millisecond - actorStart) / actorLength) * 100;
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {Kapi.KeyframeProperty} fromProp
   * @param {number} increments
   * @param {number} incrementSize
   * @param {number} actorStart
   * @param {number} fromPercent
   * @return {Array.<string>}
   */
  function generateActorTrackSegment (
      actor, fromProp, increments, incrementSize, actorStart, fromPercent) {

    var accumulator = [];
    var actorLength = actor.getLength();

    var i, adjustedPercent, stepPrefix;
    for (i = 0; i < increments; i++) {
      adjustedPercent = fromPercent + (i * incrementSize);
      actor.updateState(
          ((adjustedPercent / 100) * actorLength) + actorStart);
      stepPrefix = +adjustedPercent.toFixed(2) + '% ';
      accumulator.push(
          '  ' + stepPrefix + serializeActorStep(actor, fromProp.name));
    }

    return accumulator;
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {string} targetProp
   * @return {string}
   */
  function serializeActorStep (actor, targetProp) {
    var serializedProps = ['{'];

    var propsToSerialize;
    if (targetProp) {
      propsToSerialize = {};

      var currentPropState = actor.get()[targetProp];
      if (typeof currentPropState !== 'undefined') {
        propsToSerialize[targetProp] = currentPropState;
      }
    } else {
      propsToSerialize = actor.get();
    }

    var printVal;
    _.each(propsToSerialize, function (val, key) {
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

  if (KAPI_DEBUG) {
    Kapi._private.toCSS = {
      'TRANSFORM_TOKEN': TRANSFORM_TOKEN
      ,'VENDOR_TOKEN': VENDOR_TOKEN
      ,'applyVendorBoilerplates': applyVendorBoilerplates
      ,'applyVendorPropertyPrefixes': applyVendorPropertyPrefixes
      ,'generateBoilerplatedKeyframes': generateBoilerplatedKeyframes
      ,'generateCSSClass': generateCSSClass
      ,'generateCSSAnimationProperties': generateCSSAnimationProperties
      ,'generateActorKeyframes': generateActorKeyframes
      ,'generateActorTrackSegment': generateActorTrackSegment
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
      ,'generateOptimizedKeyframeSegment': generateOptimizedKeyframeSegment
    };
  }

};
