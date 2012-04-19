var rekapiToCSS = function (Rekapi, global) {

  // CONSTANTS
  //
  var DEFAULT_GRANULARITY = 100;
  var VENDOR_PREFIXES = Rekapi.util.VENDOR_PREFIXES = {
    'microsoft': '-ms-'
    ,'mozilla': '-moz-'
    ,'opera': '-o-'
    ,'w3': ''
    ,'webkit': '-webkit-'
  };


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
    ,'  position: absolute;'
    ,'%s'
    ,'}'
  ].join('\n');


  // PROTOTYPE EXTENSIONS
  //
  /**
   * @param {Object} opts
   */
  global.Kapi.prototype.toCSS = function (opts) {
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
  global.Kapi.Actor.prototype.toCSS = function (opts) {
    opts = opts || {};
    var actorCSS = [];
    var granularity = opts.granularity || DEFAULT_GRANULARITY;
    var actorClass = generateCSSClass(this, opts.vendors);
    actorCSS.push(actorClass);
    var keyframes = generateActorKeyframes(this, granularity);
    var boilerplatedKeyframes = applyVendorBoilerplates(
        keyframes, this.getCSSName(), opts.vendors);
    actorCSS.push(boilerplatedKeyframes);

    return actorCSS.join('\n');
  };


  // UTILITY FUNCTIONS
  //
  /**
   * @param {string} str
   */
  function isColorString (str) {
    return /rgb/.test(str);
  }


  /**
   * @param {Rekapi.Actor} actor
   */
  function serializeActorStep (actor) {
    var serializedProps = ['{'];
    var printVal;
    _.each(actor.get(), function (val, key) {
      if (isColorString(val)) {
        printVal = val;
      } else {
        printVal = limitCSSPrecision(val, 2);
      }
      serializedProps.push(key + ':' + printVal + ';');
    });

    serializedProps.push('}');
    return serializedProps.join('');
  };


  /**
   * @param {Rekapi.Actor} actor
   * @param {number} granularity
   * @return {string}
   */
  function generateActorKeyframes (actor, granularity) {
    var animLength = actor.getLength();
    var i, delay = actor.getStart();
    var serializedFrames = [];
    var percent, stepPrefix;
    var increment = animLength / granularity;
    var animPercent = animLength / 100;


    for (i = delay; i <= animLength + delay; i += increment) {
      actor.calculatePosition(i);
      percent = (i - delay) / animPercent;
      if (percent === 0) {
        stepPrefix = 'from ';
      } else if (percent === 100) {
        stepPrefix = 'to ';
      } else {
        stepPrefix = percent.toFixed(2) + '% ';
      }
      serializedFrames.push('  ' + stepPrefix + serializeActorStep(actor));
    }

    return serializedFrames.join('\n');
  }


  /**
   * @param {string} toKeyframes Generated keyframes to wrap in boilerplates
   * @param {string} animName
   * @param {[string]} opt_vendors Vendor boilerplates to be applied.  Should be
   *     any of the values in Rekapi.util.VENDOR_PREFIXES.
   * @return {string}
   */
  function applyVendorBoilerplates (toKeyframes, animName, opt_vendors) {
    opt_vendors = opt_vendors || ['w3'];
    var renderedKeyframes = [];

    _.each(opt_vendors, function (vendor) {
      var renderedChunk = printf(KEYFRAME_TEMPLATE,
          [VENDOR_PREFIXES[vendor], animName, toKeyframes]);

      renderedKeyframes.push(renderedChunk);
    });

    return renderedKeyframes.join('\n');
  }


  /**
   * @param {Rekapi.Actor} actor
   * @param {[string]} opt_vendors
   */
  function generateCSSClass (actor, opt_vendors) {
    opt_vendors = opt_vendors || ['w3'];
    var classAttrs = [];
    var vendorAttrs;

    _.each(opt_vendors, function (vendor) {
      vendorAttrs = generateCSSVendorAttributes(actor, vendor);
      classAttrs.push(vendorAttrs);
    });

    var boilerplatedClass = printf(CLASS_BOILERPLATE
        ,[actor.getCSSName(), classAttrs.join('\n')]);

    return boilerplatedClass;
  }


  /**
   * @param {Rekapi.Actor} actor
   * @param {string} vendor
   */
  function generateCSSVendorAttributes (actor, vendor) {
    var generatedAttributes = [];
    var prefix = VENDOR_PREFIXES[vendor];
    var start = actor.getStart();
    var duration = actor.getEnd() - start;

    var duration = printf('  %sanimation-duration: %sms;'
        ,[prefix, duration]);
    generatedAttributes.push(duration);

    var animationName = printf('  %sanimation-name: %s;'
        ,[prefix, actor.getCSSName() + '-keyframes']);
    generatedAttributes.push(animationName);

    var delay = printf('  %sanimation-delay: %sms;', [prefix, start]);
    generatedAttributes.push(delay);

    var fillMode = printf('  %sanimation-fill-mode: forwards;', [prefix]);
    generatedAttributes.push(fillMode);

    return generatedAttributes.join('\n');
  }


  /**
   * @param {string} formatter
   * @param {[string]} args
   * @return {string}
   */
  var printf = Rekapi.util.printf = function (formatter, args) {
    var composedStr = formatter;
    _.each(args, function (arg) {
      composedStr = composedStr.replace('%s', arg);
    });

    return composedStr;
  };


  /**
   * @param {string} cssVal
   * @param {number} precision
   */
  function limitCSSPrecision (cssVal, precision) {
    var unit = cssVal.match(/\D*$/);
    var val = parseFloat(cssVal);
    return val.toFixed(precision) + unit;
  }

};
