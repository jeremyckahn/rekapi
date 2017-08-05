import _, { noop } from 'lodash';
import { Tweenable } from 'shifty';
import { composeEasingObject } from '../node_modules/shifty/src/tweenable';
import { KeyframeProperty } from './keyframe-property';
import {
  fireEvent,
  invalidateAnimationLength,
  DEFAULT_EASING
} from './rekapi';

/*!
 * @param {Object} obj
 * @return {number} millisecond
 */
const getMillisecond = obj => obj.millisecond;

// TODO: Make this a prototype method
/*!
 * @param {Actor} actor
 * @param {string} event
 * @param {any=} data
 */
const fire = (actor, event, data) =>
  actor.rekapi && fireEvent(actor.rekapi, event, data);

/*!
 * Retrieves the most recent property cache entry for a given millisecond.
 * @param {Actor} actor
 * @param {number} millisecond
 * @return {Object|undefined} undefined if there is no property cache for
 * the millisecond, i.e. an empty cache.
 */
const getPropertyCacheEntryForMillisecond = (actor, millisecond) => {
  const { _timelinePropertyCache } = actor;
  const index = _.sortedIndex(
    _timelinePropertyCache,
    { _millisecond: millisecond },
    obj => obj._millisecond
  );

  if (!_timelinePropertyCache[index]) {
    return;
  }

  return _timelinePropertyCache[index]._millisecond === millisecond ?
    _timelinePropertyCache[index] :
      index >= 1 ?
        _timelinePropertyCache[index - 1] :
        _timelinePropertyCache[0];
};

/*!
 * Search property track `track` and find the correct index to insert a
 * new element at `millisecond`.
 * @param {Array(KeyframeProperty)} track
 * @param {number} millisecond
 * @return {number} index
 */
const insertionPointInTrack = (track, millisecond) =>
  _.sortedIndex(track, { millisecond }, getMillisecond);

/*!
 * Gets all of the current and most recent Rekapi.KeyframeProperties for a
 * given millisecond.
 * @param {Actor} actor
 * @param {number} forMillisecond
 * @return {Object} An Object containing Rekapi.KeyframeProperties
 */
const getLatestProperties = (actor, forMillisecond) => {
  const latestProperties = {};

  _.each(actor._propertyTracks, (propertyTrack, propertyName) => {
    const index = insertionPointInTrack(propertyTrack, forMillisecond);

    latestProperties[propertyName] =
      propertyTrack[index] && propertyTrack[index].millisecond === forMillisecond ?
        // Found forMillisecond exactly.
        propertyTrack[index] :
          index >= 1 ?
            // forMillisecond doesn't exist in the track and index is
            // where we'd need to insert it, therefore the previous
            // keyframe is the most recent one before forMillisecond.
            propertyTrack[index - 1] :
            // Return first property.  This is after forMillisecond.
            propertyTrack[0];
  });

  return latestProperties;
};

/*!
 * Search property track `track` and find the index to the element that is
 * at `millisecond`.  Returns `undefined` if not found.
 * @param {Array(KeyframeProperty)} track
 * @param {number} millisecond
 * @return {number} index or -1 if not present
 */
const propertyIndexInTrack = (track, millisecond) => {
  const index = insertionPointInTrack(track, millisecond);

  return track[index] && track[index].millisecond === millisecond ?
    index : -1;
};

/*!
 * Mark the cache of internal KeyframeProperty data as invalid.  The cache
 * will be rebuilt on the next call to ensurePropertyCacheValid.
 * @param {Actor}
 */
const invalidateCache = actor => actor._timelinePropertyCacheValid = false;

/*!
 * Empty out and rebuild the cache of internal KeyframeProperty data if it
 * has been marked as invalid.
 * @param {Actor}
 */
