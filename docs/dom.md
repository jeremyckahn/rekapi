# Using Rekapi on the DOM

Rekapi was built around animating Actors in an HTML 5 `<canvas>`, but it also works with DOM elements.  The API is identical either way, there are just a few caveats you should know about if you use Rekapi on the DOM.

##Canvas and Actor nodes

Since you aren't using a literal `<canvas>`, the canvas is an arbitrary container DOM element.  The Actors are simply DOM elements inside of that container "canvas."

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
