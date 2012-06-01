# Kapi

### Kapi ###

````javascript
/**
 * @param {Object=} opt_config
 *   @param {number=} fps
 *   @param {Object=} context
 * @constructor
 */
Kapi (opt_config)
````

Create a `Kapi` instance.  Valid  properties of `opt_config`:

* __fps__: The frames per second at which the animation updates.  The default value is 30.
* __context__: The context that the animation will run in.  Can be any type of `Object`; gets used by the renderer and inherited by the `Kapi.Actor`s as they are added to the animation.  This isn't always needed, it usually just applies to `<canvas>` animations.  See the documenation on the [`<canvas>` extension](https://github.com/jeremyckahn/rekapi/tree/master/ext/canvas) for more info.

__[Example](examples/kapi.html)__


### addActor

````javascript
/**
 * @param {Kapi.Actor} actor
 * @returns {Kapi}
 */
Kapi.prototype.addActor (actor)
````

Add a `Kapi.Actor` to a `Kapi` instance.

__[Example](examples/add_actor.html)__


### getActor

````javascript
/**
 * @param {number} actorId
 * @returns {Kapi.Actor}
 */
Kapi.prototype.getActor (actorId)
````

Retrieve an `Actor` from the `Kapi` instance by its ID.  All `Actor`'s have an `id` property.

__[Example](examples/get_actor.html)__


### getAllActors

````javascript
/**
 * @returns {Object}
 */
Kapi.prototype.getAllActors ()
````

Retrieve all `Actor`s in a `Kapi` instance as an Object.  Actor IDs correspond to the property names of the returned Object.

__[Example](examples/get_all_actors.html)__


### getActorIds

````javascript
/**
 * @returns {Array}
 */
Kapi.prototype.getActorIds ()
````

Retrieve the IDs of all `Actor`s in a `Kapi` instance as an Array.

__[Example](examples/get_actor_ids.html)__


### removeActor

````javascript
/**
 * @param {Kapi.Actor} actor
 * @returns {Kapi}
 */
Kapi.prototype.removeActor (actor)
````

Remove `actor` from the animation.  This does not destroy `actor`, it only removes the link between `actor` and the `Kapi` instance.

__[Example](examples/remove_actor.html)__


### isPlaying

````javascript
/**
 * @returns {boolean}
 */
Kapi.prototype.isPlaying ()
````

Return whether or not the animation is playing (meaning not paused or stopped).

__[Example](examples/is_playing.html)__


### animationLength

````javascript
/**
 * @returns {number}
 */
Kapi.prototype.animationLength ()
````

Return the length of the animation, in milliseconds.

__[Example](examples/animation_length.html)__


### lastPositionRendered

````javascript
/**
 * @returns {number}
 */
Kapi.prototype.lastPositionRendered ()
````

Return the normalized (between 0 and 1) timeline position that was last rendered.

__[Example](examples/last_position_rendered.html)__


### actorCount

````javascript
/**
 * @returns {number}
 */
Kapi.prototype.actorCount ()
````

Return the number of `Actor`s in the animation.

__[Example](examples/actor_count.html)__


### framerate

````javascript
/**
 * @param {number=} opt_newFramerate
 * @returns {number}
 */
Kapi.prototype.framerate (opt_newFramerate)
````

Get and optionally set the framerate of the animation.  There's generally no point in going above 60.

__[Example](examples/framerate.html)__


### render

````javascript
/**
 * @param {number} millisecond
 * @returns {Kapi}
 */
Kapi.prototype.render (millisecond)
````

Calculate the positions for all `Actor`s at `millisecond`, and then render them.  You can define any millisecond in the animation to render, so long as it is less than the length of the animation (see `animationLength`).

__[Example](examples/render.html)__


### redraw

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.redraw ()
````

Re-`render()` the last frame that was `render()`ed.

__[Example](examples/redraw.html)__


### calculateActorPositions

````javascript
/**
 * @param {number} millisecond
 * @returns {Kapi}
 */
Kapi.prototype.calculateActorPositions (millisecond)
````

Update the position of all the `Actor`s at `millisecond`, but do not draw them.

__[Example](examples/calculate_actor_positions.html)__


### exportTimeline

````javascript
/**
 * @return {Object}
 */
Kapi.prototype.exportTimeline ()
````
Export a reference-less dump of this Kapi's animation properties and Actors.

__[Example](examples/export_timeline.html)__


### moveActorToLayer

````javascript
/**
 * @param {Kapi.Actor} actor
 * @param {number} layer
 * @returns {Kapi|undefined}
 */
Kapi.prototype.moveActorToLayer (actor, layer)
````

Move an `Actor` around in the layer list.  Each layer has one `Actor`, and `Actor`s are drawn in order of their layer.  Lower layers (starting with 0) are drawn earlier.  If `layer` is higher than the number of layers (which can be found with `actorCount()`) or lower than 0, this method will return `undefined`.

__[Example](examples/move_actor_to_layer.html)__


### bind

````javascript
/**
 * @param {string} eventName
 * @param {function} handler
 * @returns {Kapi}
 */
Kapi.prototype.bind (eventName, handler)
````

Bind an handler function to a Kapi event.  Possible events include:

* __beforeDraw__: Fires each frame before Actors are rendered.
* __frameRender__: Fires when a frame is rendered.
* __animationComplete__: Fires when all loops have finished.
* __playStateChange__: Fires when the animation is played, paused, or stopped.
* __play__: Fires when the animation is `play()`ed.
* __pause__: Fires when the animation is `pause()`d.
* __stop__: Fires when the animation is `stop()`ped.

__[Example](examples/bind.html)__


### unbind

````javascript
/**
 * @param {string} eventName
 * @param {function=} opt_handler
 * @returns {Kapi}
 */
Kapi.prototype.unbind (eventName, opt_handler)
````

Unbind `opt_handler` from a Kapi event.  If `opt_handler` is omitted, all handler functions bound to `eventName` are unbound.  Valid events correspond to the list under `bind()`.

__[Example](examples/unbind.html)__


### setOrderFunction

````javascript
/**
 * @param {function(Kapi.Actor, number)} sortFunction
 * @return {Kapi}
 */
Kapi.prototype.setOrderFunction (sortFunction)
````

Set a function that defines the draw order of the `Actor`s.  This is called each frame before the `Actor`s are drawn.  The following example assumes that all `Actor`s are circles that have a `radius` property.  The circles will be drawn in order of the value of their `radius`, from smallest to largest.  This has the effect of layering larger circles on top of smaller circles, giving a sense of perspective.

````javascript
kapi.setOrderFunction(function (actor) {
  return actor.get().radius;
});
````

__[Example](examples/set_order_function.html)__


### unsetOrderFunction

````javascript
/**
 * @return {Kapi}
 */
Kapi.prototype.unsetOrderFunction ()
````

Remove the sort order function set by `setOrderFunction`.  Draw order defaults back to the order in which `Actors` were added.

__[Example](examples/unset_order_function.html)__
