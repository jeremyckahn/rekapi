var r = require('../lib/r.js');
r.config({
  paths: {
    shifty: "../dist/shifty",
    underscore: "../dist/underscore",
    rekapi: "../dist/rekapi"
  }
});

r(['rekapi'], function(Kapi) {
  var kapi = new Kapi();
  var actor = new Kapi.Actor();
  kapi.addActor(actor);

  actor
    .keyframe(0, { x: 0 })
    .keyframe(250, { x: 100 });

  kapi.bind('onPlay', function () {
    console.log('The animation has begun!');
  });

  kapi.bind('onFrameRender', function () {
    console.log('Actor state:', actor.get());
  });

  kapi.bind('onStop', function () {
    console.log('The animation has completed!');
  });

  kapi.play(1);
});
