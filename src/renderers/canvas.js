import _ from 'lodash';
import Rekapi, {
  renderers,
  fireEvent
} from '../rekapi';

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
 * @param {CanvasRenderer} canvasRenderer
 */
const beforeRender = canvasRenderer => canvasRenderer.clear();

/*!
 * Render all the `Actor`s at whatever position they are currently in.
 * @param {Rekapi}
 * @param {CanvasRenderer} canvasRenderer
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
 * @param {Actor} actor
 * @param {CanvasRenderer} canvasRenderer
 */
const addActor = (actor, canvasRenderer) => {
  const { id } = actor;
  canvasRenderer._renderOrder.push(id);
  canvasRenderer._canvasActors[id] = actor;
};

/*!
 * @param {Actor} actor
 * @param {CanvasRenderer} canvasRenderer
 */
const removeActor = (actor, canvasRenderer) => {
  canvasRenderer._renderOrder = _.without(canvasRenderer._renderOrder, actor.id);
  delete canvasRenderer._canvasActors[actor.id];
};

// CANVAS RENDERER OBJECT
//

/**
 * You can use Rekapi to render animations to an HTML5 `<canvas>`.  To do so,
 * just provide a
 * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 * instance to the `{@link rekapi.Rekapi}` constructor to
 * automatically set up the renderer:
 *
 *     var context = document.createElement('canvas').getContext('2d');
 *     var rekapi = new Rekapi(context);
 *     rekapi.renderer instanceof CanvasRenderer; // true
 *
 * `CanvasRenderer` adds some canvas-specific events you can bind to
 * with `{@link rekapi.Rekapi#on}` (and unbind from
 * with `{@link rekapi.Rekapi#off}`:
 *
 *  - __beforeRender__: Fires just before an actor is rendered to the canvas.
 *  - __afterRender__: Fires just after an actor is rendered to the canvas.
 *
 * __Note__: `CanvasRenderer` is added to the `{@link rekapi.Rekapi}` instance
 * automatically as `this.renderer`, there is no reason to call the constructor
 * yourself in most cases.
 *
 * ## Multiple renderers
 *
 * Rekapi supports multiple renderers per instance.  Do do this, you must not
 * provide a
 * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 * to the `{@link rekapi.Rekapi}` constructor, you must
 * instead initialize the renderer yourself.  The
 * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 * that would have been provided to the `{@link rekapi.Rekapi}` constructor
 * instead is provided as the second parameter to `CanvasRenderer`:
 *
 *
 *     var canvasContext = document.querySelector('canvas').getContext('2d');
 *
 *     // No context gets passed to the Rekapi constructor
 *     var rekapi = new Rekapi();
 *
 *     // Initialize CanvasRenderer manually and give it a
 *     // CanvasRenderingContext2D.  You can name it anything you want on the
 *     // Rekapi instance.
 *     rekapi.canvasRenderer =
 *         new CanvasRenderer(rekapi, canvasContext);
 * @param {Rekapi} rekapi
 * @param {CanvasRenderingContext2D=} context
 * @constructs rekapi.CanvasRenderer
 */
export class CanvasRenderer {

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
   * @method rekapi.CanvasRenderer#height
   * @param {number=} height The height to optionally set.
   * @return {number}
   */
  height (height = undefined) {
    return dimension(this.canvasContext.canvas, 'height', height);
  }

  /**
   * Get and optionally set the width of the associated `<canvas>` element.
   * @method rekapi.CanvasRenderer#width
   * @param {number=} width The width to optionally set.
   * @return {number}
   */
  width (width = undefined) {
    return dimension(this.canvasContext.canvas, 'width', width);
  }

  /**
   * Erase the `<canvas>`.
   * @method rekapi.CanvasRenderer#clear
   * @return {Rekapi}
   */
  clear () {
    this.canvasContext.clearRect(0, 0, this.width(), this.height());

    return this.rekapi;
  }

  /**
   * Move an actor around within the render order list.  Each actor is rendered
   * in order of its layer (layers and actors have a 1:1 relationship).  The
   * later an actor is added to an animation (with `{@link
   * rekapi.Rekapi#addActor}`), the higher its layer.  Lower layers (starting
   * with 0) are rendered earlier.
   *
   *
   * This method has no effect if an order function is set with `{@link
   * rekapi.CanvasRenderer#setOrderFunction}`.
   *
   * @method rekapi.CanvasRenderer#moveActorToLayer
   * @param {Actor} actor
   * @param {number} layer This should be within `0` and the total number of
   * actors in the animation.  That number can be found with `{@link
   * rekapi.Rekapi#getActorCount}`.
   * @return {Actor}
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
   * `radius` `{@link rekapi.KeyframeProperty}`.  The circles will be rendered
   * in order of the value of their `radius`, from smallest to largest.  This
   * has the effect of layering larger circles on top of smaller circles, thus
   * giving a sense of perspective.
   *
   * If a render order function is specified, `{@link
   * rekapi.CanvasRenderer#moveActorToLayer}` will have no effect.
   *
   *     rekapi.renderer.setOrderFunction(function (actor) {
   *       return actor.get().radius;
   *     });
   * @method rekapi.CanvasRenderer#setOrderFunction
   * @param {function(Actor)} sortFunction
   * @return {Rekapi}
   */
  setOrderFunction (sortFunction) {
    this._renderOrderSorter = sortFunction;
    return this.rekapi;
  }

  /**
   * Remove the order function set by `{@link
   * rekapi.CanvasRenderer#setOrderFunction}`.  The render order defaults back
   * to the order in which the actors were added to the animation.
   *
   * @method rekapi.CanvasRenderer#unsetOrderFunction
   * @return {Rekapi}
   */
  unsetOrderFunction () {
    this._renderOrderSorter = null;
    return this.rekapi;
  }
}

/*!
 * Sets up an instance of CanvasRenderer and attaches it to a `Rekapi`
 * instance.  Also augments the Rekapi instance with canvas-specific
 * functions.
 * @param {Rekapi} rekapi
 */
renderers.push(rekapi => {
  if (typeof CanvasRenderingContext2D === 'undefined' ||
    !(rekapi.context instanceof CanvasRenderingContext2D)) {

    return;
  }

  rekapi.renderer = new CanvasRenderer(rekapi);
});
