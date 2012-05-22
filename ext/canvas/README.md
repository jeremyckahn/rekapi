# Kapi.CanvasActor

You can use Rekapi to render to `<canvas>`.

````javascript
/**
 * @param {Object=} opt_config
 *   @param {Object=} context
 *   @param {function=} setup
 *   @param {function(CanvasRenderingContext2D, Object)=} draw
 *   @param {function=} teardown
 * @constructor
 * @extends Kapi.Actor
 */
Kapi.DOMActor = function (element)
````

This extension also adds the following methods to the `Kapi` prototype:

### canvasContext

````javascript
/**
 * @returns {CanvasRenderingContext2D}
 */
Kapi.prototype.canvasContext ()
````

Return the 2d context of the `<canvas>`.  This is needed for any and all cavnas
drawing operations - it is also provided to an `Actor`'s `draw` method.  See
the [MDN](https://developer.mozilla.org/en/Drawing_Graphics_with_Canvas) for
more info on the `<canvas>` context.


### canvasHeight, canvasWidth

````javascript
/**
 * @param {number=} opt_height
 * @returns {number}
 */
Kapi.prototype.canvasHeight (opt_height)

/**
 * @param {number=} opt_width
 * @returns {number}
 */
Kapi.prototype.canvasWidth (opt_width)
````

These methods get and optionally set their respective dimensions on the canvas.


### canvasClear

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.canvasClear ()
````

Erase the canvas.
