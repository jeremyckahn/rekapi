/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true */
import assert from 'assert';
import Rekapi from '../src/main';
import { contains } from 'lodash';

import { Tweenable, setBezierFunction, unsetBezierFunction } from 'shifty';

describe('Rekapi', () => {
  const setupTestRekapi = () => new Rekapi();

  const setupTestActor = (rekapi, actorArgs) =>
    rekapi.addActor(new Rekapi.Actor(actorArgs)
  );

  let rekapi, actor, actor2;

  beforeEach(() => {
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);
  });

  afterEach(() => {
    rekapi = undefined;
    actor = undefined;
  });

  describe('constructor', () => {
    it('is a function', () => {
      assert.equal(typeof Rekapi, 'function');
    });
  });

  describe('#addActor', () => {
    it('adds actors', () => {
      assert.equal(rekapi._actors[actor.id], actor);
    });

    it('only adds actors once', () => {
      rekapi.addActor(actor);
      assert.equal(rekapi.getActorCount(), 1);
    });

    it('propagates arguments to instantiated actor', () => {
      const actorContext = {};
      rekapi = setupTestRekapi();
      actor = setupTestActor(rekapi, { context: actorContext });

      assert(actor instanceof Rekapi.Actor);
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

      assert.equal(rekapi._actors[actor.id], undefined);

      // FIXME: This needs to be moved to canvas renderer tests
      //assert.equal(rekapi._renderOrder.indexOf(actor.id), -1);
    });
  });

  describe('removeAllActors', () => {
    it('removes all actors', () => {
      setupTestActor(rekapi);
      const removedActors = rekapi.removeAllActors();

      assert.equal(Object.keys(rekapi._actors).length, 0);
      assert.equal(
        removedActors.filter(actor => actor instanceof Rekapi.Actor).length,
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

      assert.equal(actors[actor.id], actor);
      assert.equal(actors[actor2.id], actor2);
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
  });

  describe('exportTimeline', () => {
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
  });

  describe('importTimeline', () => {
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

  describe('on', () => {
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

  describe('off', () => {
    it('unbinds event handlers', () => {
      let handlerWasCalled;

      rekapi.on('addActor', () => handlerWasCalled = true);
      rekapi.addActor(actor);

      assert(!handlerWasCalled);
    });
  });

  describe('trigger', () => {
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

  describe('getLastPositionUpdated', () => {
    it('gets last calculated timeline position', () => {
      actor.keyframe(0, {
        x: 1
      }).keyframe(1000, {
        x: 2
      });

      rekapi.update(500);
      assert.equal(rekapi.getLastPositionUpdated(), 0.5);
    });
  });
});
