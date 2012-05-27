var rekapiCanvasActor = function (context) {
  var gk = context.Kapi;

  function CanvasActorMethods () {};
  CanvasActorMethods.prototype = gk.Actor.prototype;

  /**
   * @param {Object} opt_config
   * @constructor
   */
  gk.CanvasActor = function (opt_config) {
    gk.Actor.call(this, opt_config);
    return this;
  };

  gk.CanvasActor.prototype = new CanvasActorMethods();

  /**
   * @param {Object} opt_context
   * @return {Object}
   */
  gk.CanvasActor.prototype.context = function (opt_context) {
    if (opt_context) {
      this._context = opt_context;
    }

    return this._context && this._context.getContext('2d');
  };
};
