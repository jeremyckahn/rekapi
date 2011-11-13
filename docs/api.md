# Rekapi Public API

This document is separated into 2 sections:

1.  `Kapi` constructor and methods
2.  `Kapi.Actor` constructor and methods

__Note__: Parameters with a prefix of `opt_` are optional and may be omitted.

## Kapi constructor and methods

### Kapi

````javascript
/**
 * @param {HTMLCanvas} canvas
 * @param {Object} opt_config
 * @returns {Kapi}
 */
Kapi (canvas, opt_config)
````

Create a `Kapi` instance.  `canvas` is an HTML 5 `<canvas>` from the DOM.  This `<canvas>` is where the animation is drawn.

Valid properties of `opt_config`:

* __fps__: The frames per second at which the animation updates.
* __height__: The height to set upon `canvas`.
* __width__: The width to set upon `canvas`.


### addActor

````javascript
/**
 * @param {Kapi.Actor} actor
 * @param {Object} opt_initialState
 * @returns {Kapi}
 */
Kapi.prototype.addActor (actor, opt_initialState)
````

Add a `Kapi.Actor` to a `Kapi` instance.  Optionally define the state at which the Actor will start from.


### getActor

````javascript
/**
 * @param {number} actorId
 * @returns {Kapi.Actor}
 */
Kapi.prototype.getActor (actorId)
````

Retrieve an Actor from the `Kapi` instance by its ID.  All `Kapi.Actor`'s have an `id` property.


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

Return the number of Actors in the animation.


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
 
Calculate the positions for all Actors at `millisecond`, and then draw them.  You can define any millisecond in the animation to render, so long as it is less than the length of the animation (see `animationLength`).

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

Update the position of all the Actors at `millisecond`, but do not draw them.


### draw

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.draw ()
````

Draw all the Actors at whatever position they are currently in.


### updateInternalState

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.updateInternalState ()
````

Invalidate and re-compute the internal state of the `Kapi`.


### moveActorToLayer

````javascript
/**
 * @param {Kapi.Actor} actor
 * @param {number} layer
 * @returns {Kapi|undefined}
 */
Kapi.prototype.moveActorToLayer (actor, layer)
````

Move an Actor around in the layer list.  Each layer has one Actor, and Actors are drawn in order of their layer.  Lower layers (starting with 0) are drawn earlier.  If `layer` is higher than the number of layers (which can be found with `actorCount()`) or lower than 0, this method will return `undefined`.


### canvas_context

````javascript
/**
 * @returns {CanvasRenderingContext2D}
 */
Kapi.prototype.canvas_context ()
````

Return the 2d context of the `<canvas>`.  This is needed for any and all drawing operations - it is also provided to an Actor's `draw` method.  See the [MDN](https://developer.mozilla.org/en/Drawing_Graphics_with_Canvas) for more info on the `<canvas>` context.


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

Erase the canvas.


## Kapi.Actor constructor and methods

````javascript
/**
 * @param {Object} opt_config
 * @returns {Kapi.Actor}
 */
Kapi.Actor (opt_config)
````

Create a `Kapi.Actor` instance.

Valid properties of `opt_config`:

* __setup__: A function that gets called when the Actor is added to a `Kapi` instance (with `addActor()`).
* __draw__: A function that gets called every frame that the actor is showing in.  It receives two parameters, the first is a reference to a `<canvas>` context, and the second is an Object containing the current state properties.  _This method should draw the state properties to the screen with the `<canvas>` context._
* __teardown__: A function that gets called when the Actor is removed from the animation (with `removeActor()`).


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

Create a keyframe for the Actor.  `when` defines where in the animation to place the keyframe, in milliseconds (assumes that `0` is when the animation began).  The animation length will automatically "grow" to accommodate any keyframe position.  

`position` should contain all of the properties that define the keyframe's state.  These properties can be any value that can be tweened by [Shifty](https://github.com/jeremyckahn/shifty) (numbers, color strings, CSS properties).

`opt_easing`, if specified, can be a string or an Object.  If it's a string, all properties in `position` will have the same easing formula applied to them.  Like this:

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


### liveCopy

````javascript
/**
 * @param {number} when
 * @param {number} opt_source
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.liveCopy (when, opt_source)
````

Copy an existing keyframe into another keyframe.  If the original keyframe is modified by `modifyKeyframe()`, then the copy is modified as well.  If the original keyframe is deleted, the copy remains.  If the original keyframe is overwritten with `keyframe()`, then the link between the keyframes is lost (although the copy remains as an independent keyframe).

`when` specifies where in the animation to place the liveCopy.  `opt_source` specifies which keyframe to use as the source to copy from (as defined by its millisecond position in the animation).  If `opt_source` is omitted, then the last keyframe set on this actor is copied.  This is useful for creating a "waiting" behavior.

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

Augments the properties of a pre-existing keyframe.  `when` specifies the millisecond target keyframe to modify.  For `stateModification`, each property  will overwrite the target keyframe's corresponding property.  If a property in `stateModification` is `null`, then the property on the target will be deleted.

If `opt_easingModification` is specified, it works identically to `stateModification`, but with the easing properties instead of the state properties.


### removeKeyframe

````javascript
/**
 * @param {number} when
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.removeKeyframe (when)
````

Remove a keyframe set on the Actor.  `when` is the millisecond of the keyframe to remove.


### removeAllKeyframes

````javascript
/**
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.removeAllKeyframes ()
````

Remove all keyframes set on the Actor.


### moveToLayer

````javascript
/**
 * @param {number} layer
 * @returns {Kapi.Actor|undefined}
 */
Kapi.Actor.prototype.moveToLayer (layer)
````

Move this Actor to a different layer in the `Kapi` instance that it belongs to.  This returns `undefined` if the operation was unsuccessful


### show

````javascript
/**
 * @param {boolean} alsoPersist
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.show (alsoPersist)
````

Tell the Actor to draw itself for the next rendered frame.  If `alsoPersist` is true, it continues to draw for every frame until `hide(true)` is called.


### hide

````javascript
/**
 * @param {boolean} alsoUnpersist
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.hide (alsoUnpersist)
````

Tell the Actor not to draw itself for the next frame.  If `alsoUnpersist` is true, this undoes the persistence effect of `show(true)`.


### isShowing

````javascript
/**
 * @returns {boolean}
 */
Kapi.Actor.prototype.isShowing ()
````

Return whether or not the Actor is showing for this frame or persisting across frames.


### calculatePosition

````javascript
/**
 * @param {number} millisecond
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.calculatePosition (millisecond)
````

Calculate and sets the Actor's position at `millisecond` in the animation.


### keyframeList

````javascript
/**
 * @returns {Array}
 */
Kapi.Actor.prototype.keyframeList ()
````

Expose the Actor's ordered list of keyframe "when" times (as `number`s).


### data

````javascript
/**
 * @param {Object} opt_newData
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.data (opt_newData)
````

Retrieve and optionally bind arbitrary data to the Actor.  If `opt_newData` is specified, it will overwrite the previous `opt_newData` Object that was bound with this method.
