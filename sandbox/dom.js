import $ from 'jquery';
import { Rekapi, Actor } from '../src/main';
import { Tweenable } from 'shifty';

function setupTestRekapi () {
  var sandbox
      ,rekapi
      ,actor;

  sandbox = document.getElementById('sandbox');
  rekapi = new Rekapi(sandbox);

  return rekapi;
}

function  setupTestActor (forRekapi) {
  var actor
      ,element;

  element = document.getElementById('actor');
  element.removeAttribute('style');
  element.style.position = 'absolute';
  actor = new Actor({ context: element });
  forRekapi.addActor(actor);
  return actor;
}

$(function () {

  var rekapi;

  function killTest () {
    if (rekapi) {
      var ids = rekapi.getActorIds();
      var actor = rekapi.getActor(ids[0]);
      rekapi.removeActor(actor);
      rekapi.stop(true);
      rekapi = undefined;
    }
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
        'transform': 'translateX(0px) translateY(0px)'
      })
      .keyframe(1500, {
        'transform': 'translateX(200px) translateY(200px)'
      });

    rekapi.play();
    console.log(rekapi);
  });


  $('#basic-linear-tween-ie').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(0, {
        'left': '0px'
        ,'top': '0px'
      })
      .keyframe(1500, {
        'left': '200px'
        ,'top': '200px'
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
        'transform': 'translateX(0px) translateY(0px)'
      })
      .keyframe(1500, {
        'transform': 'translateX(200px) translateY(200px)'
      }, 'easeOutExpo');

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
        'transform': 'translateX(0px) translateY(0px)'
      })
      .keyframe(1500, {
        'transform': 'translateX(200px) translateY(200px)'
      }, {
        'transform': 'easeOutExpo easeInSine'
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
        'transform': 'translateX(0px) translateY(0px) rotate(0deg)'
        ,'background': '#f00'
        ,'height': '50px'
        ,'width': '50px'
      })
      .keyframe(1500, {
        'transform': 'translateX(200px) translateY(200px) rotate(180deg)'
        ,'background': '#00f'
        ,'height': '100px'
        ,'width': '100px'
      }, 'easeOutExpo');

    rekapi.play();
    console.log(rekapi);
  });


  $('#fancy-parameters-tween-independent').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(0, {
        'translateX': '0px'
        ,'translateY': '0px'
        ,'rotate': '0deg'
        ,'background': '#f00'
        ,'height': '50px'
        ,'width': '50px'
      })
      .keyframe(1500, {
        'translateX': '200px'
        ,'translateY': '200px'
        ,'rotate': '180deg'
        ,'background': '#00f'
        ,'height': '100px'
        ,'width': '100px'
      }, 'easeOutExpo');

    rekapi.play();
    console.log(rekapi);
  });


  $('#delayed-start').click(function () {
    var actor;

    killTest();
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);

    actor
      .keyframe(500, {
        'transform': 'translateX(0px) translateY(0px)'
      })
      .keyframe(1500, {
        'transform': 'translateX(200px) translateY(200px)'
      });

    rekapi.play();
    console.log(rekapi);
  });
});
