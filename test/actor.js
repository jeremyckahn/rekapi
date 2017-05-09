/* global describe:true, it:true, before:true, beforeEach:true, afterEach:true */
import assert from 'assert';
import { contains } from 'lodash';
import { setupTestRekapi, setupTestActor } from './test-utils';

import Rekapi, { Actor } from '../src/main';
import {
  Tweenable,
  interpolate,
  setBezierFunction,
  unsetBezierFunction
} from 'shifty';

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
        assert.ok(actor.wasActive);
        assert.equal(actor.get().x, 90);
      });
    });
  });

  describe('#addKeyframeProperty', () => {
    it('creates a link between property and actor', () => {
      const keyframeProperty = new Rekapi.KeyframeProperty(0, 'x', 50);
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

      actor.copyKeyframe(1000, 0);

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
});
