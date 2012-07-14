var rekapiToCSS = function (context, _) {

  'use strict';

  var Kapi = context.Kapi;


  // CONSTANTS
  //

  var DEFAULT_GRANULARITY = 100;
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
    easeInQuad: '.55,.085,.68,.53'
    ,easeInCubic: '.55,.055,.675,.19'
    ,easeInQuart: '.895,.03,.685,.22'
    ,easeInQuint: '.755,.05,.855,.06'
    ,easeInSine: '.47,0,.745,.715'
    ,easeInExpo: '.95,.05,.795,.035'
    ,easeInCirc: '.6,.04,.98, .335'
    ,easeInBack: '.6,-.28,.735,.045'
    ,easeOutQuad: '.25,.46,.45,.94'
    ,easeOutCubic: '.215,.61,.355,1'
    ,easeOutQuart: '.165,.84,.44,1'
    ,easeOutQuint: '.23,1,.32,1'
    ,easeOutSine: '.39,.575,.565,1'
    ,easeOutExpo: '.19,1,.22,1'
    ,easeOutCirc: '.075,.82,.165,1'
    ,easeOutBack: '.175,.885,.32,1.275'
    ,easeInOutQuad: '.455,.03,.515,.955'
    ,easeInOutCubic: '.645,.045,.355,1'
    ,easeInOutQuart: '.77,0,.175,1'
    ,easeInOutQuint: '.86,0.07,1'
    ,easeInOutSine: '.445,.05,.55,.95'
    ,easeInOutExpo: '1,0,0,1'
    ,easeInOutCirc: '.785,.135,.15,.86'
    ,easeInOutBack: '.68,-.55,.265,1.55'
  }


  // TEMPLATES
  //

  /**
   * [0]: vendor
   * [1]: animation name
   * [2]: keyframes
   */
  var KEYFRAME_TEMPLATE = [
    '@%skeyframes %s-keyframes {'
    ,'%s'
    ,'}'
  ].join('\n');

  /**
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
   * @param {Object} opts
   */
  context.Kapi.prototype.toCSS = function (opts) {
    opts = opts || {};
    var animationCSS = [];
    var actorIds = this.getActorIds();

    _.each(actorIds, function (id) {
      animationCSS.push(this.getActor(id).toCSS(opts));
    }, this);

    return animationCSS.join('\n');
  };


  /**
   * @param {Object} opts
   */
  context.Kapi.Actor.prototype.toCSS = function (opts) {
    opts = opts || {};
    var actorCSS = [];
    var animName = opts.name || this.getCSSName();
    var granularity = opts.granularity || DEFAULT_GRANULARITY;
    var actorClass = generateCSSClass(this, animName, opts.vendors);
    var boilerplatedKeyframes = generateBoilerplatedKeyframes(
        this, animName, granularity, opts.vendors);

    actorCSS.push(actorClass);
    actorCSS.push(boilerplatedKeyframes);

    return actorCSS.join('\n');
  };


  // UTILITY FUNCTIONS
  //

  /**
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


  /**
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @param {number} granularity
   * @param {Array.<string>=} opt_vendors
   * @return {string}
   */
  function generateBoilerplatedKeyframes (
      actor, animName, granularity, opt_vendors) {

    var trackNames = _.keys(actor._propertyTracks);
    var trackNames = actor.getTrackNames();
    var optimizedEasingFormula = getOptimizedEasingFormula(actor);
    var cssTracks = [];

    // TODO: CSS optimization is _extremely_ incomplete.  It only supports
    // single-step animations with one keyframe property.
    if (typeof optimizedEasingFormula === 'string') {
      cssTracks = [generateOptimizedKeyframes(actor, optimizedEasingFormula)];
    } else {
      _.each(trackNames, function (trackName) {
        cssTracks.push(
          generateActorKeyframes(actor, granularity, trackName));
      });
    }

    var boilerplatedKeyframes = [];

    _.each(trackNames, function (trackName, i) {
      boilerplatedKeyframes.push(applyVendorBoilerplates(
        cssTracks[i], (animName + '-' + trackName), opt_vendors));
    });

    boilerplatedKeyframes = boilerplatedKeyframes.join('\n');

    return boilerplatedKeyframes;
  }


  /**
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


  /**
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


  /**
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @param {Array.<string>} opt_vendors
   * @return {string}
   */
  function generateCSSClass (actor, animName, opt_vendors) {
    opt_vendors = opt_vendors || ['w3'];
    var classAttrs = [];
    var vendorAttrs;

    _.each(opt_vendors, function (vendor) {
      vendorAttrs = generateCSSAnimationProperties(actor, animName, vendor);
      classAttrs.push(vendorAttrs);
    });

    var boilerplatedClass = printf(CLASS_BOILERPLATE
        ,[animName, classAttrs.join('\n')]);

    return boilerplatedClass;
  }


  /**
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @param {string} vendor
   * @return {string}
   */
  function generateCSSAnimationProperties (actor, animName, vendor) {
    var generatedProperties = [];
    var prefix = VENDOR_PREFIXES[vendor];

    generatedProperties.push(generateAnimationNameProperty(
          actor, animName, prefix));
    generatedProperties.push(
        generateAnimationDurationProperty(actor, prefix));
    generatedProperties.push(generateAnimationDelayProperty(actor, prefix));
    generatedProperties.push(generateAnimationFillModeProperty(prefix));
    generatedProperties.push(generateAnimationTimingFunctionProperty(prefix));

    return generatedProperties.join('\n');
  }


  /**
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


  /**
   * @param {Kapi.Actor} actor
   * @param {string} animName
   * @return {string}
   */
  function generateAnimationDurationProperty (actor, prefix) {
    return printf('  %sanimation-duration: %sms;'
        ,[prefix, actor.getEnd() - actor.getStart()]);
  }


  /**
   * @param {Kapi.Actor} actor
   * @param {number|string} delay
   * @return {string}
   */
  function generateAnimationDelayProperty (actor, prefix) {
    return printf('  %sanimation-delay: %sms;', [prefix, actor.getStart()]);
  }


  /**
   * @param {string} prefix
   * @return {string}
   */
  function generateAnimationFillModeProperty (prefix) {
    return printf('  %sanimation-fill-mode: forwards;', [prefix]);
  }


  /**
   * @param {string} prefix
   * @return {string}
   */
  function generateAnimationTimingFunctionProperty (prefix) {
    return printf('  %sanimation-timing-function: linear;', [prefix]);
  }


  // OPTIMIZED GENERATOR FUNCTIONS
  //

  /**
   * @param {Kapi.Actor} actor
   * @param {string} easingFormula
   * @return {string}
   */
  function generateOptimizedKeyframes (actor, easingFormula) {
    var propName = actor.getTrackNames()[0];
    var firstKeyprop = actor.getKeyframeProperty(propName, 0);
    var lastKeyprop = actor.getKeyframeProperty(propName, 1);
    var printName = propName;

    if (propName === 'transform') {
      printName = TRANSFORM_TOKEN;
    }

    return [
        // AAAAAAHHH!
        printf('from { %s: %s; %sanimation-timing-function: %s; }',
            [printName, firstKeyprop.value, VENDOR_TOKEN,
                printf('cubic-bezier(%s)', [easingFormula])]),
        printf('to { %s: %s; %sanimation-timing-function: %s; }',
            [printName, lastKeyprop.value, VENDOR_TOKEN,
                printf('cubic-bezier(%s)', [easingFormula])]),
      ].join('\n');
  }


  /**
   * @param {Kapi.Actor} actor
   * @return {string}
   */
  function getOptimizedEasingFormula (actor) {
    var trackNames = actor.getTrackNames();
    var firstTrackName = trackNames[0];
    if (trackNames.length === 1
        && actor.getTrackLength(firstTrackName) === 2) {
      return BEZIERS[actor.getKeyframeProperty(firstTrackName, 1).easing];
    }
  }


  // GENERAL-USE GENERATOR FUNCTIONS
  //

  /**
   * @param {Kapi.Actor} actor
   * @param {number} granularity
   * @param {string} track
   * @return {string}
   */
  function generateActorKeyframes (actor, granularity, track) {
    var serializedFrames = [];
    var actorEnd = actor.getEnd();
    var actorStart = actor.getStart();
    var actorLength = actor.getLength();
    var leadingWait = simulateLeadingWait(actor, track, actorStart);

    if (leadingWait) {
      serializedFrames.push(leadingWait);
    }

    _.each(actor._propertyTracks[track], function (prop, propName) {
      var fromPercent = calculateStepPercent(prop, actorStart, actorLength);
      var nextProp = prop.nextProperty;

      var toPercent, increments, incrementSize;
      if (nextProp) {
        toPercent = calculateStepPercent(nextProp, actorStart, actorLength);
        var delta = toPercent - fromPercent;
        increments = Math.floor((delta / 100) * granularity) || 1;
        incrementSize = delta / increments;
      } else {
        toPercent = 100;
        increments = 1;
        incrementSize = 1;
      }

      var trackSegment = generateActorTrackSegment(
          actor, prop, increments, incrementSize, actorStart, fromPercent);

      serializedFrames.push(trackSegment.join('\n'));
    });

    var trailingWait =
        simulateTrailingWait(actor, track, actorStart, actorEnd);

    if (trailingWait) {
      serializedFrames.push(trailingWait);
    }

    return serializedFrames.join('\n');
  }


  /**
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


  /**
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


  /**
   * @param {Kapi.KeyframeProperty} property
   * @param {number} actorStart
   * @param {number} actorLength
   * @return {number}
   */
  function calculateStepPercent (property, actorStart, actorLength) {
    return ((property.millisecond - actorStart) / actorLength) * 100;
  }


  /**
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

    var serializedFrames = [];
    var actorLength = actor.getLength();

    var i, adjustedPercent, stepPrefix;
    for (i = 0; i < increments; i++) {
      adjustedPercent = fromPercent + (i * incrementSize);
      actor.updateState(
          ((adjustedPercent / 100) * actorLength) + actorStart);
      stepPrefix = +adjustedPercent.toFixed(2) + '% ';
      serializedFrames.push(
          '  ' + stepPrefix + serializeActorStep(actor, fromProp.name));
    }

    return serializedFrames;
  };


  /**
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
      ,'generateOptimizedKeyframes': generateOptimizedKeyframes
      ,'getOptimizedEasingFormula': getOptimizedEasingFormula
      ,'generateActorKeyframes': generateActorKeyframes
      ,'generateActorTrackSegment': generateActorTrackSegment
      ,'serializeActorStep': serializeActorStep
      ,'generateAnimationNameProperty': generateAnimationNameProperty
      ,'generateAnimationDurationProperty': generateAnimationDurationProperty
      ,'generateAnimationDelayProperty': generateAnimationDelayProperty
      ,'generateAnimationFillModeProperty': generateAnimationFillModeProperty
      ,'generateAnimationTimingFunctionProperty':
          generateAnimationTimingFunctionProperty
      ,'simulateLeadingWait': simulateLeadingWait
      ,'simulateTrailingWait': simulateTrailingWait
    }
  }

};
