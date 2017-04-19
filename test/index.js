/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true */
import assert from 'assert';
import Rekapi from '../src/main';

describe('Rekapi', () => {
  describe('constructor', () => {
    it('is a function', () => {
      assert.equal(typeof Rekapi, 'function');
    });
  });
});
