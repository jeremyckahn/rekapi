import { interpolate } from 'shifty';
import {
  fireEvent
} from './rekapi';
import {
  pick,
  uniqueId
} from './utils';

const DEFAULT_EASING = 'linear';

/**
 * Represents an individual component of an {@link rekapi.Actor}'s keyframe
 * state.  In most cases you won't need to deal with this object directly, as
 * the {@link rekapi.Actor} APIs abstract a lot of what this Object does away
 * for you.
 * @param {number} millisecond Sets {@link
 * rekapi.KeyframeProperty#millisecond}.
 * @param {string} name Sets {@link rekapi.KeyframeProperty#name}.
 * @param {(number|string|boolean|rekapi.keyframeFunction)} value Sets {@link
 * rekapi.KeyframeProperty#value}.
 * @param {rekapi.easingOption} [easing="linear"] Sets {@link
 * rekapi.KeyframeProperty#easing}.
 * @constructs rekapi.KeyframeProperty
 */
export class KeyframeProperty {
  constructor (millisecond, name, value, easing = DEFAULT_EASING) {
    /**
     * @member {string} rekapi.KeyframeProperty#id The unique ID of this {@link
     * rekapi.KeyframeProperty}.
     */
    this.id = uniqueId('keyframeProperty_');

    /**
     * @member {boolean} rekapi.KeyframeProperty#hasFired Flag to determine if
     * this {@link rekapi.KeyframeProperty}'s {@link rekapi.keyframeFunction}
     * should be invoked in the current animation loop.
     */
    this.hasFired = null;

    /**
     * @member {(rekapi.Actor|undefined)} rekapi.KeyframeProperty#actor The
     * {@link rekapi.Actor} to which this {@link rekapi.KeyframeProperty}
     * belongs, if any.
     */

    /**
     * @member {(rekapi.KeyframeProperty|null)}
     * rekapi.KeyframeProperty#nextProperty A reference to the {@link
      * rekapi.KeyframeProperty} that follows this one in a {@link
      * rekapi.Actor}'s property track.
     */
    this.nextProperty = null;

    Object.assign(this, {
      /**
       * @member {number} rekapi.KeyframeProperty#millisecond Where on the
       * animation timeline this {@link rekapi.KeyframeProperty} is.
       */
      millisecond,
      /**
       * @member {string} rekapi.KeyframeProperty#name This {@link
       * rekapi.KeyframeProperty}'s name, such as `"x"` or `"opacity"`.
       */
      name,
      /**
       * @member {number|string|boolean|rekapi.keyframeFunction}
       * rekapi.KeyframeProperty#value The value that this {@link
       * rekapi.KeyframeProperty} represents.
       */
      value,
      /**
       * @member {rekapi.easingOption} rekapi.KeyframeProperty#easing The
       * easing curve by which this {@link rekapi.KeyframeProperty} should be
       * animated.
       */
      easing
    });
  }

  /**
   * Modify this {@link rekapi.KeyframeProperty}.
   * @method rekapi.KeyframeProperty#modifyWith
   * @param {Object} newProperties Valid values are:
   * @param {number} [newProperties.millisecond] Sets {@link
   * rekapi.KeyframeProperty#millisecond}.
   * @param {string} [newProperties.name] Sets {@link rekapi.KeyframeProperty#name}.
   * @param {(number|string|boolean|rekapi.keyframeFunction)} [newProperties.value] Sets {@link
   * rekapi.KeyframeProperty#value}.
   * @param {string} [newProperties.easing] Sets {@link
   * rekapi.KeyframeProperty#easing}.
   */
  modifyWith (newProperties) {
    Object.assign(this, newProperties);
  }

