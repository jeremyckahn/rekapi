Although Rekapi is renderer-agnostic, it's easiest to get started by making a
simple `<canvas>` animation.  The first step is to make a new {@link
rekapi.Rekapi} instance.  Canvas animations require a 2D `<canvas>` context to
render to, which gets passed to the {@link rekapi.Rekapi} constructor:

````javascript
import { Rekapi, Actor } from 'rekapi';

const context = document.querySelector('canvas').getContext('2d');
const rekapi = new Rekapi(context);
````

You now have a {@link rekapi.Rekapi} instance, but it won't do anything until
you define and add some {@link rekapi.Actor}s.

## Defining actors

Here's the boilerplate for a {@link rekapi.Actor}:

````javascript
const actor = new Actor({

  // Called every frame.  Receives a reference to the canvas context, and the
  // actor's state.
  render: (context, state) => {

  }

});
````

Here's a more complete example of an actor that renders a circle to the canvas:

````javascript
const actor = new Actor({
  render: (context, state) => {
    // Rekapi was given a canvas as a context, so `context` here is a
    // CanvasRenderingContext2D.

    context.beginPath();
    context.arc(
      state.x,
      state.y,
      state.radius,
      0,
      Math.PI*2,
      true
    );

    context.fillStyle = state.color;
    context.fill();
    context.closePath();
  }
});
````

The {@link rekapi.Actor}'s `render` method can be whatever you want — in this
case it's just drawing a circle.  The idea is that the `context` and `state`
parameters are provided by Rekapi on every frame update, and then rendered to
the `<canvas>` by {@link rekapi.Actor#render} method.

Now that you have a {@link rekapi.Actor} instance, you just need to add it to
animation with {@link rekapi.Rekapi#addActor}:

````javascript
rekapi.addActor(actor);
````

Now you can define some keyframes!

## Defining keyframes

A keyframe is a way of saying "at a given point in time, the actor should have
a particular state."  Let's begin by giving `actor` a starting keyframe:

````javascript
actor.keyframe(0, {
  x: 50,
  y: 50
});
````

{@link rekapi.Actor#keyframe} is a method that takes two to three parameters -

1. Which millisecond on the animation timeline the keyframe should be placed.
2. An Object whose properties define the state that the actor should have.
3. A string that specifies which
   [Shifty](https://github.com/jeremyckahn/shifty) easing formula to use -
   "linear" is the default.

The above snippet says, "at zero milliseconds into the animation, place `actor`
at `x` 50, and `y` 50.  Continuing with that, animate it to another point on
the canvas:

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

The animation defined here will last one second, as the final keyframe is
set at 1000 milliseconds.  It will have a nice `easeOutExpo` ease applied to
it, as you can see in the third parameter.  Individual tweens (that is,
keyframed animation segments) get their easing curves from the keyframe they
are animating to, not animating from.

Rekapi inherits all of [Shifty's easing
functions](https://github.com/jeremyckahn/shifty/blob/master/src/easing-functions.js).

## Playing the animation

So now you've set up a sweet animation!  Let's run it and see what it looks
like:

````javascript
rekapi.play();
````

And the animation will just loop continuously.  You can also pass a `number` to
{@link rekapi.Rekapi#play} to define how many times to play before stopping,
like so:

````javascript
rekapi.play(3);
````

This will play the animation three times and stop.  When an animation stops, it
will just sit at the last frame that was rendered.  You can control the
animation playback with {@link rekapi.Rekapi#pause} and {@link
rekapi.Rekapi#stop}`.
