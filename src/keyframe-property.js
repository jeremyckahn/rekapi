import _ from 'lodash';
import { interpolate } from 'shifty';
import {
  fireEvent
} from './rekapi';

const DEFAULT_EASING = 'linear';

export class KeyframeProperty {
  /**
   * Represents an individual component of an actor's keyframe state.  In most
   * cases you won't need to deal with this object directly, as the
   * `{{#crossLink "Actor"}}{{/crossLink}}` APIs abstract a lot of what
   * this Object does away for you.
   * @class KeyframeProperty
   * @param {number} millisecond Where on the animation timeline this
   * `KeyframeProperty` is.
   * @param {string} name The property's name, such as `"x"` or `"opacity"`.
   * @param {number|string|Function} value The value that this
   * `KeyframeProperty` represents.
   * @param {string=} easing The easing curve at which this
   * `KeyframeProperty` should be animated to.  Defaults to `"linear"`.
   * @constructor
   */
  constructor (millisecond, name, value, easing = DEFAULT_EASING) {
    this.id = _.uniqueId('keyframeProperty_');
    this.hasFired = null;
    this.nextProperty = null;

    Object.assign(this, {
      millisecond,
      name,
      value,
      easing
    });
  }

  /**
   * Modify this `{{#crossLink "KeyframeProperty"}}{{/crossLink}}`.
   * @method modifyWith
   * @param {Object} newProperties Valid values correspond to `{{#crossLink
   * "KeyframeProperty"}}{{/crossLink}}`'s constructor parameters:
   *   - __millisecond__ (_number_)
   *   - __name__ (_string_)
   *   - __value__ (_number|string_)
   *   - __easing__ (_string_)
   */
  modifyWith (newProperties) {
    Object.assign(this, newProperties);
  }

  /**
   * Calculate the midpoint between this `{{#crossLink
   * "KeyframeProperty"}}{{/crossLink}}` and the next `{{#crossLink
   * "KeyframeProperty"}}{{/crossLink}}` in a `{{#crossLink
   * "Actor"}}{{/crossLink}}`'s property track.
   *
   * In just about all cases, `millisecond` should be between this
   * `{{#crossLink "KeyframeProperty"}}{{/crossLink}}`'s `millisecond`
   * and the `millisecond` of the `{{#crossLink
   * "KeyframeProperty"}}{{/crossLink}}` that follows it in the
   * animation timeline, but it is valid to specify a value outside of this
   * range.
   * @method getValueAt
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
   * Create the reference to the `{{#crossLink
   * "KeyframeProperty"}}{{/crossLink}}` that follows this one on a
   * `{{#crossLink "Actor"}}{{/crossLink}}`'s property track.  Property
   * tracks are just linked lists of `{{#crossLink
   * "KeyframeProperty"}}{{/crossLink}}`s.
   * @method linkToNext
   * @param {KeyframeProperty=} nextProperty The `{{#crossLink
   * "KeyframeProperty"}}{{/crossLink}}` that should immediately follow
   * this one on the animation timeline.
   */
  linkToNext (nextProperty = null) {
    this.nextProperty = nextProperty;
  }

  /**
   * Disassociates this `{{#crossLink
   * "KeyframeProperty"}}{{/crossLink}}` from its `{{#crossLink
   * "Actor"}}{{/crossLink}}`.  This is called by various `{{#crossLink
   * "Actor"}}{{/crossLink}}` methods and triggers the `{{#crossLink
   * "Rekapi/on:method"}}removeKeyframeProperty{{/crossLink}}` event on the
   * associated `{{#crossLink "Rekapi"}}{{/crossLink}}` instance.
   * @method detach
   * @chainable
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
   * __[Example](../../../../examples/keyprop_export_property_data.html)__
   * @method exportPropertyData
   * @return {Object} A serializable Object representation of this
   * `{{#crossLink "KeyframeProperty"}}{{/crossLink}}`.
   */
  exportPropertyData () {
    return _.pick(this, ['millisecond', 'name', 'value', 'easing']);
  }

  /*!
   * Whether or not this is a function keyframe and should be invoked for the
   * current frame.  Helper method for Actor.
   * @method shouldInvokeForMillisecond
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
   * @method invoke
   * @return {*} Whatever value is returned from the keyframe function that was
   * set for this `{{#crossLink "KeyframeProperty"}}{{/crossLink}}`.
   */
  invoke () {
    const drift = this.actor.rekapi._loopPosition - this.millisecond;
    const returnValue = this.value.call(this.actor, drift);
    this.hasFired = true;

    return returnValue;
  }
}
