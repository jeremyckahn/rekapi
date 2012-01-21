# Rekapi Public API

This document is separated into 2 sections:

1.  `Kapi` constructor and methods
2.  `Kapi.Actor` constructor and methods
3.  `Kapi.KeyframeProperty` constructor and methods

__Note__: Parameters with a prefix of `opt_` are optional and may be omitted.

## Kapi constructor and methods

### Kapi ###

````javascript
/**
 * @param {HTMLCanvas|HTMLElement|Object} canvas
 * @param {Object} opt_config
 * @constructor
 */
Kapi (canvas, opt_config)
````

Create a `Kapi` instance.  `canvas` is (typically) an HTML 5 `<canvas>` from the DOM.  This `<canvas>` is where the animation is drawn.  `canvas` can also be an `HTMLElement`, please see [dom.md](https://github.com/jeremyckahn/rekapi/blob/master/docs/dom.md) for documentation of DOM animations.

Functional properties of `opt_config`:

* __fps__: The frames per second at which the animation updates.
* __height__: The height to set upon `canvas`.
* __width__: The width to set upon `canvas`.


### addActor

````javascript
/**
 * @param {Kapi.Actor} actor
 * @returns {Kapi}
 */
Kapi.prototype.addActor (actor)
````

Add a `Kapi.Actor` to a `Kapi` instance.


### getActor

````javascript
/**
 * @param {number} actorId
 * @returns {Kapi.Actor}
 */
Kapi.prototype.getActor (actorId)
````

Retrieve an `Actor` from the `Kapi` instance by its ID.  All `Kapi.Actor`'s have an `id` property.


### removeActor

````javascript
/**
 * @param {Kapi.Actor} actor
 * @returns {Kapi}
 */
Kapi.prototype.removeActor (actor)
````

Remove `actor` from the animation.  This does not destroy `actor`, it only removes the link between `actor` and the `Kapi` instance.


### play

````javascript
/**
 * @param {number} opt_howManyTimes
 * @returns {Kapi}
 */
Kapi.prototype.play (opt_howManyTimes)
````

Play the animation on a loop, either a set amount of times or infinitely.  If `opt_howManyTimes` is omitted, the animation will loop infinitely.


### playFrom

````javascript
/**
 * @param {number} millisecond
 * @param {number} opt_howManyTimes
 * @returns {Kapi}
 */
Kapi.prototype.playFrom (millisecond, opt_howManyTimes)
````

Move to a specific millisecond on the timeline and play from there.  `opt_howManyTimes` works as it does in `play()`.


### playFromCurrent

````javascript
/**
 * @param {number} opt_howManyTimes
 * @returns {Kapi}
 */
Kapi.prototype.playFrom (opt_howManyTimes)
````

Play from the last frame that was drawn with `render()`. `opt_howManyTimes` works as it does in `play()`.


### pause

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.pause ()
````

Pause the animation.  A "paused" animation can be resumed from where it left off with `play()`.


### stop

````javascript
/**
 * @param {boolean} alsoClear
 * @returns {Kapi}
 */
Kapi.prototype.stop (alsoClear)
````

Stop the animation.  A "stopped" animation will start from the beginning if `play()` is called upon it again.  If `alsoClear` is `true`, the contents of the canvas will be cleared.  It is `false` by default.


### isPlaying

````javascript
/**
 * @returns {boolean}
 */
Kapi.prototype.isPlaying ()
````

Return whether or not the animation is playing (meaning not paused or stopped).


### animationLength

````javascript
/**
 * @returns {number}
 */
Kapi.prototype.animationLength ()
````

Return the length of the animation, in milliseconds.


### actorCount

````javascript
/**
 * @returns {number}
 */
Kapi.prototype.actorCount ()
````

Return the number of `Actor`s in the animation.


### framerate

````javascript
/**
 * @param {number} opt_newFramerate
 * @returns {number}
 */
Kapi.prototype.framerate (opt_newFramerate)
````

Get and optionally set the framerate of the animation.  There's generally no point in going above 60.


### render

````javascript
/**
 * @param {number} millisecond
 * @returns {Kapi}
 */
Kapi.prototype.render (millisecond)
````

Calculate the positions for all `Actor`s at `millisecond`, and then draw them.  You can define any millisecond in the animation to render, so long as it is less than the length of the animation (see `animationLength`).


### draw

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.draw ()
````

Draw all the `Actor`s at whatever position they are currently in.


### redraw

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.redraw ()
````

Re-`render()` the last frame that was `render()`ed.


### calculateActorPositions

````javascript
/**
 * @param {number} millisecond
 * @returns {Kapi}
 */
Kapi.prototype.calculateActorPositions (millisecond)
````

Update the position of all the `Actor`s at `millisecond`, but do not draw them.


### updateInternalState

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.updateInternalState ()
````

Invalidate and re-compute the internal state of the `Kapi`.


### exportTimeline

````javascript
/**
 * @return {Object}
 */
Kapi.prototype.exportTimeline ()
````
Export a reference-less dump of this Kapi's animation properties and Actors.


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
 * @param {Function} handler
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
 * @param {Function} opt_handler
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
 * @param {number} opt_height
 * @returns {number}
 */
Kapi.prototype.canvas_height (opt_height)

/**
 * @param {number} opt_width
 * @returns {number}
 */
Kapi.prototype.canvas_width (opt_width)
````

These methods get and optionally set their respective dimensions on the canvas.


### canvas_style

````javascript
/**
 * @param {string} styleName
 * @param {number|string} opt_styleValue
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


### Kapi.Actor constructor and methods ###

````javascript
/**
 * @param {Object} opt_config
 * @returns {Kapi.Actor}
 * @constructor
 */
Kapi.Actor (opt_config)
````

Create a `Kapi.Actor` instance.

Valid properties of `opt_config`:

* __setup__: A function that gets called when the `Actor` is added to a `Kapi` instance (with `addActor()`).
* __draw__: A function that gets called every frame that the actor is showing in.  It receives two parameters, the first is a reference to a `<canvas>` context, and the second is an Object containing the current state properties.  _This method should draw the state properties to the screen with the `<canvas>` context._
* __teardown__: A function that gets called when the `Actor` is removed from the animation (with `removeActor()`).


### keyframe

````javascript
/**
 * @param {number} when
 * @param {Object} position
 * @param {string|Object} opt_easing
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.keyframe (when, position, opt_easing)
````

Create a keyframe for the `Actor`.  `when` defines where in the animation to place the keyframe, in milliseconds (assumes that `0` is when the animation began).  The animation length will automatically "grow" to accommodate any keyframe position.

`position` should contain all of the properties that define the keyframe's state.  These properties can be any value that can be tweened by [Shifty](https://github.com/jeremyckahn/shifty) (numbers, color strings, CSS properties).

`opt_easing`, if specified, can be a string or an Object.  If it's a string, all properties in `position` will have the same easing formula applied to them.  Like this:

__Note:__ Internally, this creates a one or more `Kapi.KeyframeProperty`s and places them on a "track."  Any previously added/tracked properties that were not defined in `position` are inferred from previous, corresponding `KeyframeProperty`s.  This information will likely not be important to you unless you are making very complex animations, so don't worry if it doesn't make any sense.

````javascript
actor.keyframe(1000, {
    'x': 100,
    'y': 100
  }, 'easeOutSine');
````

Both `x` and `y` will have `easeOutSine` applied to them.  You can also specify multiple easing formulas with an Object:

````javascript
actor.keyframe(1000, {
    'x': 100,
    'y': 100
  }, {
    'x': 'easeinSine',
    'y': 'easeOutSine'
  });
````

`x` will transition with an easing of `easeInSine`, and `y` will transition with an easing of `easeOutSine`.  Any missing properties will transition with `linear`.  If the `opt_easing` property is omitted, all properties will default to `linear`.

Keyframes always inherit missing properties from the keyframes that came before them.  For example:

````javascript
actor.keyframe(0, {
  'x': 100
}).keyframe(1000{
  // Inheriting the `x` from above!
  'y': 50
});
````

Keyframe `1000` will have a `y` of `50`, and an `x` of `100`, because `x` was inherited from keyframe `0`.


### copyProperties

````javascript
/**
 * @param {number} copyTo The millisecond to copy KeyframeProperties to
 * @param {number} copyFrom The millisecond to copy KeyframeProperties from
 * @return {Kapi.Actor}
 */
Kapi.Actor.prototype.copyProperties (when, opt_source)
````

Copy all of the properties that at one point in the timeline to another point. This effectively copies the state of an `Actor` from point to another.


### wait

````javascript
/**
 * @param {number} until At what point in the animation the Actor should wait
 *     until (relative to the start of the animation)
 * @return {Kapi.Actor}
 */
Kapi.Actor.prototype.copyProperties (when, opt_source)
````

Extend the last state on this `Actor`'s timeline to create a animation wait.  The state does not change during this time.


### removeKeyframe

````javascript
/**
 * @param {number} when
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.removeKeyframe (when)
````

Remove all `KeyframeProperty`s at a given millisecond of the animation.  `when` is the millisecond of the keyframe to remove.


### removeAllKeyframeProperties

````javascript
/**
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.removeAllKeyframeProperties ()
````

Remove all `KeyframeProperty`s set on the `Actor`.


### modifyKeyframe

````javascript
/**
 * @param {number} when
 * @param {Object} stateModification
 * @param {Object} opt_easingModification
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.modifyKeyframe (when, stateModification, opt_easingModification)
````

Augment the `value` or `easing` of any or all `KeyframeProperty`s at a given millisecond for an `Actor`.  Any `KeyframeProperty`s not specified in `stateModification` or `opt_easing` are not modified.  Here's how you might use it:

````javascript
actor.keyframe(0, {
  'x': 10,
  'y': 20
}).keyframe(1000, {
  'x': 20,
  'y': 40
}).keyframe(2000, {
  'x': 30,
  'y': 60
})

// Changes the state of the keyframe at millisecond 1000.
// Modifies the value of 'y' and the easing of 'x.'
actor.modifyKeyframe(1000, {
  'y': 150
}, {
  'x': 'easeFrom'
});
````


### getKeyframeProperty

````javascript
/**
 * @param {string} property The name of the property.
 * @param {number} index The index of the KeyframeProperty in the Actor's
 *     KeyframeProperty track.
 * @return {Kapi.KeyframeProperty}
 */
Kapi.Actor.prototype.getKeyframeProperty (property, index)
````

Gets the `KeyframeProperty` from an `Actor`'s `KeyframeProperty` track.


### modifyKeyframeProperty

````javascript
/**
 * @param {string} property The name of the property to modify
 * @param {number} index The property track index of the KeyframeProperty to modify
 * @param {Object} newProperties The properties to augment the KeyframeProperty with
 * @return {Kapi.Actor}
 */
Kapi.Actor.prototype.modifyKeyframeProperty (property, index, newProperties)
````

Modify a specified `KeyframeProperty` stored on an `Actor`.  Essentially, this calls `modifyWith` on the targeted `KeyframeProperty` (passing along `newProperties`) and then performs some cleanup.


### getTrackNames

````javascript
/**
 * @return {Array}
 */
Kapi.Actor.prototype.getTrackNames ()
````

Get a list of all the track names for an `Actor`.  Each element in this Array is a string.


### getTrackLength

````javascript
/**
 * @param {string} trackName
 * @return {number}
 */
Kapi.Actor.prototype.getTrackLength (trackName)
````

Get the property track length for an `Actor`.


### getStart

````javascript
/**
 * @return {number}
 */
Kapi.Actor.prototype.getStart ()

````

Get the millisecond of the first state of an `Actor` (when it first starts animating).


### getEnd

````javascript
/**
 * @return {number}
 */
Kapi.Actor.prototype.getEnd ()

````

Get the millisecond of the last state of an `Actor` (when it is done animating).


### moveToLayer

````javascript
/**
 * @param {number} layer
 * @returns {Kapi.Actor|undefined}
 */
Kapi.Actor.prototype.moveToLayer (layer)
````

Move this `Actor` to a different layer in the `Kapi` instance that it belongs to.  This returns `undefined` if the operation was unsuccessful


### show

````javascript
/**
 * @param {boolean} alsoPersist
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.show (alsoPersist)
````

Tell the `Actor` to draw itself for the next rendered frame.  If `alsoPersist` is true, it continues to draw for every frame until `hide(true)` is called.


### hide

````javascript
/**
 * @param {boolean} alsoUnpersist
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.hide (alsoUnpersist)
````

Tell the `Actor` not to draw itself for the next frame.  If `alsoUnpersist` is true, this undoes the persistence effect of `show(true)`.


### isShowing

````javascript
/**
 * @returns {boolean}
 */
Kapi.Actor.prototype.isShowing ()
````

Return whether or not the `Actor` is showing for this frame or persisting across frames.


### calculatePosition

````javascript
/**
 * @param {number} millisecond
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.calculatePosition (millisecond)
````

Calculate and set the `Actor`'s position at `millisecond` in the animation.


### data

````javascript
/**
 * @param {Object} opt_newData
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.data (opt_newData)
````

Retrieve and optionally bind arbitrary data to the `Actor`.  If `opt_newData` is specified, it will overwrite the previous `opt_newData` Object that was bound with this method.


### exportTimeline

````javascript
/**
 * @return {Object}
 */
Kapi.Actor.prototype.exportTimeline ()
````

Export a reference-less dump of this Actor's timeline property tracks and KeyframeProperties.


### Kapi.KeyframeProperty constructor and methods ###

````javascript
/**
 * @param {Kapi.Actor} ownerActor The Actor to which this KeyframeProperty is associated.
 * @param {number} millisecond Where in the animation this KeyframeProperty lives.
 * @param {string} name The property's name, such as "x" or "opacity."
 * @param {number} value The value of `name`.  This is the value to animate to.
 * @param {string} opt_easing The easing to arrive to `value` at.  Defaults to linear.
 * @constructor
 */
Kapi.KeyframeProperty (ownerActor, millisecond, name, value, opt_easing)
````
Represents an individual component of an `Actor`'s keyframe state.  In most cases you won't need to deal with this directly, `Actor` abstracts a lot of what this Object does away for you.


### modifyWith

````javascript
/**
 * @param {Object} newProperties Contains the new `millisecond`, `easing`, or
 * `value` values to update this KeyframeProperty with.  These correspond to
 * the formal parameters of the KeyframeProperty constructor.
 */
Kapi.KeyframeProperty.prototype.modifyWith (newProperties)
````

Augment a `KeyframeProperty`'s properties.


### linkToNext

````javascript
/**
 * @param {KeyframeProperty} nextProperty The KeyframeProperty that immediately
 * follows this one in an animation.
 */
Kapi.KeyframeProperty.prototype.linkToNext (nextProperty)
````

Create the reference to the next KeyframeProperty in an `Actor`'s `KeyframeProperty` track.


### getValueAt

````javascript
/**
 * @param {number} millisecond The point in the animation to compute the
 * midpoint of the two KeyframeProperties.
 * @return {number}
 */
Kapi.KeyframeProperty.prototype.getValueAt (millisecond)
````

Calculate the midpoint between this `KeyframeProperty` and the next `KeyframeProperty` in an `Actor`'s `KeyframeProperty` track.


### exportTimeline

````javascript
/**
 * @return {Object}
 */
Kapi.KeyframeProperty.prototype.exportTimeline ()
````

Export a reference-less dump of this KeyframeProperty's state data.
