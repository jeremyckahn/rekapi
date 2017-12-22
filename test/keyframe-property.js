/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true */
import assert from 'assert';
import { contains } from 'lodash';
import { setupTestRekapi, setupTestActor } from './test-utils';

import { Rekapi, KeyframeProperty } from '../src/main';
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

    it('sets key object properties', () => {
      const keyframeProperty = new KeyframeProperty(500, 'x', 10, 'easeInQuad');

      assert.equal(keyframeProperty.millisecond, 500);
      assert.equal(keyframeProperty.name, 'x');
      assert.equal(keyframeProperty.value, 10);
      assert.equal(keyframeProperty.easing, 'easeInQuad');
    });
  });

  describe('#modifyWith', () => {
    it('modifies properties', function () {
      const keyframeProperty = new KeyframeProperty(500, 'x', 10, 'easeInQuad');

      keyframeProperty.modifyWith({
        millisecond: 1500,
        easing: 'bounce',
        value: 123456
      });

      assert.equal(keyframeProperty.millisecond, 1500);
      assert.equal(keyframeProperty.value, 123456);
      assert.equal(keyframeProperty.easing, 'bounce');
    });
  });

  describe('#linkToNext', () => {
    it('links to a given KeyframeProperty instance', () => {
      const keyframeProperty = new KeyframeProperty(500, 'x', 10, 'easeInQuad');
      const linkedKeyprop = new KeyframeProperty(1000, 'x', 20, 'swingTo');

      keyframeProperty.linkToNext(linkedKeyprop);

      assert.equal(keyframeProperty.nextProperty, linkedKeyprop);
    });
  });

  describe('#getValueAt', () => {
    it('computes given midpoint between self and linked KeyframeProperty instance', () => {
      const keyframeProperty = new KeyframeProperty(500, 'x', 10, 'linear');
      const linkedKeyprop = new KeyframeProperty(1000, 'x', 20, 'linear');

      keyframeProperty.linkToNext(linkedKeyprop);
      const midpoint = keyframeProperty.getValueAt(750);

      assert.equal(midpoint, 15);
    });
  });

  describe('#detach', () => {
    it('destroys actor/keyframeProperty association', () => {
      actor.keyframe(0, { x: 10 });
      const keyframeProperty = actor.getKeyframeProperty('x', 0);

      assert.equal(actor, keyframeProperty.actor);
      keyframeProperty.detach();
      assert.equal(null, keyframeProperty.actor);
    });
  });

  describe('#exportPropertyData', () => {
    beforeEach(() => {
      actor.keyframe(0, { x: 1 });
    });

    it('exports key data points', () => {
      const exportedProp = actor._propertyTracks.x[0].exportPropertyData();
      assert.equal(typeof exportedProp.millisecond, 'number');
      assert.equal(typeof exportedProp.name, 'string');
      assert.equal(typeof exportedProp.value, 'number');
      assert.equal(typeof exportedProp.easing, 'string');
      assert.equal(typeof exportedProp.id, 'undefined');
    });

    describe('withId: true', () => {
      it('includes id property', () => {
        const exportedProp =
          actor._propertyTracks.x[0].exportPropertyData({ withId: true });
        assert.equal(typeof exportedProp.id, 'string');
      });
    });
  });

  describe('removeKeyframeProperty event', () => {
    let removeKeyframePropertyWasTriggered, keyframeProperty;

    beforeEach(() => {
      removeKeyframePropertyWasTriggered = false;
      actor.keyframe(0, { x: 10 });
      keyframeProperty = actor.getKeyframeProperty('x', 0);
      rekapi.on('removeKeyframeProperty', () => removeKeyframePropertyWasTriggered = true);
    });

    it('is fired by #detach', () => {
      keyframeProperty.detach();
      assert(removeKeyframePropertyWasTriggered);
    });

    it('is fired by Actor#removeKeyframe', () => {
      actor.removeKeyframe(0);
      assert(removeKeyframePropertyWasTriggered);
    });

    it('is fired by Actor#removeAllKeyframes', () => {
      actor.removeAllKeyframes();
      assert(removeKeyframePropertyWasTriggered);
    });

    it('is fired by Actor#removeKeyframeProperty', () => {
      actor.removeKeyframeProperty('x', 0);
      assert(removeKeyframePropertyWasTriggered);
    });
  });
});