const ensurePropertyCacheValid = actor => {
  if (actor._timelinePropertyCacheValid) {
    return;
  }

  actor._timelinePropertyCache = [];
  actor._timelineFunctionCache = [];

  const { _timelinePropertyCache, _timelineFunctionCache } = actor;

  // Build the cache map
  const props = _.values(actor._keyframeProperties)
    .sort((a, b) => a.millisecond - b.millisecond);

  let curCacheEntry = getLatestProperties(actor, 0);

  curCacheEntry._millisecond = 0;
  _timelinePropertyCache.push(curCacheEntry);

  props.forEach(property => {
    if (property.millisecond !== curCacheEntry._millisecond) {
      curCacheEntry = _.clone(curCacheEntry);
      curCacheEntry._millisecond = property.millisecond;
      _timelinePropertyCache.push(curCacheEntry);
    }

    curCacheEntry[property.name] = property;

    if (property.name === 'function') {
      _timelineFunctionCache.push(property);
    }
  });

  actor._timelinePropertyCacheValid = true;
};

/*!
 * Remove any property tracks that are empty.
 *
 * @param {Actor} actor
 */
const removeEmptyPropertyTracks = actor => {
  const { _propertyTracks } = actor;

  Object.keys(_propertyTracks).forEach(trackName => {
    if (!_propertyTracks[trackName].length) {
      delete _propertyTracks[trackName];
      fire(actor, 'removeKeyframePropertyTrack', trackName);
    }
  });
};

/*!
 * Stably sort all of the property tracks of an actor
 * @param {Actor} actor
 */
const sortPropertyTracks = actor => {
  _.each(actor._propertyTracks, (propertyTrack, trackName) => {
    propertyTrack = _.sortBy(propertyTrack, 'millisecond');

    propertyTrack.forEach((keyframeProperty, i) =>
      keyframeProperty.linkToNext(propertyTrack[i + 1])
    );

    actor._propertyTracks[trackName] = propertyTrack;
  });
};

/*!
 * Updates internal Rekapi and Actor data after a KeyframeProperty
 * modification method is called.
 *
 * @param {Actor} actor
 */
const cleanupAfterKeyframeModification = actor => {
  sortPropertyTracks(actor);
  invalidateCache(actor);

  if (actor.rekapi) {
    invalidateAnimationLength(actor.rekapi);
  }

  fire(actor, 'timelineModified');
};

/**
 * An actor represents an individual component of an animation.  An animation
 * may have one or many actors.
 *
 * @param {Object=} config Valid properties:
 *   - __context__ (_Object|CanvasRenderingContext2D|HTMLElement_): The
 *   rendering context for this actor. If omitted, this Actor gets the parent
 *   `{@link rekapi.Rekapi}` instance's `context` when it is
 *   added with `{@link rekapi.Rekapi#addActor}`.
 *   - __setup__ (_Function_): A function that gets called when the actor is
 *     added to an animation with
 *     `{@link rekapi.Rekapi#addActor}`.
 *   - __render__ (_Function(Object, Object)_): A function that gets called
 *   every time the actor's state is updated (once every frame). This
 *   function should do something meaningful with state of the actor (for
 *   example, visually rendering to the screen).  This function receives two
 *   parameters: The first is a reference to the actor's `context` and the
 *   second is an Object containing the current state properties.
 *   - __teardown__ (_Function_): A function that gets called when the actor
 *   is removed from an animation with
 *   `{@link rekapi.Rekapi#removeActor}`.
 * @constructs rekapi.Actor
 */
export class Actor extends Tweenable {
  constructor (config = {}) {
    super();

    Object.assign(this, {
      _propertyTracks: {},
      _timelinePropertyCache: [],
      _timelineFunctionCache: [],
      _timelinePropertyCacheValid: false,
      _keyframeProperties: {},
      id: _.uniqueId(),
      context: config.context, // This may be undefined
      setup: config.setup || noop,
      render: config.render || noop,
      teardown: config.teardown || noop,
      data: {},
      wasActive: true
    });
  }

