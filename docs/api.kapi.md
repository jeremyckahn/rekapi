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

  * __fps__: The frames per second at which the animation updates.  The default
  value is 30.
  * __context__: The context that the animation will run in.  Can be any type
  of `Object`; gets used by the renderer and inherited by the `Kapi.Actor`s as
  they are added to the animation.  This isn't always needed, it usually just
  applies to `<canvas>` animations.  See the documenation on the
  [`<canvas>` extension](https://github.com/jeremyckahn/rekapi/tree/master/ext/canvas)
  for more info.

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

Retrieve an `Actor` from the `Kapi` instance by its ID.  All `Actor`'s have an
`id` property.

__[Example](examples/get_actor.html)__


### getAllActors

````javascript
/**
 * @returns {Object}
 */
Kapi.prototype.getAllActors ()
````

Retrieve all `Actor`s in a `Kapi` instance as an Object.  Actor IDs correspond
to the property names of the returned Object.

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

Remove `actor` from the animation.  This does not destroy `actor`, it only
removes the link between `actor` and the `Kapi` instance.

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


### lastPositionUpdated

````javascript
/**
 * @returns {number}
 */
Kapi.prototype.lastPositionUpdated ()
````

Return the normalized (between 0 and 1) timeline position that was last
calculated.

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

Get and optionally set the framerate of the animation.  There's generally no
point in going above 60.

__[Example](examples/framerate.html)__


### update

````javascript
/**
 * @param {number} millisecond
 * @returns {Kapi}
 */
Kapi.prototype.update (millisecond)
````

Update the position of all the `Actor`s at `millisecond`.

__[Example](examples/update.html)__


### exportTimeline

````javascript
/**
 * @return {Object}
 */
Kapi.prototype.exportTimeline ()
````
Export a reference-less dump of this Kapi's animation properties and Actors.

__[Example](examples/export_timeline.html)__


### on

````javascript
/**
 * @param {string} eventName
 * @param {function} handler
 * @returns {Kapi}
 */
Kapi.prototype.on (eventName, handler)
````

Bind an handler function to a Kapi event.  Possible events include:

  * __animationComplete__: Fires when all animations loops have completed.
  * __playStateChange__: Fires when the animation is played, paused, or
  stopped.
  * __play__: Fires when the animation is `play()`ed.
  * __pause__: Fires when the animation is `pause()`d.
  * __stop__: Fires when the animation is `stop()`ped.
  * __beforeUpdate__: Fires each frame before all Actors are updated.
  * __afterUpdate__: Fires each frame after all Actors are updated.
  * __addActor__: Fires when an Actor is added.
  * __removeActor__: Fires when an Actor is removed.

__[Example](examples/bind.html)__


### off

````javascript
/**
 * @param {string} eventName
 * @param {function=} opt_handler
 * @returns {Kapi}
 */
Kapi.prototype.off (eventName, opt_handler)
````

Unbind `opt_handler` from a Kapi event.  If `opt_handler` is omitted, all
handler functions bound to `eventName` are unbound.  Valid events correspond to
the list under `bind()`.

__[Example](examples/unbind.html)__
