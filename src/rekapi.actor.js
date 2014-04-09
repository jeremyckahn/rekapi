rekapiModules.push(function (context) {

  'use strict';

  var DEFAULT_EASING = 'linear';
  var Rekapi = context.Rekapi;
  var Tweenable = Rekapi.Tweenable;
  var _ = Rekapi._;

  /*!
   * Sorts an array numerically, from smallest to largest.
   * @param {Array.<number>} array The Array to sort.
   * @return {Array.<number>} The sorted Array.
   */
  function sortNumerically (array) {
    return array.sort(function (a, b) {
      return a - b;
    });
  }

  /*!
   * Retrieves the most recent property cache ID for a given millisecond.
   * @param {Rekapi.Actor} actor
   * @param {number} millisecond
   * @return {number} -1 if there is no property cache for the millisecond
   * (this should never happen).
   */
  function getPropertyCacheIdForMillisecond (actor, millisecond) {
    var list = actor._timelinePropertyCacheKeys;

    var i, len = list.length;

    // If there is only one keyframe, use that
    if (len === 1) {
      return 0;
    }

    //TODO:  Oh noes, this is a linear search!  Maybe optimize it?
    for (i = 1; i < len; i++) {
      if (list[i] >= millisecond) {
        return (i - 1);
      }
    }

    return -1;
  }

  /*!
   * Sort all of an Actor's property tracks so they can be cached.
   * @param {Rekapi.Actor} actor
   */
  function sortPropertyTracks (actor) {
    _.each(actor._propertyTracks, function (track) {
      track.sort(function (current, next) {
        return current.millisecond - next.millisecond;
      });
    });
  }

  /*!
   * Compute and fill all timeline caches.
   * @param {Rekapi.Actor} actor
   */
  function cachePropertiesToSegments (actor) {
    _.each(actor._timelinePropertyCache, function (propertyCache, cacheId) {
      var latestProperties = getLatestPropeties(actor, cacheId);
      _.defaults(propertyCache, latestProperties);
    });
  }

  /*!
   * Gets all of the current and most recent Rekapi.KeyframeProperties for a
   * given millisecond.
   * @param {Rekapi.Actor} actor
   * @param {number} forMillisecond
   * @return {Object} An Object containing Rekapi.KeyframeProperties
   */
  function getLatestPropeties (actor, forMillisecond) {
    var latestProperties = {};

    _.each(actor._propertyTracks, function (propertyTrack, propertyName) {
      var previousKeyframeProperty = propertyTrack[0] || null;
      var i = 0, len = propertyTrack.length, keyframeProperty;

      for (i; i < len; i++) {
        keyframeProperty = propertyTrack[i];

        if (keyframeProperty.millisecond > forMillisecond) {
          // We went to far, use the previous keyframeProperty
          latestProperties[propertyName] = previousKeyframeProperty;
        } else if (keyframeProperty.millisecond === forMillisecond) {
          // Found it!
          latestProperties[propertyName] = keyframeProperty;
        }

        previousKeyframeProperty = keyframeProperty;

        // Quit the loop if something was found.  We can't early-return above,
        // because latestProperties[propertyName] might be null, which is not
        // what we want.
        if (latestProperties[propertyName]) {
          break;
        }
      }

      // If nothing was found, attempt to use the last keyframeProperty in the
      // track.
      if (!latestProperties[propertyName]) {
        var lastProp = _.last(propertyTrack);

        if (lastProp && lastProp.millisecond <= forMillisecond) {
          latestProperties[propertyName] = lastProp;
        }
      }
    });

    return latestProperties;
  }

  /*!
   * Links each KeyframeProperty to the next one in its respective track.
   *
   * They're linked lists!
   * @param {Rekapi.Actor} actor
   */
  function linkTrackedProperties (actor) {
    _.each(actor._propertyTracks, function (propertyTrack) {
      _.each(propertyTrack, function (keyframeProperty, i) {
        keyframeProperty.linkToNext(propertyTrack[i + 1]);
      });
    });
  }

  /*!
   * Returns a requested KeyframeProperty at a millisecond on a specified
   * track.
   * @param {Rekapi.Actor} actor
   * @param {string} trackName
   * @param {number} millisecond
   * @return {Rekapi.KeyframeProperty|undefined}
   */
  function findPropertyAtMillisecondInTrack (actor, trackName, millisecond) {
    return _.findWhere(actor._propertyTracks[trackName], {
        millisecond: millisecond
      });
  }

  /*!
   * Empty out and rebuild the cache of internal KeyframeProperty data.
   * @param {Rekapi.Actor}
   */
  function invalidatePropertyCache (actor) {
    actor._timelinePropertyCache = {};
    var timelinePropertyCache = actor._timelinePropertyCache;

    // Build the cache map
    var millisecond;
    _.each(actor._keyframeProperties, function (keyframeProperty) {
      millisecond = keyframeProperty.millisecond;
      if (!timelinePropertyCache[millisecond]) {
        timelinePropertyCache[millisecond] = {};
      }

      timelinePropertyCache[millisecond][keyframeProperty.name]
          = keyframeProperty;
    });

    actor._timelinePropertyCacheKeys = _.map(timelinePropertyCache,
        function (val, key) {
      return +key;
    });

    // Optimize the cache lookup
    sortNumerically(actor._timelinePropertyCacheKeys);

    // Associate cache map elements to their respective points on the timeline
    cachePropertiesToSegments(actor);

    // Re-link the linked list of keyframeProperties
    linkTrackedProperties(actor);

    if (actor.rekapi) {
      fireEvent(actor.rekapi, 'timelineModified', _);
    }
  }

  /*!
   * Updates internal Rekapi and Actor data after a KeyframeProperty
   * modification method is called.
   *
   * TODO: This should be moved to core.
   *
   * @param {Rekapi.Actor} actor
   */
  function cleanupAfterKeyframeModification (actor) {
    sortPropertyTracks(actor);
    invalidatePropertyCache(actor);
    recalculateAnimationLength(actor.rekapi, _);
  }

  /**
   * An actor represents an individual component of an animation.  An animation may have one or many actors.
   *
   * Valid properties of `opt_config` (you can omit the ones you don't need):
   *
   * - __context__ (_Object|CanvasRenderingContext2D|HTMLElement_): The rendering context for this actor. If omitted, this Actor gets the parent [`Rekapi`](rekapi.core.js.html#Rekapi) instance's `context` when it is added with [`Rekapi#addActor`](rekapi.core.js.html#addActor).
   * - __setup__ (_Function_): A function that gets called when the actor is added to an animation with [`Rekapi#addActor`](rekapi.core.js.html#addActor).
   * - __render__ (_Function(Object, Object)_): A function that gets called every time the actor's state is updated (once every frame). This function should do something meaningful with state of the actor (for example, visually rendering to the screen).  This function receives two parameters: The first is a reference to the actor's `context` and the second is an Object containing the current state properties.
   * - __teardown__ (_Function_): A function that gets called when the actor is removed from an animation with [`Rekapi#removeActor`](rekapi.core.js.html#removeActor).
   * @param {Object=} opt_config
   * @constructor
   */
  Rekapi.Actor = function (opt_config) {

    opt_config = opt_config || {};

    // Steal the `Tweenable` constructor.
    Tweenable.call(this);

    _.extend(this, {
      '_propertyTracks': {}
      ,'_timelinePropertyCache': {}
      ,'_timelinePropertyCacheKeys': []
      ,'_keyframeProperties': {}
      ,'id': _.uniqueId()
      ,'context': opt_config.context // This may be undefined
      ,'setup': opt_config.setup || noop
      ,'render': opt_config.render || noop
      ,'teardown': opt_config.teardown || noop
      ,'data': {}
    });

    return this;
  };
  var Actor = Rekapi.Actor;

  // Kind of a fun way to set up an inheritance chain.  `ActorMethods` prevents
  // methods on `Actor.prototype` from polluting `Tweenable`'s prototype with
  // `Actor` specific methods.
  var ActorMethods = function () {};
  ActorMethods.prototype = Tweenable.prototype;
  Actor.prototype = new ActorMethods();
  // But the magic doesn't stop here!  `Actor`'s constructor steals the
  // `Tweenable` constructor.

  /**
   * Create a keyframe for the actor.  `millisecond` defines where in the animation's timeline to place the keyframe.  The animation timeline begins at `0`.  The timeline's length will automatically "grow" to accommodate new keyframes as they are added.
   *
   * `properties` should contain all of the properties that define this keyframe's state.  These properties can be any value that can be tweened by [Shifty](https://github.com/jeremyckahn/shifty) (numbers, RGB/hexadecimal color strings, and CSS property strings).
   *
   * __Note:__ Internally, this creates [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html)s and places them on a "track."  These [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html)s are managed for you by the [`Rekapi.Actor`](#Actor) APIs.
   *
   * ## Easing
   *
   * `opt_easing`, if provided, can be a string or an Object.  If it's a string, all `properties` will have the same easing curve applied to them. For example:
   *
   * ```javascript
   * actor.keyframe(1000, {
   *     'x': 100,
   *     'y': 100
   *   }, 'easeOutSine');
   * ```
   *
   * Both `x` and `y` will have `easeOutSine` applied to them.  You can also specify multiple easing curves with an Object:
   *
   * ```javascript
   * actor.keyframe(1000, {
   *     'x': 100,
   *     'y': 100
   *   }, {
   *     'x': 'easeinSine',
   *     'y': 'easeOutSine'
   *   });
   * ```
   *
   * `x` will ease with `easeInSine`, and `y` will ease with `easeOutSine`.  Any unspecified properties will ease with `linear`.  If `opt_easing` is omitted, all properties will default to `linear`.
   *
   * ## Keyframe inheritance
   *
   * Keyframes always inherit missing properties from the previous keyframe.  For example:
   *
   * ```javascript
   * actor.keyframe(0, {
   *   'x': 100
   * }).keyframe(1000{
   *   // Inherits the `x: 100` from above
   *   'y': 50
   * });
   * ```
   *
   * Keyframe `1000` will have a `y` of `50`, and an `x` of `100`, because `x` was inherited from keyframe `0`.
   * @param {number} millisecond Where on the timeline to set the keyframe.
   * @param {Object} properties The state properties of the keyframe.
   * @param {string|Object=} opt_easing Optional easing string or Object.
   * @return {Rekapi.Actor}
   */
  Actor.prototype.keyframe = function keyframe (
      millisecond, properties, opt_easing) {

    opt_easing = opt_easing || DEFAULT_EASING;
    var easing = Tweenable.composeEasingObject(properties, opt_easing);

    // Create and add all of the KeyframeProperties
    _.each(properties, function (value, name) {
      var newKeyframeProperty = new Rekapi.KeyframeProperty(
          millisecond, name, value, easing[name]);

      this._addKeyframeProperty(newKeyframeProperty);
    }, this);

    if (this.rekapi) {
      recalculateAnimationLength(this.rekapi, _);
    }

    invalidatePropertyCache(this);

    return this;
  };

  /**
   * Determines if an actor has any properties of a keyframe set at a given millisecond.  You can scope this and determine if a property exists on a particular track with `opt_trackName`.
   *
   * @param {number} millisecond Point on the timeline to query.
   * @param {string=} opt_trackName Optional name of a property track.
   * @return {boolean}
   */
  Actor.prototype.hasKeyframeAt = function(millisecond, opt_trackName) {
    var tracks = this._propertyTracks;

    if (opt_trackName) {
      if (!_.has(tracks, opt_trackName)) {
        return false;
      }
      tracks = _.pick(tracks, opt_trackName);
    }

    // Search through the tracks and determine if a property can be found.
    var track;
    for (track in tracks) {
      if (tracks.hasOwnProperty(track)
          && findPropertyAtMillisecondInTrack(this, track, millisecond)) {
        return true;
      }
    }

    return false;
  };

  /**
   * Copies all of the [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html)s from one point on the actor's timeline to another. This is particularly useful for animating an actor back to its original position.
   *
   * ```
   * actor
   *   .keyframe(0, {
   *     x: 10,
   *     y: 15
   *   }).keyframe(1000, {
   *     x: 50,
   *     y: 75
   *   });
   *
   * // Return the actor to its original position
   * actor.copyFrom(2000, 0);
   * ```
   *
   * __[Example](../../../../docs/examples/actor_copy_keyframe.html)__
   * @param {number} copyTo The timeline millisecond to copy KeyframeProperties to.
   * @param {number} copyFrom The timeline millisecond to copy KeyframeProperties from.
   * @return {Rekapi.Actor}
   */
  Actor.prototype.copyKeyframe = function (copyTo, copyFrom) {
    // Build the configuation objects to be passed to Actor#keyframe
    var sourcePositions = {};
    var sourceEasings = {};

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var keyframeProperty =
          findPropertyAtMillisecondInTrack(this, trackName, copyFrom);

      if (keyframeProperty) {
        sourcePositions[trackName] = keyframeProperty.value;
        sourceEasings[trackName] = keyframeProperty.easing;
      }
    }, this);

    this.keyframe(copyTo, sourcePositions, sourceEasings);
    return this;
  };

  /**
   * Moves all of the [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html)s from one point on the actor's timeline to another.  Although this method does error checking for you to make sure the operation can be safely performed, an effective pattern is to use [`hasKeyframeAt`](#hasKeyframeAt) to see if there is already a keyframe at the requested `to` destination.
   *
   * __[Example](../../../../docs/examples/actor_move_keyframe.html)__
   * @param {number} from The millisecond of the keyframe to be moved.
   * @param {number} to The millisecond of where the keyframe should be moved to.
   * @return {boolean} Whether or not the keyframe was successfully moved.
   */
  Actor.prototype.moveKeyframe = function (from, to) {
    if (!this.hasKeyframeAt(from) || this.hasKeyframeAt(to)) {
      return false;
    }

    // Move each of the relevant KeyframeProperties to the new location in the
    // timeline
    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var property = findPropertyAtMillisecondInTrack(this, trackName, from);

      if (property) {
        property.millisecond = to;
      }
    }, this);

    cleanupAfterKeyframeModification(this);

    return true;
  };

  /**
   * Augment the `value` or `easing` of the [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html)s at a given millisecond.  Any [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html)s omitted in `stateModification` or `opt_easing` are not modified.  Here's how you might use it:
   *
   * ```javascript
   * actor.keyframe(0, {
   *   'x': 10,
   *   'y': 20
   * }).keyframe(1000, {
   *   'x': 20,
   *   'y': 40
   * }).keyframe(2000, {
   *   'x': 30,
   *   'y': 60
   * })
   *
   * // Changes the state of the keyframe at millisecond 1000.
   * // Modifies the value of 'y' and the easing of 'x.'
   * actor.modifyKeyframe(1000, {
   *   'y': 150
   * }, {
   *   'x': 'easeFrom'
   * });
   * ```
   *
   * __[Example](../../../../docs/examples/actor_modify_keyframe.html)__
   * @param {number} millisecond
   * @param {Object} stateModification
   * @param {Object=} opt_easingModification
   * @return {Rekapi.Actor}
   */
  Actor.prototype.modifyKeyframe = function (
      millisecond, stateModification, opt_easingModification) {
    opt_easingModification = opt_easingModification || {};

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var property = findPropertyAtMillisecondInTrack(
          this, trackName, millisecond);

      if (property) {
        property.modifyWith({
          'value': stateModification[trackName]
          ,'easing': opt_easingModification[trackName]
        });
      }
    }, this);

    cleanupAfterKeyframeModification(this);

    return this;
  };

  /**
   * Remove all [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html)s at a given millisecond in the animation.
   *
   * __[Example](../../../../docs/examples/actor_remove_keyframe.html)__
   * @param {number} millisecond The location on the timeline of the keyframe to remove.
   * @return {Rekapi.Actor}
   */
  Actor.prototype.removeKeyframe = function (millisecond) {
    var propertyTracks = this._propertyTracks;

    _.each(this._propertyTracks, function (propertyTrack, propertyName) {
      var keyframeProperty = _.findWhere(propertyTrack, { millisecond: millisecond });

      if (keyframeProperty) {
        propertyTracks[propertyName] = _.without(propertyTrack, keyframeProperty);
        keyframeProperty.detach();
      }
    }, this);

    if (this.rekapi) {
      recalculateAnimationLength(this.rekapi, _);
    }

    invalidatePropertyCache(this);

    return this;
  };

  /**
   * Remove all [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html)s set on the actor.
   *
   * __[Example](../../../../docs/examples/actor_remove_all_keyframes.html)__
   * @return {Rekapi.Actor}
   */
  Actor.prototype.removeAllKeyframes = function () {
    _.each(this._propertyTracks, function (propertyTrack) {
      propertyTrack.length = 0;
    });

    _.each(this._keyframeProperties, function (keyframeProperty) {
      keyframeProperty.detach();
    }, this);

    this._keyframeProperties = {};

    // Calling removeKeyframe performs some necessary post-removal cleanup, the
    // earlier part of this method skipped all of that for the sake of
    // efficiency.
    return this.removeKeyframe(0);
  };

  /**
   * Get the [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html) from an actor's property track. Returns `undefined` if no properties were found.
   * @param {string} property The name of the property.
   * @param {number} index The millisecond of the property in the timeline.
   * @return {Rekapi.KeyframeProperty|undefined}
   */
  Actor.prototype.getKeyframeProperty = function (property, millisecond) {
    var propertyTrack = this._propertyTracks[property];
    if (propertyTrack) {
      return _.findWhere(propertyTrack, { millisecond: millisecond });
    }
  };

  /**
   * Modify a [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html) stored on an actor.  This calls [`KeyframeProperty#modifyWith`](rekapi.keyframe-property.js.html#modifyWith) (passing along `newProperties`) and then performs some cleanup.
   *
   * __[Example](../../../../docs/examples/actor_modify_keyframe_property.html)__
   * @param {string} property The name of the property to modify.
   * @param {number} millisecond The timeline millisecond of the KeyframeProperty to modify.
   * @param {Object} newProperties The properties to augment the KeyframeProperty with.
   * @return {Rekapi.Actor}
   */
  Actor.prototype.modifyKeyframeProperty = function (
      property, millisecond, newProperties) {

    var keyframeProperty = this.getKeyframeProperty(property, millisecond);
    if (keyframeProperty) {
      keyframeProperty.modifyWith(newProperties);
      cleanupAfterKeyframeModification(this);
    }

    return this;
  };

  /**
   * Removes a [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html) from the actor.
   * @param {string} property The name of the property to remove.
   * @param {number} millisecond Where in the timeline the property to remove is.
   * @return {Rekapi.KeyframeProperty|undefined} The removed KeyframeProperty, if one was found.
   */
  Actor.prototype.removeKeyframeProperty = function (property, millisecond) {
    var propertyTracks = this._propertyTracks;

    if (typeof propertyTracks[property] !== 'undefined') {
      var keyframeProperty = this.getKeyframeProperty(property, millisecond);
      propertyTracks[property] =
          _.without(propertyTracks[property], keyframeProperty);
      keyframeProperty.detach();

      cleanupAfterKeyframeModification(this);

      return keyframeProperty;
    }
  };

  /**
   * Get a list of all the track names for an actor.
   * @return {Array.<string>}
   */
  Actor.prototype.getTrackNames = function () {
    return _.keys(this._propertyTracks);
  };

  /**
   * Get all of the [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html)s for a track.
   * @param {string} trackName
   * @return {Array.<Rekapi.KeyframeProperty>|undefined}
   */
  Actor.prototype.getPropertiesInTrack = function (trackName) {
    var propertyTrack = this._propertyTracks[trackName];

    if (propertyTrack) {
      return propertyTrack.slice(0);
    }
  };

  /**
   * Get the millisecond of the first animated state of an actor (for instance, if the actor's first keyframe is later than millisecond `0`).  You can scope this and get the start time of a specific track with `opt_trackName`.  If there are no keyframes, this returns `0`.
   * @param {string=} opt_trackName
   * @return {number}
   */
  Actor.prototype.getStart = function (opt_trackName) {
    var starts = [];
    var propertyTracks = this._propertyTracks;

    // Null check to see if opt_trackName was provided and is valid
    if (propertyTracks.hasOwnProperty(opt_trackName)) {
      var firstKeyframeProperty = propertyTracks[opt_trackName][0];

      if (firstKeyframeProperty) {
        starts.push(firstKeyframeProperty.millisecond);
      }
    } else {
      // Loop over all property tracks and accumulate the first
      // keyframeProperties from non-empty tracks
      _.each(propertyTracks, function (propertyTrack) {
        if (propertyTrack.length) {
          starts.push(propertyTrack[0].millisecond);
        }
      });
    }

    if (starts.length === 0) {
      starts = [0];
    }

    var start;
    if (starts.length > 0) {
      start = Math.min.apply(Math, starts);
    } else {
      start = 0;
    }

    return start;
  };

  /**
   * Get the millisecond in the timeline of the last state of an `Actor` (when it is done animating).  You can scope this and get the last state for a specific track with `opt_trackName`.  If there are no keyframes, this returns `0`.
   * @param {string=} opt_trackName
   * @return {number}
   */
  Actor.prototype.getEnd = function (opt_trackName) {
    var latest = 0;
    var tracksToInspect = this._propertyTracks;

    if (opt_trackName) {
      tracksToInspect = {};
      tracksToInspect[opt_trackName] = this._propertyTracks[opt_trackName];
    }

    _.each(tracksToInspect, function (propertyTrack) {
      if (propertyTrack.length) {
        var trackLength = _.last(propertyTrack).millisecond;

        if (trackLength > latest) {
          latest = trackLength;
        }
      }
    }, this);

    return latest;
  };

  /**
   * Get the length of time in milliseconds that an actor animates for.  You can scope this and get the length of time that a specific track animates for with `opt_trackName`.
   * @param {string=} opt_trackName
   * @return {number}
   */
  Actor.prototype.getLength = function (opt_trackName) {
    return this.getEnd(opt_trackName) - this.getStart(opt_trackName);
  };

  /**
   * Extend the last state on this actor's timeline to simulate a pause. The state does not change during this time.
   *
   * __[Example](../../../../docs/examples/actor_wait.html)__
   * @param {number} until At what point in the animation the Actor should wait until (relative to the start of the animation timeline).  If this number is less than the value returned from getLength, this method does nothing.
   * @return {Rekapi.Actor}
   */
  Actor.prototype.wait = function (until) {
    var length = this.getEnd();

    if (until <= length) {
      return this;
    }

    var end = this.getEnd();
    var latestProps = getLatestPropeties(this, this.getEnd());
    var serializedProps = {};
    var serializedEasings = {};

    _.each(latestProps, function (latestProp, propName) {
      serializedProps[propName] = latestProp.value;
      serializedEasings[propName] = latestProp.easing;
    });

    this.removeKeyframe(end);
    this.keyframe(end, serializedProps, serializedEasings);
    this.keyframe(until, serializedProps, serializedEasings);

    return this;
  };

  /*!
   * Associate a `Rekapi.KeyframeProperty` to this actor.  Augments the `Rekapi.KeyframeProperty` to maintain a link between the two objects.
   * @param {Rekapi.KeyframeProperty} keyframeProperty
   * @return {Rekapi.Actor}
   */
  Actor.prototype._addKeyframeProperty = function (keyframeProperty) {
    keyframeProperty.actor = this;
    this._keyframeProperties[keyframeProperty.id] = keyframeProperty;

    var name = keyframeProperty.name;
    var propertyTracks = this._propertyTracks;

    if (typeof this._propertyTracks[name] === 'undefined') {
      propertyTracks[name] = [keyframeProperty];
      if (this.rekapi) {
        fireEvent(this.rekapi, 'addKeyframePropertyTrack', _, keyframeProperty);
      }
    } else {
      propertyTracks[name].push(keyframeProperty);
    }

    sortPropertyTracks(this);

    if (this.rekapi) {
      fireEvent(this.rekapi, 'addKeyframeProperty', _, keyframeProperty);
    }

    return this;
  };

  /*!
   * Calculate and set the actor's position at `millisecond` in the animation.
   * @param {number} millisecond
   * @return {Rekapi.Actor}
   */
  Actor.prototype._updateState = function (millisecond) {
    var startMs = this.getStart();
    var endMs = this.getEnd();
    var interpolatedObject = {};

    millisecond = Math.min(endMs, millisecond);

    var latestCacheId = getPropertyCacheIdForMillisecond(this, millisecond);
    var propertiesToInterpolate =
        this._timelinePropertyCache[this._timelinePropertyCacheKeys[
        latestCacheId]];

    if (startMs === endMs) {

      // If there is only one keyframe, use that for the state of the actor
      _.each(propertiesToInterpolate, function (property, propertyName) {
        interpolatedObject[propertyName] = property.value;
      });

    } else {

      _.each(propertiesToInterpolate, function (keyframeProperty, propName) {
        if (this._beforeKeyframePropertyInterpolate !== noop) {
          this._beforeKeyframePropertyInterpolate(keyframeProperty);
        }

        interpolatedObject[propName] =
            keyframeProperty.getValueAt(millisecond);

        if (this._afterKeyframePropertyInterpolate !== noop) {
          this._afterKeyframePropertyInterpolate(
              keyframeProperty, interpolatedObject);
        }
      }, this);
    }

    this.set(interpolatedObject);

    return this;
  };

  /*!
   * @param {Rekapi.KeyframeProperty} keyframeProperty
   * @abstract
   */
  Actor.prototype._beforeKeyframePropertyInterpolate = noop;

  /*!
   * @param {Rekapi.KeyframeProperty} keyframeProperty
   * @param {Object} interpolatedObject
   * @abstract
   */
  Actor.prototype._afterKeyframePropertyInterpolate = noop;

  /**
   * Export a serializable Object of this actor's timeline property tracks and [`Rekapi.KeyframeProperty`](rekapi.keyframe-property.js.html)s.
   *
   * __[Example](../../../../docs/examples/actor_export_timeline.html)__
   * @return {Object}
   */
  Actor.prototype.exportTimeline = function () {
    var exportData = {
      'start': this.getStart()
      ,'end': this.getEnd()
      ,'trackNames': this.getTrackNames()
      ,'propertyTracks': {}
    };

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var trackAlias = exportData.propertyTracks[trackName] = [];
      _.each(propertyTrack, function (keyframeProperty) {
        trackAlias.push(keyframeProperty.exportPropertyData());
      });
    });

    return exportData;
  };

  /**
   * Import an Object to augment this actor's state.  This does not remove keyframe properties before importing new ones, so this could be used to "merge" keyframes across multiple actors.
   *
   * @param {Object} actorData Any object that has the same data format as the object generated from Actor#exportTimeline.
   */
  Actor.prototype.importTimeline = function (actorData) {
    _.each(actorData.propertyTracks, function (propertyTrack) {
      _.each(propertyTrack, function (property) {
        var obj = {};
        obj[property.name] = property.value;
        this.keyframe(property.millisecond, obj, property.easing);
      }, this);
    }, this);
  };

});