  /**
   * Create a keyframe for the actor.  The animation timeline begins at `0`.
   * The timeline's length will automatically "grow" to accommodate new
   * keyframes as they are added.
   *
   * `state` should contain all of the properties that define this
   * keyframe's state.  These properties can be any value that can be tweened
   * by [Shifty](http://jeremyckahn.github.io/shifty/) (numbers,
   * RGB/hexadecimal color strings, and CSS property strings).  `state` can
   * also be a function, but this works differently (see "Function keyframes"
   * below).
   *
   * __Note:__ Internally, this creates `{@link rekapi.KeyframeProperty}`s and
   * places them on a "track." These `{@link rekapi.KeyframeProperty}`s are managed
   * for you by the `{@link rekapi.Actor}` APIs.
   *
   * ## Keyframe inheritance
   *
   * Keyframes always inherit missing properties from the previous keyframe.
   * For example:
   *
   *     actor.keyframe(0, {
   *       'x': 100
   *     }).keyframe(1000, {
   *       // Implicitly specifies the `x: 100` from above
   *       'y': 50
   *     });
   *
   * Keyframe `1000` will have a `y` of `50`, and an `x` of `100`, because `x`
   * was inherited from keyframe `0`.
   *
   * ## Function keyframes
   *
   * Instead of providing an Object to be used to interpolate state values, you
   * can provide a function to be called at a specific point on the timeline.
   * This function does not need to return a value, as it does not get used to
   * render the actor state.  Function keyframes are called once per animation
   * loop and do not have any tweening relationship with one another.  This is
   * a primarily a mechanism for scheduling arbitrary code to be executed at
   * specific points in an animation.
   *
   *     // drift is the number of milliseconds that this function was executed
   *     // after the scheduled time.  There is typically some amount of delay
   *     // due to the nature of JavaScript timers.
   *     actor.keyframe(1000, function (drift) {
   *       console.log(this); // Logs the actor instance
   *     });
   *
   * ## Easing
   *
   * `opt_easing`, if provided, can be a string or an Object.  If `opt_easing`
   * is a string, all animated properties will have the same easing curve
   * applied to them.  For example:
   *
   *     actor.keyframe(1000, {
   *         'x': 100,
   *         'y': 100
   *       }, 'easeOutSine');
   *
   * Both `x` and `y` will have `easeOutSine` applied to them.  You can also
   * specify multiple easing curves with an Object:
   *
   *     actor.keyframe(1000, {
   *         'x': 100,
   *         'y': 100
   *       }, {
   *         'x': 'easeinSine',
   *         'y': 'easeOutSine'
   *       });
   *
   * `x` will ease with `easeInSine`, and `y` will ease with `easeOutSine`.
   * Any unspecified properties will ease with `linear`.  If `easing` is
   * omitted, all properties will default to `linear`.
   * @method rekapi.Actor#keyframe
   * @param {number} millisecond Where on the timeline to set the keyframe.
   * @param {Object|Function(number)} state The state properties of the
   * keyframe.  If this is an Object, the properties will be interpolated
   * between this and those of the following keyframe for a given point on the
   * animation timeline.  If this is a function, it will be executed at the
   * specified keyframe.  The function will receive a number that represents
   * the delay between when the function is called and when it was scheduled.
   * @param {string|Object=} easing Optional easing string or Object.  If
   * `state` is a function, this is ignored.
   * @chainable
   */
  keyframe (millisecond, state, easing = DEFAULT_EASING) {
    if (state instanceof Function) {
      state = { 'function': state };
    }

    const easingObject = composeEasingObject(state, easing);

    _.each(state, (value, name) =>
      this.addKeyframeProperty(
        new KeyframeProperty(millisecond, name, value, easingObject[name])
      )
    );

    if (this.rekapi) {
      invalidateAnimationLength(this.rekapi);
    }

    invalidateCache(this);
    fire(this, 'timelineModified');

    return this;
  }

  /**
   * @method rekapi.Actor#hasKeyframeAt
   * @param {number} millisecond Point on the timeline to query.
   * @param {string=} trackName Optionally scope the lookup to a particular
   * track.
   * @return {boolean} Whether or not the actor has any `{@link
   * rekapi.KeyframeProperty}`s set at `millisecond`.
   */
  hasKeyframeAt (millisecond, trackName = undefined) {
    const { _propertyTracks } = this;

    if (trackName && !_propertyTracks[trackName]) {
      return false;
    }

    const propertyTracks = trackName ?
      _.pick(_propertyTracks, trackName) :
      _propertyTracks;

    return Object.keys(propertyTracks).some(track =>
      propertyTracks.hasOwnProperty(track) &&
      !!this.getKeyframeProperty(track, millisecond)
    );
  }

