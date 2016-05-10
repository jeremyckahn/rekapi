# Upgrading to Rekapi 1.3.0

This version of Rekapi changes how undefined keyframe states are handled, as well as single-keyframe states.  Animations that have a single keyframe will just compute and render that keyframe continuously.  The previous behavior was to not render the keyframe at all.

Rekapi will no longer provide `undefined` for keyframe properties when the playhead is outside of its track bounds.  If the playhead is before first keyframe for a given track, the first keyframe's state is the one that will be rendered.  If the playhead is after the last keyframe for a track, the final keyframe state is the one that will be rendered.

# Upgrading to Rekapi 1.0.0

There are several breaking changes in this release.  The most significant is that the globally-exposed object is renamed from `Kapi` to `Rekapi`, to match the name of the project.  It is recommended that you update your code, but in lieu of that you might be able to get away with this:

````javascript
window.Kapi = window.Rekapi;
````

If you are loading Rekapi as an AMD module, there is a good chance that you won't need to change any of your code in order to upgrade, since the object names provided by the loader are arbitrary.  In other words, this should still work:

````javascript
define(['rekapi'], function (Kapi) {
  // ...
});
````

Note that __all__ internal references to `Kapi` objects have been renamed from `kapi` to `rekapi` as well, so that might break your code regardless of how Rekapi was loaded.  To demonstrate:

````javascript
var rekapi = new Rekapi();
var actor = new Rekapi.Actor();
rekapi.add(actor);

rekapi === actor.rekapi; // <-- actor.rekapi used to be actor.kapi
````

## The `Rekapi` constructor signature has changed

Instead of a configuration object, `Rekapi` now expects the rendering context as the first and only parameter.  If you were providing `height` and `width` for canvas animations previously, you will now have to call those methods directly:

````
var rekapi = new Rekapi(document.createElement('canvas'));
rekapi.renderer.height(300);
rekapi.renderer.width(300);
````

## There are no more subclasses of `Rekapi.Actor`

`Rekapi.CanvasActor` and `Rekapi.DOMActor` are gone, there is only `Rekapi.Actor` now.  Context-specific actor methods have been moved to their respective renderers.  The signature and name of many of these methods have changed slightly, please refer to the docs of each individual renderer.

## The `Rekapi.KeyframeProperty` constructor signature has changed

`Rekapi.KeyframeProperty` no longer accepts the owner actor via the constructor.  The link between the two objects is established by the new method, `Rekapi.Actor.prototype.addKeyframeProperty`.

## `Rekapi.prototype.addActor` can now instantiate a `Rekapi.Actor`

Before, you had to create a `Rekapi.Actor` before calling `addActor`:

````javascript
var rekapi = new Rekapi();
var actor = new Actor();
rekapi.addActor(actor);
````

Now you can do this:

````javascript
var rekapi = new Rekapi();
var actor = rekapi.addActor();
````

The old form is still supported.

## `Rekapi.prototype.removeActor` now returns the removed actor

It used to return the `Rekapi` instance.

## Method renames

* `Rekapi.prototype.actorCount` is now called `Rekapi.prototype.getActorCount`
* `Rekapi.prototype.animationLength` is now called `Rekapi.prototype.getAnimationLength`
* `Rekapi.prototype.lastPositionUpdated` is now called `Rekapi.prototype.getLastPositionUpdated`
* `Rekapi.Actor.prototype.copyProperties` is now `Rekapi.Actor.prototype.copyKeyframe`
* `Rekapi.Actor.prototype.removeAllKeyframeProperties` is now `Rekapi.Actor.prototype.removeAllKeyframes`

These methods all work the same as before.

## `Rekapi.Actor.prototype.updateState` is now private

This function wasn't useful as a public API, so it has been made private by convention.  It is still accessible as `Rekapi.Actor.prototype._updateState`, but it is suggested that you update the state of the `Rekapi` instance instead.

