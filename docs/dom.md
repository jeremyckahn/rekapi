# Using Rekapi on the DOM

You can use Rekapi to animate DOM elements.  This is thanks to a standard extension, which lives at `ext/dom/rekapi.dom.js`.  This extension is part of the standard build, but you can safely omit it from custom builds if you don't need it.

There are just a few caveats you should know about if you use Rekapi on the DOM.

##Canvas and Actor nodes

Since you aren't using a literal `<canvas>`, the canvas is an arbitrary container DOM element.  The Actors are simply child elements of that container element.

````javascript
// Assumes there is a DOM element with an ID of "canvas"
var kapi = new Kapi(document.getElementById('canvas'));
````

All DOM actors inherently work the same way, so you can just use the `Kapi.DOMActor` Object to control them.  There's generally no need to roll your own Actor if you are using Rekapi for DOM animation.

````javascript
/**
 * @param {HTMLElement} element
 * @returns {Kapi.DOMActor}
 */
Kapi.DOMActor = function (element)
````

So, let's suppose you have a DOM node inside of `#canvas` with an ID of "actor."

````javascript
var actor = new Kapi.DOMActor(document.getElementById('actor'));

kapi.addActor(actor);
````

Now you can keyframe `actor` like you would any Actor.  The only difference is that you are animating CSS properties, not arbitrarily defined properties for a `<canvas>` animation.

````javascript
actor
  .keyframe(0, {
    'left': '0px'
    ,'top': '0px'
  })
  .keyframe(1500, {
    'left': '200px'
    ,'top': '200px'
  }, 'easeOutExpo');

kapi.play();
````

## Rotation

`DOMActor` supports CSS3 rotations.  This is accomplished with the non-standard `rotate` property, and a degree integer.  Modifying the above snippet:

````javascript
actor
  .keyframe(0, {
    'left': '0px'
    ,'top': '0px'
    ,'rotate': 0
  })
  .keyframe(1500, {
    'left': '200px'
    ,'top': '200px'
    ,'rotate': 90
  }, 'easeOutExpo');
````

## getCSSName

The extension also provides a small utility function for generating a class for each actor DOM element.

````javascript
/**
 * @return {string}
 */
actor.getCSSName();
````

This can be useful when used with the to-css extension.  You might not ever need to use this directly, as the class is attached to an element when you create a DOMActor from said element.
