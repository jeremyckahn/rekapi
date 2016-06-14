# Rekapi - Keyframes for JavaScript

[![Gitter](https://badges.gitter.im/jeremyckahn/rekapi.svg)](https://gitter.im/jeremyckahn/rekapi?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Rekapi is a keyframe animation library for JavaScript.  It gives you an API
for:

* Defining keyframe-based animations
* Controlling animation playback

Rekapi is renderer-agnostic.  At its core, Rekapi does not perform any
rendering.  However, it does expose an API for defining renderers, and the
standard distribution comes bundled with renderers for the HTML DOM and HTML5
2D `<canvas>`.

Rekapi has two dependencies:
[Underscore](https://github.com/documentcloud/underscore) (or
[Lo-Dash](https://github.com/lodash/lodash)) and
[Shifty](https://github.com/jeremyckahn/shifty).

Rekapi has been tested in and supports:

* Modern HTML5 browsers
* IE 6/7/8 (9 probably works; has not been tested.  Only Rekapi core APIs and
  DOM inline styling are supported in these browsers, not `<canvas>` or CSS3
  functionality)
* Node.js

If you have any questions about Rekapi, please post them to the [Google
Group](https://groups.google.com/forum/?fromgroups#!forum/rekapi).  Also, check
out the [Getting Started Guide ](docs/getting_started.md).

Please note:  Rekapi is a rewrite of
[Kapi](https://github.com/jeremyckahn/kapi). Rekapi is very similar to Kapi,
but they are not identical.  Rekapi is not a drop-in replacement for Kapi.
Kapi is no longer maintained, so Rekapi is a better choice for your projects.
Kapi and Rekapi were written by the same author.

If you used Rekapi before it reached 1.0.0, please be aware that the API has
changed significantly.  Please see [this guide](docs/upgrading.md) for all API
changes and how to upgrade your code.

## What is keyframing?

Keyframing is an animation technique for defining states at specific points in
time. Keyframing allows you to declaratively define the points at which an
animation changes.  All of the frames that exist between keyframes are
interpolated for you.  It is a powerful way to construct a complex animation.

## How do I use Rekapi?

Using Rekapi boils down to four steps:

* Define one or more `Rekapi.Actor` instances (generally referred to as
  "actors")
* Instantiate and add the actors to a `Rekapi` instance
* Define keyframe states for the actors
* Play the animation

## `Rekapi`

The `Rekapi` Object  manages the state and playback of an animation.  An
instance of `Rekapi` acts as a conductor for the various actors associated with
it.

## `Rekapi.Actor`

The actors are the individual visual components of an animation.  A circle
moving from left to right is an actor.  A square that moves up and down is
another, separate actor.  Actors are represented by the `Rekapi.Actor` Object.

## Playback control APIs

There are playback control methods built into the `Rekapi` Object.  These
methods include `play()`, `pause()` and `stop()`.  See [the API
documentation](http://rekapi.com/api) for a full list of the available methods.

## Rendering contexts

Rekapi works by providing state data to the actors for every frame.  The actors
then render the data according to their rendering context.  Rekapi treats rendering
contexts generically, and you can create new ones as needed.  The standard
Rekapi distribution includes rendering contexts for the DOM and 2D `<canvas>`.

A `Rekapi` instance has one renderer associated with, and it is attached to the
instance as a property called `renderer`.  The appropriate renderer is
determined automatically based on what context the `Rekapi` constructor is
provided.  The renderer visually displays the data that Rekapi computes for
each frame.  Renderers also provide unique APIs.  Please see the API
documentation for each renderer for more detailed information.

## AMD

You can optionally load Rekapi as an
[AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) module by using a loader
such as [RequireJS](http://requirejs.org). This prevents the creation a global
`Rekapi` variable.

Caution: You can only require `rekapi.js` or `rekapi.min.js` as AMD modules.
`rekapi-underscore-shifty.min.js` will expose the `Rekapi`, `Tweenable` and `_`
Objects globally.

Here is an example of how you can use Rekapi with RequireJS:

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
require(['rekapi'], function(Rekapi) {
  var rekapi = new Rekapi();
});
````

## Node

Rekapi can be used in Node.js.  This can be useful for generating keyframe
data.  Usage is the same as in the browser.  Loading the code requires the
[r.js](https://github.com/jrburke/r.js/blob/master/dist/r.js) script and looks
a lot ike the AMD approach above:

````javascript
var requirejs = require('requirejs');
requirejs.config({
  paths: {
    shifty: "dist/shifty.min",
    underscore: "dist/underscore-min",
    rekapi: "dist/rekapi"
  }
});

requirejs(['rekapi'], function(Rekapi) {
  var rekapi = new Rekapi();
});
````

## Core contributors

* [Franck Lecollinet](https://github.com/sork)
* [Brian Downing](https://github.com/bdowning)

## A note about project activity

While Rekapi doesn't see much development lately, the project is still very
much alive and maintained.  It serves my needs, so I don't have much reason to
make changes to it.  As a post-1.0 project, Rekapi is considered stable and
ready for production use.  If you find a bug or have a feature request, please
file it in the [issue tracker](https://github.com/jeremyckahn/rekapi/issues/)
and it will be addressed as soon as possible.
