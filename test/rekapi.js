/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true */
import assert from 'assert';
import { contains } from 'lodash';
import { setupTestRekapi, setupTestActor } from './test-utils';

import { Rekapi, Actor, DOMRenderer } from '../src/main';
import { Tweenable, setBezierFunction, unsetBezierFunction } from 'shifty';

import {
  determineCurrentLoopIteration,
  calculateTimeSinceStart,
  isAnimationComplete,
  updatePlayState,
  calculateLoopPosition,
  updateToMillisecond,
  updateToCurrentMillisecond
} from '../src/rekapi';

describe('Rekapi', () => {
  let rekapi, actor, actor2;

  beforeEach(() => {
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);
  });

  afterEach(() => {
    rekapi = undefined;
    actor = undefined;
    Tweenable.now = () => +(new Date());
  });

  describe('constructor', () => {
    it('is a function', () => {
      assert.equal(typeof Rekapi, 'function');
    });
  });

  describe('#addActor', () => {
    it('adds actors', () => {
      assert.equal(rekapi._actors[0], actor);
    });

    it('only adds actors once', () => {
      rekapi.addActor(actor);
      assert.equal(rekapi.getActorCount(), 1);
    });

    it('propagates arguments to instantiated actor', () => {
      const actorContext = {};
      rekapi = setupTestRekapi();
      actor = setupTestActor(rekapi, { context: actorContext });

      assert(actor instanceof Actor);
      assert.equal(actorContext, actor.context);
    });
  });

  describe('#getActor', () => {
    it('retrieves added actor', () => {
      assert.equal(rekapi.getActor(actor.id), actor);
    });
  });

  describe('#removeActor', () => {
    it('removes an actor', () => {
      rekapi.removeActor(actor);

      assert.equal(rekapi._actors.length, 0);
    });
  });

  describe('#removeAllActors', () => {
    it('removes all actors', () => {
      setupTestActor(rekapi);
      const removedActors = rekapi.removeAllActors();

      assert.equal(rekapi._actors.length, 0);
      assert.equal(
        removedActors.filter(actor => actor instanceof Actor).length,
        2
      );
    });
  });

  describe('#getActorIds', () => {
    it('gets actor ids', () => {
      actor2 = setupTestActor(rekapi);
      const ids = rekapi.getActorIds();

      assert.equal(ids.length, 2);
      assert(contains(ids, actor.id));
      assert(contains(ids, actor2.id));
    });
  });

  describe('#getAllActors', () => {
    it('gets all actors', () => {
      actor2 = setupTestActor(rekapi);
      const actors = rekapi.getAllActors();

      assert.equal(actors[0], actor);
      assert.equal(actors[1], actor2);
    });
  });

  describe('#getActor', () => {
    it('gets an actor', () => {
      assert.equal(rekapi.getActor(actor.id), actor);
    });
  });

  describe('#getAnimationLength', () => {
    describe('single actor', () => {
      it('calculates correct animation length', () => {
        actor
          .keyframe(0, { x: 1 })
          .keyframe(1000, { x: 2 })
          .keyframe(2000, { x: 3 });

        assert.equal(rekapi.getAnimationLength(), 2000);
      });
    });

    describe('multiple actors', () => {
      it('calculates correct animation length', () => {
        actor
          .keyframe(0, { x: 1 })
          .keyframe(1000, { x: 2 })
          .keyframe(2000, { x: 3 });

        setupTestActor(rekapi)
          .keyframe(0, { x: 1 })
          .keyframe(5000, { x: 2 });

        assert.equal(rekapi.getAnimationLength(), 5000);
      });
    });

    describe('after adding actors that already have keyframes', () => {
      it('returns updated animation length', () => {
        actor = new Actor();

        actor
          .keyframe(0, { x: 0 })
          .keyframe(1000, { x: 10 });

        rekapi = new Rekapi();
        rekapi.addActor(actor);

        assert.equal(rekapi.getAnimationLength(), 1000);
      });
    });
  });

  describe('#exportTimeline', () => {
    let exportedTimeline;

    it('exports key data points', () => {
      actor.keyframe(0, {
        x: 1
      }).keyframe(1000, {
        x: 2
      });

      exportedTimeline = rekapi.exportTimeline();

      assert.equal(exportedTimeline.duration, 1000);
      assert.deepEqual(
        exportedTimeline.actors[0],
        actor.exportTimeline()
      );
      assert.equal(typeof exportedTimeline.actors[0].id, 'undefined');
      assert.equal(
        typeof exportedTimeline.actors[0].propertyTracks.x[0].id,
        'undefined'
      );
    });

    it('exports custom easing curves', () => {
      setBezierFunction('custom', 0, 0.25, 0.5, 0.75);
      rekapi = setupTestRekapi();

      exportedTimeline = rekapi.exportTimeline();
      assert.deepEqual(
        exportedTimeline.curves, {
          custom: {
            displayName: 'custom',
            x1: 0,
            y1: 0.25,
            x2: 0.5,
            y2: 0.75
          }
        });

      // Clean up Tweenable
      unsetBezierFunction('custom');
    });

    describe('withId: true', () => {
      beforeEach(() => {
        actor.keyframe(0, {
          x: 1
        }).keyframe(1000, {
          x: 2
        });
      });

      it('includes id properties', () => {
        exportedTimeline = rekapi.exportTimeline({ withId: true });
        assert.equal(typeof exportedTimeline.actors[0].id, 'string');
        assert.equal(
          typeof exportedTimeline.actors[0].propertyTracks.x[0].id,
          'string'
        );
      });
    });
  });

  describe('#importTimeline', () => {
    let exportedTimeline, targetRekapi;

    it('imports data correctly', () => {
      actor.keyframe(0, {
        x: 1
      }).keyframe(1000, {
        x: 2
      });

      exportedTimeline = rekapi.exportTimeline();
      targetRekapi = new Rekapi();
      targetRekapi.importTimeline(exportedTimeline);

      assert.deepEqual(targetRekapi.exportTimeline(), exportedTimeline);
    });

    it('sets up custom curves correctly', () => {
      setBezierFunction('custom', 0, 0.25, 0.5, 0.75);
      rekapi = setupTestRekapi();

      exportedTimeline = rekapi.exportTimeline();

      // Reset for a clean test
      unsetBezierFunction('custom');

      targetRekapi = new Rekapi();
      targetRekapi.importTimeline(exportedTimeline);

      assert.equal(typeof Tweenable.formulas.custom, 'function');
      assert.equal(Tweenable.formulas.custom.x1, 0);
      assert.equal(Tweenable.formulas.custom.y1, 0.25);
      assert.equal(Tweenable.formulas.custom.x2, 0.5);
      assert.equal(Tweenable.formulas.custom.y2, 0.75);

      // Clean up Tweenable
      unsetBezierFunction('custom');
    });
  });

  describe('#on', () => {
    it('fires an event when an actor is added', () => {
      rekapi.on('addActor', function(rekapi, addedActor) {
        assert.equal(actor, addedActor);
      });

      rekapi.addActor(actor);
    });

    it('fires an event when an actor is removed', () => {
      rekapi.on('removeActor', function(rekapi, removedActor) {
        assert.equal(actor, removedActor);
      });

      rekapi.removeActor(actor);
    });
  });

  describe('#off', () => {
    it('unbinds event handlers', () => {
      let handlerWasCalled;

      rekapi.on('addActor', () => handlerWasCalled = true);
      rekapi.addActor(actor);

      assert(!handlerWasCalled);
    });
  });

  describe('#trigger', () => {
    it('triggers an event', () => {
      let eventWasTriggered = false;
      let providedData;

      rekapi.on('timelineModified', (_, data) => {
        eventWasTriggered = true;
        providedData = data;
      });

      rekapi.trigger('timelineModified', 5);
      assert(eventWasTriggered);
      assert.equal(providedData, 5);
    });
  });

  describe('#getLastPositionUpdated', () => {
    it('gets last calculated timeline position as a normalized value', () => {
      actor.keyframe(0, {
        x: 1
      }).keyframe(1000, {
        x: 2
      });

      rekapi.update(500);
      assert.equal(rekapi.getLastPositionUpdated(), 0.5);
    });
  });

  describe('#getLastMillisecondUpdated', () => {
    it('gets last calculated timeline position in milliseconds', () => {
      actor.keyframe(0, {
        x: 1
      }).keyframe(1000, {
        x: 2
      });

      rekapi.update(500);
      assert.equal(rekapi.getLastMillisecondUpdated(), 500);
    });
  });

  describe('#getActorCount', () => {
    it('gets number of actors in timeline', () => {
      setupTestActor(rekapi);
      setupTestActor(rekapi);
      assert.equal(rekapi.getActorCount(), 3);
    });
  });

  describe('#update', () => {
    describe('with parameters', () => {
      it('causes the actor states to be recalculated', () => {
        actor
          .keyframe(0, { x: 0 })
          .keyframe(1000, { x: 10 });

        rekapi.update(500);
        assert.equal(actor.get().x, 5);
      });
    });

    describe('with no parameters', () => {
      it('causes the animation to update to the last rendered millisecond', () => {
        actor
          .keyframe(0, { x: 0 })
          .keyframe(1000, { x: 10 });

        // Simulate the state of rekapi if it was stopped at millisecond 500
        rekapi._lastUpdatedMillisecond = 500;

        rekapi.update();
        assert.equal(actor.get().x, 5);
      });

      it('resets function keyframes that come later in the timeline', () => {
        let callCount = 0;
        actor
          .keyframe(10, {
            'function': function () {
              callCount++;
            },
            x: 0
          })
          .keyframe(20, {
            x: 10
          });

        rekapi._timesToIterate = 1;

        updateToMillisecond(rekapi, 5);
        assert.equal(callCount, 0);

        updateToMillisecond(rekapi, 15);
        assert.equal(callCount, 1);

        rekapi.update(5);
        updateToMillisecond(rekapi, 15);
        assert.equal(callCount, 2);
      });
    });
  });

  describe('#isPlaying', () => {
    it('returns the play state of the animation', () => {
      rekapi.play();
      assert(rekapi.isPlaying());

      rekapi.pause();
      assert.equal(rekapi.isPlaying(), false);

      rekapi.stop();
      assert.equal(rekapi.isPlaying(), false);
    });
  });

  describe('#pause', () => {
    it('resumes a paused animation', () => {
      actor
        .keyframe(0, {})
        .keyframe(1000, {})
        .keyframe(2000, {});


      Tweenable.now = () => 0;
      rekapi.play();
      Tweenable.now = () => 500;
      rekapi.pause();
      Tweenable.now = () => 1500;
      rekapi.play();

      assert.equal(rekapi._loopTimestamp, 1000);
    });
  });

  describe('#isPaused', () => {
    it('returns the paused state of the animation', function () {
      rekapi.play();
      assert.equal(rekapi.isPaused(), false);

      rekapi.pause();
      assert(rekapi.isPaused());

      rekapi.stop();
      assert.equal(rekapi.isPaused(), false);
    });
  });

  describe('#stop', () => {
    it('moves the playhead to the beginning of the timeline', () => {
      actor
        .keyframe(0, {})
        .keyframe(1000, {})
        .keyframe(2000, {});

      Tweenable.now = () => 0;
      rekapi.play();

      Tweenable.now = () => 500;
      rekapi.stop();

      Tweenable.now = () => 1500;
      rekapi.play();

      assert.equal(rekapi._loopTimestamp, 1500);
    });

    it('resets function keyframes', () => {
      let callCount = 0;
      actor
        .keyframe(10, {
          'function': () => callCount++
        })
        .keyframe(20, {
          'function': () => callCount++
        });

      rekapi.play();

      updateToMillisecond(rekapi, 5);
      assert.equal(callCount, 0);

      updateToMillisecond(rekapi, 15);
      assert.equal(callCount, 1);

      rekapi.stop();

      updateToMillisecond(rekapi, 15);
      assert.equal(callCount, 2);
    });
  });

  describe('#isStopped', () => {
    it('returns the stopped state of the animation', function () {
      rekapi.play();
      assert.equal(rekapi.isStopped(), false);

      rekapi.pause();
      assert.equal(rekapi.isStopped(), false);

      rekapi.stop();
      assert(rekapi.isStopped());
    });
  });

  describe('#playFrom', () => {
    it('starts an animation from an arbitrary point on the timeline', () => {
      actor
        .keyframe(0, {})
        .keyframe(1000, {});

      Tweenable.now = () => 3000;
      rekapi.playFrom(500);

      assert.equal(rekapi._loopTimestamp, 2500);
    });

    it('resets function keyframes after the specified millisecond', () => {
      let callCount = 0;
      actor
        .keyframe(10, {
          'function': () => callCount++
        })
        .keyframe(20, {
          'function': () => callCount++
        });

      rekapi._timesToIterate = 1;

      updateToMillisecond(rekapi, 5);
      assert.equal(callCount, 0);

      updateToMillisecond(rekapi, 15);
      assert.equal(callCount, 1);

      rekapi.playFrom(5);
      updateToMillisecond(rekapi, 15);
      assert.equal(callCount, 2);
    });
  });

  describe('#playFromCurrent', () => {
    it('can start playback from an arbitrary point on the timeline', () => {
      actor
        .keyframe(0, {})
        .keyframe(1000, {});

      Tweenable.now = () => 3000;

      rekapi.update(500);
      rekapi.playFromCurrent();

      assert.equal(rekapi._loopTimestamp, 2500);
    });
  });

  describe('#getEventNames', () => {
    it('returns a list of event names', () => {
      assert.deepEqual(rekapi.getEventNames().sort(), Object.keys(rekapi._events).sort());
    });
  });

  describe('#getRendererInstance', () => {
    it('returns an instance of the specified renderer if one was set up', () => {
      rekapi = setupTestRekapi(document.createElement('div'));
      assert(rekapi.getRendererInstance(DOMRenderer) instanceof DOMRenderer);
    });

    it('returns undefined if no matching instance was found', () => {
      assert.equal(rekapi.getRendererInstance(DOMRenderer), undefined);
    });
  });

  describe('private helper methods', () => {
    describe('updateToCurrentMillisecond', () => {
      it('correctly calculates position based on time in a finite loop', () => {
        Tweenable.now = () => 0;

        actor
          .keyframe(0, {
            x: 0
          })
          .keyframe(1000, {
            x: 100
          });

        rekapi.play(2);

        Tweenable.now = () => 500;
        updateToCurrentMillisecond(rekapi);
        assert.equal(actor.get().x, 50);

        Tweenable.now = () => 1500;
        updateToCurrentMillisecond(rekapi);
        assert.equal(actor.get().x, 50);

        Tweenable.now = () => 2500;
        updateToCurrentMillisecond(rekapi);
        assert.equal(actor.get().x, 100);
      });

      it('correctly calculates position based on time in an infinite loop', () => {
        actor
          .keyframe(0, {
            x: 0
          })
          .keyframe(1000, {
            x: 100
          });

        Tweenable.now = () => 0;

        rekapi.play();

        Tweenable.now = () => 500;
        updateToCurrentMillisecond(rekapi);
        assert.equal(actor.get().x, 50);

        Tweenable.now = () => 1500;
        updateToCurrentMillisecond(rekapi);
        assert.equal(actor.get().x, 50);

        Tweenable.now = () => 10000000500;
        updateToCurrentMillisecond(rekapi);
        assert.equal(actor.get().x, 50);
      });
    });

    describe('calculateLoopPosition', () => {
      it('calculates accurate position in the tween', () => {
        actor
          .keyframe(0, { x: 1 })
          .keyframe(2000, { x: 2 });

        let calculatedMillisecond = calculateLoopPosition(rekapi, 1000, 0);

        assert.equal(calculatedMillisecond, 1000);
      });

      it('calculates accurate overflow position in the tween', () => {
        actor
          .keyframe(0, { x: 1 })
          .keyframe(2000, { x: 2 });

        let calculatedMillisecond = calculateLoopPosition(rekapi, 2500, 1);

        assert.equal(calculatedMillisecond, 500);
      });
    });

    describe('determineCurrentLoopIteration', () => {
      it('calculates the iteration of a given loop', () => {
        actor
          .keyframe(0, { x: 1 })
          .keyframe(2000, { x: 2 });

        let calculatedIteration = determineCurrentLoopIteration(rekapi, 0);

        assert.equal(calculatedIteration, 0);

        calculatedIteration = determineCurrentLoopIteration(rekapi, 1000);
        assert.equal(calculatedIteration, 0);


        calculatedIteration = determineCurrentLoopIteration(rekapi, 1999);
        assert.equal(calculatedIteration, 0);

        calculatedIteration = determineCurrentLoopIteration(rekapi, 4000);
        assert.equal(calculatedIteration, 2);

        calculatedIteration = determineCurrentLoopIteration(rekapi, 5000);
        assert.equal(calculatedIteration, 2);

        calculatedIteration = determineCurrentLoopIteration(rekapi, 5999);
        assert.equal(calculatedIteration, 2);
      });
    });

    describe('calculateTimeSinceStart', () => {
      it('calculates the delta of the current time and when the animation began', () => {
        actor
          .keyframe(0, {})
          .keyframe(2000, {});

        Tweenable.now = () => 0;
        rekapi.play();
        Tweenable.now = () => 500;
        const calculatedTime = calculateTimeSinceStart(rekapi);

        assert.equal(calculatedTime, 500);
      });
    });

    describe('isAnimationComplete', () => {
      it('determines if the animation has completed in a finite loop', () => {
        actor
          .keyframe(0, {})
          .keyframe(2000, {});

        rekapi.play(3);

        assert.equal(isAnimationComplete(rekapi, 1), false);
        assert.equal(isAnimationComplete(rekapi, 2), false);
        assert.equal(isAnimationComplete(rekapi, 3), true);
      });

      it('determines if the animation has completed in an infinite loop', () => {
        actor
          .keyframe(0, {})
          .keyframe(2000, {});

        rekapi.play();

        assert.equal(isAnimationComplete(rekapi, 1), false);
        assert.equal(isAnimationComplete(rekapi, 3), false);
        assert.equal(isAnimationComplete(rekapi, 1000), false);
      });
    });

    describe('updatePlayState', () => {
     it('determine if the animation\'s internal state is "playing" after evaluating a given iteration', () => {
       actor
         .keyframe(0, {})
         .keyframe(2000, {});

       rekapi.play(3);

       updatePlayState(rekapi, 0);
       assert.equal(rekapi.isPlaying(), true);

       updatePlayState(rekapi, 2);
       assert.equal(rekapi.isPlaying(), true);

       updatePlayState(rekapi, 3);
       assert.equal(rekapi.isPlaying(), false);
     });
   });
  });

  describe('multiple actor support', () => {
    it('animates multiple actors concurrently', () => {
      const testActor2 = setupTestActor(rekapi);

      actor
        .keyframe(0, { x: 0 })
        .keyframe(1000, { x: 100 });

      testActor2
        .keyframe(0, { x: 0 })
        .keyframe(500, { x: 100 });

      rekapi._loopTimestamp = 0;
      Tweenable.now = () => 250;
      updateToCurrentMillisecond(rekapi);

      assert.equal(actor.get().x, 25);
      assert.equal(testActor2.get().x, 50);

      Tweenable.now = () => 750;
      updateToCurrentMillisecond(rekapi);

      assert.equal(actor.get().x, 75);
      assert.equal(testActor2.get().x, 100);
    });
  });

  describe('#moveActorToPosition', () => {
    it('can move actors to the beginning of the list', () => {
      actor2 = setupTestActor(rekapi);
      rekapi.moveActorToPosition(actor2, 0);

      assert.equal(rekapi._actors[0], actor2);
      assert.equal(rekapi._actors[1], actor);
      assert.equal(rekapi.getActorCount(), 2);
    });

    it('can move actors to the end of the list', () => {
      actor2 = setupTestActor(rekapi);
      rekapi.moveActorToPosition(actor, 1);

      assert.equal(rekapi._actors[0], actor2);
      assert.equal(rekapi._actors[1], actor);
      assert.equal(rekapi.getActorCount(), 2);
    });
  });
});
