/*global require: true, global console: true */
var requirejs = require('requirejs');
requirejs.config({
  paths: {
    shifty: "../dist/shifty.min",
    underscore: "../dist/underscore-min",
    rekapi: "../dist/rekapi"
  }
});

requirejs(['rekapi'], function(Rekapi) {
  var rekapi = new Rekapi();
  var actor = new Rekapi.Actor();
  rekapi.addActor(actor);

  actor
    .keyframe(0, { x: 0 })
    .keyframe(250, { x: 100 });

  rekapi.on('play', function () {
    console.log('The animation has begun!');
  });

  rekapi.on('afterUpdate', function () {
    console.log('Actor state:', actor.get());
  });

  rekapi.on('stop', function () {
    console.log('The animation has completed!');
  });

  rekapi.play(1);
});
