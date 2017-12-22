/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true */
import assert from 'assert';
import { contains } from 'lodash';
import { setupTestRekapi, setupTestActor } from './test-utils';

import { Rekapi, Actor, KeyframeProperty } from '../src/main';
import {
  Tweenable,
  interpolate,
  setBezierFunction,
  unsetBezierFunction
} from 'shifty';

import {
  updateToMillisecond,
  updateToCurrentMillisecond
} from '../src/rekapi';

describe('Actor', () => {
  let rekapi, actor;

  beforeEach(() => {
    rekapi = setupTestRekapi();
    actor = setupTestActor(rekapi);
  });

  describe('constructor', () => {
    it('is a function', () => {
      assert.equal(typeof Actor, 'function');
    });
  });

  describe('#_updateState', () => {
    describe('interpolating positions', () => {
      describe('actors that start at 0', () => {
        it('interpolates actor positions at arbitrary positions mid-frame', () => {
          actor.keyframe(0, {
            x: 0,
            y: 0
          }).keyframe(1000, {
            x: 100,
            y:100
          });

          actor._updateState(0);
          assert.equal(actor.get().x, 0);
          assert.equal(actor.get().y, 0);

          actor._updateState(500);
          assert.equal(actor.get().x, 50);
          assert.equal(actor.get().y, 50);

          actor._updateState(1000);
          assert.equal(actor.get().x, 100);
          assert.equal(actor.get().y, 100);
        });
      });

      describe('actors that start later than 0', () => {
        it('interpolates actor positions at arbitrary positions mid-frame', () => {
          actor.keyframe(1000, {
            x: 0,
            y: 0
          }).keyframe(2000, {
            x: 100,
            y: 100
          });

          actor._updateState(1000);
          assert.equal(actor.get().x, 0);
          assert.equal(actor.get().y, 0);

          actor._updateState(1500);

          assert.equal(actor.get().x, 50);
          assert.equal(actor.get().y, 50,
            'Value "y" was properly interpolated at position 0.5');

          actor._updateState(2000);
          assert.equal(actor.get().x, 100);
          assert.equal(actor.get().y, 100);
        });

        describe('property look-ahead', () => {
          describe('single track', () => {
            it('looks ahead to first keyframe when computing states prior to actor start', () => {
              actor.keyframe(0, {
                // Nothing!
              }).keyframe(1000, {
                y: 100
              });

              actor._updateState(500);
              assert.equal(actor.get().y, 100);
            });
          });

          describe('multiple tracks', () => {
            it('looks ahead to first keyframe when computing states prior to actor start', () => {
              actor.keyframe(0, {
                x: 50
              }).keyframe(1000, {
                y: 100
              });

              actor._updateState(500);
              assert.equal(actor.get().y, 100);
            });
          });
        });
      });
    });

    describe('computing state past a keyframe track end', () => {
      it('leaves keyframe tracks at their final position', () => {
        actor.keyframe(0,{
          x: 100
        }).keyframe(1000, {
          y: 200
        });

        actor._updateState(500);
        assert.equal(actor.get().x, 100);
      });
    });

    describe('applying easing curves', () => {
      it('easing is taken from the destination frame', () => {
        let tweenableComparator;

        actor
          .keyframe(0, { x: 0 }, 'linear')
          .keyframe(1000, { x: 100 }, 'easeInSine')
          .keyframe(2000, { x: 200 }, 'easeOutCirc');

        tweenableComparator =
          interpolate({ x: 0 }, { x: 100 }, 0.5, 'easeInSine');

        actor._updateState(500);
        assert.equal(actor.get().x, tweenableComparator.x);

        tweenableComparator =
          interpolate({ x: 100 }, { x: 200 }, 0.5, 'easeOutCirc');

        actor._updateState(1500);
        assert.equal(actor.get().x, tweenableComparator.x);
      });
    });

    describe('#wasActive management', () => {
      it('updates wasActive for arbitrary state updates', () => {
        actor
          .keyframe(0,{ x: 0 })
          .setActive(250, false)
          .setActive(750, true)
          .keyframe(1000, { x: 100 });

        actor._updateState(100);
        assert(actor.wasActive);
        assert.equal(actor.get().x, 10);

        actor._updateState(500);
        assert.equal(actor.wasActive, false);
        assert.equal(actor.get().x, 10);

        actor._updateState(900);
        assert(actor.wasActive);
        assert.equal(actor.get().x, 90);
      });
    });
  });

  describe('#addKeyframeProperty', () => {
    it('creates a link between property and actor', () => {
      const keyframeProperty = new KeyframeProperty(0, 'x', 50);
      actor.addKeyframeProperty(keyframeProperty);

      assert.equal(keyframeProperty.actor, actor);
      assert.equal(actor._keyframeProperties[keyframeProperty.id], keyframeProperty);
    });
  });

  describe('#removeKeyframe', () => {
    it('removes arbitrary keyframes', () => {
      actor
        .keyframe(0, { x: 1 })
        .keyframe(1000, { x: 2 })
        .keyframe(2000, { x: 3 });

      actor.removeKeyframe(1000);

      assert.equal(Object.keys(actor._keyframeProperties).length, 2);
      assert.equal(actor._propertyTracks.x.length, 2);
      assert.equal(actor._propertyTracks.x[0].value, 1);
      assert.equal(actor._propertyTracks.x[1].value, 3);
    });

    it('removes all keyframes at a given millisecond', () => {
      actor.keyframe(0, {
        x: 0,
        y: 1
      }).keyframe(1000, {
        x: 50,
        y: 51
      }).keyframe(2000, {
        x: 100,
        y: 101
      });

     actor.removeKeyframe(1000);

     assert.equal(actor._propertyTracks.x.length, 2);
     assert.equal(actor._propertyTracks.y.length, 2);
     assert.equal(actor._propertyTracks.x[0].value, 0);
     assert.equal(actor._propertyTracks.x[1].value, 100);
     assert.equal(actor._propertyTracks.y[0].value, 1);
     assert.equal(actor._propertyTracks.y[1].value, 101);
     assert.equal(actor._propertyTracks.x[0].nextProperty, actor._propertyTracks.x[1]);
     assert.equal(actor._propertyTracks.x[1].nextProperty, null);
    });

    it('removes keyframes at the end of a timeline', () => {
      actor
        .keyframe(0, { x: 1 })
        .keyframe(1000, { x: 2 })
        .keyframe(2000, { x: 3 });

      actor.removeKeyframe(2000);

      assert.equal(rekapi.getAnimationLength(), 1000);
      assert.equal(actor._propertyTracks.x.length, 2);
      assert.equal(actor._propertyTracks.x[0].nextProperty, actor._propertyTracks.x[1]);
      assert.equal(actor._propertyTracks.x[1].nextProperty, null);
    });
  });

  describe('#removeAllKeyframes', () => {
    it('removes all keyframes', () => {
      actor
        .keyframe(0, { x: 0 })
        .keyframe(1000, { x: 1 })
        .keyframe(2000, { x: 2 });

      actor.removeAllKeyframes();

      assert.equal(rekapi.getAnimationLength(), 0);
      assert.equal(actor._propertyTracks.x, undefined);
    });
  });

  describe('#copyKeyframe', () => {
    it('copies keyframe properties', () => {
      actor = setupTestActor(rekapi);
      actor.keyframe(0, {
          x: 50
        }, {
          x: 'easeInQuad'
        });

      actor.copyKeyframe(0, 1000);

      const { _propertyTracks } = actor;

      assert.equal(_propertyTracks.x.length, 2);
      assert(_propertyTracks.x[0] !== _propertyTracks.x[1]);
      assert.equal(_propertyTracks.x[0].value, _propertyTracks.x[1].value);
      assert.equal(_propertyTracks.x[0].easing, _propertyTracks.x[1].easing);
    });
  });

  describe('#modifyKeyframe', () => {
    it('modifies keyframe property value', () => {
      actor
        .keyframe(0, { x: 100 })
        .keyframe(1000, { x: 200 });

      actor.modifyKeyframe(0, { x: 0 });
      assert.equal(actor._propertyTracks.x[0].value, 0);
    });

    it('modifies keyframe property easing', () => {
      actor
        .keyframe(0, { x: 0 }, { x: 'elastic' })
        .keyframe(1000, { x: 100 }, { x: 'elastic' });

      actor.modifyKeyframe(1000, {}, { x: 'linear' });

      assert.equal(actor._propertyTracks.x[1].easing, 'linear');
    });
  });

  describe('#hasKeyframeAt', () => {
    beforeEach(() => {
      actor
        .keyframe(0, { x: 0 }, { x: 'elastic' })
        .keyframe(1000, { x: 100 }, { x: 'elastic' });
    });

    it('determines if there are any properties at a given millisecond', () => {
      assert.equal(actor.hasKeyframeAt(500), false);
      assert.equal(actor.hasKeyframeAt(2000), false);
      assert.equal(actor.hasKeyframeAt(1000), true);
    });

    it('determines if there is a specific property at a given millisecond', () => {
      assert.equal(actor.hasKeyframeAt(0, 'y'), false);
      assert.equal(actor.hasKeyframeAt(1200, 'x'), false);
      assert.equal(actor.hasKeyframeAt(1000, 'x'), true);
    });
  });

  describe('#moveKeyframe', () => {
    it('does not move a keyframe to a point on the timeline if the target is not empty', () => {
      actor
        .keyframe(0, { x: 1 })
        .keyframe(10, { x: 2 })
        .keyframe(20, { x: 3 });

      assert.equal(actor.moveKeyframe(20, 10), false);
      assert.equal(actor.getKeyframeProperty('x', 10).value, 2);
      assert.equal(actor.getKeyframeProperty('x', 20).value, 3);
    });

    it('does not move a keyframe is the source keyframe is not there', () => {
      actor
        .keyframe(0, { x: 1 })
        .keyframe(10, { x: 2 });

      assert.equal(actor.moveKeyframe(20, 30), false);
    });

    it('moves valid source keyframe to valid target', () => {
      actor
        .keyframe(0, { x: 1 })
        .keyframe(10, { x: 2 });

      const didMoveKeyframe = actor.moveKeyframe(10, 20);

      assert(didMoveKeyframe);
      assert.equal(actor.hasKeyframeAt(20), true);
      assert.equal(actor.hasKeyframeAt(10), false);
      assert.equal(rekapi.getAnimationLength(), 20);
    });
  });

  describe('#wait', () => {
    it('extends final state of fully defined tracks', () => {
      actor.keyframe(0, { x: 50 }).wait(1000);

      assert.equal(actor._propertyTracks.x[1].value, 50);
    });

    // TODO: This is sort of weird behavior.  Could this be simplified/removed?
    it('sets an explicit final state for implicit properties before extending them', () => {
      actor
        .keyframe(0, { x: 51, y: 50 })
        .keyframe(500, { y: 100 })
        .keyframe(1000, { x: 101 })
        .wait(2000);

      assert.equal(actor._propertyTracks.x[2].value, 101);
      assert.equal(actor._propertyTracks.x[2].millisecond, 2000);
      assert.equal(actor._propertyTracks.x.length, 3);

      // The missing y property at millisecond 1000 was implicitly filled in and copied
      assert.equal(actor._propertyTracks.y.length, 4);
    });
  });

  describe('#getKeyframeProperty', () => {
    it('retrieves KeyframeProperty instances', () => {
      actor.keyframe(0, { x: 10 });

      assert.equal(actor.getKeyframeProperty('x', 0).value, 10);
    });
  });

  describe('#modifyKeyframeProperty', () => {
    it('modifies KeyframeProperty instances', () => {
      actor.keyframe(0, { x: 10 });
      actor.modifyKeyframeProperty('x', 0, { value: 20 });

      assert.equal(actor.getKeyframeProperty('x', 0).value, 20);
    });

    it('can reorder properties', () => {
      actor
        .keyframe(0, {x: 1})
        .keyframe(10, {x: 2});

      actor.modifyKeyframeProperty('x', 0, { millisecond: 20 });
      const propertyAt10 = actor.getKeyframeProperty('x', 10);
      const propertyAt20 = actor.getKeyframeProperty('x', 20);

      assert.equal(propertyAt10.nextProperty, propertyAt20);
      assert.equal(propertyAt20.nextProperty, null);
    });

    it('cannot move a KeyframeProperty where there already is one', () => {
      actor
        .keyframe(0, { x: 1 })
        .keyframe(10, { x: 2 });

      assert.throws(() => {
        actor.modifyKeyframeProperty('x', 10, { millisecond: 0 });
      }, Error);
    });
  });

  describe('#removeKeyframeProperty', () => {
    it('remove KeyframeProperty instances', () => {
      actor.keyframe(0, { x: 10 });
      actor.removeKeyframeProperty('x', 0);

      assert.equal(actor.getPropertiesInTrack('x').length, 0);
    });
  });

  describe('#getPropertiesInTrack', () => {
    it('returns an array KeyframeProperty instances in a track', () => {
      actor
        .keyframe(0, { x: 1 })
        .keyframe(1000, { x: 2 })
        .keyframe(2000, { x: 3 });

      assert.equal(actor.getPropertiesInTrack('x').length, 3);
    });

    it('returns nothing if there are no properties in a given track', () => {
      actor
        .keyframe(0, {})
        .keyframe(1000, {})
        .keyframe(2000, {});

      assert.equal(actor.getPropertiesInTrack('x').length, 0);
    });
  });

  describe('#getStart', () => {
    it('gets the start of an actor\'s movement in the animation', () => {
      actor
        .keyframe(250, {
          x: 1
        }).keyframe(1000, {
          x: 10
        }).keyframe(2000, {
          x: 20
        });

      assert.equal(actor.getStart(), 250);
    });

    it('gets the start of an actor\'s movement for a given track in the animation', () => {
      actor
        .keyframe(0, { y: 45 })
        .keyframe(250, { x: 1 })
        .keyframe(1000, { x: 10, y: 100 });

      assert.equal(actor.getStart('y'), 0);
      assert.equal(actor.getStart('x'), 250);
    });

    it('handles an actor with no keyframes', () => {
      assert.equal(actor.getStart(), 0);
    });
  });

  describe('#getEnd', () => {
    it('gets the end of an actor\'s movement', () => {
      actor
        .keyframe(250, { x: 1 })
        .keyframe(1000, { x: 10 })
        .keyframe(2000, { x: 20 });

      assert.equal(actor.getEnd(), 2000);
    });

    it('can scope to a track', () => {
      actor
        .keyframe(250,  { x: 1,  y: 10 })
        .keyframe(1000, { x: 10, y: 20 })
        .keyframe(2000, { x: 20 });

      assert.equal(actor.getEnd('x'), 2000);
      assert.equal(actor.getEnd('y'), 1000);
    });

    it('is unaffected by keyframes that were moved', () => {
      actor
        .keyframe(0,    { x: 1  })
        .keyframe(1000, { x: 10 })
        .keyframe(2000, { x: 20 });

      assert.equal(actor.getEnd('x'), 2000);

      actor.modifyKeyframeProperty('x', 2000, { millisecond: 500 });
      assert.equal(actor.getEnd('x'), 1000);

      actor.modifyKeyframeProperty('x', 500, { millisecond: 2000 });
      assert.equal(actor.getEnd('x'), 2000);
    });
  });

  describe('#getLength', () => {
    it('gets the total time that an actor animates for', () => {
      actor
        .keyframe(250, { x: 1 })
        .keyframe(1000, { x: 10 })
        .keyframe(2000, { x: 20 });

      assert.equal(actor.getLength(), 1750);
    });

    it('can scope to a track', () => {
      actor
        .keyframe(0,    { y: 10 })
        .keyframe(250,  { x: 1  })
        .keyframe(1000, { x: 10 })
        .keyframe(2000, { y: 20 });

      assert.equal(actor.getLength('x'), 750);
      assert.equal(actor.getLength('y'), 2000);
    });
  });

  describe('#getTrackNames', () => {
    it('returns list of track names', () => {
      actor.keyframe(0, { a: 1, b: 2, c: 3, d: 4 });

      const trackNames = actor.getTrackNames().sort();

      assert.equal(trackNames[0], 'a');
      assert.equal(trackNames[1], 'b');
      assert.equal(trackNames[2], 'c');
      assert.equal(trackNames[3], 'd');
      assert.equal(trackNames.length, 4);
    });
  });

  describe('#exportTimeline', () => {
    beforeEach(() => {
      actor
        .keyframe(0, { x: 1, y: 10 })
        .keyframe(1000, { x: 2, y: 20 });
    });

    it('exports key data points', () => {
      const exportedActorData = actor.exportTimeline();

      assert.equal(exportedActorData.start, 0);
      assert.equal(exportedActorData.end, 1000);
      assert(exportedActorData.trackNames.indexOf('x') > -1);
      assert(exportedActorData.trackNames.indexOf('y') > -1);
      assert.equal(exportedActorData.trackNames.length, 2);
      assert.equal(exportedActorData.propertyTracks.x.length, 2);
      assert.equal(exportedActorData.propertyTracks.y.length, 2);
      assert.equal(typeof exportedActorData.id, 'undefined');
      assert.equal(typeof exportedActorData.propertyTracks.x[0].id, 'undefined');
    });

    describe('withId: true', () => {
      it('includes id properties', () => {
        const exportedActorData = actor.exportTimeline({ withId: true });
        assert.equal(typeof exportedActorData.id, 'string');
        assert.equal(typeof exportedActorData.propertyTracks.x[0].id, 'string');
      });
    });
  });

  describe('#importTimeline', () => {
    it('imports data correctly', () => {
      actor
        .keyframe(0, { x: 1, y: 10 })
        .keyframe(1000, { x: 2, y: 20 });

      const importActor = new Actor();
      importActor.importTimeline(actor.exportTimeline());

      const firstImportXKeyProp = importActor.getKeyframeProperty('x', 0);
      const firstExportXKeyProp = actor.getKeyframeProperty('x', 0);
      assert.equal(firstImportXKeyProp.value, firstExportXKeyProp.value);
      assert.equal(firstImportXKeyProp.millisecond, firstExportXKeyProp.millisecond);

      const secondImportXKeyProp = importActor.getKeyframeProperty('x', 1000);
      const secondExportXKeyProp = actor.getKeyframeProperty('x', 1000);
      assert.equal(secondImportXKeyProp.value, secondExportXKeyProp.value);
      assert.equal(secondImportXKeyProp.millisecond, secondExportXKeyProp.millisecond);

      const firstImportYKeyProp = importActor.getKeyframeProperty('y', 0);
      const firstExportYKeyProp = actor.getKeyframeProperty('y', 0);
      assert.equal(firstImportYKeyProp.value, firstExportYKeyProp.value);
      assert.equal(firstImportYKeyProp.millisecond, firstExportYKeyProp.millisecond);

      const secondImportYKeyProp = importActor.getKeyframeProperty('y', 1000);
      const secondExportYKeyProp = actor.getKeyframeProperty('y', 1000);
      assert.equal(secondImportYKeyProp.value, secondExportYKeyProp.value);
      assert.equal(secondImportYKeyProp.millisecond, secondExportYKeyProp.millisecond);
    });
  });

  describe('.context', () => {
    it('is inherited from parent Rekapi instance by default', () => {
      assert.equal(actor.context, rekapi.context);
    });
  });

  describe('events', () => {
    describe('beforeAddKeyframeProperty', () => {
      it('when fired, reflects the state of the animation prior to adding the keyframe property', () => {
        actor.keyframe(50, { x: 0 });

        rekapi.on('beforeAddKeyframeProperty', () => {
          assert.equal(rekapi.getAnimationLength(), 50);
        });

        actor.keyframe(100, { x: 10 });
      });
    });

    describe('beforeRemoveKeyframeProperty', () => {
      it('when fired, reflects the state of the animation prior to removing the keyframe property', () => {
        actor.keyframe(0, { x: 0 }).keyframe(100, { x: 10 });

        rekapi.on('beforeRemoveKeyframeProperty', () => {
          assert.equal(rekapi.getAnimationLength(), 100);
        });

        actor.removeKeyframeProperty('x', 100);
      });
    });

    describe('removeKeyframePropertyComplete', () => {
      it('when fired, reflects the new state of the animation', () => {
        actor.keyframe(0, { x: 0 }).keyframe(100, { x: 10 });

        rekapi.on('removeKeyframePropertyComplete', () => {
          assert.equal(rekapi.getAnimationLength(), 0);
        });

        actor.removeKeyframeProperty('x', 100);
      });
    });

    describe('removeKeyframePropertyTrack', () => {
      it('fires when a track is removed', () => {
        let eventWasCalled, removedTrackName;

        actor.keyframe(0, { x: 10 });

        rekapi.on('removeKeyframePropertyTrack', (rekapi, trackName) => {
          eventWasCalled = true;
          removedTrackName = trackName;
        });

        actor.removeKeyframe(0);
        assert(eventWasCalled);
        assert.equal(removedTrackName, 'x');
      });
    });
  });

  describe('function keyframes', () => {
    describe('without other properties', () => {
      it('gets called', () => {
        let functionWasCalled;
        actor.keyframe(0, () => functionWasCalled = true);

        rekapi._loopTimestamp = 0;
        Tweenable.now = () => 0;
        updateToCurrentMillisecond(rekapi);

        assert(functionWasCalled);
      });

      it('at millisecond 0, is called with each loop iteration', () => {
        let callCount = 0;
        actor.keyframe(0, () => callCount++);

        rekapi._loopTimestamp = 0;
        Tweenable.now = () => 0;
        updateToCurrentMillisecond(rekapi);
        assert.equal(callCount, 1);

        Tweenable.now = () => 1;
        updateToCurrentMillisecond(rekapi);
        assert.equal(callCount, 2);
      });
    });

    describe('with other properties', () => {
      it('gets called', () => {
        let functionWasCalled;
        actor.keyframe(10, () => functionWasCalled = true);
        actor.keyframe(20, { x: 1 });

        rekapi._loopTimestamp = 0;
        Tweenable.now = () => 5;
        updateToCurrentMillisecond(rekapi);
        assert(!functionWasCalled);

        // Note: 20 causes the loop to start over and be evaluated as 0 in
        // KeyframeProperty#shouldInvokeForMillisecond.
        Tweenable.now = () => 19;
        updateToCurrentMillisecond(rekapi);

        assert(functionWasCalled);
      });
    });

    describe('callback', () => {
      it('receives drift and context', () => {
        let receivedDrift, context;

        actor.keyframe(0, function (actor, drift) {
          context = actor;
          receivedDrift = drift;
        });

        actor.keyframe(20, { x: 1 });

        rekapi._loopTimestamp = 0;
        Tweenable.now = () => 5;
        updateToCurrentMillisecond(rekapi);

        assert.equal(receivedDrift, 5);
        assert.equal(context, actor);
      });

      it('gets called once per loop iteration', () => {
        let functionCalls = 0;

        actor.keyframe(10, () => functionCalls += 1);
        actor.keyframe(20, { x: 1 });

        rekapi._loopTimestamp = 0;
        Tweenable.now = () => 12;
        updateToCurrentMillisecond(rekapi);
        Tweenable.now = () => 13;
        updateToCurrentMillisecond(rekapi);
        assert.equal(functionCalls, 1);

        // Reset the loop
        Tweenable.now = () => 21;
        updateToCurrentMillisecond(rekapi);
        Tweenable.now = () => 12;
        updateToCurrentMillisecond(rekapi);
        assert.equal(functionCalls, 2);
      });

      it('does not require non-function keyframes in the timeline to be invoked', () => {
        let calledFn1, calledFn2;

        actor.keyframe(10, () => calledFn1 = true);
        actor.keyframe(20, () => calledFn2 = true);

        rekapi._loopTimestamp = 0;
        Tweenable.now = () => 5;
        updateToCurrentMillisecond(rekapi);
        assert(!calledFn1);
        assert(!calledFn2);

        Tweenable.now = () => 15;
        updateToCurrentMillisecond(rekapi);
        assert(calledFn1);
        assert(!calledFn2);

        Tweenable.now = () => 20;
        updateToCurrentMillisecond(rekapi);
        assert(calledFn1);
        assert(calledFn2);
      });

      it('when at the end of the loop, is called only once', () => {
        let callCount = 0;
        actor
          .keyframe(10, {
            'function': () => callCount++
          });

        rekapi._timesToIterate = 1;
        updateToMillisecond(rekapi, 10);
        assert.equal(callCount, 1);
      });
    });

    describe('#_resetFnKeyframesFromMillisecond', () => {
      it('resets function keyframes later but not before specified millisecond', () => {
        let callCount = 0;
        actor
          .keyframe(10, {
            'function': () => callCount++
          })
          .keyframe(20, {
            'function': () => callCount++
          });

        rekapi._timesToIterate = 1;

        updateToMillisecond(rekapi, 5);
        assert.equal(callCount, 0);

        updateToMillisecond(rekapi, 15);
        assert.equal(callCount, 1);

        actor._resetFnKeyframesFromMillisecond(2);
        updateToMillisecond(rekapi, 15);
        assert.equal(callCount, 2);

        updateToMillisecond(rekapi, 15);
        assert.equal(callCount, 2);
      });
    });
  });
});
