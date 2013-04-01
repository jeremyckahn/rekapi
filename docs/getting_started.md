# Getting started

Although Rekapi can render any type of View, such as DOM, let's start off by
making a simple `<canvas>` animation.  The first step is to  make a new `Kapi`
instance.  Canvas animations require a `<canvas>` element to render to, which
we will supply to the `Kapi` constructor:

````javascript
var canvas = document.getElementsByTagName('canvas')[0];
var kapi = new Kapi({
    'context': canvas
  });
````

So now we have a Kapi instance... but it won't do terribly much until you
define and add some Actors.

## Defining Actors

Here's the boilerplate for a canvas Actor:

````javascript
var actor = new Kapi.CanvasActor({

  // Called every frame.  Receives a reference to the canvas context, and the
  // Actor's state.
  'draw': function (context, state) {

  }

});
````

Continuing from before, here's a sample implementation for a canvas actor:

````javascript
var canvas = document.getElementsByTagName('canvas')[0];
var kapi = new Kapi({
    'context': canvas
  });

var actor = new Kapi.CanvasActor({
  // Draws a circle.
  'draw': function (context, state) {
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

The Actor's `draw` method can do whatever you want it to, really.  The idea is
that the `context` and `state` parameters are computed by `kapi`, and then
rendered to the `<canvas>` by the Actor's `draw` method.

Now that we have an Actor instance, we just need to add it to `kapi`:

````javascript
kapi.addActor(actor);
````

Now we can define some keyframes.

## Defining keyframes

A Rekapi keyframe is a way of saying "At a given point in time, the Actor
should have a particular state."  Let's start off by giving `actor` a starting
keyframe:

````javascript
actor
  .keyframe(0, {
    x: 50,
    y: 50
  });
````

`keyframe` is a method that takes two or three parameters - the first is how
many milliseconds into the animation this keyframe is going start, and the
second is an Object whose properties define the state that the Actor should
have.  The third parameter is a string that defines which
[Shifty](https://github.com/jeremyckahn/shifty) easing formula to use -
"linear" is the default.  The previous snippet says, "at zero milliseconds into
the animation, place `actor` at `x` 50, and `y` 50.  Continuing with the
previous snippet, let's animate it to another point on the canvas:

````javascript
actor
  .keyframe(0, {
    x: 50,
    y: 50
  })
  .keyframe(1000, {
    x: 200,
    y: 100
  }, 'easeOutExpo');
````

The animation defined here will last one second, as the second `keyframe` is
placed at 1000 milliseconds.  It will have a nice `easeOutExpo` ease applied to
it, as we can see in the third parameter.  Tweens get their easing formula from
the keyframe they are animating to, not animating from.

Rekapi inherits all of [Shifty's easing
formulas](https://github.com/jeremyckahn/shifty/blob/master/src/shifty.formulas.js).

## Playing the animation

So now we've set up a sweet animation - let's run it and see what it looks
like.  Continuing from before:

````javascript
kapi.play();
````

And the animation will just loop continuously.  We can also pass a `number` to
`play()` to define how many times to play before stopping, like so:

````javascript
kapi.play(3);
````

That will play the animation three times and stop.  When an animation stops, it
will will just sit at the last frame that was rendered.  You can control the
animation flow with `kapi.pause()` and `kapi.stop()`.

## All together

Copy/paste/save this onto your machine to see a simple Rekapi animation:

````html
<!DOCTYPE html>
<html>
<head>
  <script src="https://raw.github.com/jeremyckahn/rekapi/master/dist/rekapi-underscore-shifty.min.js"></script>
</head>
<body>
  <canvas></canvas>
  <script>
  var canvas = document.getElementsByTagName('canvas')[0],
      kapi = new Kapi({
        'context': canvas
      });

  var actor = new Kapi.CanvasActor({
    // Draws a circle.
    'draw': function (context, state) {
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

  kapi.addActor(actor);

  actor
    .keyframe(0, {
      x: 50,
      y: 50
    })
    .keyframe(1000, {
      x: 200,
      y: 100
    }, 'easeOutExpo');

  kapi.play();

  </script>
</body>
</html>
````
