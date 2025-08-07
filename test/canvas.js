/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true, after:true */
import assert from 'assert';
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
import { beforeAll, afterAll } from 'vitest';

describe('Canvas renderer', () => {
  class CanvasRenderingContext2D {
    constructor () {
      this.canvas = {
        style: {},
        getContext: () => ({})
      };
    }
  }
  let rekapi, actor, actor2;

  beforeAll(() =>
    global.CanvasRenderingContext2D = CanvasRenderingContext2D
  );

  afterAll(() =>
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
});
