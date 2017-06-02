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

  before(() => {
    /**
     * This is used to prevent optimization to make certain functions easier to
     * test.
     */
    Tweenable.formulas.fakeLinear = function (pos) {
      return pos;
    };
  });

  after(() => {
    delete Tweenable.formulas.fakeLinear;
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
          classProperties,
          ['.ANIM_NAME {',
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

    describe('generateBoilerplatedKeyframes', () => {
      it('generates boilerplated keyframes', () => {
        actor
          .keyframe(0,    { 'x': 0   })
          .keyframe(1000, { 'x': 100 }, { 'x': 'fakeLinear' });

        actor._updateState(0);

        const keyframeData = cssRenderer.generateBoilerplatedKeyframes(
          actor,
          'ANIM_NAME',
          10,
          false
        );

        assert.equal(
          keyframeData,
          ['@keyframes ANIM_NAME-x-keyframes {',
          '  0% {x:0;}',
          '  10% {x:10;}',
          '  20% {x:20;}',
          '  30% {x:30;}',
          '  40% {x:40;}',
          '  50% {x:50;}',
          '  60% {x:60;}',
          '  70% {x:70;}',
          '  80% {x:80;}',
          '  90% {x:90;}',
          '  100% {x:100;}',
          '}'].join('\n')
        );
      });
    });

    describe('generateActorKeyframes', () => {
      it('can generate un-optimized keyframe data', () => {
        actor
          .keyframe(0,    { 'x': 0   })
          .keyframe(1000, { 'x': 100 }, { 'x': 'fakeLinear' });

        actor._updateState(0);

        const keyframeData =
            cssRenderer.generateActorKeyframes(actor, 10, 'x');

        assert.equal(
          keyframeData,
          ['  0% {x:0;}',
          '  10% {x:10;}',
          '  20% {x:20;}',
          '  30% {x:30;}',
          '  40% {x:40;}',
          '  50% {x:50;}',
          '  60% {x:60;}',
          '  70% {x:70;}',
          '  80% {x:80;}',
          '  90% {x:90;}',
          '  100% {x:100;}'].join('\n')
        );

        assert.equal(keyframeData.split('\n').length, 11);
      });

      it('can generate un-optimized keyframe data targeting one track', () => {
        actor
          .keyframe(0,    { 'x': 0, 'y': 5    })
          .keyframe(1000, { 'x': 100, 'y': 15 }, { 'x': 'fakeLinear' });

        actor._updateState(0);

        const keyframeData =
          cssRenderer.generateActorKeyframes(actor, 10, 'x');

        assert.equal(
          keyframeData,
          ['  0% {x:0;}',
          '  10% {x:10;}',
          '  20% {x:20;}',
          '  30% {x:30;}',
          '  40% {x:40;}',
          '  50% {x:50;}',
          '  60% {x:60;}',
          '  70% {x:70;}',
          '  80% {x:80;}',
          '  90% {x:90;}',
          '  100% {x:100;}'].join('\n')
        );

        assert.equal(keyframeData.split('\n').length, 11);
      });

      it('can control granularity of un-optimized keyframe data', () => {
        actor
          .keyframe(0,    { 'x': 0   })
          .keyframe(1000, { 'x': 100 }, { 'x': 'fakeLinear' });

        actor._updateState(0);

        const keyframeData =
          cssRenderer.generateActorKeyframes(actor, 100, 'x');

        assert.equal(keyframeData.split('\n').length, 101);
      });

      it('can mix optimized and un-optimized segments, optimized first', () => {
        actor
          .keyframe(0,    { 'x': 0  })
          .keyframe(500,  { 'x': 10 })
          .keyframe(1000, { 'x': 20 }, { 'x': 'fakeLinear' });

        actor._updateState(0);

        const keyframeData =
          cssRenderer.generateActorKeyframes(actor, 10, 'x');

        assert.equal(
          keyframeData,
          ['  0% {x:0;VENDORanimation-timing-function: cubic-bezier(.25,.25,.75,.75);}',
          '  50% {x:10;}',
          '  60% {x:12;}',
          '  70% {x:14;}',
          '  80% {x:16;}',
          '  90% {x:18;}',
          '  100% {x:20;}'].join('\n')
        );
      });

      it('can mix optimized and un-optimized segments, optimized last', () => {
        actor
          .keyframe(0,    { 'x': 0  })
          .keyframe(500,  { 'x': 10 }, { 'x': 'fakeLinear' })
          .keyframe(1000, { 'x': 20 });

        actor._updateState(0);

        const keyframeData =
          cssRenderer.generateActorKeyframes(actor, 10, 'x');

        assert.equal(
          keyframeData,
          ['  0% {x:0;}',
          '  10% {x:2;}',
          '  20% {x:4;}',
          '  30% {x:6;}',
          '  40% {x:8;}',
          '  50% {x:10;VENDORanimation-timing-function: cubic-bezier(.25,.25,.75,.75);}',
          '  100% {x:20;}'].join('\n')
        );
      });

      it('does not generate redundant optimized keyframes when they are back-to-back', () => {
        actor
          .keyframe(0,    { 'x': 0  })
          .keyframe(500,  { 'x': 5  })
          .keyframe(1000, { 'x': 10 });

        actor._updateState(0);

        const keyframeData =
          cssRenderer.generateActorKeyframes(actor, 99, 'x');

        assert.equal(
          keyframeData,
          ['  0% {x:0;VENDORanimation-timing-function: cubic-bezier(.25,.25,.75,.75);}',
          '  50% {x:5;VENDORanimation-timing-function: cubic-bezier(.25,.25,.75,.75);}',
          '  100% {x:10;}'].join('\n')
        );
      });

      it('simulates a wait for late-starting tracks by duplicating leading keyframe', () => {
        actor
          .keyframe(0,    { 'x': 0           })
          .keyframe(500,  { 'y': 0           }, { 'y': 'fakeLinear' })
          .keyframe(1000, { 'x': 10, 'y': 10 }, { 'y': 'fakeLinear' });

        const keyframeData =
          cssRenderer.generateActorKeyframes(actor, 10, 'y');

        assert.equal(
          keyframeData,
          ['  0% {y:0;}',
          '  50% {y:0;}',
          '  60% {y:2;}',
          '  70% {y:4;}',
          '  80% {y:6;}',
          '  90% {y:8;}',
          '  100% {y:10;}'].join('\n')
        );
      });

      it('generates duplicate trailing keyframe at the end for early-ending track', () => {
        actor
          .keyframe(0,    { 'x': 0, 'y': 0 })
          .keyframe(500,  { 'y': 10        }, { 'y': 'fakeLinear' })
          .keyframe(1000, { 'x': 10        }, { 'y': 'fakeLinear' });

        actor._updateState(0);

        const keyframeData =
            cssRenderer.generateActorKeyframes(actor, 10, 'y');

        assert.equal(
          keyframeData,
          ['  0% {y:0;}',
          '  10% {y:2;}',
          '  20% {y:4;}',
          '  30% {y:6;}',
          '  40% {y:8;}',
          '  50% {y:10;}',
          '  100% {y:10;}'].join('\n')
        );
      });

      describe('with waits', () => {
        it('does not generate redundant @keyframes for unoptimized easing curves', () => {
          actor
            .keyframe(0, { y: 0 })
            .keyframe(500, { y: 5 }, 'fakeLinear')
            .wait(1000);

          actor._updateState(0);

          const keyframeData =
            cssRenderer.generateActorKeyframes(actor, 10, 'y');

          assert.equal(
            keyframeData,
           ['  0% {y:0;}',
            '  10% {y:1;}',
            '  20% {y:2;}',
            '  30% {y:3;}',
            '  40% {y:4;}',
            '  50% {y:5;}',
            '  100% {y:5;}'].join('\n')
          );
        });

        it('does not generate redundant @keyframes for optimized easing curves', () => {
          actor
            .keyframe(0, { y: 0 })
            .keyframe(500, { y: 5 })
            .wait(1000);

          actor._updateState(0);

          const keyframeData =
            cssRenderer.generateActorKeyframes(actor, 10, 'y');

          assert.equal(
            keyframeData,
            ['  0% {y:0;VENDORanimation-timing-function: cubic-bezier(.25,.25,.75,.75);}',
            '  50% {y:5;}',
            '  100% {y:5;}'].join('\n')
          );
        });

        it('does not generate redundant transform @keyframes for unoptimized easing curves', () => {
          actor
            .keyframe(0, { transform: 'translateX(0px)' })
            .keyframe(500, { transform: 'translateX(5px)' }, 'fakeLinear')
            .wait(1000);

          actor._updateState(0);

          const keyframeData =
            cssRenderer.generateActorKeyframes(actor, 10, 'transform');

          assert.equal(
            keyframeData,
            ['  0% {TRANSFORM:translateX(0px);}',
            '  10% {TRANSFORM:translateX(1px);}',
            '  20% {TRANSFORM:translateX(2px);}',
            '  30% {TRANSFORM:translateX(3px);}',
            '  40% {TRANSFORM:translateX(4px);}',
            '  50% {TRANSFORM:translateX(5px);}',
            '  100% {TRANSFORM:translateX(5px);}'].join('\n')
          );
        });
      });
    });

    describe('simulateLeadingWait', () => {
      it('can fake the 0% keyframe', () => {
        actor
          .keyframe(0,    { 'x': 0           })
          .keyframe(500,  { 'y': 0           })
          .keyframe(1000, { 'x': 10, 'y': 10 });

        const keyframeStep = cssRenderer.simulateLeadingWait(actor, 'y', 0);

        assert.equal(keyframeStep, '  0% {y:0;}');
      });
    });

    describe('simulateTrailingWait', () => {
      it('can fake the 100% keyframe', () => {
        actor
          .keyframe(0,    { 'x': 0, 'y': 0 })
          .keyframe(500,  { 'y': 10        })
          .keyframe(1000, { 'x': 10        });

        const keyframeStep = cssRenderer.simulateTrailingWait(
          actor, 'y', actor.getStart(), actor.getEnd()
        );

        assert.equal(keyframeStep, '  100% {y:10;}');
      });
    });

    describe('generateActorTrackSegment', () => {
      it('can get @keyframes for a three-step track segment', () => {
        actor
          .keyframe(0,    { 'x': 0   })
          .keyframe(1000, { 'x': 100 })
          .keyframe(2000, { 'x': 200 });

        const serializedSegment = cssRenderer.generateActorTrackSegment(
          actor, 5, 10, 0, 50, actor._propertyTracks['x'][1]
        );

        assert.deepEqual(
          serializedSegment,
          ['  50% {x:100;}',
          '  60% {x:120;}',
          '  70% {x:140;}',
          '  80% {x:160;}',
          '  90% {x:180;}']
        );
      });

      it('can get @keyframes for a five-step track segment', () => {
        actor
          .keyframe(0,    { 'x': 0   })
          .keyframe(1000, { 'x': 100 })
          .keyframe(2000, { 'x': 200 })
          .keyframe(3000, { 'x': 400 })
          .keyframe(4000, { 'x': 600 });

        const serializedSegment = cssRenderer.generateActorTrackSegment(
          actor, 5, 5, 0, 25, actor._propertyTracks['x'][1]
        );

        assert.deepEqual(
          serializedSegment,
          ['  25% {x:100;}',
          '  30% {x:120;}',
          '  35% {x:140;}',
          '  40% {x:160;}',
          '  45% {x:180;}']
        );
      });
    });

    describe('combineTranfromProperties', () => {
      it('can combine transform properties into a single property', () => {
        const combinedProperty = cssRenderer.combineTranfromProperties({
          translateX: '10px',
          translateY: '20px'
        }, cssRenderer.transformFunctions);

        const targetObject = {
          [cssRenderer.TRANSFORM_TOKEN]: 'translateX(10px) translateY(20px)'
        };

        assert.deepEqual(
          combinedProperty,
          targetObject
        );
      });

      it('can combine transform properties into a single property and leave non-tranform properties unchanged', () => {
        const combinedProperty = cssRenderer.combineTranfromProperties({
          translateX: '10px',
          translateY: '20px',
          foo: 'bar'
        }, cssRenderer.transformFunctions);

        const targetObject = {
          foo: 'bar',
          [cssRenderer.TRANSFORM_TOKEN]: 'translateX(10px) translateY(20px)'
        };

        assert.deepEqual(
          combinedProperty,
          targetObject
        );
      });
    });

    describe('serializeActorStep', () => {
      it('can serialize an individual Actor step', () => {
        actor
          .keyframe(0,    { x: 0   })
          .keyframe(1000, { x: 100 });

        actor._updateState(500);

        assert.equal(cssRenderer.serializeActorStep(actor), '{x:50;}');
      });

      it('rewrites transform properties', () => {
        actor
          .keyframe(0,    { transform: 'rotate(0deg)'   })
          .keyframe(1000, { transform: 'rotate(100deg)' });

        actor._updateState(500);

        assert.equal(
          cssRenderer.serializeActorStep(actor),
          '{' + cssRenderer.TRANSFORM_TOKEN + ':rotate(50deg);}'
        );
      });

      it('rewrites decoupled tranform properties', () => {
        actor
          .keyframe(0,    { rotate: '0deg'   })
          .keyframe(1000, { rotate: '100deg' });

        actor._updateState(500);

        assert.equal(
          cssRenderer.serializeActorStep(actor),
          '{' + Rekapi._private.cssRenderer.TRANSFORM_TOKEN + ':rotate(50deg);}'
        );
      });

      it('can target a single property to serialize', () => {
        actor
          .keyframe(0,    { x: 0,  y: 50  })
          .keyframe(1000, { x: 10, y: 100 });

        actor._updateState(500);

        assert.equal(
          cssRenderer.serializeActorStep(actor, 'x'),
          '{x:5;}'
        );
      });

      it('can serialize multiple keyframes into a single step', () => {
        actor
          .keyframe(0,    { 'x': 0,  'y': 0  })
          .keyframe(1000, { 'x': 10, 'y': 20 }, 'fakeLinear');

        actor._updateState(500);

        assert.equal(cssRenderer.serializeActorStep(actor), '{x:5;y:10;}');
      });
    });

    describe('generateAnimationNameProperty', () => {
      it('can generate the CSS name of an animation', () => {
        actor
          .keyframe(0,    { 'x': 0,  'y': 50  })
          .keyframe(1000, { 'x': 10, 'y': 100 });

        const animName = cssRenderer.generateAnimationNameProperty(
          actor, 'ANIM_NAME', 'PREFIX', false
        );

        assert.equal(
          animName,
          '  PREFIXanimation-name: ANIM_NAME-x-keyframes, ANIM_NAME-y-keyframes;'
        );
      });

      it('can generate the CSS name of an animation with multiple properties', () => {
        actor
          .keyframe(0,    { 'x': 0,  'y': 50  })
          .keyframe(1000, { 'x': 10, 'y': 100 });

        const animName = cssRenderer.generateAnimationNameProperty(
          actor, 'ANIM_NAME', 'PREFIX', false
        );

        assert.equal(
          animName,
          '  PREFIXanimation-name: ANIM_NAME-x-keyframes, ANIM_NAME-y-keyframes;'
        );
      });

      it('can generate single CSS name of an animation with combined keyframes', () => {
        actor
          .keyframe(0,    { 'x': 0,  'y': 50  }, 'fakeLinear')
          .keyframe(1000, { 'x': 10, 'y': 100 });

        const animName = cssRenderer.generateAnimationNameProperty(
          actor, 'ANIM_NAME', 'PREFIX', true
        );

        assert.equal(
          animName,
          '  PREFIXanimation-name: ANIM_NAME-keyframes;'
        );
      });
    });

    describe('generateAnimationDurationProperty', () => {
      it('can generate the CSS duration of an animation', () => {
        actor
          .keyframe(0,    { 'x': 0  })
          .keyframe(1000, { 'x': 10 });

        assert.equal(
          cssRenderer.generateAnimationDurationProperty(actor, 'PREFIX'),
          '  PREFIXanimation-duration: 1000ms;'
        );
      });
    });

    describe('generateAnimationDelayProperty', () => {
      it('can generate the CSS delay of an animation', () => {
        actor
          .keyframe(500,  { 'x': 0  })
          .keyframe(1000, { 'x': 10 });

        assert.equal(
          cssRenderer.generateAnimationDelayProperty(actor, 'PREFIX'),
          '  PREFIXanimation-delay: 500ms;'
        );
      });
    });

    describe('generateAnimationFillModeProperty', () => {
      it('can generate the CSS fill mode of an animation', () => {
        assert.equal(
          cssRenderer.generateAnimationFillModeProperty('PREFIX'),
          '  PREFIXanimation-fill-mode: forwards;'
        );
      });
    });

    describe('generateAnimationTimingFunctionProperty', () => {
      it('can generate the CSS timing function of an animation', () => {
        assert.equal(
          cssRenderer.generateAnimationTimingFunctionProperty('PREFIX'),
          '  PREFIXanimation-timing-function: linear;'
        );
      });
    });

    describe('generateAnimationIterationProperty', () => {
      afterEach(() => {
        rekapi.stop();
      });

      it('can generate an infinite CSS iteration count an animation', () => {
        const animDuration = cssRenderer.generateAnimationIterationProperty(
          rekapi, 'PREFIX'
        );

        assert.equal(
          animDuration,
          '  PREFIXanimation-iteration-count: infinite;'
        );
      });

      it('can generate a finite CSS iteration count an animation', () => {
        rekapi.play(3);

        const animDuration = cssRenderer.generateAnimationIterationProperty(
          rekapi, 'PREFIX'
        );

        assert.equal(
          animDuration,
          '  PREFIXanimation-iteration-count: 3;'
        );
      });

      it('can generate an overridden CSS iteration count an animation', () => {
        rekapi.play(3);

        const animDuration = cssRenderer.generateAnimationIterationProperty(
          rekapi, 'PREFIX', 5
        );

        assert.equal(
          animDuration,
          '  PREFIXanimation-iteration-count: 5;'
        );
      });
    });

    describe('generateAnimationCenteringRule', () => {
      it('can generate an offset rule for centering an element', () => {
        assert.equal(
          cssRenderer.generateAnimationCenteringRule('PREFIX'),
          '  PREFIXtransform-origin: 0 0;'
        );
      });
    });

    describe('canOptimizeKeyframeProperty', () => {
      it('detects a property that can be optimized', () => {
        actor
          .keyframe(0,    { x: 0  })
          .keyframe(1000, { x: 10 }, { x: 'easeInQuad' });

        actor._updateState(0);

        assert(
          cssRenderer.canOptimizeKeyframeProperty(actor.getKeyframeProperty('x', 0))
        );
      });

      it('detects a property that cannot be optimized', () => {
        actor
          .keyframe(0,    { x: 0  })
          .keyframe(1000, { x: 10 }, { x: 'bounce' });

        const canBeOptimized = cssRenderer.canOptimizeKeyframeProperty(
          actor.getKeyframeProperty('x', 0)
        );

        assert.equal(canBeOptimized, false);
      });

      it('detects a transform that can be optimized', () => {
        actor
          .keyframe(0,    { transform: 'translateX(0) translateY(0)'   })
          .keyframe(1000,
            { transform: 'translateX(10) translateY(10)' },
            { transform: 'linear linear' }
          );

        actor._updateState(0);

        const canBeOptimized = cssRenderer.canOptimizeKeyframeProperty(
          actor.getKeyframeProperty('transform', 0)
        );

        assert(canBeOptimized);
      });

      it('detects a transform that cannot be optimized', () => {
        actor
          .keyframe(0,    { transform: 'translateX(0) translateY(0)'   })
          .keyframe(1000,
            { transform: 'translateX(10) translateY(10)' },
            { transform: 'linear easeInQuad' }
          );

        const canBeOptimized = cssRenderer.canOptimizeKeyframeProperty(
          actor.getKeyframeProperty('transform', 0)
        );

        assert.equal(canBeOptimized, false);
      });

      it('detects that a wait can be optimized', () => {
        actor
          .keyframe(0, { y: 0 })
          .keyframe(500, { y: 5 })
          .wait(1000);

        actor._updateState(0);

        const canBeOptimized = cssRenderer.canOptimizeKeyframeProperty(
          actor.getKeyframeProperty('y', 500)
        );

        assert(canBeOptimized);
      });
    });
  });
});
