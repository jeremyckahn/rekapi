var rekapiActor = function (context, _, Tweenable) {

  'use strict';

  var DEFAULT_EASING = 'linear';
  var Kapi = context.Kapi;


  /*!
   * Sorts an array numerically, from smallest to largest.
   * @param {Array} array The Array to sort.
   * @return {Array} The sorted Array.
   */
  function sortNumerically (array) {
    return array.sort(function (a, b) {
      return a - b;
    });
  }


  /*!
   * @param {Kapi.Actor} actor
   * @param {number} millisecond
   * @return {number}
   */
  //TODO:  Oh noes, this is a linear search!  Maybe optimize it?
  function getPropertyCacheIdForMillisecond (actor, millisecond) {
    var list = actor._timelinePropertyCacheIndex;
    var len = list.length;

    var i;
    for (i = 1; i < len; i++) {
      if (list[i] >= millisecond) {
        return (i - 1);
      }
    }

    return -1;
  }


  /*!
   * Order all of an Actor's property tracks so they can be cached.
   * @param {Kapi.Actor} actor
   */
  function sortPropertyTracks (actor) {
    _.each(actor._propertyTracks, function (track, name) {
      actor._propertyTracks[name] = _.sortBy(actor._propertyTracks[name],
        function (keyframeProperty) {
        return keyframeProperty.millisecond;
      });
    });
  }


  /*!
   * Compute and fill all timeline caches.
   * @param {Kapi.Actor} actor
   */
  function cachePropertiesToSegments (actor) {
    _.each(actor._timelinePropertyCaches, function (propertyCache, cacheId) {
      var latestProperties = getLatestPropeties(actor, +cacheId);
      _.defaults(propertyCache, latestProperties);
    });
  }


  /*!
   * Gets all of the current and most recent Kapi.KeyframeProperties for a
   * given millisecond.
   * @param {Kapi.Actor} actor
   * @param {number} forMillisecond
   * @return {Object} An Object containing Kapi.KeyframeProperties
   */
  function getLatestPropeties (actor, forMillisecond) {
    var latestProperties = {};

    _.each(actor._propertyTracks, function (propertyTrack, propertyName) {
      var previousKeyframeProperty = null;

      _.find(propertyTrack, function (keyframeProperty) {
        if (keyframeProperty.millisecond > forMillisecond) {
          latestProperties[propertyName] = previousKeyframeProperty;
        } else if (keyframeProperty.millisecond === forMillisecond) {
          latestProperties[propertyName] = keyframeProperty;
        }

        previousKeyframeProperty = keyframeProperty;
        return !!latestProperties[propertyName];
      });

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
   * Links each KeyframeProperty to the next one in it's respective track.
   *
   * They're linked lists!
   * @param {Kapi.Actor} actor
   */
  function linkTrackedProperties (actor) {
    _.each(actor._propertyTracks, function (propertyTrack, trackName) {
      _.each(propertyTrack, function (trackProperty, i) {
        trackProperty.linkToNext(propertyTrack[i + 1]);
      });
    });
  }


  /*!
   * Returns a requested KeyframeProperty at a millisecond on a specified
   * track.
   * @param {Kapi.Actor} actor
   * @param {string} trackName
   * @param {number} millisecond
   * @return {Kapi.KeyframeProperty}
   */
  function findPropertyAtMillisecondInTrack (actor, trackName, millisecond) {
    return _.find(actor._propertyTracks[trackName],
        function (keyframeProperty) {
      return keyframeProperty.millisecond === millisecond;
    });
  }


  /*!
   * Empty out and re-cache internal KeyframeProperty data.
   * @param {Kapi.Actor}
   */
  function invalidatePropertyCache  (actor) {
    actor._timelinePropertyCaches = {};

    _.each(actor._keyframeProperties, function (keyframeProperty) {
      if (!actor._timelinePropertyCaches[keyframeProperty.millisecond]) {
        actor._timelinePropertyCaches[keyframeProperty.millisecond] = {};
      }

      actor._timelinePropertyCaches[keyframeProperty.millisecond][
          keyframeProperty.name] = keyframeProperty;
    }, actor);

    actor._timelinePropertyCacheIndex = _.keys(actor._timelinePropertyCaches);

    _.each(actor._timelinePropertyCacheIndex, function (listId, i) {
      actor._timelinePropertyCacheIndex[i] = +listId;
    }, actor);

    sortNumerically(actor._timelinePropertyCacheIndex);
    cachePropertiesToSegments(actor);
    linkTrackedProperties(actor);
  }


  /*!
   * Updates internal Kapi and Actor data after a KeyframeProperty
   * modification method is called.
   * @param {Kapi.Actor} actor
   */
  function cleanupAfterKeyframeModification (actor) {
    sortPropertyTracks(actor);
    invalidatePropertyCache(actor);
    recalculateAnimationLength(actor.kapi);
  }


  /**
   * Create a `Kapi.Actor` instance.  Note that the rest of the API docs for `Kapi.Actor` will simply refer to this Object as `Actor`.
   *
   * Valid properties of `opt_config` (you can omit the ones you don't need):
   *
   * - __context__ (_Object_): The context that this Actor is associated with. If omitted, this Actor gets the `Kapi` instance's context when it is added with [`Kapi#addActor`](rekapi.core.js.html#addActor).
   * - __setup__ (_Function_): A function that gets called when the `Actor` is added with [`Kapi#addActor`](rekapi.core.js.html#addActor).
   * - __update__ (_Function(Object, Object)_): A function that gets called every time that the `Actor`'s state is updated. It receives two parameters: A reference to the `Actor`'s context and an Object containing the current state properties.
   * - __teardown__ (_Function_): A function that gets called when the `Actor` is removed with [`Kapi#removeActor`](rekapi.core.js.html#removeActor).
   *
   * `Kapi.Actor` does _not_ render to any context.  It is a base class.  Use the [`Kapi.CanvasActor`](../ext/canvas/rekapi.canvas.actor.js.html) or [`Kapi.DOMActor`](../ext/dom/rekapi.dom.actor.js.html) subclasses to render to the screen.  You can also make your own rendering subclass - see the source code for the aforementioned examples.
   *
   * __[Example](../../../../docs/examples/actor.html)__
   * @param {Object} opt_config
   * @constructor
   */
  Kapi.Actor = function (opt_config)  {

    opt_config = opt_config || {};

    // Steal the `Tweenable` constructor.
    Tweenable.call(this);

    _.extend(this, {
      '_propertyTracks': {}
      ,'_timelinePropertyCaches': {}
      ,'_timelinePropertyCacheIndex': []
      ,'_keyframeProperties': {}
      ,'id': _.uniqueId()
      ,'setup': opt_config.setup || noop
      ,'update': opt_config.update || noop
      ,'teardown': opt_config.teardown || noop
      ,'data': {}
    });

    if (opt_config.context) {
      this.context(opt_config.context);
    }

    return this;
  };
  var Actor = Kapi.Actor;


  // Kind of a fun way to set up an inheritance chain.  `ActorMethods` prevents
  // methods on `Actor.prototype` from polluting `Tweenable`'s prototype with
  // `Actor` specific methods.
  var ActorMethods = function () {};
  ActorMethods.prototype = Tweenable.prototype;
  Actor.prototype = new ActorMethods();
  // But the magic doesn't stop here!  `Actor`'s constructor steals the
  // `Tweenable` constructor.


  /**
   * Get and optionally set the `Actor`'s context.
   *
   * __[Example](../../../../docs/examples/actor_context.html)__
   * @param {Object} opt_context
   * @return {Object}
   */
  Actor.prototype.context = function (opt_context)  {
    if (opt_context) {
      this._context = opt_context;
    }

    return this._context;
  };


  /**
   * Create a keyframe for the `Actor`.  `millisecond` defines where in the animation to place the keyframe, in milliseconds (assumes that `0` is when the animation began).  The animation length will automatically "grow" to accommodate any keyframe position.
   *
   * `properties` should contain all of the properties that define the keyframe's state.  These properties can be any value that can be tweened by [Shifty](https://github.com/jeremyckahn/shifty) (numbers, color strings, CSS properties).
   *
   * __Note:__ Internally, this creates [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s and places them on a "track."  These [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s are managed for you by the `Actor` APIs.
   *
   * ## Easing
   *
   * `opt_easing`, if specified, can be a string or an Object.  If it's a string, all properties in `properties` will have the same easing formula applied to them. For example:
   *
   * ```javascript
   * actor.keyframe(1000, {
   *     'x': 100,
   *     'y': 100
   *   }, 'easeOutSine');
   * ```
   *
   * Both `x` and `y` will have `easeOutSine` applied to them.  You can also specify multiple easing formulas with an Object:
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
   * Keyframes always inherit missing properties from the keyframes that came before them.  For example:
   *
   * ```javascript
   * actor.keyframe(0, {
   *   'x': 100
   * }).keyframe(1000{
   *   // Inheriting the `x` from above!
   *   'y': 50
   * });
   * ```
   *
Keyframe `1000` will have a `y` of `50`, and an `x` of `100`, because `x` was inherited from keyframe `0`.
   * @param {number} millisecond Where on the timeline to set the keyframe.
   * @param {Object} properties Keyframe properties to set for the keyframe.
   * @param {string|Object} opt_easing Optional easing string or configuration object.
   * @return {Kapi.Actor}
   */
  Actor.prototype.keyframe = function keyframe (
      millisecond, properties, opt_easing)  {

    var originalEasingString;

    // TODO:  The opt_easing logic seems way overcomplicated, it's probably out
    // of date.  Multiple eases landed first in Rekapi, then were pushed
    // upstream into Shifty.  There's likely some redundant logic here.
    opt_easing = opt_easing || DEFAULT_EASING;

    if (typeof opt_easing === 'string') {
      originalEasingString = opt_easing;
      opt_easing = {};
      _.each(properties, function (property, propertyName) {
        opt_easing[propertyName] = originalEasingString;
      });
    }

    // If `opt_easing` was passed as an Object, this will fill in any missing
    // opt_easing properties with the default equation.
    _.each(properties, function (property, propertyName) {
      opt_easing[propertyName] = opt_easing[propertyName] || DEFAULT_EASING;
    });

    _.each(properties, function (value, name) {
      var newKeyframeProperty = new Kapi.KeyframeProperty(
          this, millisecond, name, value, opt_easing[name]);

      this._keyframeProperties[newKeyframeProperty.id] = newKeyframeProperty;

      if (!this._propertyTracks[name]) {
        this._propertyTracks[name] = [];
      }

      this._propertyTracks[name].push(newKeyframeProperty);
      sortPropertyTracks(this);
    }, this);

    if (this.kapi) {
      recalculateAnimationLength(this.kapi);
    }

    invalidatePropertyCache(this);

    return this;
  };


  /**
   * Gets the [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html) from an `Actor`'s [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html) track. Returns `undefined` if there were no properties found with the specified parameters.
   *
   * __[Example](../../../../docs/examples/actor_get_keyframe_property.html)__
   * @param {string} property The name of the property.
   * @param {number} index The 0-based index of the KeyframeProperty in the Actor's KeyframeProperty track.
   * @return {Kapi.KeyframeProperty|undefined}
   */
  Actor.prototype.getKeyframeProperty = function (property, index)  {
    if (this._propertyTracks[property]
        && this._propertyTracks[property][index]) {
      return this._propertyTracks[property][index];
    }
  };


  /**
   * Modify a specified [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html) stored on an `Actor`.  Essentially, this calls [`KeyframeProperty#modifyWith`](rekapi.keyframeprops.js.html#modifyWith) (passing along `newProperties`) and then performs some cleanup.
   *
   * __[Example](../../../../docs/examples/actor_modify_keyframe_property.html)__
   * @param {string} property The name of the property to modify
   * @param {number} index The property track index of the KeyframeProperty to modify
   * @param {Object} newProperties The properties to augment the KeyframeProperty with
   * @return {Kapi.Actor}
   */
  Actor.prototype.modifyKeyframeProperty = function (
      property, index, newProperties)  {

    if (this._propertyTracks[property]
        && this._propertyTracks[property][index]) {
      this._propertyTracks[property][index].modifyWith(newProperties);
    }

    cleanupAfterKeyframeModification(this);

    return this;
  };


  /**
   * Get a list of all the track names for an `Actor`.
   *
   * __[Example](../../../../docs/examples/actor_get_track_names.html)__
   * @return {Array.<string>}
   */
  Actor.prototype.getTrackNames = function ()  {
    return _.keys(this._propertyTracks);
  };


  /**
   * Get the property track length for an `Actor` (how many `KeyframeProperty`s are in a given property track).
   *
   * __[Example](../../../../docs/examples/actor_get_track_length.html)__
   * @param {string} trackName
   * @return {number}
   */
  Actor.prototype.getTrackLength = function (trackName)  {
    if (!this._propertyTracks[trackName]) {
      return;
    }

    return this._propertyTracks[trackName].length;
  };


  /**
   * Copy all of the properties that at one point in the timeline to another point. This is useful for many things, particularly for bringing a `Kapi.Actor` back to its original position.
   *
   * __[Example](../../../../docs/examples/actor_copy_properties.html)__
   * @param {number} copyTo The millisecond to copy KeyframeProperties to
   * @param {number} copyFrom The millisecond to copy KeyframeProperties from
   * @return {Kapi.Actor}
   */
  Actor.prototype.copyProperties = function (copyTo, copyFrom)  {
    var sourcePositions = {};
    var sourceEasings = {};

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var foundProperty = findPropertyAtMillisecondInTrack(this, trackName,
          copyFrom);

      if (foundProperty) {
        sourcePositions[trackName] = foundProperty.value;
        sourceEasings[trackName] = foundProperty.easing;
      }
    }, this);

    this.keyframe(copyTo, sourcePositions, sourceEasings);
    return this;
  };


  /**
   * Extend the last state on this `Actor`'s timeline to create a animation wait. The state does not change during this time.
   *
   * __[Example](../../../../docs/examples/actor_wait.html)__
   * @param {number} until At what point in the animation the Actor should wait until (relative to the start of the animation)
   * @return {Kapi.Actor}
   */
  Actor.prototype.wait = function (until)  {
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


  /**
   * Get the millisecond of the first state of an `Actor` (when it first starts animating).  You can get the start time of a specific track with `opt_trackName`.
   *
   * __[Example](../../../../docs/examples/actor_get_start.html)__
   * @param {string} opt_trackName
   * @return {number}
   */
  Actor.prototype.getStart = function (opt_trackName)  {
    var starts = [];

    if (opt_trackName) {
      starts.push(this._propertyTracks[opt_trackName][0].millisecond);
    } else {
      _.each(this._propertyTracks, function (propertyTrack) {
        if (propertyTrack.length) {
          starts.push(propertyTrack[0].millisecond);
        }
      });
    }

    if (starts.length === 0) {
      starts = [0];
    }

    return Math.min.apply(Math, starts);
  };


  /**
   * Get the millisecond of the last state of an `Actor` (when it is done animating).  You can get the last state for a specific track with `opt_trackName`.
   *
   * __[Example](../../../../docs/examples/actor_get_end.html)__
   * @param {string} opt_trackName
   * @return {number}
   */
  Actor.prototype.getEnd = function (opt_trackName)  {
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
   * Get the length of time in milliseconds that an `Actor` animates for.  You can get the length of time that a specific track animates for with `opt_trackName`.
   *
   * __[Example](../../../../docs/examples/actor_get_length.html)__
   * @param {string} opt_trackName
   * @return {number}
   */
  Actor.prototype.getLength = function (opt_trackName)  {
    return this.getEnd(opt_trackName) - this.getStart(opt_trackName);
  };


  /*
   * Determines if an actor has a keyframe set at a given millisecond.  Can optionally scope the lookup to a specific property name.
   *
   * @param {number} millisecond Point on the timeline to query.
   * @param {string} opt_trackName Optional name of a property track.
   * @return {boolean}
   */
  Actor.prototype.hasKeyframeAt = function(millisecond, opt_trackName)  {
    var tracks = this._propertyTracks;

    if (opt_trackName) {
      if (!_.has(tracks, opt_trackName)) {
        return false;
      }
      tracks = _.pick(tracks, opt_trackName);
    }

    return _.find(tracks, function (propertyTrack, trackName) {
      var retrievedProperty =
          findPropertyAtMillisecondInTrack(this, trackName, millisecond);
      return retrievedProperty !== undefined;
    }, this) !== undefined;
  };


  /**
   * Moves a Keyframe from one point on the timeline to another.  Although this method does error checking for you to make sure the operation can be safely performed, an effective pattern is to use [`hasKeyframeAt`](#hasKeyframeAt) to see if there is already a keyframe at the requested `to` destination.
   *
   * __[Example](../../../../docs/examples/actor_move_keyframe.html)__
   * @param {number} from The millisecond of the keyframe to be moved.
   * @param {number} to The millisecond of where the keyframe should be moved to.
   * @return {boolean} Whether or not the keyframe was successfully moved.
   */
  Actor.prototype.moveKeyframe = function (from, to)  {
    if (!this.hasKeyframeAt(from) || this.hasKeyframeAt(to)) {
      return false;
    }

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var property = findPropertyAtMillisecondInTrack(this, trackName, from);

      if (property) {
        property.modifyWith({
          'millisecond': to
        });
      }
    }, this);

    cleanupAfterKeyframeModification(this);

    return true;
  };


  /**
   * Augment the `value` or `easing` of the [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s at a given millisecond.  Any [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s omitted in `stateModification` or `opt_easing` are not modified.  Here's how you might use it:
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
   * @param {Object} opt_easingModification
   * @return {Kapi.Actor}
   */
  Actor.prototype.modifyKeyframe = function (
      millisecond, stateModification, opt_easingModification)  {
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

    return this;
  };


  /**
   * Remove all [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s at a given millisecond in the animation.
   *
   * __[Example](../../../../docs/examples/actor_remove_keyframe.html)__
   * @param {number} millisecond The location on the timeline of the keyframe to remove.
   * @return {Kapi.Actor}
   */
  Actor.prototype.removeKeyframe = function (millisecond)  {
    _.each(this._propertyTracks, function (propertyTrack, propertyName) {
      var i = -1;
      var foundProperty = false;

      _.find(propertyTrack, function (keyframeProperty) {
        i++;
        foundProperty = (millisecond === keyframeProperty.millisecond);
        return foundProperty;
      });

      if (foundProperty) {
        var removedProperty = propertyTrack.splice(i, 1)[0];

        if (removedProperty) {
          delete this._keyframeProperties[removedProperty.id];
        }
      }
    }, this);

    if (this.kapi) {
      recalculateAnimationLength(this.kapi);
    }

    invalidatePropertyCache(this);

    return this;
  };


  /**
   * Remove all `KeyframeProperty`s set on the `Actor`.
   *
   * __[Example](../../../../docs/examples/actor_remove_all_keyframe_properties.html)__
   * @return {Kapi.Actor}
   */
  Actor.prototype.removeAllKeyframeProperties = function ()  {
    _.each(this._propertyTracks, function (propertyTrack, propertyName) {
      propertyTrack.length = 0;
    }, this);

    this._keyframeProperties = {};
    return this.removeKeyframe(0);
  };


  /**
   * Calculate and set the `Actor`'s position at `millisecond` in the animation.
   *
   * __[Example](../../../../docs/examples/actor_update_state.html)__
   * @param {number} millisecond
   * @return {Kapi.Actor}
   */
  Actor.prototype.updateState = function (millisecond)  {
    var startMs = this.getStart();
    var endMs = this.getEnd();

    millisecond = Math.min(endMs, millisecond);

    if (startMs <= millisecond) {
      var latestCacheId = getPropertyCacheIdForMillisecond(this, millisecond);
      var propertiesToInterpolate =
          this._timelinePropertyCaches[this._timelinePropertyCacheIndex[
          latestCacheId]];
      var interpolatedObject = {};

      _.each(propertiesToInterpolate, function (keyframeProperty, propName) {
        if (keyframeProperty) {
          interpolatedObject[propName] =
              keyframeProperty.getValueAt(millisecond);
        }
      });

      this.set(interpolatedObject);
    }

    return this;
  };


  /**
   * Export a serializable `Object` of this `Actor`'s timeline property tracks and [`Kapi.KeyframeProperty`](rekapi.keyframeprops.js.html)s.
   *
   * __[Example](../../../../docs/examples/actor_export_timeline.html)__
   * @return {Object}
   */
  Actor.prototype.exportTimeline = function ()  {
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

};
