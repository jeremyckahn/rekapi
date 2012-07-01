You can use Rekapi to render to `<canvas>`.  This extension does two things:

  1. Subclasses `Kapi.Actor` as `Kapi.CanvasActor`.
  2. Attaches an instance of `Kapi.CanvasRenderer` to each instance of `Kapi`,
  named `canvas`, at initialization time.  So:

````javascript
// With the Rekapi <canvas> extension loaded
var kapi = new Kapi();
kapi.canvas instanceof Kapi.CanvasRenderer; // true
````


# Kapi Object additions


### Events

This extension adds some new events you can bind to with `Kapi.on`.

  * __beforeDraw__: Fires just before an actor is drawn to the screen.
  * __afterDraw__: Fires just after an actor is drawn to the screen.


# Kapi.CanvasRenderer


### context

````javascript
/**
 * @returns {CanvasRenderingContext2D}
 */
Kapi.CanvasRenderer.prototype.context ()
````

Retrieve the 2d context of the `<canvas>` that is set as the `Kapi` instance's
context.  This is needed for any and all canvas rendering operations.  It is
also provided to a `CanvasActor`'s `draw` method, so you mostly won't need to
call it directly.  Note that this is differet from the normal
`Kapi.prototype.context` method, as it does slightly more logic to retrieve the
actual `<canvas>` rendering context, not the DOM element.  See the
[MDN](https://developer.mozilla.org/en/Drawing_Graphics_with_Canvas) for more
info on the `<canvas>` context.


### height, width

````javascript
/**
 * @param {number=} opt_height
 * @returns {number}
 */
Kapi.CanvasRenderer.prototype.height (opt_height)

/**
 * @param {number=} opt_width
 * @returns {number}
 */
Kapi.CanvasRenderer.prototype.width (opt_width)
````

These methods get and optionally set their respective dimensions on the canvas.


### clear

````javascript
/**
 * @returns {Kapi}
 */
Kapi.CanvasRenderer.prototype.clear ()
````

Erase the canvas.


### setOrderFunction

````javascript
/**
 * @param {function(Kapi.CanvasActor, number)} sortFunction
 * @return {Kapi}
 */
Kapi.CanvasRenderer.prototype.setOrderFunction (sortFunction)
````

Set a function that defines the draw order of the `CanvasActor`s.  This is
called each frame before the `CanvasActor`s are drawn.  The following example
assumes that all `CanvasActor`s are circles that have a `radius` property.  The
circles will be drawn in order of the value of their `radius`, from smallest to
largest.  This has the effect of layering larger circles on top of smaller
circles, giving a sense of perspective.

````javascript
kapi.canvas.setOrderFunction(function (actor) {
  return actor.get().radius;
});
````

__[Example](../docs/examples/canvas_set_order_function.html)__


### unsetOrderFunction

````javascript
/**
 * @return {Kapi}
 */
Kapi.CanvasRenderer.prototype.unsetOrderFunction ()
````

Remove the sort order function set by `setOrderFunction`.  Draw order defaults
back to the order in which `CanvasActors` were added.

__[Example](../docs/examples/canvas_unset_order_function.html)__


### moveActorToLayer

````javascript
/**
 * @param {Kapi.Actor} actor
 * @param {number} layer
 * @return {Kapi|undefined}
 */
Kapi.CanvasRenderer.prototype.moveActorToLayer (actor, layer)
````

Move a `CanvasActor` around in the layer list.  Each layer has one
`CanvasActor`, and `CanvasActor`s are drawn in order of their layer.  Lower
layers (starting with 0) are drawn earlier.  If `layer` is higher than the
number of layers (which can be found with `actorCount()`) or lower than 0, this
method will return `undefined`.

__[Example](../docs/examples/canvas_move_actor_to_layer.html)__


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

Move this `CanvasActor` to a different layer in the `Kapi` instance that it
belongs to.  This returns `undefined` if the operation was unsuccessful.  The
method just calls `Kapi.CanvasRenderer.prototype.moveActorToLayer`.
