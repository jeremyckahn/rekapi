var rekapi = function (global, deps) {

  'use strict';

  // If `deps` is defined, it means that Rekapi is loaded via AMD.
  // Don't use global context in this case so that the global scope
  // is not polluted by the Kapi object.
  var context = deps ? {} : global;

  var _ = (deps && deps.underscore) ? deps.underscore : context._;
  var Tweenable = (deps && deps.Tweenable) ?
      deps.Tweenable : context.Tweenable;

  rekapiCore(context, _, Tweenable);
  rekapiActor(context, _, Tweenable);
  rekapiKeyframeProperty(context, _, Tweenable);

  // Extensions
  if (typeof rekapiDOM === 'function') {
    rekapiDOM(context, _, Tweenable);
  }
  if (typeof rekapiToCSS === 'function') {
    rekapiToCSS(context, _, Tweenable);
  }
  if (typeof rekapiCanvasContext === 'function') {
    rekapiCanvasContext(context, _, Tweenable);
  }
  if (typeof rekapiCanvasActor === 'function') {
    rekapiCanvasActor(context, _, Tweenable);
  }

  return context.Kapi;
};


if (typeof define === 'function' && define.amd) {
  var underscoreAlreadyInUse = (typeof _ !== 'undefined');

  // Expose Rekapi as an AMD module if it's loaded with RequireJS or similar.
  // Shifty and Underscore are set as dependencies of this module.
  //
  // The rekapi module is anonymous so that it can be required with any name.
  // Example: define(['lib/rekapi.min'], function(Kapi) { ... });
  define(['shifty', 'underscore'], function (Tweenable, Underscore) {
    var underscoreSupportsAMD = (Underscore !== null);
    var deps = {  Tweenable: Tweenable,
                  // Some versions of Underscore.js support AMD, others don't.
                  // If not, use the `_` global.
                  underscore: underscoreSupportsAMD ? Underscore : _ };
    var Kapi = rekapi(global, deps);

    if (KAPI_DEBUG) {
      Kapi.underscore_version = deps.underscore.VERSION;
    }

    if (!underscoreAlreadyInUse && underscoreSupportsAMD) {
      // Prevent Underscore from polluting the global scope.
      // This global can be safely removed since Rekapi keeps its own reference
      // to Underscore via the `deps` object passed earlier as an argument.
      global._ = undefined;
    }

    return Kapi;
  });
} else {
  // Load Rekapi normally (creating a Kapi global) if not using an AMD loader.

  // Note: `global` is not defined when running unit tests. Pass `this` instead.
  rekapi(typeof global !== 'undefined' ? global : this);
}
