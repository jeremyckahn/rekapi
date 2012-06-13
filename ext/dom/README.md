# Kapi.DOMActor

You can use Rekapi to animate DOM nodes with the DOM renderer extension.

````javascript
/**
 * @param {HTMLElement} element
 * @constructor
 * @extends Kapi.Actor
 */
Kapi.DOMActor = function (element)
````

`Kapi.DOMActor` is a subclass of `Kapi.Actor`.  All methods of the `Kapi.Actor`
prototype are available to `Kapi.DOMActor`.  Instantiate a `Kapi.DOMActor` with
an `HTMLElement`, and then add it to the animation:

````javascript
var actor = new Kapi.DOMActor(document.getElementById('actor'));

kapi.addActor(actor);
````

Now you can keyframe `actor` like you would any Actor.

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

## Transforms

`DOMActor` supports CSS3 `transform`s.  Typically, when writing a `transform`
rule, it is necessary to write the same rule multiple times, in order to
support the vendor prefixes for all of the browser rendering engines.  The DOM
extension takes care of the cross browser inconsistencies; all you need to use
is the `transform` property:

````javascript
actor
  .keyframe(0, {
    'transform': 'translateX(0px) translateY(0px) rotate(0deg)'
  })
  .keyframe(1500, {
    'transform': 'translateX(200px) translateY(200px) rotate(90deg)'
  }, 'easeOutExpo');
````

## getCSSName

The DOM extension also provides a small utility function for generating a class
for each Actor DOM element.

````javascript
/**
 * @return {string}
 */
Kapi.DOMActor.prototype.getCSSName();
````

This can be useful when used with the `to-css` extension.  You might not ever
need to use this directly, as the class is attached to an element when you
create a `DOMActor` from said element.
