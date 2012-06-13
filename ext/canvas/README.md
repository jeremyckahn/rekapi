You can use Rekapi to render to `<canvas>`.

# Kapi Object additions


### Events

This extension adds some new events you can bind to with `Kapi.on`.

  * __beforeDraw__: Fires just before an actor is drawn to the screen.
  * __afterDraw__: Fires just after an actor is drawn to the screen.


### canvasContext

````javascript
/**
 * @returns {CanvasRenderingContext2D}
 */
Kapi.prototype.canvasContext ()
````

Return the 2d context of the `<canvas>`.  This is needed for any and all canvas
rendering operations - it is also provided to a `CanvasActor`'s `draw`
method.  See the
[MDN](https://developer.mozilla.org/en/Drawing_Graphics_with_Canvas) for more
info on the `<canvas>` context.


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


### redraw

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.redraw ()
````

Re-`render()` the last frame that was `render()`ed.

__[Example](../../docs/examples/redraw.html)__


### setOrderFunction

````javascript
/**
 * @param {function(Kapi.CanvasActor, number)} sortFunction
 * @return {Kapi}
 */
Kapi.prototype.setOrderFunction (sortFunction)
````

Set a function that defines the draw order of the `CanvasActor`s.  This is
called each frame before the `CanvasActor`s are drawn.  The following example
assumes that all `CanvasActor`s are circles that have a `radius` property.  The
circles will be drawn in order of the value of their `radius`, from smallest to
largest.  This has the effect of layering larger circles on top of smaller
circles, giving a sense of perspective.

````javascript
kapi.setOrderFunction(function (actor) {
  return actor.get().radius;
});
````

__[Example](../../docs/examples/set_order_function.html)__


### unsetOrderFunction

````javascript
/**
 * @return {Kapi}
 */
Kapi.prototype.unsetOrderFunction ()
````

Remove the sort order function set by `setOrderFunction`.  Draw order defaults
back to the order in which `CanvasActors` were added.

__[Example](../../docs/examples/unset_order_function.html)__


### moveActorToLayer

````javascript
/**
 * @param {Kapi.Actor} actor
 * @param {number} layer
 * @returns {Kapi|undefined}
 */
Kapi.prototype.moveActorToLayer (actor, layer)
````

Move a `CanvasActor` around in the layer list.  Each layer has one
`CanvasActor`, and `CanvasActor`s are drawn in order of their layer.  Lower
layers (starting with 0) are drawn earlier.  If `layer` is higher than the
number of layers (which can be found with `actorCount()`) or lower than 0, this
method will return `undefined`.

__[Example](../../docs/examples/move_actor_to_layer.html)__


===


# Kapi.CanvasActor

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
Kapi.CanvasActor = function (element)
````

Note: `context` is inherited from the `Kapi` instance that a `Kapi.CanvasActor`
is added to if it is not provided to this constructor.


### moveToLayer

````javascript
/**
 * @param {number} layer
 * @returns {Kapi.Actor|undefined}
 */
Kapi.CanvasActor.prototype.moveToLayer (layer)
````

Move this `CanvasActor` to a different layer in the `Kapi` instance that it belongs
to.  This returns `undefined` if the operation was unsuccessful