  /**
   * Copies all of the `{@link rekapi.KeyframeProperty}`s from one point on the
   * actor's timeline to another. This is particularly useful for animating an
   * actor back to its original position.
   *
   *     actor
   *       .keyframe(0, {
   *         x: 10,
   *         y: 15
   *       }).keyframe(1000, {
   *         x: 50,
   *         y: 75
   *       });
   *
   *     // Return the actor to its original position
   *     actor.copyKeyframe(2000, 0);
   *
   * @method rekapi.Actor#copyKeyframe
   * @param {number} copyTo The timeline millisecond to copy KeyframeProperties
   * to.
   * @param {number} copyFrom The timeline millisecond to copy
   * KeyframeProperties from.
   * @chainable
   */
  copyKeyframe (copyTo, copyFrom) {
    // Build the configuation objects to be passed to Actor#keyframe
    const sourcePositions = {};
    const sourceEasings = {};

    _.each(this._propertyTracks, (propertyTrack, trackName) => {
      const keyframeProperty =
        this.getKeyframeProperty(trackName, copyFrom);

      if (keyframeProperty) {
        sourcePositions[trackName] = keyframeProperty.value;
        sourceEasings[trackName] = keyframeProperty.easing;
      }
    });

    this.keyframe(copyTo, sourcePositions, sourceEasings);

    return this;
  }

  /**
   * Moves all of the `{@link rekapi.KeyframeProperty}`s from one point on the
   * actor's timeline to another.  Although this method does error checking for
   * you to make sure the operation can be safely performed, an effective
   * pattern is to use `{@link rekapi.Actor#hasKeyframeAt}` to see if there is
   * already a keyframe at the requested `to` destination.
   *
   * @method rekapi.Actor#moveKeyframe
   * @param {number} from The millisecond of the keyframe to be moved.
   * @param {number} to The millisecond of where the keyframe should be moved
   * to.
   * @return {boolean} Whether or not the keyframe was successfully moved.
   */
  moveKeyframe (from, to) {
    if (!this.hasKeyframeAt(from) || this.hasKeyframeAt(to)) {
      return false;
    }

    // Move each of the relevant KeyframeProperties to the new location in the
    // timeline
    _.each(this._propertyTracks, (propertyTrack, trackName) => {
      const oldIndex = propertyIndexInTrack(propertyTrack, from);

      if (oldIndex !== -1) {
        propertyTrack[oldIndex].millisecond = to;
      }
    });

    cleanupAfterKeyframeModification(this);

    return true;
  }

  /**
   * Augment the `value` or `easing` of the `{@link rekapi.KeyframeProperty}`s
   * at a given millisecond.  Any `{@link rekapi.KeyframeProperty}`s omitted in
   * `state` or `opt_easing` are not modified.
   *
   *     actor.keyframe(0, {
   *       'x': 10,
   *       'y': 20
   *     }).keyframe(1000, {
   *       'x': 20,
   *       'y': 40
   *     }).keyframe(2000, {
   *       'x': 30,
   *       'y': 60
   *     })
   *
   *     // Changes the state of the keyframe at millisecond 1000.
   *     // Modifies the value of 'y' and the easing of 'x.'
   *     actor.modifyKeyframe(1000, {
   *       'y': 150
   *     }, {
   *       'x': 'easeFrom'
   *     });
   *
   * @method rekapi.Actor#modifyKeyframe
   * @param {number} millisecond
   * @param {Object} state
   * @param {Object=} easing
   * @chainable
   */
  modifyKeyframe (millisecond, state, easing = {}) {
    _.each(this._propertyTracks, (propertyTrack, trackName) => {
      const property = this.getKeyframeProperty(trackName, millisecond);

      if (property) {
        property.modifyWith({
          value: state[trackName],
          easing: easing[trackName]
        });
      } else if (state[trackName]) {
        this.addKeyframeProperty(
          new KeyframeProperty(
            millisecond,
            trackName,
            state[trackName],
            easing[trackName]
          )
        );
      }
    });

    cleanupAfterKeyframeModification(this);

    return this;
  }

