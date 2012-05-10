# Rekapi - Keyframes for JavaScript

Rekapi is a keyframe animation library for JavaScript.  It gives you:

* A keyframe-based Model by which to structure an animation
* Controller APIs to control the playback of an animation

Rekapi does not define drawing methods.  That part is completely generic, and the library exposes a common interface for defining Views.

Rekapi has two dependencies: [Underscore](https://github.com/documentcloud/underscore) and [Shifty](https://github.com/jeremyckahn/shifty).

Please note:  Rekapi is a rewrite of [Kapi](https://github.com/jeremyckahn/kapi). Rekapi is very similar to Kapi, but they are not identical.  Rekapi is not a drop-in replacement for Kapi.  Rekapi is way awesomer, so you should use it instead.

## What is keyframing?

Keyframing is an animation technique for defining states at specific points in time. Animations are always rendered as frames to the screen, and keyframing allows you to define the key points at which the motion in the animation changes - all of the frames that exist between those points are interpolated for you.  It is a powerful way to construct a complex animation.

## How do I use Rekapi?

Rekapi's usage boils down to five steps:

* Create a Rekapi instance
* Define some actors
* Add the actors to the Rekapi instance
* Define keyframes (states) for the actors
* Play the animation

A Rekapi animation is conceptualized as a stage with actors.

## Actors

The Actors are the individual components of an animation.  If you want to move a circle from left to right in your animation, that circle is an Actor.  If you want to add a square to your animation that moves up and down, that square is another, separate actor.  Actors are represented by the `Kapi.Actor` Object, and we'll get to that shortly.

## The stage

The stage acts as a puppetmaster for the actors.  The stage controls the flow of the animation for all of the actors.  It controls playing, pausing, stopping and looping.  The stage concept is represented by an HTML 5 `<canvas>` element controlled by an instance of the `Kapi` Object.

## Getting started

As mentioned before, you need to have Underscore and Shifty loaded.  Once everything is loaded, make a new Kapi instance.  All it requires is a reference to a `<canvas>`:

````javascript
var canvas = document.getElementsByTagName('canvas')[0],
    kapi = new Kapi(canvas);
````

You can also pass a configuration Object to tweak the Kapi instance - details in the [API documentation](https://github.com/jeremyckahn/rekapi/blob/master/docs/api.md).

So now we have a Kapi instance... but it won't do terribly much until you define and add some Actors.

## Defining Actors

Here's the boilerplate for an Actor:

````javascript
var actor = new Kapi.Actor({
  // Called once when the actor is added to the animation
  'setup': function () {

  },

  // Called every frame.  Receives a reference to the canvas context, and the Actor's state.
  'draw': function (canvas_context, state) {

  },

  // Called once when the actor is removed from the animation
  'teardown': function () {

  }
});
````

All of the methods described above are optional, but you should at least have a `draw` method.  Continuing from before, here's a simple implementation for an Actor that we can use as an example:

````javascript
var canvas = document.getElementsByTagName('canvas')[0],
    kapi = new Kapi(canvas);

var actor = new Kapi.Actor({
  // Draws a circle.
  'draw': function (canvas_context, state) {
    canvas_context.beginPath();
    canvas_context.arc(
      state.x || 50,
      state.y || 50,
      state.radius || 50,
      0,
      Math.PI*2,
      true);
    canvas_context.fillStyle = state.color || '#f0f';
    canvas_context.fill();
    canvas_context.closePath();
  }
});
````

The Actor's `draw` method can do whatever you want it to, really.  The idea is that the `canvas_context` and `state` parameters are computed by Rekapi, and then expressed visually on the `<canvas>` by the Actor's `draw` method.  `setup` and `teardown` are methods that get called when the Actor is added and removed from the Kapi instance, respectively.

Now that we have an Actor instance, we just need to add it to the Kapi:

````javascript
kapi.addActor(actor);
````

Now we can define some keyframes.

## Defining keyframes

A Rekapi keyframe is a way of saying "At a given point in time, the Actor should have a specified state."  Let's start off by giving `actor` a starting keyframe:

````javascript
actor
  .keyframe(0, {
    x: 50,
    y: 50
  });
````

`keyframe` is a method that takes two or three parameters - the first is how many milliseconds into the animation this keyframe is going start, and the second is an Object whose properties define the state that the Actor should have.  The third parameter is a string that defines which Shifty easing formula to use - "linear" is the default.  The previous snippet says, "at zero milliseconds into the animation, place `actor` at `x` 50, and `y` 50.  Continuing with the previous snippet, let's animate it to another point on the canvas:

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

So, a few things to note.  `keyframe`, like many methods of the `Kapi.Actor` Object, is chainable.  The animation defined here will last one second, as the the second `keyframe` is placed at 1000 milliseconds.  It will have a nice `easeOutExpo` easing formula applied to it, as we can see from the third parameter.  Rekapi inherits all of [Shifty's easing formulas](https://github.com/jeremyckahn/shifty/blob/master/src/shifty.formulas.js).  Also of note: individual tweens get their easing formula from the keyframe they are animating to, not animating from.

## Playing the animation

So now we've set up a sweet animation - let's run it and see what it looks like.  Continuing from before:

````javascript
kapi.play();
````

And the animation will just loop continuously.  We can also pass a `number` to `play()` to define how many times to play before stopping, like so:

````javascript
kapi.play(3);
````

That will play the animation three times and stop.  When an animation stops, it will will just sit at the last frame that was rendered.  You can control the animation flow with `kapi.pause()` and `kapi.stop()`.  These methods are detailed in the [API documentation](https://github.com/jeremyckahn/rekapi/blob/master/docs/api.md).

## All together

Copy/paste/save this onto your machine to see a simple Rekapi animation:

````html
<!DOCTYPE html>
<html>
<head>
  <script src="https://raw.github.com/jeremyckahn/rekapi/master/dist/rekapi.bundle.min.js"></script>
</head>
<body>
  <canvas></canvas>
  <script>
  var canvas = document.getElementsByTagName('canvas')[0],
      kapi = new Kapi(canvas);

  var actor = new Kapi.Actor({
    // Draws a circle.
    'draw': function (canvas_context, state) {
      canvas_context.beginPath();
      canvas_context.arc(
        state.x || 50,
        state.y || 50,
        state.radius || 50,
        0,
        Math.PI*2,
        true);
      canvas_context.fillStyle = state.color || '#f0f';
      canvas_context.fill();
      canvas_context.closePath();
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

To learn about the API methods not covered in this README, please view the [API documentation](https://github.com/jeremyckahn/rekapi/blob/master/docs/api.md).

## AMD

Alternatively, you can load Rekapi as an [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) module by using a loader such as [RequireJS](http://requirejs.org). This has the added benefit of not creating any `Kapi`, `Tweenable` (from Shifty) or `_` global variables, unlike in the previous code sample.

Caution: You can only require `rekapi.js` or `rekapi.min.js` as AMD modules. It will not work with `rekapi.bundle.min.js`.

Here is an example of how you can use it with RequireJS:

````javascript
// This example assumes that there is a `lib` directory in your project
require.config({
  paths: {
    shifty: "lib/shifty",
    underscore: "lib/underscore.min",
    rekapi: "lib/rekapi"
  }
});

// Dependencies (Underscore and Shifty) are automatically loaded.
require(['rekapi'], function(Kapi) {
  var canvas = document.getElementById('canvas'),
      kapi = new Kapi(canvas);
});
````

## Support

If you find any bugs, have suggestions or questions, please post them them to the [Rekapi Github issue tracker](https://github.com/jeremyckahn/rekapi/issues).

## Building and contributing

If you'd like to download entirety of this repo, please note that it uses Git submodules.  You will need to clone it like so:

````
$: git clone --recursive git@github.com:jeremyckahn/rekapi.git
````

The `--recursive` flag tells Git to download the submodules in addition to the Rekapi files.  You will need these submodules in order to build Rekapi or run the tests.

If you make a change to the Rekapi source and would like to build the project, just run this from the Rekapi root directory on the command line:

````
sh build.sh <version> [<local_compiler_path>]
````

`version` is whatever version you want to call the build.  Rekapi uses the [SemVer](http://semver.org/) versioning scheme.  This will generate any files you need and place them into the `dist/` directory.  You can specify a local copy of the Google Closure compiler with `local_compiler_path`, if you have it.  If you omit the `local_compiler_path` variable, then the script will `curl` out to the Closure compiler on the web.  This will just work if you are on a Mac.  On Linux, you may need run `sudo apt-get install curl`.

It's also important to make sure you didn't break any tests in `tests/`.  You can take a quick look by opening `tests/test.all_unit_tests.html` in your browser.
