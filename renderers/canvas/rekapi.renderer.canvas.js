rekapiModules.push(function (context) {

  'use strict';

  var Rekapi = context.Rekapi;
  var _ = Rekapi._;

  // PRIVATE UTILITY FUNCTIONS
  //

  /*!
   * Gets (and optionally sets) height or width on a canvas.
   * @param {HTMLCanvas} canvas
   * @param {string} heightOrWidth The dimension (either "height" or "width")
   * to get or set.
   * @param {number=} opt_newSize The new value to set for `dimension`.
   * @return {number}
   */
  function dimension (canvas, heightOrWidth, opt_newSize) {
    if (typeof opt_newSize !== 'undefined') {
      canvas[heightOrWidth] = opt_newSize;
      canvas.style[heightOrWidth] = opt_newSize + 'px';
    }

    return canvas[heightOrWidth];
  }

  /*!
   * Takes care of some pre-rendering tasks for canvas animations.
   * @param {Rekapi.CanvasRenderer} canvasRenderer
   */
  function beforeRender (canvasRenderer) {
    canvasRenderer.clear();
  }

  /*!
   * Render all the `Actor`s at whatever position they are currently in.
   * @param {Rekapi}
   * @param {Rekapi.CanvasRenderer} canvasRenderer
   * @return {Rekapi}
   */
  function render (rekapi, canvasRenderer) {
    fireEvent(rekapi, 'beforeRender', _);
    var renderOrderSorter = canvasRenderer._renderOrderSorter;
    var len = canvasRenderer._renderOrder.length;
    var renderOrder;

    if (renderOrderSorter) {
      var orderedActors =
          _.sortBy(canvasRenderer._canvasActors, renderOrderSorter);
      renderOrder = _.pluck(orderedActors, 'id');
    } else {
      renderOrder = canvasRenderer._renderOrder;
    }

    var currentActor;
    var canvasActors = canvasRenderer._canvasActors;

    var i;
    for (i = 0; i < len; i++) {
      currentActor = canvasActors[renderOrder[i]];
      currentActor.render(currentActor.context, currentActor.get());
    }
    fireEvent(rekapi, 'afterRender', _);

    return rekapi;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {Rekapi.CanvasRenderer} canvasRenderer
   */
  function addActor (actor, canvasRenderer) {
    canvasRenderer._renderOrder.push(actor.id);
    canvasRenderer._canvasActors[actor.id] = actor;
  }

  /*!
   * @param {Rekapi.Actor} actor
   * @param {Rekapi.CanvasRenderer} canvasRenderer
   */
  function removeActor (actor, canvasRenderer) {
    canvasRenderer._renderOrder = _.without(canvasRenderer._renderOrder, actor.id);
    delete canvasRenderer._canvasActors[actor.id];
  }

  /*!
   * Sets up an instance of CanvasRenderer and attaches it to a `Rekapi`
   * instance.  Also augments the Rekapi instance with canvas-specific
   * functions.
   * @param {Rekapi} rekapi
   */
  Rekapi._rendererInitHook.canvas = function (rekapi) {
    if (typeof CanvasRenderingContext2D === 'undefined' ||
        !(rekapi.context instanceof CanvasRenderingContext2D)) {
      return;
    }

    rekapi.renderer = new CanvasRenderer(rekapi);
  };

  // CANVAS RENDERER OBJECT
  //

  /**
   * You can use Rekapi to render animations to an HTML5 `<canvas>`.  To do so,
   * just provide a
   * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
   * instance to the `{{#crossLink "Rekapi"}}{{/crossLink}}` constructor to
   * automatically set up the renderer:
   *
   *     var context = document.createElement('canvas').getContext('2d');
   *     var rekapi = new Rekapi(context);
   *     rekapi.renderer instanceof Rekapi.CanvasRenderer; // true
   *
   * `Rekapi.CanvasRenderer` adds some canvas-specific events you can bind to
   * with `{{#crossLink "Rekapi/on:method"}}{{/crossLink}}` (and unbind from
   * with `{{#crossLink "Rekapi/off:method"}}{{/crossLink}}`:
   *
   *  - __beforeRender__: Fires just before an actor is rendered to the canvas.
   *  - __afterRender__: Fires just after an actor is rendered to the canvas.
   *
   * __Note__: `Rekapi.CanvasRenderer` is added to the `{{#crossLink
   * "Rekapi"}}{{/crossLink}}` instance automatically as `this.renderer`, there
   * is no reason to call the constructor yourself in most cases.
   *
   * ## Multiple renderers
   *
   * Rekapi supports multiple renderers per instance.  Do do this, you must not
   * provide a
   * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
   * to the `{{#crossLink "Rekapi"}}{{/crossLink}}` constructor, you must
   * instead initialize the renderer yourself.  The
   * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
   * that would have been provided to the `{{#crossLink
   * "Rekapi"}}{{/crossLink}}` constructor instead is provided as the second
   * parameter to `Rekapi.CanvasRenderer`:
   *
   *
   *     var canvasContext = document.querySelector('canvas').getContext('2d');
   *
   *     // No context gets passed to the Rekapi constructor
   *     var rekapi = new Rekapi();
   *
   *     // Initialize Rekapi.CanvasRenderer manually and give it a
   *     // CanvasRenderingContext2D.  You can name it anything you want on the
   *     // Rekapi instance.
   *     rekapi.canvasRenderer =
   *         new Rekapi.CanvasRenderer(rekapi, canvasContext);
   * @class Rekapi.CanvasRenderer
   * @param {Rekapi} rekapi
   * @param {CanvasRenderingContext2D=} opt_context
   * @constructor
   */
  Rekapi.CanvasRenderer = function (rekapi, opt_context) {
    this.rekapi = rekapi;
    this.canvasContext = opt_context || rekapi.context;
    this._renderOrder = [];
    this._renderOrderSorter = null;
    this._canvasActors = {};

    _.extend(rekapi._events, {
      'beforeRender': []
      ,'afterRender': []
    });

    var self = this;

    rekapi.on('afterUpdate', function () {
      render(rekapi, self);
    });

    rekapi.on('addActor', function (rekapi, actor) {
      addActor(actor, self);
    });

    rekapi.on('removeActor', function (rekapi, actor) {
      removeActor(actor, self);
    });

    rekapi.on('beforeRender', function () {
      beforeRender(self);
    });

    return this;
  };
  var CanvasRenderer = Rekapi.CanvasRenderer;

  /**
   * Get and optionally set the height of the associated `<canvas>` element.
   * @method height
   * @param {number=} opt_height The height to optionally set.
   * @return {number}
   */
  CanvasRenderer.prototype.height = function (opt_height) {
    return dimension(this.canvasContext.canvas, 'height', opt_height);
  };

  /**
   * Get and optionally set the width of the associated `<canvas>` element.
   * @method width
   * @param {number=} opt_width The width to optionally set.
   * @return {number}
   */
  CanvasRenderer.prototype.width = function (opt_width) {
    return dimension(this.canvasContext.canvas, 'width', opt_width);
  };

  /**
   * Erase the `<canvas>`.
   * @method clear
   * @return {Rekapi}
   */
  CanvasRenderer.prototype.clear = function () {
    this.canvasContext.clearRect(0, 0, this.width(), this.height());

    return this.rekapi;
  };

  /**
   * Move an actor around within the render order list.  Each actor is rendered
   * in order of its layer (layers and actors have a 1:1 relationship).  The
   * later an actor is added to an animation (with `{{#crossLink
   * "Rekapi/addActor:method"}}{{/crossLink}}`), the higher its layer.  Lower
   * layers (starting with 0) are rendered earlier.
   *
   *
   * This method has no effect if an order function is set with `{{#crossLink
   * "Rekapi.CanvasRenderer/setOrderFunction:method"}}{{/crossLink}}`.
   *
   * __[Example](../../../../docs/examples/canvas_move_actor_to_layer.html)__
   * @method moveActorToLayer
   * @param {Rekapi.Actor} actor
   * @param {number} layer This should be within `0` and the total number of
   * actors in the animation.  That number can be found with `{{#crossLink
   * "Rekapi/getActorCount:method"}}{{/crossLink}}`.
   * @return {Rekapi.Actor}
   */
  CanvasRenderer.prototype.moveActorToLayer = function (actor, layer) {
    if (layer < this._renderOrder.length && layer > -1) {
      this._renderOrder = _.without(this._renderOrder, actor.id);
      this._renderOrder.splice(layer, 0, actor.id);
    }

    return actor;
  };

  /**
   * Set a function that defines the render order of the actors.  This is
   * called each frame before the actors are rendered.
   *
   * The following example assumes that all actors are circles that have a
   * `radius` `{{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}`.  The
   * circles will be rendered in order of the value of their `radius`, from
   * smallest to largest.  This has the effect of layering larger circles on
   * top of smaller circles, thus giving a sense of perspective.
   *
   * If a render order function is specified, `{{#crossLink
   * "Rekapi.CanvasRenderer/moveActorToLayer:method"}}{{/crossLink}}` will have
   * no effect.
   *
   *     rekapi.renderer.setOrderFunction(function (actor) {
   *       return actor.get().radius;
   *     });
   * __[Example](../../../../docs/examples/canvas_set_order_function.html)__
   * @method setOrderFunction
   * @param {function(Rekapi.Actor)} sortFunction
   * @return {Rekapi}
   */
  CanvasRenderer.prototype.setOrderFunction = function (sortFunction) {
    this._renderOrderSorter = sortFunction;
    return this.rekapi;
  };

  /**
   * Remove the order function set by `{{#crossLink
   * "Rekapi.CanvasRenderer/setOrderFunction:method"}}{{/crossLink}}`.  The
   * render order defaults back to the order in which the actors were added to
   * the animation.
   *
   * __[Example](../../../../docs/examples/canvas_unset_order_function.html)__
   * @method unsetOrderFunction
   * @return {Rekapi}
   */
  CanvasRenderer.prototype.unsetOrderFunction = function () {
    this._renderOrderSorter = null;
    return this.rekapi;
  };

});
