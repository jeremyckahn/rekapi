import $ from 'jquery';
import { Rekapi, Actor, CanvasRenderer, DOMRenderer } from '../src/main';
import { Tweenable } from 'shifty';

function circleActorDraw (canvas_context, state) {
  if (isNaN(state.x)) {
    return;
  }

  canvas_context.beginPath();
    canvas_context.arc(
      state.x || 0,
      state.y || 0,
      state.radius || 50,
      0,
      Math.PI*2,
      true);
    canvas_context.fillStyle = state.color || '#f0f';
    canvas_context.fill();
    canvas_context.closePath();
}

function  setupTestActor (forRekapi) {
  var actor;

  actor = new Actor({
    render: circleActorDraw
  });

  forRekapi.addActor(actor);
  return actor;
}

$(function () {

  var rekapi;

  function killTest () {
    rekapi && rekapi.stop(true);
    rekapi = undefined;
  }

  $('#kill-test').click(killTest);

  $('#play').click(function () {
    rekapi && rekapi.play();
  });

  $('#pause').click(function () {
    rekapi && rekapi.pause();
  });

  $('#stop').click(function () {
    rekapi && rekapi.stop(true);
  });

  $('#basic-linear-tween').click(function () {
    killTest();
    var canvasContext = document.querySelector('canvas').getContext('2d');
    rekapi = new Rekapi();
    rekapi.canvasRenderer = new CanvasRenderer(rekapi, canvasContext);
    rekapi.canvasRenderer.height(300);
    rekapi.canvasRenderer.width(100);
    rekapi.domRenderer = new DOMRenderer(rekapi);

    var canvasActor = rekapi.addActor({
      'render': circleActorDraw
      ,'context': canvasContext
    })

    var domActor = rekapi.addActor({
      'context': document.querySelector('#dom-actor')
    });

    canvasActor
      .keyframe(0, {
        'x': 50
        ,'y': 50
      })
      .keyframe(1500, {
        'y': 250
      });

    domActor
      .keyframe(0, {
        'transform': 'translateY(0px)'
      }).keyframe(1500, {
        'transform': 'translateY(200px)'
      });

    rekapi.play();
    console.log(rekapi);
  });

});
