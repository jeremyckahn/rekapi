/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true */
import assert from 'assert';
import Rekapi from '../src/main';

describe('Rekapi', () => {
  const setupTestRekapi = () => new Rekapi();
  const setupTestActor = rekapi => rekapi.addActor(new Rekapi.Actor());

  let rekapi, actor;

  describe('constructor', () => {
    it('is a function', () => {
      assert.equal(typeof Rekapi, 'function');
    });
  });

  describe('#addActor', () => {
    beforeEach(() => {
      rekapi = setupTestRekapi();
      actor = setupTestActor(rekapi);
    });

    it('adds actors', () => {
      assert.equal(rekapi._actors[actor.id], actor);
    });
  });
});