  /**
   * Remove all `{@link rekapi.KeyframeProperty}`s set
   * on the actor at a given millisecond in the animation.
   *
   * @method rekapi.Actor#removeKeyframe
   * @param {number} millisecond The location on the timeline of the keyframe
   * to remove.
   * @chainable
   */
  removeKeyframe (millisecond) {
    _.each(this._propertyTracks, (propertyTrack, propertyName) => {
      const index = propertyIndexInTrack(propertyTrack, millisecond);

      if (index !== -1) {
        const keyframeProperty = propertyTrack[index];
        this._deleteKeyframePropertyAt(propertyTrack, index);
        keyframeProperty.detach();
      }
    });

    removeEmptyPropertyTracks(this);
    cleanupAfterKeyframeModification(this);
    fire(this, 'timelineModified');

    return this;
  }

  /**
   * Remove all `{@link rekapi.KeyframeProperty}`s set
   * on the actor.
   *
   * **NOTE**: This method does _not_ fire the `beforeRemoveKeyframeProperty`
   * or `removeKeyframePropertyComplete` events.  This method is a bulk
   * operation that is more efficient than calling `{@link
   * rekapi.Actor#removeKeyframeProperty}` many times individually, but
   * foregoes firing events.
   *
   * @method rekapi.Actor#removeAllKeyframes
   * @chainable
   */
  removeAllKeyframes () {
    _.each(this._propertyTracks, propertyTrack =>
      propertyTrack.length = 0
    );

    _.each(this._keyframeProperties, keyframeProperty =>
      keyframeProperty.detach()
    );

    removeEmptyPropertyTracks(this);
    this._keyframeProperties = {};

    // Calling removeKeyframe performs some necessary post-removal cleanup, the
    // earlier part of this method skipped all of that for the sake of
    // efficiency.
    return this.removeKeyframe(0);
  }

  /**
   * @method rekapi.Actor#getKeyframeProperty
   * @param {string} property The name of the property track.
   * @param {number} millisecond The millisecond of the property in the
   * timeline.
   * @return {KeyframeProperty|undefined} A `{@link rekapi.KeyframeProperty}`
   * that is stored on the actor, as specified by the `property` and
   * `millisecond` parameters. This is `undefined` if no properties were found.
   */
  getKeyframeProperty (property, millisecond) {
    const propertyTrack = this._propertyTracks[property];

    return propertyTrack[propertyIndexInTrack(propertyTrack, millisecond)];
  }

  /**
   * Modify a `{@link rekapi.KeyframeProperty}` stored on an actor.
   * Internally, this calls `{@link rekapi.KeyframeProperty#modifyWith}` and
   * then performs some cleanup.
   *
   * @method rekapi.Actor#modifyKeyframeProperty
   * @param {string} property The name of the `{@link rekapi.KeyframeProperty}`
   * to modify.
   * @param {number} millisecond The timeline millisecond of the `{@link
   * rekapi.KeyframeProperty}` to modify.
   * @param {Object} newProperties The properties to augment the `{@link
   * rekapi.KeyframeProperty}` with.
   * @chainable
   */
  modifyKeyframeProperty (property, millisecond, newProperties) {
    const keyframeProperty = this.getKeyframeProperty(property, millisecond);

    if (keyframeProperty) {
      if ('millisecond' in newProperties &&
          this.hasKeyframeAt(newProperties.millisecond, property)
        ) {
        throw new Error(
          `Tried to move ${property} to ${newProperties.millisecond}ms, but a keyframe property already exists there`
        );
      }

      keyframeProperty.modifyWith(newProperties);
      cleanupAfterKeyframeModification(this);
    }

    return this;
  }

  /**
   * Remove a single `{@link rekapi.KeyframeProperty}`
   * from the actor.
   * @method rekapi.Actor#removeKeyframeProperty
   * @param {string} property The name of the `{@link rekapi.KeyframeProperty}`
   * to remove.
   * @param {number} millisecond Where in the timeline the `{@link
   * rekapi.KeyframeProperty}` to remove is.
   * @return {KeyframeProperty|undefined} The removed KeyframeProperty,
   * if one was found.
   */
  removeKeyframeProperty (property, millisecond) {
    const { _propertyTracks } = this;

    if (_propertyTracks[property]) {
      const propertyTrack = _propertyTracks[property];
      const index = propertyIndexInTrack(propertyTrack, millisecond);
      const keyframeProperty = propertyTrack[index];

      fireEvent(this.rekapi, 'beforeRemoveKeyframeProperty', keyframeProperty);
      this._deleteKeyframePropertyAt(propertyTrack, index);
      keyframeProperty.detach();

      removeEmptyPropertyTracks(this);
      cleanupAfterKeyframeModification(this);
      fireEvent(this.rekapi, 'removeKeyframePropertyComplete', keyframeProperty);

      return keyframeProperty;
    }
  }

