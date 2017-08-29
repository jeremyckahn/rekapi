import _ from 'lodash';
import Rekapi, {
  rendererBootstrappers,
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
 * instance to the {@link rekapi.Rekapi} constructor to
 * automatically set up the renderer:
 *
 *     const rekapi = new Rekapi(document.createElement('canvas').getContext('2d'));
 *
 *  To use this renderer's API, get a reference to the initialized object:
 *
 *     const canvasRenderer = rekapi.getRendererInstance(CanvasRenderer);
 *
 * `CanvasRenderer` adds some canvas-specific events you can bind to
 * with {@link rekapi.Rekapi#on} (and unbind from
 * with {@link rekapi.Rekapi#off}:
 *
 *  - __beforeRender__: Fires just before a {@link rekapi.Actor} is rendered to
 *  the canvas.
 *  - __afterRender__: Fires just after a {@link rekapi.Actor} is rendered to
 *  the canvas.
 *
 * __Note__: {@link rekapi.CanvasRenderer} is added to {@link
 * rekapi.Rekapi#renderers} automatically, there is no reason to call the
 * constructor yourself in most cases.
 * @param {rekapi.Rekapi} rekapi The {@link rekapi.Rekapi} instance to render for.
 * @param {CanvasRenderingContext2D=} context See [the canvas
 * docs](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D).
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
   * @param {number} [height] The height to optionally set.
   * @return {number}
   */
  height (height = undefined) {
    return dimension(this.canvasContext.canvas, 'height', height);
  }

  /**
   * Get and optionally set the width of the associated `<canvas>` element.
   * @method rekapi.CanvasRenderer#width
   * @param {number} [width] The width to optionally set.
   * @return {number}
   */
  width (width = undefined) {
    return dimension(this.canvasContext.canvas, 'width', width);
  }

  /**
   * Erase the `<canvas>`.
   * @method rekapi.CanvasRenderer#clear
   * @return {rekapi.Rekapi}
   */
  clear () {
    this.canvasContext.clearRect(0, 0, this.width(), this.height());

    return this.rekapi;
  }

  /**
   * Move a {@link rekapi.Actor} around within the render order list.  Each
   * {@link rekapi.Actor} is rendered in order of its layer (layers and {@link
   * rekapi.Actor}s have a 1:1 relationship).  The later a {@link rekapi.Actor}
   * is added to an animation (with {@link rekapi.Rekapi#addActor}), the higher
   * its layer.  Lower layers (starting with 0) are rendered earlier.
   *
   * This method has no effect if an order function is set with {@link
   * rekapi.CanvasRenderer#setOrderFunction}.
   *
   * @method rekapi.CanvasRenderer#moveActorToLayer
   * @param {rekapi.Actor} actor
   * @param {number} layer This should be within `0` and the total number of
   * {@link rekapi.Actor}s in the animation.  That number can be found with
   * {@link rekapi.Rekapi#getActorCount}.
   * @return {rekapi.Actor}
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
   * `radius` {@link rekapi.KeyframeProperty}.  The circles will be rendered
   * in order of the value of their `radius`, from smallest to largest.  This
   * has the effect of layering larger circles on top of smaller circles, thus
   * giving a sense of perspective.
   *
   * If a render order function is specified, {@link
   * rekapi.CanvasRenderer#moveActorToLayer} will have no effect.
   *
   *     rekapi.getRendererInstance(CanvasRenderer).setOrderFunction(
   *       actor => actor.get().radius
   *     );
   * @method rekapi.CanvasRenderer#setOrderFunction
   * @param {rekapi.actorSortFunction} sortFunction
   * @return {rekapi.Rekapi}
   */
  setOrderFunction (sortFunction) {
    this._renderOrderSorter = sortFunction;
    return this.rekapi;
  }

  /**
   * Remove the order function set by {@link
   * rekapi.CanvasRenderer#setOrderFunction}.  The render order defaults back
   * to the order in which the {@link rekapi.Actor}s were added to the
   * animation.
   *
   * @method rekapi.CanvasRenderer#unsetOrderFunction
   * @return {rekapi.Rekapi}
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
rendererBootstrappers.push(rekapi => {
  if (typeof CanvasRenderingContext2D === 'undefined' ||
    !(rekapi.context instanceof CanvasRenderingContext2D)) {

    return;
  }

  return new CanvasRenderer(rekapi);
});
