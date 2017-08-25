 Rekapi supports using multiple renderers in a single animation.  Here's how you might do that:

    import { Rekapi, Actor, CanvasRenderer, DOMRenderer } from 'rekapi';

    const rekapi = new Rekapi();

    const canvasActor = rekapi.addActor({
      context: document.querySelector('canvas').getContext('2d'),
      render: (context, state) => {
        if (isNaN(state.x)) {
          return;
        }

        context.beginPath();
        context.arc(
          state.x || 0,
          state.y || 0,
          state.radius || 50,
          0,
          Math.PI*2,
          true);
        context.fillStyle = state.color || '#f0f';
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
