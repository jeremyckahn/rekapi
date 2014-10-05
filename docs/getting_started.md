# Getting started

Although Rekapi is renderer-agnostic, it's easiest to get started by making a
simple `<canvas>` animation.  The first step is to make a new `Rekapi`
instance.  Canvas animations require a 2D `<canvas>` context to render to,
which gets passed to the `Rekapi` constructor:

````javascript
var context = document.getElementsByTagName('canvas')[0].getContext('2d');
var rekapi = new Rekapi(context);
````

You now have a `Rekapi` instance, but it won't do anything until you define and
add some actors.

## Defining actors

Here's the boilerplate for an actor:

````javascript
var actor = new Rekapi.Actor({

  // Called every frame.  Receives a reference to the canvas context, and the
  // actor's state.
  'render': function (context, state) {

  }

});
````

Continuing from before, here's a sample implementation for a actor that gets
rendered as a circle to the canvas:

````javascript
var context = document.getElementsByTagName('canvas')[0].getContext('2d');
var rekapi = new Rekapi(context);

var actor = new Rekapi.Actor({
  // Draws a circle.
  'render': function (context, state) {
    context.beginPath();
    context.arc(
      state.x || 50,
      state.y || 50,
      state.radius || 50,
      0,
      Math.PI*2,
      true);
    context.fillStyle = state.color || '#f0f';
    context.fill();
    context.closePath();
  }
});
````

The actor's `render` method can be whatever you want, so don't focus too much
on what that function is actually doing here.  The idea is that the `context`
and `state` parameters are provided by `rekapi` on every frame update, and then
rendered to the `<canvas>` by the actor's `render` method.

Now that you have an actor instance, you just need to add it to `rekapi`:

````javascript
rekapi.addActor(actor);
````

Now you can define some keyframes.

## Defining keyframes

A keyframe is a way of saying "At a given point in time, the actor should have
a particular state."  Start off by giving `actor` a starting keyframe:

````javascript
actor.keyframe(0, {
    x: 50,
    y: 50
  });
````

`keyframe` is a method that takes two or three parameters - the first is what
millisecond on the animation timeline the keyframe should be placed, and the
second is an Object whose properties define the state that the actor should
have.  The optional third parameter is a string that specifies which
[Shifty](https://github.com/jeremyckahn/shifty) easing formula to use -
"linear" is the default.  The previous snippet says, "at zero milliseconds into
the animation, place `actor` at `x` 50, and `y` 50.  Continuing with that,
animate it to another point on the canvas:

````javascript
actor.keyframe(0, {
    x: 50,
    y: 50
  })
  .keyframe(1000, {
    x: 200,
    y: 100
  }, 'easeOutExpo');
````

The animation defined here will last one second, as the final `keyframe` is
set at 1000 milliseconds.  It will have a nice `easeOutExpo` ease applied to
it, as you can see in the third parameter.  Individual tweens (that is,
keyframed animation segments) get their easing curves from the keyframe they
are animating to, not animating from.

Rekapi inherits all of [Shifty's easing
functions](https://github.com/jeremyckahn/shifty/blob/master/src/shifty.formulas.js).

## Playing the animation

So now you've set up a sweet animation - run it and see what it looks like.
Continuing from before:

````javascript
rekapi.play();
````

And the animation will just loop continuously.  You can also pass a `number` to
`play()` to define how many times to play before stopping, like so:

````javascript
rekapi.play(3);
````

This will play the animation three times and stop.  When an animation stops, it
will just sit at the last frame that was rendered.  You can control the
animation playback with `rekapi.pause()` and `rekapi.stop()`.

## All together

Copy/paste/save this onto your computer to see a simple Rekapi animation:

````html
<!DOCTYPE html>
<html>
<head>
  <script src="https://raw.github.com/jeremyckahn/rekapi/master/dist/rekapi-lodash-shifty.min.js"></script>
</head>
<body>
  <canvas></canvas>
  <script>
  var context = document.getElementsByTagName('canvas')[0].getContext('2d');
  var rekapi = new Rekapi(context);

  var actor = new Rekapi.Actor({
    // Draws a circle.
    'render': function (context, state) {
      context.beginPath();
      context.arc(
        state.x || 50,
        state.y || 50,
        state.radius || 50,
        0,
        Math.PI*2,
        true);
      context.fillStyle = state.color || '#f0f';
      context.fill();
      context.closePath();
    }
  });

  rekapi.addActor(actor);

  actor.keyframe(0, {
      x: 50,
      y: 50
    })
    .keyframe(1000, {
      x: 200,
      y: 100
    }, 'easeOutExpo');

  rekapi.play();

  </script>
</body>
</html>
````