  /**
   * Calculate the midpoint between this {@link rekapi.KeyframeProperty} and
   * the next {@link rekapi.KeyframeProperty} in a {@link rekapi.Actor}'s
   * property track.
   *
   * In just about all cases, `millisecond` should be between this {@link
   * rekapi.KeyframeProperty}'s `millisecond` and the `millisecond` of the
   * {@link rekapi.KeyframeProperty} that follows it in the animation
   * timeline, but it is valid to specify a value outside of this range.
   * @method rekapi.KeyframeProperty#getValueAt
   * @param {number} millisecond The millisecond in the animation timeline to
   * compute the state value for.
   * @return {(number|string|boolean|rekapi.keyframeFunction|rekapi.KeyframeProperty#value)}
   */
  getValueAt (millisecond) {
    const nextProperty = this.nextProperty;

    if (typeof this.value === 'boolean') {
      return this.value;
    } else if (nextProperty) {
      const boundedMillisecond = Math.min(
        Math.max(millisecond, this.millisecond),
        nextProperty.millisecond
      );

      const { name } = this;
      const delta = nextProperty.millisecond - this.millisecond;
      const interpolatePosition =
        (boundedMillisecond - this.millisecond) / delta;

      return interpolate(
        { [name]: this.value },
        { [name]: nextProperty.value },
        interpolatePosition,
        nextProperty.easing
      )[name];
    } else {
      return this.value;
    }
  }

  /**
   * Create the reference to the {@link rekapi.KeyframeProperty} that follows
   * this one on a {@link rekapi.Actor}'s property track.  Property tracks
   * are just linked lists of {@link rekapi.KeyframeProperty}s.
   * @method rekapi.KeyframeProperty#linkToNext
   * @param {KeyframeProperty=} nextProperty The {@link
   * rekapi.KeyframeProperty} that should immediately follow this one on the
   * animation timeline.
   */
  linkToNext (nextProperty = null) {
    this.nextProperty = nextProperty;
  }

  /**
   * Disassociates this {@link rekapi.KeyframeProperty} from its {@link
   * rekapi.Actor}.  This is called by various {@link rekapi.Actor} methods
   * and triggers the [removeKeyframeProperty]{@link rekapi.Rekapi#on} event
   * on the associated {@link rekapi.Rekapi} instance.
   * @method rekapi.KeyframeProperty#detach
   * @fires rekapi.removeKeyframeProperty
   */
  detach () {
    const { actor } = this;

    if (actor && actor.rekapi) {
      fireEvent(actor.rekapi, 'removeKeyframeProperty', this);
      delete actor._keyframeProperties[this.id];
      this.actor = null;
    }

    return this;
  }

  /**
   * Export this {@link rekapi.KeyframeProperty} to a `JSON.stringify`-friendly
   * `Object`.
   * @method rekapi.KeyframeProperty#exportPropertyData
   * @param {Object} [config]
   * @param {boolean} [config.withId=false] If `true`, include internal `id`
   * value in exported data.
   * @return {rekapi.propertyData}
   */
  exportPropertyData ({ withId = false } = {}) {
    const props = ['millisecond', 'name', 'value', 'easing'];

    if (withId) {
      props.push('id');
    }

    return pick(this, props);
  }

  /*!
   * Whether or not this is a function keyframe and should be invoked for the
   * current frame.  Helper method for Actor.
   * @method rekapi.KeyframeProperty#shouldInvokeForMillisecond
   * @return {boolean}
   */
  shouldInvokeForMillisecond (millisecond) {
    return (millisecond >= this.millisecond &&
      this.name === 'function' &&
      !this.hasFired
    );
  }

  /**
   * Calls {@link rekapi.KeyframeProperty#value} if it is a {@link
   * rekapi.keyframeFunction}.
   * @method rekapi.KeyframeProperty#invoke
   * @return {any} Whatever value is returned for this {@link
   * rekapi.KeyframeProperty}'s {@link rekapi.keyframeFunction}.
   */
  invoke () {
    const drift = this.actor.rekapi._loopPosition - this.millisecond;
    const returnValue = this.value(this.actor, drift);
    this.hasFired = true;

    return returnValue;
  }
}
