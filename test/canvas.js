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
});
