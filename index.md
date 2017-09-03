# Rekapi

## A JavaScript Keyframe Library

### `npm install --save rekapi`
### [Download](../rekapi.js) • [Source](https://github.com/jeremyckahn/rekapi)

[![Gitter](https://badges.gitter.im/jeremyckahn/rekapi.svg)](https://gitter.im/jeremyckahn/rekapi?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)


Rekapi is a keyframe animation library for JavaScript.  It gives you an API
for:

* Defining keyframe-based animations
* Controlling animation playback

Rekapi is renderer-agnostic.  At its core, Rekapi does not perform any
rendering.  However, it does expose an API for defining renderers, and comes
bundled with renderers for the HTML DOM and HTML5 2D `<canvas>`.

Rekapi officially supports Evergreen browsers and is published as a UMD module.

<p data-height="575" data-theme-id="0" data-slug-hash="gxEOJm" data-default-tab="js,result" data-user="jeremyckahn" data-embed-version="2" data-pen-title="Rekapi Confetti" class="codepen">See the Pen <a href="https://codepen.io/jeremyckahn/pen/gxEOJm/">Rekapi Confetti</a> by Jeremy Kahn (<a href="https://codepen.io/jeremyckahn">@jeremyckahn</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

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

For a fuller explanation with a runnable example, check out the
[Getting Started]{@tutorial getting-started} guide.

## Rendering

Rekapi works by providing state data to the actors for every frame.  The actors
then render the data according to their rendering context.  Rekapi treats rendering
contexts generically, and you can create new ones as needed.

Rekapi ships with {@link rekapi.CanvasRenderer} and {@link rekapi.DOMRenderer}
which are designed to cover a variety of common use cases.  However, you can
create your own {@link rekapi.renderer}-like class to fit whatever use case you
have.