  /**
   *
   * @method rekapi.Actor#getTrackNames
   * @return {Array(string)} A list of all the track names for an actor.
   */
  getTrackNames () {
    return Object.keys(this._propertyTracks);
  }

  /**
   * Get all of the `{@link rekapi.KeyframeProperty}`s
   * for a track.
   * @method rekapi.Actor#getPropertiesInTrack
   * @param {string} trackName The track name to query.
   * @return {KeyframeProperty[]|undefined}
   */
  getPropertiesInTrack (trackName) {
    const propertyTrack = this._propertyTracks[trackName];

    if (propertyTrack) {
      return propertyTrack.slice(0);
    }
  }

  /**
   * @method rekapi.Actor#getStart
   * @param {string=} opt_trackName Optionally scope the lookup to a particular
   * track.
   * @return {number} The millisecond of the first animating state of an actor
   * (for instance, if the actor's first keyframe is later than millisecond
   * `0`).  If there are no keyframes, this returns `0`.
   */
  getStart (trackName = undefined) {
    const { _propertyTracks } = this;
    const starts = [];

    // Null check to see if trackName was provided and is valid
    if (_propertyTracks.hasOwnProperty(trackName)) {
      const firstKeyframeProperty = _propertyTracks[trackName][0];

      if (firstKeyframeProperty) {
        starts.push(firstKeyframeProperty.millisecond);
      }
    } else {
      // Loop over all property tracks and accumulate the first
      // keyframeProperties from non-empty tracks
      _.each(_propertyTracks, propertyTrack => {
        if (propertyTrack.length) {
          starts.push(propertyTrack[0].millisecond);
        }
      });
    }

    return starts.length > 0 ?
      Math.min.apply(Math, starts) :
      0;
  }

  /**
   * @method rekapi.Actor#getEnd
   * @param {string=} trackName Optionally scope the lookup to a particular
   * keyframe track.
   * @return {number} The millisecond of the last state of an actor (the point
   * in the timeline in which it is done animating).  If there are no
   * keyframes, this is `0`.
   */
  getEnd (trackName = undefined) {
    const endingTracks = [0];

    const tracksToInspect = trackName ?
      { [trackName]: this._propertyTracks[trackName] } :
      this._propertyTracks;

    _.each(tracksToInspect, propertyTrack => {
      if (propertyTrack.length) {
        endingTracks.push(propertyTrack[propertyTrack.length - 1].millisecond);
      }
    });

    return Math.max.apply(Math, endingTracks);
  }

  /**
   * @method rekapi.Actor#getLength
   * @param {string=} trackName Optionally scope the lookup to a particular
   * track.
   * @return {number} The length of time in milliseconds that the actor
   * animates for.
   */
  getLength (trackName = undefined) {
    return this.getEnd(trackName) - this.getStart(trackName);
  }

  /**
   * Extend the last state on this actor's timeline to simulate a pause.
   * Internally, this method copies the final state of the actor in the
   * timeline to the millisecond defined by `until`.
   *
   * @method rekapi.Actor#wait
   * @param {number} until At what point in the animation the Actor should wait
   * until (relative to the start of the animation timeline).  If this number
   * is less than the value returned from `{@link rekapi.Actor#getLength}`,
   * this method does nothing.
   * @chainable
   */
  wait (until) {
    const end = this.getEnd();

    if (until <= end) {
      return this;
    }

    const latestProps = getLatestProperties(this, this.getEnd());
    const serializedProps = {};
    const serializedEasings = {};

    _.each(latestProps, (latestProp, propName) => {
      serializedProps[propName] = latestProp.value;
      serializedEasings[propName] = latestProp.easing;
    });

    this.modifyKeyframe(end, serializedProps, serializedEasings);
    this.keyframe(until, serializedProps, serializedEasings);

    return this;
  }

