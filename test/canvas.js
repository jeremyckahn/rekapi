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

import { vi } from 'vitest';

describe('Canvas renderer', () => {
  const MockCanvasRenderingContext2D = vi.fn(() => ({
    canvas: {
      style: {},
      getContext: () => ({})
    }
  }));

  vi.stubGlobal('CanvasRenderingContext2D', MockCanvasRenderingContext2D);

  let rekapi, actor, actor2;

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
