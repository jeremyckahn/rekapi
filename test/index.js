/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true */
import assert from 'assert';
import Rekapi from '../src/main';

describe('Rekapi', () => {
  const setupTestRekapi = () => new Rekapi();

  const setupTestActor = (rekapi, actorArgs) =>
    rekapi.addActor(new Rekapi.Actor(actorArgs)
  );

  let rekapi, actor;

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
});