  /*!
   * Insert a `KeyframeProperty` into a property track at `index`.  The linked
   * list structure of the property track is maintained.
   * @method rekapi.Actor#_insertKeyframePropertyAt
   * @param {KeyframeProperty} keyframeProperty
   * @param {Array(KeyframeProperty)} propertyTrack
   * @param {number} index
   */
  _insertKeyframePropertyAt (keyframeProperty, propertyTrack, index) {
    propertyTrack.splice(index, 0, keyframeProperty);
  }

  /*!
   * Remove the `KeyframeProperty` at `index` from a property track.  The linked
   * list structure of the property track is maintained.  The removed property
   * is not modified or unlinked internally.
   * @method rekapi.Actor#_deleteKeyframePropertyAt
   * @param {Array(KeyframeProperty)} propertyTrack
   * @param {number} index
   */
  _deleteKeyframePropertyAt (propertyTrack, index) {
    propertyTrack.splice(index, 1);
  }

  /**
   * Associate a `{@link rekapi.KeyframeProperty}` to this actor.  Augments the
   * `{@link rekapi.KeyframeProperty}` to maintain a link between the two
   * objects.  This is a lower-level method, and it is generally better to use
   * `{@link rekapi.Actor#keyframe}`.  This is mostly useful for adding a
   * `{@link rekapi.KeyframeProperty}` back to an actor after it was `{@link
   * rekapi.KeyframeProperty#detach}`ed.
   * @method rekapi.Actor#addKeyframeProperty
   * @param {KeyframeProperty} keyframeProperty
   * @chainable
   */
  addKeyframeProperty (keyframeProperty) {
    if (this.rekapi) {
      fireEvent(this.rekapi, 'beforeAddKeyframeProperty', keyframeProperty);
    }

    keyframeProperty.actor = this;
    this._keyframeProperties[keyframeProperty.id] = keyframeProperty;

    const { name } = keyframeProperty;
    const { _propertyTracks, rekapi } = this;

    if (!this._propertyTracks[name]) {
      _propertyTracks[name] = [keyframeProperty];

      if (rekapi) {
        fireEvent(rekapi, 'addKeyframePropertyTrack', keyframeProperty);
      }
    } else {
      const index = insertionPointInTrack(_propertyTracks[name], keyframeProperty.millisecond);

      if (_propertyTracks[name][index]) {
        const newMillisecond = keyframeProperty.millisecond;
        const targetMillisecond = _propertyTracks[name][index].millisecond;

        if (targetMillisecond === newMillisecond) {
          throw new Error(
            `Cannot add duplicate ${name} keyframe property @ ${newMillisecond}ms`
          );
        } else if (rekapi && rekapi._warnOnOutOfOrderKeyframes) {
          console.warn(
            new Error(
              `Added a keyframe property before end of ${name} track @ ${newMillisecond}ms (< ${targetMillisecond}ms)`
            )
          );
        }
      }

      this._insertKeyframePropertyAt(keyframeProperty, _propertyTracks[name], index);
      cleanupAfterKeyframeModification(this);
    }

    if (rekapi) {
      fireEvent(rekapi, 'addKeyframeProperty', keyframeProperty);
    }

    return this;
  }

  /*!
   * TODO: Explain the use case for this method
   * Set the actor to be active or inactive starting at `millisecond`.
   * @method rekapi.Actor#setActive
   * @param {number} millisecond The time at which to change the actor's active state
   * @param {boolean} isActive Whether the actor should be active or inactive
   * @chainable
   */
  setActive (millisecond, isActive) {
    const hasActiveTrack = !!this._propertyTracks._active;
    const activeProperty = hasActiveTrack
        && this.getKeyframeProperty('_active', millisecond);

    if (activeProperty) {
      activeProperty.value = isActive;
    } else {
      this.addKeyframeProperty(
        new KeyframeProperty(millisecond, '_active', isActive)
      );
    }

    return this;
  }

