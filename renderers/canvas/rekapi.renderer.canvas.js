import _ from 'lodash';
import Rekapi, {
  rendererInitHooks,
  fireEvent
} from '../../src/rekapi.core';

// PRIVATE UTILITY FUNCTIONS
//

/*!
 * Gets (and optionally sets) height or width on a canvas.
 * @param {HTMLCanvas} canvas
 * @param {string} heightOrWidth The dimension (either "height" or "width")
 * to get or set.
 * @param {number=} newSize The new value to set for `dimension`.
 * @return {number}
 */
const dimension = (canvas, heightOrWidth, newSize = undefined) => {
  if (newSize !== undefined) {
    canvas[heightOrWidth] = newSize;
    canvas.style[heightOrWidth] = `${newSize}px`;
  }

  return canvas[heightOrWidth];
};

/*!
 * Takes care of some pre-rendering tasks for canvas animations.
 * @param {Rekapi.CanvasRenderer} canvasRenderer
 */
const beforeRender = canvasRenderer => canvasRenderer.clear();

/*!
 * Render all the `Actor`s at whatever position they are currently in.
 * @param {Rekapi}
 * @param {Rekapi.CanvasRenderer} canvasRenderer
 * @return {Rekapi}
 */
const render = (rekapi, canvasRenderer) => {
  fireEvent(rekapi, 'beforeRender');
  const { _renderOrderSorter } = canvasRenderer;

  const renderOrder = _renderOrderSorter ?
    _.pluck(
      _.sortBy(canvasRenderer._canvasActors, _renderOrderSorter),
      'id'
    ) :
    canvasRenderer._renderOrder;

  const { _canvasActors } = canvasRenderer;

  renderOrder.forEach(id => {
    const actor = _canvasActors[id];

    if (actor.wasActive) {
      actor.render(actor.context, actor.get());
    }
  });

  fireEvent(rekapi, 'afterRender');

  return rekapi;
};

/*!
 * @param {Rekapi.Actor} actor
 * @param {Rekapi.CanvasRenderer} canvasRenderer
 */
const addActor = (actor, canvasRenderer) => {
  const { id } = actor;
  canvasRenderer._renderOrder.push(id);
  canvasRenderer._canvasActors[id] = actor;
};

/*!
 * @param {Rekapi.Actor} actor
 * @param {Rekapi.CanvasRenderer} canvasRenderer
 */
const removeActor = (actor, canvasRenderer) => {
  canvasRenderer._renderOrder = _.without(canvasRenderer._renderOrder, actor.id);
  delete canvasRenderer._canvasActors[actor.id];
};

/*!
 * Sets up an instance of CanvasRenderer and attaches it to a `Rekapi`
 * instance.  Also augments the Rekapi instance with canvas-specific
 * functions.
 * @param {Rekapi} rekapi
 */
rendererInitHooks.canvas = rekapi => {
  if (typeof CanvasRenderingContext2D === 'undefined' ||
    !(rekapi.context instanceof CanvasRenderingContext2D)) {

    return;
  }

  rekapi.renderer = new CanvasRenderer(rekapi);
};

// CANVAS RENDERER OBJECT
//

export default class CanvasRenderer {

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
   * @param {CanvasRenderingContext2D=} context
   * @constructor
   */
  constructor (rekapi, context = undefined) {

    Object.assign(this, {
      rekapi,
      canvasContext: context || rekapi.context,
      _renderOrder: [],
      _renderOrderSorter: null,
      _canvasActors: {},
      _batchRendering: true
    });

    _.extend(rekapi._events, {
      beforeRender: [],
      afterRender: []
    });

    rekapi.on('afterUpdate', () => render(rekapi, this));
    rekapi.on('addActor', (rekapi, actor) => addActor(actor, this));
    rekapi.on('removeActor', (rekapi, actor) => removeActor(actor, this));
    rekapi.on('beforeRender', () => beforeRender(this));
  }

  /**
   * Get and optionally set the height of the associated `<canvas>` element.
   * @method height
   * @param {number=} height The height to optionally set.
   * @return {number}
   */
  height (height = undefined) {
    return dimension(this.canvasContext.canvas, 'height', height);
  }

  /**
   * Get and optionally set the width of the associated `<canvas>` element.
   * @method width
   * @param {number=} width The width to optionally set.
   * @return {number}
   */
  width (width = undefined) {
    return dimension(this.canvasContext.canvas, 'width', width);
  }

  /**
   * Erase the `<canvas>`.
   * @method clear
   * @return {Rekapi}
   */
  clear () {
    this.canvasContext.clearRect(0, 0, this.width(), this.height());

    return this.rekapi;
  }

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
   * __[Example](../../../../examples/canvas_move_actor_to_layer.html)__
   * @method moveActorToLayer
   * @param {Rekapi.Actor} actor
   * @param {number} layer This should be within `0` and the total number of
   * actors in the animation.  That number can be found with `{{#crossLink
   * "Rekapi/getActorCount:method"}}{{/crossLink}}`.
   * @return {Rekapi.Actor}
   */
  moveActorToLayer (actor, layer) {
    if (layer < this._renderOrder.length && layer > -1) {
      this._renderOrder = _.without(this._renderOrder, actor.id);
      this._renderOrder.splice(layer, 0, actor.id);
    }

    return actor;
  }

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
   * __[Example](../../../../examples/canvas_set_order_function.html)__
   * @method setOrderFunction
   * @param {function(Rekapi.Actor)} sortFunction
   * @return {Rekapi}
   */
  setOrderFunction (sortFunction) {
    this._renderOrderSorter = sortFunction;
    return this.rekapi;
  }

  /**
   * Remove the order function set by `{{#crossLink
   * "Rekapi.CanvasRenderer/setOrderFunction:method"}}{{/crossLink}}`.  The
   * render order defaults back to the order in which the actors were added to
   * the animation.
   *
   * __[Example](../../../../examples/canvas_unset_order_function.html)__
   * @method unsetOrderFunction
   * @return {Rekapi}
   */
  unsetOrderFunction () {
    this._renderOrderSorter = null;
    return this.rekapi;
  }
}
