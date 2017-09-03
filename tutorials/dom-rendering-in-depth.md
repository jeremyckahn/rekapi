{@link rekapi.DOMRenderer} allows you to animate DOM elements.  This is
achieved either by [CSS `@keyframe`
animations](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes), or by
per-frame inline style updates.

Advantages of playing an animation with CSS `@keyframes`:

  - Generally smoother animations.
  - The JavaScript thread is freed from performing animation updates,
  making it available for other logic.

Disadvantages:

  - Limited playback control: You can only play and stop an animation, you
  cannot jump to or start from a specific point in the timeline.
  - Generating the CSS for `@keyframe` animations can take a noticeable
  amount of time.  This blocks all other logic, including rendering, so
  you may have to be clever with how to spend the cycles to do it.
  - No [events]{@link rekapi.Rekapi#on} can be
  bound to CSS `@keyframe` animations.

So, the results are a little more predictable and flexible with inline style
animations, but CSS `@keyframe` may give you better performance.  Choose
whichever approach makes the most sense for your needs.

{@link rekapi.DOMRenderer} can gracefully fall back to an inline style
animation if CSS `@keyframe` animations are not supported by the browser:

     import { Rekapi, DOMRenderer } from 'rekapi';

     const rekapi = new Rekapi(document.body);

     // Each actor needs a reference to the DOM element it represents
     const actor = rekapi.addActor({
       context: document.querySelector('div')
     });

     actor
       .keyframe(0,    { left: '0px'   })
       .keyframe(1000, { left: '250px' }, 'easeOutQuad');

     // Feature detect for CSS @keyframe support
     if (rekapi.renderer.canAnimateWithCSS()) {
       // Animate with CSS @keyframes
       rekapi.getRendererInstance(DOMRenderer).play();
     } else {
       // Animate with inline styles instead
       rekapi.play();
     }

## `@keyframe` animations work differently than inline style animations

Inline style animations are compatible with all of the playback and timeline
control methods defined by {@link rekapi.Rekapi}, such as {@link
rekapi.Rekapi#play}, {@link rekapi.Rekapi#playFrom} and {@link
rekapi.Rekapi#update}.  CSS `@keyframe` playback cannot be controlled in all
browsers, so {@link rekapi.DOMRenderer} defines analogous, renderer-specific
CSS playback methods that you should use:

  - {@link rekapi.DOMRenderer#play}
  - {@link rekapi.DOMRenderer#isPlaying}
  - {@link rekapi.DOMRenderer#stop}

<p data-height="816" data-theme-id="0" data-slug-hash="MvKJJW" data-default-tab="result" data-user="jeremyckahn" data-embed-version="2" data-pen-title="Rekapi demo: Playing many actors" class="codepen">See the Pen <a href="https://codepen.io/jeremyckahn/pen/MvKJJW/">Rekapi demo: Playing many actors</a> by Jeremy Kahn (<a href="https://codepen.io/jeremyckahn">@jeremyckahn</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>