  /*!
   * Calculate and set the actor's position at `millisecond` in the animation.
   * @method rekapi.Actor#_updateState
   * @param {number} millisecond
   * @param {boolean=} resetLaterFnKeyframes If true, allow all function
   * keyframes later in the timeline to be run again.
   * @chainable
   */
  _updateState (millisecond, resetLaterFnKeyframes = false) {
    const start = this.getStart();
    const end = this.getEnd();
    const interpolatedObject = {};

    millisecond = Math.min(end, millisecond);

    ensurePropertyCacheValid(this);

    const propertyCacheEntry =
      _.omit(
        getPropertyCacheEntryForMillisecond(this, millisecond),
        '_millisecond'
      );

    // All actors are active at time 0 unless otherwise specified;
    // make sure a future time deactivation doesn't deactive the actor
    // by default.
    if (propertyCacheEntry._active
        && millisecond >= propertyCacheEntry._active.millisecond) {

      this.wasActive = propertyCacheEntry._active.getValueAt(millisecond);

      if (!this.wasActive) {
        return this;
      }
    } else {
      this.wasActive = true;
    }

    if (start === end) {
      // If there is only one keyframe, use that for the state of the actor
      _.each(propertyCacheEntry, (keyframeProperty, propName) => {
        if (keyframeProperty.shouldInvokeForMillisecond(millisecond)) {
          keyframeProperty.invoke();
          keyframeProperty.hasFired = false;
          return;
        }

        interpolatedObject[propName] = keyframeProperty.value;
      });

    } else {
      _.each(propertyCacheEntry, (keyframeProperty, propName) => {
        if (this._beforeKeyframePropertyInterpolate !== noop) {
          this._beforeKeyframePropertyInterpolate(keyframeProperty);
        }

        if (keyframeProperty.shouldInvokeForMillisecond(millisecond)) {
          keyframeProperty.invoke();
          return;
        }

        interpolatedObject[propName] =
          keyframeProperty.getValueAt(millisecond);

        if (this._afterKeyframePropertyInterpolate !== noop) {
          this._afterKeyframePropertyInterpolate(
            keyframeProperty, interpolatedObject);
        }
      });
    }

    this.set(interpolatedObject);

    if (!resetLaterFnKeyframes) {
      this._resetFnKeyframesFromMillisecond(millisecond);
    }

    return this;
  }

  /*!
   * @method rekapi.Actor#_resetFnKeyframesFromMillisecond
   * @param {number} millisecond
   */
  _resetFnKeyframesFromMillisecond (millisecond) {
    const cache = this._timelineFunctionCache;
    const { length } = cache;
    let index = _.sortedIndex(cache, { millisecond: millisecond }, getMillisecond);

    while (index < length) {
      cache[index++].hasFired = false;
    }
  }

  /**
   * @method rekapi.Actor#exportTimeline
   * @return {Object} A serializable Object of this actor's timeline property
   * tracks and `{@link rekapi.KeyframeProperty}`s.
   */
  exportTimeline () {
    const exportData = {
      start: this.getStart(),
      end: this.getEnd(),
      trackNames: this.getTrackNames(),
      propertyTracks: {}
    };

    _.each(this._propertyTracks, (propertyTrack, trackName) => {
      const track = [];

      _.each(propertyTrack, keyframeProperty => {
        track.push(keyframeProperty.exportPropertyData());
      });

      exportData.propertyTracks[trackName] = track;
    });

    return exportData;
  }

  /**
   * Import an Object to augment this actor's state.  This does not remove
   * keyframe properties before importing new ones.
   *
   * @method rekapi.Actor#importTimeline
   * @param {Object} actorData Any object that has the same data format as the
   * object generated from `{@link rekapi.Actor#exportTimeline}`.
   */
  importTimeline (actorData) {
    _.each(actorData.propertyTracks, propertyTrack => {
      _.each(propertyTrack, property => {
        this.keyframe(
          property.millisecond,
          { [property.name]: property.value },
          property.easing
        );
      });
    });
  }
}

Object.assign(Actor.prototype, {
  /*!
   * @method rekapi.Actor#_beforeKeyframePropertyInterpolate
   * @param {KeyframeProperty} keyframeProperty
   * @abstract
   */
  _beforeKeyframePropertyInterpolate: noop,

  /*!
   * @method rekapi.Actor#_afterKeyframePropertyInterpolate
   * @param {KeyframeProperty} keyframeProperty
   * @param {Object} interpolatedObject
   * @abstract
   */
  _afterKeyframePropertyInterpolate: noop
});