## Canvas animations now require an instance of `CanvasRenderingContext2D` instead of a `<canvas>` element

Old way:

````javascript
var canvas = document.querySelector('canvas');
var rekapi = new Rekapi(canvas);
````

New way:

````javascript
var canvas = document.querySelector('canvas');
var rekapi = new Rekapi(canvas.getContext('2d'));
````

This approach will allow for more advanced renderers in the future, such as WebGL.

## `Rekapi.Actor.prototype.modifyKeyframeProperty` and `getKeyframeProperty` now look for properties based on their timeline millisecond

Previously, these methods used the zero-based track index to look for properties.

## `Rekapi.Actor.prototype.getTrackLength` was dropped in favor of `getPropertiesInTrack`

`getPropertiesInTrack` returns an `Array`, so you can just query the `length` property to get this value.

## `Rekapi.CanvasRenderer` instance is now called `renderer`

This was previously called `canvas`.  So:

````javascript
var rekapi = new Rekapi(document.createElement('canvas'));

// This used to be called `rekapi.canvas`.
rekapi.renderer instanceof Rekapi.CanvasRenderer; // true
````

## `Rekapi.CSSRenderer` is now called `Rekapi.DOMRenderer`

All `Rekapi.DOMActor` functionality has been ported into `Rekapi.DOMRenderer`.

## `Rekapi.DOMRenderer` instance is now called `renderer` and has different requirements

As you may suspect, this means that a Rekapi animation can no longer animate both DOM and Canvas actors.  This choice was made to simplify the API for common use cases.  The renderer to use for an animation is determined by the context that was provided to the Rekapi constructor.  CSS 3 animations require a non-canvas element as the context.  For simplicity, you can just provide the `<body>`:

````javascript
var rekapi = new Rekapi(document.body);

// ...

if (rekapi.renderer.canAnimateWithCSS()) {
  rekapi.renderer.play();
} else {
  rekapi.play();
}
````

### `Rekapi.prototype.toCSS` is now `Rekapi.DOMRenderer.prototype.toString`

These modules have been combined.  To generate the CSS string directly:

````javascript
var rekapi = new Rekapi(document.body);
rekapi.renderer.toString();
````

## `Rekapi.CanvasActor` is gone

Just use regular `Rekapi.Actor`s in your animations, the API is unchanged otherwise.

## `draw` is gone, all Actors now use `render`

The `Rekapi.Actor` constructor now expects a function called `render` instead of `draw` or `update`.  `draw` is no longer recognized by Rekapi.  Both functions work identically, it is just a name change.  The related events `beforeDraw` and `afterDraw` are now `beforeRender` and `afterRender`, respectively.

## `context` is no longer a method

`context` is now stored as an "own" property for all objects that previously had a `context` method.  For canvas animations, the public `context` property, which is supplied via the `Rekapi` constuctor, is changed internally at setup time to reference its 2D drawing context.

# Upgrading to Rekapi 0.13.0

`Kapi.Actor.prototype.data` is now just property, not a getter/setter method.

# Upgrading to Rekapi 0.10.0

The Canvas extension APIs were reorganized.  Now instead of being attached
directly to the `Kapi` prototype, they are attached to a new `canvas` property
on each `Kapi` instance.  This is explained more in the Canvas README, but
here's an example of the change:

````javascript
var kapi = new Kapi();

// This won't work anymore!
kapi.setOrderFunction();

// This is the new way to do it.
kapi.canvas.setOrderFunction();
````

Some of the Canvas extension methods have also been cleaned up to avoid
redundancy.  Assuming the `kapi` instance from above, here's all of the
methods:

  * `kapi.renderer.height()`
  * `kapi.renderer.width()`
  * `kapi.canvas.clear()`
  * `kapi.canvas.context()`
  * `kapi.canvas.moveActorToLayer()`
  * `kapi.canvas.setOrderFunction()`
  * `kapi.canvas.unsetOrderFunction()`

