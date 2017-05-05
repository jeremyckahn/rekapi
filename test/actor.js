/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true */
import assert from 'assert';
import { contains } from 'lodash';
import { setupTestRekapi, setupTestActor } from './test-utils';

import Rekapi, { Actor } from '../src/main';
import { Tweenable, setBezierFunction, unsetBezierFunction } from 'shifty';

describe('Actor', () => {
  describe('constructor', () => {
    it('is a function', () => {
      assert.equal(typeof Actor, 'function');
    });
  });
});
