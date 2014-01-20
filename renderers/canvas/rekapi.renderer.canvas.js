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
   * @param {Rekapi}
   */
  function beforeRender (rekapi) {
    rekapi.renderer.clear();
  }

  /*!
   * Render all the `Actor`s at whatever position they are currently in.
   * @param {Rekapi}
   * @return {Rekapi}
   */
  function render (rekapi) {
    fireEvent(rekapi, 'beforeRender', _);
    var renderer = rekapi.renderer;
    var renderOrderSorter = renderer._renderOrderSorter;
    var len = renderer._renderOrder.length;
    var renderOrder;

    if (renderOrderSorter) {
      var orderedActors = _.sortBy(renderer._canvasActors, renderOrderSorter);
      renderOrder = _.pluck(orderedActors, 'id');
    } else {
      renderOrder = renderer._renderOrder;
    }

    var currentActor;
    var canvasActors = renderer._canvasActors;

    var i;
    for (i = 0; i < len; i++) {
      currentActor = canvasActors[renderOrder[i]];
      currentActor.render(currentActor.context, currentActor.get());
    }
    fireEvent(rekapi, 'afterRender', _);

    return rekapi;
  }

  /*!
   * @param {Rekapi} rekapi
   * @param {Rekapi.Actor} actor
   */
  function addActor (rekapi, actor) {
    rekapi.renderer._renderOrder.push(actor.id);
    rekapi.renderer._canvasActors[actor.id] = actor;
  }

  /*!
   * @param {Rekapi} rekapi
   * @param {Rekapi.Actor} actor
   */
  function removeActor (rekapi, actor) {
    rekapi.renderer._renderOrder = _.without(rekapi.renderer._renderOrder, actor.id);
    delete rekapi.renderer._canvasActors[actor.id];
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

    _.extend(rekapi._events, {
      'beforeRender': []
      ,'afterRender': []
    });

    rekapi.on('afterUpdate', render);
    rekapi.on('addActor', addActor);
    rekapi.on('removeActor', removeActor);
    rekapi.on('beforeRender', beforeRender);
  };

  // CANVAS RENDERER OBJECT
  //

  /**
   * You can use Rekapi to render to an HTML5 `<canvas>`.  To do so, just provide a `CanvasRenderingContext2D` instance to the [`Rekapi`](../../src/rekapi.core.js.html#Rekapi) constructor to automatically set up the renderer:
   *
   * ```
   * var context = document.createElement('canvas').getContext('2d');
   * var rekapi = new Rekapi(context);
   * rekapi.renderer instanceof Rekapi.CanvasRenderer; // true
   * ```
   *
   * `Rekapi.CanvasRenderer` adds some canvas-specific events you can bind to with [`Rekapi#on`](../../src/rekapi.core.js.html#on) (and unbind from with [`Rekapi#off`](../../src/rekapi.core.js.html#off)):
   *
   *  - __beforeRender__: Fires just before an actor is rendered to the screen.
   *  - __afterRender__: Fires just after an actor is rendered to the screen.
   *
   *  __Note__: `Rekapi.CanvasRenderer` is instantiated for you automatically as `renderer`, there is no reason to call it yourself for most use cases.
   *
   * @param {Rekapi} rekapi
   * @constructor
   */
  Rekapi.CanvasRenderer = function (rekapi) {
    this.rekapi = rekapi;
    this._renderOrder = [];
    this._renderOrderSorter = null;
    this._canvasActors = {};
    return this;
  };
  var CanvasRenderer = Rekapi.CanvasRenderer;

  /**
   * Get and optionally set the height of the associated `<canvas>` element.
   *
   * @param {number=} opt_height
   * @return {number}
   */
  CanvasRenderer.prototype.height = function (opt_height) {
    return dimension(this.rekapi.context.canvas, 'height', opt_height);
  };

  /**
   * Get and optionally set the width of the associated `<canvas>` element.
   *
   * @param {number=} opt_width
   * @return {number}
   */
  CanvasRenderer.prototype.width = function (opt_width) {
    return dimension(this.rekapi.context.canvas, 'width', opt_width);
  };

  /**
   * Erase the `<canvas>`.
   *
   * @return {Rekapi}
   */
  CanvasRenderer.prototype.clear = function () {
    this.rekapi.context.clearRect(0, 0, this.width(), this.height());

    return this.rekapi;
  };

  /**
   * Move an actor around within the render order list.  Each actor is rendered in order of its layer (layers and actors have a 1:1 relationship).  The later an actor is added to an animation (with [`Rekapi.addActor`](../../src/rekapi.core.js.html#addActor)), the higher its layer.  Lower layers (starting with 0) are rendered earlier.
   *
   * `layer` should be within `0` and the total number of actors in the animation.  The total number of layers in the animation can be found with [`Rekapi.getActorCount`](../../src/rekapi.core.js.html#getActorCount).
   *
   * This method has no effect if an order function is set with [`setOrderFunction`](#setOrderFunction).
   *
   * __[Example](../../../../docs/examples/canvas_move_actor_to_layer.html)__
   * @param {Rekapi.Actor} actor
   * @param {number} layer
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
   * Set a function that defines the render order of the actors.  This is called each frame before the actors are rendered.
   *
   * The following example assumes that all actors are circles that have a `radius` [`Rekapi.KeyframeProperty`](../../src/rekapi.keyframe-property.js.html).  The circles will be rendered in order of the value of their `radius`, from smallest to largest.  This has the effect of layering larger circles on top of smaller circles, thus giving a sense of perspective.
   *
   * If a render order function is specified, layer changes made [`moveActorToLayer`](#moveActorToLayer) will be ignored.
   *
   * ```
   * rekapi.renderer.setOrderFunction(function (actor) {
   *   return actor.get().radius;
   * });
   * ```
   * @param {function(Rekapi.Actor,number)} sortFunction
   * @return {Rekapi}
   */
  CanvasRenderer.prototype.setOrderFunction = function (sortFunction) {
    this._renderOrderSorter = sortFunction;
    return this.rekapi;
  };

  /**
   * Remove the order function set by [`setOrderFunction`](#setOrderFunction).  The render order defaults back to the order in which the actors were added.
   *
   * __[Example](../../../../docs/examples/canvas_unset_order_function.html)__
   * @return {Rekapi}
   */
  CanvasRenderer.prototype.unsetOrderFunction = function () {
    this._renderOrderSorter = null;
    return this.rekapi;
  };

});
