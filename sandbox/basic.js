import $ from 'jquery';
import { Rekapi, Actor } from '../src/main';
import { Tweenable } from 'shifty';

function setupTestRekapi () {
  var rekapi = new Rekapi(document.querySelector('canvas').getContext('2d'));
  rekapi.renderer.height(300);
  rekapi.renderer.width(300);

  return rekapi;
}

function  setupTestActor (forRekapi) {
  var actor;

  actor = new Actor({
    'render': function (canvas_context, state) {
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
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(0, {
        'x': 50
        ,'y': 50
      })
      .keyframe(1500, {
        'x': 200
        ,'y': 200
      });

    rekapi.play();
    console.log(rekapi);
  });


  $('#loop-twice').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(0, {
        'x': 50
        ,'y': 50
      })
      .keyframe(750, {
        'x': 200
        ,'y': 200
      });

    rekapi.play(2);
    console.log(rekapi);
  });



  $('#early-start').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(0, {
        'x': 50
        ,'y': 50
      }, 'easeOutExpo')
      .keyframe(1500, {
        'x': 200
        ,'y': 200
      }, 'easeOutExpo');

    rekapi.playFrom(300);
    console.log(rekapi);
  });


  $('#delayed-start').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(500, {
        'x': 50
        ,'y': 50
      })
      .keyframe(1500, {
        'x': 200
        ,'y': 200
      });

    rekapi.play();
    console.log(rekapi);
  });


  $('#basic-eased-tween').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(0, {
        'x': 50
        ,'y': 50
      }, 'easeOutExpo')
      .keyframe(1500, {
        'x': 200
        ,'y': 200
      }, 'easeOutExpo');

    rekapi.play();
    console.log(rekapi);
  });


  $('#two-step-tween').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(0, {
        'x': 50
        ,'y': 50
      }, 'easeOutExpo')
      .keyframe(750, {
        'x': 150
        ,'y': 250
      }, 'easeOutExpo')
      .keyframe(1500, {
        'x': 250
        ,'y': 50
      }, 'easeOutExpo');


    rekapi.play();
    console.log(rekapi);
  });


  $('#copy-props-tween').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(0, {
        'x': 50
        ,'y': 50
      }, 'easeOutExpo')
      .keyframe(750, {
        'x': 200
        ,'y': 200
      }, 'easeOutExpo')
      .copyKeyframe(1500, 0);

    rekapi.play();
    console.log(rekapi);
  });


  $('#removed-step-tween').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(0, {
        'x': 50
        ,'y': 50
      }, 'easeOutExpo')
      .keyframe(750, {
        'x': 150
        ,'y': 250
      }, 'easeOutExpo')
      .keyframe(1500, {
        'x': 250
        ,'y': 50
      }, 'easeOutExpo');

    actor.removeKeyframe(750);


    rekapi.play();
    console.log(rekapi);
  });


  $('#multi-eased-tween').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(0, {
        'x': 50
        ,'y': 50
      }, {
        'x': 'easeOutExpo'
        ,'y': 'easeInSine'
      })
      .keyframe(1500, {
        'x': 200
        ,'y': 200
      }, {
        'x': 'easeOutExpo'
        ,'y': 'easeInSine'
      });

    rekapi.play();
    console.log(rekapi);
  });


  $('#fancy-parameters-tween').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(0, {
        'x': 50
        ,'y': 50
        ,'radius': 50
        ,'color': '#f0f'
      }, 'easeOutExpo')
      .keyframe(1500, {
        'x': 200
        ,'y': 200
        ,'radius': 100
        ,'color': '#0f0'
      },'easeOutExpo');

    rekapi.play();
    console.log(rekapi);
  });


  $('#multi-actor-same-keyframeid').click(function () {
    killTest();
    rekapi = setupTestRekapi();
    const actor1 = setupTestActor(rekapi);
    const actor2 = setupTestActor(rekapi);

    actor1
      .keyframe(0, {
        'x': 50
        ,'y': 50
      })
      .keyframe(750, {
        'x': 100
        ,'y': 100
      }, 'easeOutExpo');


    actor2
      .keyframe(0, {
        'color': '#00f'
        ,'x': 250
        ,'y': 250
      })
      .keyframe(750, {
        'x': 200
        ,'y': 200
      }, 'easeOutExpo');

    rekapi.play();
    console.log(rekapi);
  });


  $('#tween').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .tween({
        'from': {
          'x': 0
          ,'y': 0
        }
        ,'to': {
          'x': 200
          ,'y': 200
        }
        ,'duration': 1000
      });

    rekapi.play();
    console.log(rekapi);
  });

});
