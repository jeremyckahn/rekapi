# .toCSS()

With the to-css extension (`ext/to-css/rekapi.to-css.js`), you can export your
animations as CSS `@keyframes` for improved rendering performance.  The to-css
extension is a part of the standard build, but you can safely omit it from
custom builds if you don't need it.  This extension depends on the
`rekapi.dom.js` extension.

Advantages of using CSS `@keyframes` over traditional JavaScript animations:

  * Smoother animations.
  * The JavaScript thread is freed from performing animation updates, resulting
  in more resources for other logic.

Disadvantages of the `@keyframes` approach:

  * Doesn't work in older browsers
  * No start/stop/goto control - once the animation runs, it runs from the
  beginning to completion.
  * Animations must either be rendered dynamically or saved to a static
  stylesheet, which hurts loading speed.
  * No framerate control.
  * Currently, no animation events can be bound to CSS animations.

This is a feature that isn't appropriate in all situations, but can help you
achieve a level of performance and animation quality that pure-JavaScript
animations cannot.

The vision for this feature is that you can define an animation with the
standard Rekapi API, and then export it to CSS and let the browser do the
actual animating.  It's essentially prerendering an animation in its entirety,
rather than updating the DOM on each tick.

## Exporting

There's only one command you need to export a Rekapi animation to CSS
`@keyframes`:

````javascript
var container = document.getElementById('container');
var animation = new Kapi(container);

// Easy!
var css = animation.toCSS();
````

All `toCSS()` does is render a string.  The most common thing to do with this
string is to stick it into a `style` element somewhere on your page.

````javascript
var style = document.createElement('style');
style.innerHTML = css;
document.head.appendChild(style);
````

For a working example of this method, take a look at the source for
`ext/to-css/sandbox.html`. [Live
demo](http://rekapi.com/ext/to-css/sandbox.html).

### .toCSS() options

You can specify some parameters for your CSS animation.  They are all optional.
Just supply them in the configuration parameter when calling `.toCSS()`:

````javascript
/**
 * @param {Object} options
 *   @param {Array} vendors
 *   @param {number} granularity
 *   @param {string} name
 * @return {string}
 */
animation.toCSS(options);
````

  * vendors: Defaults to `['w3']`.  The browser vendors you want this CSS to
  support. Valid values are:
    * `'microsoft'`
    * `'mozilla'`
    * `'opera'`
    * `'w3'`
    * `'webkit'`
  * granularity: Defaults to `100`.  Defines the "resolution" of an exported
  animation.  CSS `@keyframes` are comprised of a series of explicitly defined
  steps, and more steps will result in a smoother animation.  More steps will
  also result in overhead in regards to the size of the CSS string generated,
  and also processing time to generate the string.
  * name: Define a custom name for your animation.  This becomes the class name
  targeted in the generated CSS selector, and also the name of the `@keyframes`
  rule that is generated.  Note that this does not match the CSS class that is
  automatically added to the `Kapi.DOMActor` DOM element, so you will have to
  add that yourself.