This version also removes draw order exporting functionality (in
`Kapi.prototype.exportTimeline`).

# Upgrading to Rekapi 0.9.13

`Kapi.prototype.redraw()` was removed.  You can still use
`Kapi.prototype.update()` (with no parameters) to achieve the same effect.

# Upgrading to Rekapi 0.9.6

The build process has changed.  Rekapi now uses UglifyJS and Node.js to
generate the binaries, not the Google Closure Compiler.  Please the README for
instructions on compiling.

# Upgrading to Rekapi 0.9.0

Version 0.8.x had lots of API changes, but 0.9.x should be much more stable.
However, there are some differences from older versions.

  * `Kapi.Actor` now receives the `update` constructor parameter to specify the
  function that processes the per-frame state data instead of `render`.  The
  analagous parameter for `Kapi.CanvasActor` is now `draw`.  `Kapi.DOMActor`
  doesn't need any such parameter.
  * Methods moved from core to the Canvas extension:
    * kapi.redraw
    * kapi.moveActorToLayer
    * kapi.setOrderFunction
    * kapi.unsetOrderFunction
    * actor.moveToLayer
  * Methods removed:
    * kapi.render
  * Method name changes
    * kapi.calculateActorPositions -> kapi.update
    * kapi.lastPositionRendered -> kapi.lastPositionUpdated
    * actor.calculatePosition -> actor.updateState
  * Actor draw ordering functionality was moved to the Canvas extension.

# Upgrading to Rekapi 0.8.17

Renamed `bind` to `on` and `unbind` to `off`.

# Upgrading to Rekapi 0.8.16

All event names removed the "on" prefix with proper camelCasing.  So,
"onAnimationComplete" is now "animationComplete," for example.

# Upgrading to Rekapi 0.8.5

All hide/show functionality has been __removed__.

# Upgrading to Rekapi 0.8.4

The keyframe model has __changed__.  It works much more like the `@keyframe`
CSS3 spec (but not identically).  With the new model, missing keyframe
properties are not copied from the previous keyframe.  If you want a
property to "wait" at a given value, you now need to declare that value at
every keyframe which the property should wait. So if your code looked like:

````javascript
actor.keyframe(0, {
  x: 10,
  y: 10
}).keyframe(1000, {
  x: 20
}).keyframe(2000, {
  x: 30,
  y: 20
});
````

It should now look like:

````javascript
actor.keyframe(0, {
  x: 10,
  y: 10
}).keyframe(1000, {
  x: 20,
  y: 10 // This property was manually copied from the previous keyframe!
}).keyframe(2000, {
  x: 30,
  y: 20
});
````

...In order to work the same.  The behavior of `Kapi.Actor.prototype.wait` has
also changed to sensibly match this new keyframe model.  It works basically the
same as before, except that now it implicitly fills in any missing keyframe
properties of the millisecond that is extended.  This is done so that all
properties can be properly paused.  In other words, when you call `wait()` on
an actor, all properties are paused for the duration of the wait.

# Upgrading to Rekapi 0.8.2

Rounding functionality was removed.  Passing `doRoundNumbers` to the `Kapi`
constructor will do nothing.

# Upgrading to Rekapi 0.8.1

The `draw` method that gets passed into the `Kapi.Actor` constructor (and its
subclasses) is now called `render`.  __Using `draw` instead of `render` will
break.__

# Upgrading to Rekapi 0.8.0

The API changed a bit for 0.8.0, as a result of issue #9.  Upgrading shouldn't
be too difficult, there are just a few changes you need to make to use it.

## Canvas animations

  1.  You need replace `Kapi.Actor` with `Kapi.CanvasActor`.
  2.  `Kapi.prototype.canvas_style` no longer exists.
  3.  All methods that began with `canvas_` are now camelCase.

## DOM animations

  1.  You don't need to have a container element or pass anything into the
  `Kapi` constructor.  No changes are made to the Actor DOM element's parent.

