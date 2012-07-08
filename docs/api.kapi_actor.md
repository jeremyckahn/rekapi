# Kapi.Actor

````javascript
/**
 * @param {Object=} opt_config
 *   @param {Object=} context
 *   @param {function=} setup
 *   @param {function(Object, Object)=} update
 *   @param {function=} teardown
 * @constructor
 */
Kapi.Actor (opt_config)
````

Create a `Kapi.Actor` instance.

Valid properties of `opt_config` (you can omit the ones you don't need):

  * __context__: The context that this Actor is associated with. If omitted,
  this Actor gets the `Kapi` instance's context when it is added to an
  animation.
  * __setup__: A function that gets called when the `Actor` is added to a
  `Kapi` instance (with `addActor()`).
  * __update__: A function that gets called every time that the `Actor`'s state
  is updated. It receives two parameters: A reference to the `Actor`'s context
  and an Object containing the current state properties.
  * __teardown__: A function that gets called when the `Actor` is removed from
  the animation (with `removeActor()`).

`Kapi.Actor` does _not_ render to any context.  It is a base class.  Use the
[`Kapi.CanvasActor`](../ext/canvas) [`Kapi.DOMActor`](../ext/dom) subclasses to
render to the screen.

__[Example](examples/actor.html)__


### context

````javascript
/**
 * @param {Object} opt_context
 * @return {Object}
 */
Kapi.Actor.prototype.context (opt_context)
````

Get and optionally set the `Actor`'s context.

__[Example](examples/actor_context.html)__


### keyframe

````javascript
/**
 * @param {number} when
 * @param {Object} position
 * @param {string|Object=} opt_easing
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.keyframe (when, position, opt_easing)
````

Create a keyframe for the `Actor`.  `when` defines where in the animation to
place the keyframe, in milliseconds (assumes that `0` is when the animation
began).  The animation length will automatically "grow" to accommodate any
keyframe position.

`position` should contain all of the properties that define the keyframe's
state.  These properties can be any value that can be tweened by
[Shifty](https://github.com/jeremyckahn/shifty) (numbers, color strings, CSS
properties).

__Note:__ Internally, this creates a one or more `Kapi.KeyframeProperty`s and
places them on a "track."

`opt_easing`, if specified, can be a string or an Object.  If it's a string,
all properties in `position` will have the same easing formula applied to them.
Like this:

````javascript
actor.keyframe(1000, {
    'x': 100,
    'y': 100
  }, 'easeOutSine');
````

Both `x` and `y` will have `easeOutSine` applied to them.  You can also specify
multiple easing formulas with an Object:

````javascript
actor.keyframe(1000, {
    'x': 100,
    'y': 100
  }, {
    'x': 'easeinSine',
    'y': 'easeOutSine'
  });
````

`x` will transition with an easing of `easeInSine`, and `y` will transition
with an easing of `easeOutSine`.  Any missing properties will transition with
`linear`.  If the `opt_easing` property is omitted, all properties will default
to `linear`.

Keyframes always inherit missing properties from the keyframes that came before
them.  For example:

````javascript
actor.keyframe(0, {
  'x': 100
}).keyframe(1000{
  // Inheriting the `x` from above!
  'y': 50
});
````

Keyframe `1000` will have a `y` of `50`, and an `x` of `100`, because `x` was
inherited from keyframe `0`.


### copyProperties

````javascript
/**
 * @param {number} copyTo The millisecond to copy KeyframeProperties to
 * @param {number} copyFrom The millisecond to copy KeyframeProperties from
 * @return {Kapi.Actor}
 */
Kapi.Actor.prototype.copyProperties (copyTo, copyFrom)
````

Copy all of the properties that at one point in the timeline to another point.
This is useful for many things, particularly for bringing a `Kapi.Actor` back
to its original position.

__[Example](examples/actor_copy_properties.html)__


### wait

````javascript
/**
 * @param {number} until At what point in the animation the Actor should wait
 *     until (relative to the start of the animation)
 * @return {Kapi.Actor}
 */
Kapi.Actor.prototype.wait (until)
````

Extend the last state on this `Actor`'s timeline to create a animation wait.
The state does not change during this time.

__[Example](examples/actor_wait.html)__


### removeKeyframe

````javascript
/**
 * @param {number} when
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.removeKeyframe (when)
````

Remove all `KeyframeProperty`s at a given millisecond of the animation.  `when`
is the millisecond of the keyframe to remove.

__[Example](examples/actor_remove_keyframe.html)__


### removeAllKeyframeProperties

````javascript
/**
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.removeAllKeyframeProperties ()
````

Remove all `KeyframeProperty`s set on the `Actor`.

__[Example](examples/actor_remove_all_keyframe_properties.html)__


### modifyKeyframe

````javascript
/**
 * @param {number} when
 * @param {Object} stateModification
 * @param {Object=} opt_easingModification
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.modifyKeyframe (when, stateModification, opt_easingModification)
````

Augment the `value` or `easing` of any or all `KeyframeProperty`s at a given
millisecond for an `Actor`.  Any `KeyframeProperty`s not specified in
`stateModification` or `opt_easing` are not modified.  Here's how you might use
it:

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

__[Example](examples/actor_modify_keyframe.html)__


### getKeyframeProperty

````javascript
/**
 * @param {string} property The name of the property.
 * @param {number} index The index of the KeyframeProperty in the Actor's
 *     KeyframeProperty track.
 * @return {Kapi.KeyframeProperty|undefined}
 */
Kapi.Actor.prototype.getKeyframeProperty (property, index)
````

Gets the `KeyframeProperty` from an `Actor`'s `KeyframeProperty` track.
Returns `undefined` if the lookup failed.

__[Example](examples/actor_get_keyframe_property.html)__


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

Modify a specified `KeyframeProperty` stored on an `Actor`.  Essentially, this
calls `modifyWith` on the targeted `KeyframeProperty` (passing along
`newProperties`) and then performs some cleanup.

__[Example](examples/actor_modify_keyframe_property.html)__


### getTrackNames

````javascript
/**
 * @return {Array}
 */
Kapi.Actor.prototype.getTrackNames ()
````

Get a list of all the track names for an `Actor`.  Each element in this Array
is a string.

__[Example](examples/actor_get_track_names.html)__


### getTrackLength

````javascript
/**
 * @param {string} trackName
 * @return {number}
 */
Kapi.Actor.prototype.getTrackLength (trackName)
````

Get the property track length for an `Actor` (how many `KeyframeProperty`s are
in a given property track).

__[Example](examples/actor_get_track_length.html)__


### getStart

````javascript
/**
 * @param {string} opt_trackName
 * @return {number}
 */
Kapi.Actor.prototype.getStart (opt_trackName)

````

Get the millisecond of the first state of an `Actor` (when it first starts
animating).  You can get the start time of a specific track with
`opt_trackName`.

__[Example](examples/actor_get_start.html)__


### getEnd

````javascript
/**
 * @param {string} opt_trackName
 * @return {number}
 */
Kapi.Actor.prototype.getEnd (opt_trackName)

````

Get the millisecond of the last state of an `Actor` (when it is done
animating).  You can get the last state for a specific track with
`opt_trackName`.

__[Example](examples/actor_get_end.html)__


### getLength

````javascript
/**
 * @param {string} opt_trackName
 * @return {number}
 */
Kapi.Actor.prototype.getLength (opt_trackName)

````

Get the length of time in milliseconds that an `Actor` animates for.  You can
get the length of time that a specific track animates for with `opt_trackName`.

__[Example](examples/actor_get_length.html)__


### updateState

````javascript
/**
 * @param {number} millisecond
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.updateState (millisecond)
````

Calculate and set the `Actor`'s position at `millisecond` in the animation.

__[Example](examples/actor_update_state.html)__


### data

````javascript
/**
 * @param {Object=} opt_newData
 * @returns {Kapi.Actor}
 */
Kapi.Actor.prototype.data (opt_newData)
````

Retrieve and optionally bind arbitrary data to the `Actor`.  If `opt_newData`
is specified, it will overwrite the previous `opt_newData` Object that was
bound with this method.

__[Example](examples/actor_data.html)__


### exportTimeline

````javascript
/**
 * @return {Object}
 */
Kapi.Actor.prototype.exportTimeline ()
````

Export a reference-less dump of this Actor's timeline property tracks and
KeyframeProperties.

__[Example](examples/actor_export_timeline.html)__
