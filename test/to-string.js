/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true, after:true */
import assert from 'assert';
import { contains } from 'lodash';
import { setupTestRekapi, setupTestActor } from './test-utils';

import Rekapi, { DOMRenderer } from '../src/main';
import {
  Tweenable,
  interpolate,
  setBezierFunction,
  unsetBezierFunction
} from 'shifty';

describe('DOMRenderer#toString', () => {
  const { cssRenderer } = Rekapi._private;
  let rekapi, actor, actor2;

  beforeEach(() => {
    rekapi = setupTestRekapi(document.createElement('div'));
    actor = setupTestActor(rekapi);
  });

  describe('private helper methods', () => {
    let vendorBoilerplates;

    afterEach(() => {
      vendorBoilerplates = undefined;
    });

    describe('applyVendorBoilerplates', () => {
      it('applies boilerplate for W3 by default', () => {
        vendorBoilerplates =
          cssRenderer.applyVendorBoilerplates('KEYFRAMES', 'NAME');

        assert.equal(
          vendorBoilerplates,
          ['@keyframes NAME-keyframes {',
          'KEYFRAMES',
          '}'].join('\n')
        );
      });

      it('applies boilerplate for other vendors', () => {
        vendorBoilerplates = cssRenderer.applyVendorBoilerplates(
          'KEYFRAMES', 'NAME',
          ['w3', 'webkit']
        );

        assert.equal(
          vendorBoilerplates,
          ['@keyframes NAME-keyframes {',
          'KEYFRAMES',
          '}',
          '@-webkit-keyframes NAME-keyframes {',
          'KEYFRAMES',
          '}'].join('\n')
        );
      });
    });

    describe('generateCSSAnimationProperties', () => {
      it('converts transform token into valid unprefixed property', () => {
        const keyframe =
          'from: { ' + cssRenderer.TRANSFORM_TOKEN + ': foo; }';
        const vendorBoilerplates =
          cssRenderer.applyVendorPropertyPrefixes(keyframe, 'w3');

        assert.equal(
          vendorBoilerplates,
          'from: { transform: foo; }'
        );
      });

      it('converts transform token into valid prefixed property', () => {
        const keyframe = 'from: { ' + cssRenderer.TRANSFORM_TOKEN + ': foo; }';
        const vendorBoilerplates =
          cssRenderer.applyVendorPropertyPrefixes(keyframe, 'webkit');

        assert.equal(vendorBoilerplates, 'from: { -webkit-transform: foo; }');
      });
    });

    describe('generateCSSClass', () => {
      it('generates boilerplated class properties for prefix-less class', () => {
        actor.keyframe(0, { 'x': 0 });

        const classProperties =
          cssRenderer.generateCSSClass(actor, 'ANIM_NAME', false);

        assert.equal(
          classProperties,
          ['.ANIM_NAME {',
          '  animation-name: ANIM_NAME-x-keyframes;',
          '  animation-duration: 0ms;',
          '  animation-delay: 0ms;',
          '  animation-fill-mode: forwards;',
          '  animation-timing-function: linear;',
          '  animation-iteration-count: infinite;',
          '}'].join('\n')
        );
      });

      it('generates boilerplated class properties for an animation with transform properties', () => {
        actor.keyframe(0, { rotate: '0deg' });

        const classProperties =
            cssRenderer.generateCSSClass(actor, 'ANIM_NAME', false);

        assert.equal(
          classProperties,
          ['.ANIM_NAME {',
          '  animation-name: ANIM_NAME-transform-keyframes;',
          '  animation-duration: 0ms;',
          '  animation-delay: 0ms;',
          '  animation-fill-mode: forwards;',
          '  animation-timing-function: linear;',
          '  animation-iteration-count: infinite;',
          '}'].join('\n')
        );
      });

      it('generates boilerplated class properties for a vendor-prefixed class', () => {
        actor.keyframe(0, { 'x': 0 });

        const classProperties = cssRenderer.generateCSSClass(
          actor,
          'ANIM_NAME',
          false,
          ['webkit']
        );

        assert.equal(
          classProperties
          ,['.ANIM_NAME {',
          '  -webkit-animation-name: ANIM_NAME-x-keyframes;',
          '  -webkit-animation-duration: 0ms;',
          '  -webkit-animation-delay: 0ms;',
          '  -webkit-animation-fill-mode: forwards;',
          '  -webkit-animation-timing-function: linear;',
          '  -webkit-animation-iteration-count: infinite;',
          '}'].join('\n')
        );
      });
    });
  });
});
