/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true, after:true */
import assert from 'assert';
import { contains } from 'lodash';
import {
  setupTestRekapi,
  setupTestActor
} from './test-utils';

import { Rekapi, DOMRenderer } from '../src/main';
import {
  Tweenable,
  interpolate,
  setBezierFunction,
  unsetBezierFunction
} from 'shifty';

describe('DOM renderer', () => {
  let rekapi, actor, actor2;

  beforeEach(() => {
    rekapi = setupTestRekapi(document.createElement('div'));
    actor = setupTestActor(rekapi);
  });

  describe('constructor', () => {
    it('is a function', () => {
      assert.equal(typeof DOMRenderer, 'function');
    });
  });

  describe('setting inline styles', () => {
    it('interpolates and sets transform styles', () => {
      actor
        .keyframe(0, {
          transform: 'translateX(100px) translateY(100px) rotate(45deg)',
          background: '#f00'
        })
        .keyframe(1000, {
          transform: 'translateX(300px) translateY(300px) rotate(135deg)',
          background: '#00f'
        });

      rekapi.update(500);

      assert.equal(
        actor.context.style.transform,
        'translateX(200px) translateY(200px) rotate(90deg)'
      );
    });

    it('supports independent transform properties', () => {
      actor
        .keyframe(0, {
          translateX: '0px',
          translateY: '0px',
          rotate: '100deg',
          height: '0px'
        })
        .keyframe(2000, {
          translateX: '100px',
          translateY: '100px',
          rotate: '150deg',
          height: '50px'
        });

      rekapi.update(1000);

      const { style } = actor.context;

      assert.equal(
        style.transform,
        'translateX(50px) translateY(50px) rotate(125deg)'
      );

      assert.equal(style.height, '25px');
    });

    it('supports translate3d', () => {
      actor
        .keyframe(0, {
          transform: 'translate3d(0, 0, 0)'})
        .keyframe(100, {
          transform: 'translate3d(1, 1, 1)'
        }, 'linear easeInQuad easeOutQuad');

      rekapi.update(50);

      const transformChunks = actor.get().transform.match(/(\d|\.)+/g);

      assert.equal(
        transformChunks[1],
        interpolate({ x: 0 }, { x: 1 }, 0.5, 'linear').x
      );
      assert.equal(
        transformChunks[2],
        interpolate({ x: 0 }, { x: 1 }, 0.5, 'easeInQuad').x
      );
      assert.equal(
        transformChunks[3],
        interpolate({ x: 0 }, { x: 1 }, 0.5, 'easeOutQuad').x
      );
    });

    it('supports "3deg" value', () => {
      actor
        .keyframe(0, { transform: 'rotate(3deg)' })
        .keyframe(100, { transform: 'rotate(6deg)' });

      rekapi.update(50);

      assert.equal(
        actor.get().transform.match(/(\d|\.)+/g),
        interpolate({x:3}, {x:6}, 0.5, 'linear').x
      );
    });

    it('supports decoupled unit-less transform values', () => {
      actor
        .keyframe(0,   { scale: 0 })
        .keyframe(100, { scale: 1 });

      rekapi.update(0);

      assert.equal(
        actor.context.getAttribute('style').match(/transform.*;/)[0],
        'transform: scale(0);'
      );
    });
  });

  describe('#setTransformOrder', () => {
    it('throws an exception if given an unknown/unsupported transform function', () => {
      assert.throws(() =>
        rekapi.getRendererInstance(DOMRenderer).setActorTransformOrder(actor, ['foo', 'bar', 'rotate'])
      );
    });

    it('sets a transform property order', () => {
      const order = ['rotate', 'translateY', 'translateX'];
      rekapi.getRendererInstance(DOMRenderer).setActorTransformOrder(actor, order);
      assert.deepEqual(actor._transformOrder, order);
    });

    it('ignores duplicate values passed to setTransformOrder', () => {
      const order = ['rotate', 'translateX', 'rotate'];
      rekapi.getRendererInstance(DOMRenderer).setActorTransformOrder(actor, order);
      assert.deepEqual(actor._transformOrder, ['rotate', 'translateX']);
    });

    it('sets inline styles in specified order', () => {
      actor
        .keyframe(0, {
          translateX: '0px',
          translateY: '0px',
          rotate: '100deg'
        })
        .keyframe(2000, {
          translateX: '100px',
          translateY: '100px',
          rotate: '150deg'
        });

      rekapi.getRendererInstance(DOMRenderer).setActorTransformOrder(
        actor, ['rotate', 'translateY', 'translateX']
      );

      rekapi.update(1000);

      assert.equal(
        actor.context.style.transform,
        'rotate(125deg) translateY(50px) translateX(50px)'
      );
    });
  });
});
