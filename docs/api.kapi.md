# Kapi

### Kapi ###

````javascript
/**
 * @param {HTMLCanvas|HTMLElement|Object} canvas
 * @param {Object=} opt_config
 * @constructor
 */
Kapi (canvas, opt_config)
````

Create a `Kapi` instance.  `canvas` is (typically) an HTML 5 `<canvas>` from the DOM.  This `<canvas>` is where the animation is drawn.  `canvas` can also be an `HTMLElement`, please see [dom.md](dom.md) for documentation of DOM animations.

Functional properties of `opt_config`:

* __fps__: Number.  The frames per second at which the animation updates.  The default value is 30.
* __height__: Number.  The height to set upon `canvas`.
* __width__: Number.  The width to set upon `canvas`.
* __doRoundNumbers__: Boolean.  Force all calculated state values to be rounded to the nearest integer.  This is an optimization that generally equates to faster screen updates, but the quality of the animation may suffer.  `false` by default.
* __clearOnUpdate__: Boolean.  Whether or not clear out the canvas before each new frame is drawn.  `true` by default.

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


### play

````javascript
/**
 * @param {number=} opt_howManyTimes
 * @returns {Kapi}
 */
Kapi.prototype.play (opt_howManyTimes)
````

Play the animation on a loop, either a set amount of times or infinitely.  If `opt_howManyTimes` is omitted, the animation will loop infinitely.

__[Example](examples/play.html)__


### playFrom

````javascript
/**
 * @param {number} millisecond
 * @param {number=} opt_howManyTimes
 * @returns {Kapi}
 */
Kapi.prototype.playFrom (millisecond, opt_howManyTimes)
````

Move to a specific millisecond on the timeline and play from there.  `opt_howManyTimes` works as it does in `play()`.

__[Example](examples/play_from.html)__


### playFromCurrent

````javascript
/**
 * @param {number=} opt_howManyTimes
 * @returns {Kapi}
 */
Kapi.prototype.playFromCurrent (opt_howManyTimes)
````

Play from the last frame that was drawn with `render()`. `opt_howManyTimes` works as it does in `play()`.

__[Example](examples/play_from_current.html)__


### pause

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.pause ()
````

Pause the animation.  A "paused" animation can be resumed from where it left off with `play()`.

__[Example](examples/pause.html)__


### stop

````javascript
/**
 * @param {boolean} alsoClear
 * @returns {Kapi}
 */
Kapi.prototype.stop (alsoClear)
````

Stop the animation.  A "stopped" animation will start from the beginning if `play()` is called upon it again.  If `alsoClear` is `true`, the contents of the canvas will be cleared.  It is `false` by default.

__[Example](examples/stop.html)__


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

Calculate the positions for all `Actor`s at `millisecond`, and then draw them.  You can define any millisecond in the animation to render, so long as it is less than the length of the animation (see `animationLength`).

__[Example](examples/render.html)__


### draw

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.draw ()
````

Draw all the `Actor`s at whatever position they are currently in.

__[Example](examples/draw.html)__


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

* __onFrameRender__: Fires when a frame is rendered.
* __onAnimationComplete__: Fires when all loops have finished.
* __onPlayStateChange__: Fires when the animation is played, paused, or stopped.
* __onPlay__: Fires when the animation is `play()`ed.
* __onPause__: Fires when the animation is `pause()`d.
* __onStop__: Fires when the animation is `stop()`ped.


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


### unsetOrderFunction

````javascript
/**
 * @return {Kapi}
 */
Kapi.prototype.unsetOrderFunction (sortFunction)
````

Remove the sort order function set by `setOrderFunction`.  Draw order defaults back to the order in which `Actors` were added.


### canvas_setContext

````javascript
/**
 * @param {HTMLCanvas|HTMLElement|Object} canvas
 * @returns {CanvasRenderingContext2D|HTMLElement|Object}
 */
Kapi.prototype.canvas_setContext (canvas)
````

Define the context that Kapi is rendering in.  This can be either an HTML 5 <canvas>, other DOM element, or Object.  Note that if `canvas` is not an HTML 5 <canvas>, `canvas_clear` doesn't do anything.


### canvas_getContext

````javascript
/**
 * @returns {CanvasRenderingContext2D|HTMLElement|Object}
 */
Kapi.prototype.canvas_getContext ()
````

Return the 2d context of the `<canvas>`.  This is needed for any and all drawing operations - it is also provided to an `Actor`'s `draw` method.  See the [MDN](https://developer.mozilla.org/en/Drawing_Graphics_with_Canvas) for more info on the `<canvas>` context.


### canvas_height, canvas_width

````javascript
/**
 * @param {number=} opt_height
 * @returns {number}
 */
Kapi.prototype.canvas_height (opt_height)

/**
 * @param {number=} opt_width
 * @returns {number}
 */
Kapi.prototype.canvas_width (opt_width)
````

These methods get and optionally set their respective dimensions on the canvas.


### canvas_style

````javascript
/**
 * @param {string} styleName
 * @param {number|string=} opt_styleValue
 * @returns {number|string}
 */
Kapi.prototype.canvas_style (styleName, opt_styleValue)
````

Get and optionally set a CSS style on the canvas.


### canvas_clear

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.canvas_clear ()
````

Erase the canvas.  This only does something if Kapi is bound to an HTML 5 `<canvas>`.
