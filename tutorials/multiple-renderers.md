 Rekapi supports using multiple renderers in a single animation.  Here's how you might do that:

 HTML:

 ```html
 <canvas style="background: #ddd; height: 300px; width: 100px; float: left;"></canvas>
 <div style="position: absolute; height: 100px; width: 100px; left: 120px; background: #00f;"></div>
 ```


JavaScript:

```javascript
import { Rekapi, Actor, CanvasRenderer, DOMRenderer } from 'rekapi';

// Renderer inference by the Rekapi constructor is only practical if there is
// one renderer, but this animation has two, so don't provide a context value
// here
const rekapi = new Rekapi();

const canvasContext = document.querySelector('canvas').getContext('2d')

// Add the renderers manually here
rekapi.renderers.push(new CanvasRenderer(rekapi, canvasContext));
rekapi.renderers.push(new DOMRenderer(rekapi));

const canvasRenderer = rekapi.getRendererInstance(CanvasRenderer);

// Necessary to prevent the canvas image from getting distorted
canvasRenderer.height(300);
canvasRenderer.width(100);

const canvasActor = rekapi.addActor({
  context: canvasContext,
  render: (context, state) => {
    context.beginPath();
    context.arc(
      state.x,
      state.y,
      25,
      0,
      Math.PI*2,
      true
    );
    context.fillStyle = '#f0f';
    context.fill();
    context.closePath();
  }
});

const domActor = rekapi.addActor({
  context: document.querySelector('div')
});

canvasActor
  .keyframe(0, {
    x: 50,
    y: 50
  })
  .keyframe(1500, {
    y: 250
  });

domActor
  .keyframe(0, {
    transform: 'translateY(0px)'
  }).keyframe(1500, {
    transform: 'translateY(200px)'
  });

rekapi.play();
```

<p data-height="442" data-theme-id="0" data-slug-hash="GvZZRg" data-default-tab="js,result" data-user="jeremyckahn" data-embed-version="2" data-pen-title="Rekapi demo: Multiple renderers" class="codepen">See the Pen <a href="https://codepen.io/jeremyckahn/pen/GvZZRg/">Rekapi demo: Multiple renderers</a> by Jeremy Kahn (<a href="https://codepen.io/jeremyckahn">@jeremyckahn</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>
