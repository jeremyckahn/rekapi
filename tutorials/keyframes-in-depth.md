## Keyframe inheritance

Keyframes always inherit missing properties from the previous keyframe.  For
example:

    import { Rekapi, Actor } from 'rekapi';

    const rekapi = new Rekapi();
    const actor = rekapi.addActor();

    actor.keyframe(0, {
      x: 100
    }).keyframe(1000, {
      // Implicitly copies the `x: 100` from above
      y: 50
    });

Keyframe `1000` will have a `y` of `50`, and an `x` of `100`, because `x` was
inherited from keyframe `0`.

## Function keyframes

Instead of providing an Object to be used to interpolate state values, you can
provide [a function]{@link rekapi.keyframeFunction} to be called at a specific
point on the timeline.  This function does not need to return a value, as it
does not get used to render the actor state.  Function keyframes are called
once per animation loop and do not have any tweening relationship with one
another.  This is a primarily a mechanism for scheduling arbitrary code to be
executed at specific points in an animation.

    actor.keyframe(1000, actor => console.log(actor));

## Easing

`easing`, if provided, can be a string or an Object.  If `easing` is a string,
all animated properties will have the same easing curve applied to them.  For
example:

    actor.keyframe(1000, { x: 100, y: 100 }, 'easeOutSine');

Both `x` and `y` will have `easeOutSine` applied to them.  You can also specify
multiple easing curves with an Object:

    actor.keyframe(1000, {
        x: 100,
        y: 100
      }, {
        x: 'easeinSine',
        y: 'easeOutSine'
      });

`x` will ease with `easeInSine`, and `y` will ease with `easeOutSine`.  Any
unspecified properties will ease with `linear`.  If `easing` is omitted, all
properties will default to `linear`.
