/* global describe:true, it:true, beforeEach:true */
import assert from 'assert';
import { setupTestRekapi } from './test-utils';

import { CanvasRenderer } from '../src/main';

import { vi } from 'vitest';

describe('Canvas renderer', () => {
  const MockCanvasRenderingContext2D = vi.fn(() => ({
    canvas: {
      style: {},
      getContext: () => ({}),
    },
  }));

  vi.stubGlobal('CanvasRenderingContext2D', MockCanvasRenderingContext2D);

  beforeEach(() => {
    setupTestRekapi(new CanvasRenderingContext2D());
  });

  describe('constructor', () => {
    it('is a function', () => {
      assert.equal(typeof CanvasRenderer, 'function');
    });
  });
});
