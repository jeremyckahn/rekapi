/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true */
import assert from 'assert';
import { contains } from 'lodash';
import { setupTestRekapi, setupTestActor } from './test-utils';

import Rekapi, { KeyframeProperty } from '../src/main';
import {
  Tweenable,
  interpolate,
  setBezierFunction,
  unsetBezierFunction
} from 'shifty';

describe('KeyframeProperty', () => {
  let rekapi, actor;

  beforeEach(() => {
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);
  });

  describe('constructor', () => {
    it('is a function', () => {
      assert.equal(typeof KeyframeProperty, 'function');
    });
  });
});
