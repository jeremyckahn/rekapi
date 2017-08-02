# Rekapi - Keyframes for JavaScript

[![Gitter](https://badges.gitter.im/jeremyckahn/rekapi.svg)](https://gitter.im/jeremyckahn/rekapi?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Rekapi is a keyframe animation library for JavaScript.  It gives you an API
for:

* Defining keyframe-based animations
* Controlling animation playback

Rekapi is renderer-agnostic.  At its core, Rekapi does not perform any
rendering.  However, it does expose an API for defining renderers, and comes
bundled with renderers for the HTML DOM and HTML5 2D `<canvas>`.

Rekapi officially supports Evergreen browsers and is published as a UMD module.

## What is keyframing?

Keyframing is an animation technique for defining states at specific points in
time. Keyframing allows you to declaratively define the points at which an
animation changes.  All of the frames that exist between keyframes are
interpolated for you.  It is a powerful way to construct a complex animation!

## How do I use Rekapi?

Using Rekapi boils down to four steps:

* Define one or more actors
* Add actors to the animation
* Define keyframe states for the actors
* Play the animation

## `Rekapi`

The `Rekapi` class  manages the state and playback of an animation.  An
instance of `Rekapi` acts as a conductor for the actors associated with it.

## `Actor`

The `Actor`s are the individual visual components of an animation.  A circle
moving from left to right is an actor.  A square that moves up and down is
another, separate actor.

## Playback control APIs

There are playback control methods built into the `Rekapi` class.  These
methods include `play()`, `pause()` and `stop()`.  See [the API
documentation](http://rekapi.com/api) for a full list of the available methods.

## Rendering contexts

Rekapi works by providing state data to the actors for every frame.  The actors
then render the data according to their rendering context.  Rekapi treats rendering
contexts generically, and you can create new ones as needed.

A `Rekapi` instance has one renderer associated with, and it is attached to the
instance as a property called `renderer`.  The appropriate renderer is
determined automatically based on what context the `Rekapi` constructor is
provided.  The renderer visually displays the data that Rekapi computes for
each frame.  Renderers can also provide additional, renderer-specific APIs.
Please see the API documentation for each renderer for more detailed
information.
