/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true, after:true */
import assert from 'assert';
import { contains } from 'lodash';
import {
  setupTestRekapi,
  setupTestActor
} from './test-utils';

import { Rekapi, CanvasRenderer } from '../src/main';
import {
  Tweenable,
  interpolate,
  setBezierFunction,
  unsetBezierFunction
} from 'shifty';

describe('Canvas renderer', () => {
  class CanvasRenderingContext2D {}
  let rekapi, actor, actor2;

  before(() =>
    global.CanvasRenderingContext2D = CanvasRenderingContext2D
  );

  after(() =>
    delete global.CanvasRenderingContext2D
  );

  beforeEach(() => {
    rekapi = setupTestRekapi(new CanvasRenderingContext2D());
    actor = setupTestActor(rekapi);
  });

  describe('constructor', () => {
    it('is a function', () => {
      assert.equal(typeof CanvasRenderer, 'function');
    });
  });

  describe('renderOrder array', () => {
    it('is populated as actors are added', () => {
      assert.equal(rekapi.getRendererInstance(CanvasRenderer)._renderOrder[0], actor.id);
    });

    it('is emptied as actors are removed', () => {
      rekapi.removeActor(actor);
      assert.equal(rekapi.getRendererInstance(CanvasRenderer)._renderOrder.length, 0);
    });

    describe('compatibility with Rekapi#removeActor', () => {
      it('is updated when Rekapi#removeActor is called', () => {
        rekapi.removeActor(actor);

        assert.equal(rekapi.getRendererInstance(CanvasRenderer)._renderOrder.indexOf(actor.id), -1);
      });
    });
  });

  describe('#moveActorToLayer', () => {
    it('can move actors to the beginning of the list', () => {
      actor2 = setupTestActor(rekapi);
      rekapi.getRendererInstance(CanvasRenderer).moveActorToLayer(actor2, 0);

      assert.equal(rekapi.getRendererInstance(CanvasRenderer)._renderOrder[0], actor2.id);
      assert.equal(rekapi.getRendererInstance(CanvasRenderer)._renderOrder[1], actor.id);
      assert.equal(rekapi.getActorCount(), 2);
    });

    it('can move actors to the end of the list', () => {
      actor2 = setupTestActor(rekapi);
      rekapi.getRendererInstance(CanvasRenderer).moveActorToLayer(actor, 1);

      assert.equal(rekapi.getRendererInstance(CanvasRenderer)._renderOrder[0], actor2.id);
      assert.equal(rekapi.getRendererInstance(CanvasRenderer)._renderOrder[1], actor.id);
      assert.equal(rekapi.getActorCount(), 2);
    });
  });
});
