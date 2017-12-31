import Rekapi, {
  rendererBootstrappers
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
 * __Note__: {@link rekapi.CanvasRenderer} is added to {@link
 * rekapi.Rekapi#renderers} automatically, there is no reason to call the
 * constructor yourself in most cases.
 * @param {rekapi.Rekapi} rekapi The {@link rekapi.Rekapi} instance to render for.
 * @param {CanvasRenderingContext2D=} context See [the canvas
 * docs](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D).
 * @constructor rekapi.CanvasRenderer
 * @extends {rekapi.renderer}
 */
export class CanvasRenderer {

  constructor (rekapi, context = undefined) {
    Object.assign(this, {
      rekapi,
      canvasContext: context || rekapi.context
    });

    rekapi.on('beforeUpdate', () => this.clear());
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
   * @return {rekapi.CanvasRenderer}
   */
  clear () {
    this.canvasContext.clearRect(0, 0, this.width(), this.height());

    return this;
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
