# Kapi.Actor

````javascript
/**
 * @param {Object} opt_config
 *   @param {function=} setup
 *   @param {function(CanvasRenderingContext2D, Object)=} draw
 *   @param {function=} teardown
 * @constructor
 */
Kapi.Actor (opt_config)
````

Create a `Kapi.Actor` instance.

Valid properties of `opt_config`:

* __setup__: A function that gets called when the `Actor` is added to a `Kapi` instance (with `addActor()`).
* __draw__: A function that gets called every frame that the actor is rendered in.  It receives two parameters:  A reference to a `<canvas>` context, and an Object containing the current state properties.  _This method should render the state properties to the screen with the `<canvas>` context._
* __teardown__: A function that gets called when the `Actor` is removed from the animation (with `removeActor()`).

````javascript
var actor = new Kapi.Actor({

  'setup': function () {
    console.log('Alive!');
  },

  'draw': function (canvas_context, state) {
    canvas_context.beginPath();
      canvas_context.arc(
        state.x || 0,
        state.y || 0,
        state.radius || 50,
        0,
        Math.PI*2,
        true);
      canvas_context.fillStyle = state.color || '#f0f';
      canvas_context.fill();
      canvas_context.closePath();

      return this;
  },

  'teardown': function () {
    console.log('Bye bye...');
  }

});
````


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