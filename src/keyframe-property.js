import _ from 'lodash';
import { interpolate } from 'shifty';
import {
  fireEvent
} from './rekapi';

const DEFAULT_EASING = 'linear';

/**
 * Represents an individual component of an actor's keyframe state.  In most
 * cases you won't need to deal with this object directly, as the
 * {@link rekapi.Actor} APIs abstract a lot of what
 * this Object does away for you.
 * @param {number} millisecond Sets {@link rekapi.KeyframeProperty#millisecond}
 * @param {string} name Sets {@link rekapi.KeyframeProperty#name}
 * @param {number|string|rekapi.keyframeFunction} value Sets {@link
 * rekapi.KeyframeProperty#value}
 * @param {string} [easing="linear"] Sets {@link rekapi.KeyframeProperty#easing}
 * @constructs rekapi.KeyframeProperty
 */
export class KeyframeProperty {
  constructor (millisecond, name, value, easing = DEFAULT_EASING) {
    this.id = _.uniqueId('keyframeProperty_');
    this.hasFired = null;
    this.nextProperty = null;

    Object.assign(this, {
      /**
       * @member {number} rekapi.KeyframeProperty#millisecond Where on the
       * animation timeline this {@link rekapi.KeyframeProperty} is.
       */
      millisecond,
      /**
       * @member {string} rekapi.KeyframeProperty#name The property's name,
       * such as `"x"` or `"opacity"`.
       */
      name,
      /**
       * @member {number|string|rekapi.keyframeFunction}
       * rekapi.KeyframeProperty#value The value that this {@link
       * rekapi.KeyframeProperty} represents.
       */
      value,
      /**
       * @member {string} rekapi.KeyframeProperty#easing The easing curve at
       * which this {@link rekapi.KeyframeProperty} should be animated to.
       */
      easing
    });
  }

  /**
   * Modify this {@link rekapi.KeyframeProperty}.
   * @method rekapi.KeyframeProperty#modifyWith
   * @param {Object} newProperties Valid values correspond to {@link
   * rekapi.KeyframeProperty}'s constructor parameters:
   *   - __millisecond__ (_number_)
   *   - __name__ (_string_)
   *   - __value__ (_number|string_)
   *   - __easing__ (_string_)
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
   * @return {number}
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
   * and triggers the `[removeKeyframeProperty]{@link rekapi.Rekapi#on} event
   * on the associated {@link rekapi.Rekapi} instance.
   * @method rekapi.KeyframeProperty#detach
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
   * @method rekapi.KeyframeProperty#exportPropertyData
   * @return {Object} A serializable Object representation of this
   * {@link rekapi.KeyframeProperty}.
   */
  exportPropertyData () {
    return _.pick(this, ['millisecond', 'name', 'value', 'easing']);
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
   * Assuming this is a function keyframe, call the function.
   * @method rekapi.KeyframeProperty#invoke
   * @return {*} Whatever value is returned from the keyframe function that was
   * set for this {@link rekapi.KeyframeProperty}.
   */
  invoke () {
    const drift = this.actor.rekapi._loopPosition - this.millisecond;
    const returnValue = this.value(this.actor, drift);
    this.hasFired = true;

    return returnValue;
  }
}
