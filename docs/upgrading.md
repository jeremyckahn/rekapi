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

