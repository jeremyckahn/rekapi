var rekapiActor = function (context, _, Tweenable) {

  'use strict';

  var DEFAULT_EASING = 'linear';
  var Kapi = context.Kapi;


  /**
   * Sorts an array numerically, from smallest to largest.
   * @param {Array} array The Array to sort.
   * @return {Array} The sorted Array.
   */
  function sortNumerically (array) {
    return array.sort(function (a, b) {
      return a - b;
    });
  }


  /**
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


  /**
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


  /**
   * Compute and fill all timeline caches.
   * @param {Kapi.Actor} actor
   */
  function cachePropertiesToSegments (actor) {
    _.each(actor._timelinePropertyCaches, function (propertyCache, cacheId) {
      var latestProperties = getLatestPropeties(actor, +cacheId);
      _.defaults(propertyCache, latestProperties);
    });
  }


  /**
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


  /**
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


  /**
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


  /**
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


  /**
   * @param {Object} opt_config
   * @constructor
   */
  var Actor = Kapi.Actor = function (opt_config) {

    opt_config = opt_config || {};

    // Steal the `Tweenable` constructor.
    Tweenable.call(this);

    _.extend(this, {
      '_data': {}
      ,'_propertyTracks': {}
      ,'_timelinePropertyCaches': {}
      ,'_timelinePropertyCacheIndex': []
      ,'_keyframeProperties': {}
      ,'id': _.uniqueId()
      ,'setup': opt_config.setup || noop
      ,'update': opt_config.update || noop
      ,'teardown': opt_config.teardown || noop
    });

    if (opt_config.context) {
      this.context(opt_config.context);
    }

    return this;
  };


  // Kind of a fun way to set up an inheritance chain.  `ActorMethods` prevents
  // methods on `Actor.prototype` from polluting `Tweenable`'s prototype with
  // `Actor` specific methods.
  var ActorMethods = function () {};
  ActorMethods.prototype = Tweenable.prototype;
  Actor.prototype = new ActorMethods();
  // But the magic doesn't stop here!  `Actor`'s constructor steals the
  // `Tweenable` constructor.


  /**
   * @param {Object} opt_context
   * @return {Object}
   */
  Actor.prototype.context = function (opt_context) {
    if (opt_context) {
      this._context = opt_context;
    }

    return this._context;
  };


  /**
   * @param {number} when
   * @param {Object} position
   * @param {string|Object} easing
   * @return {Kapi.Actor}
   */
  Actor.prototype.keyframe = function keyframe (when, position, opt_easing) {
    var originalEasingString;

    // TODO:  The opt_easing logic seems way overcomplicated, it's probably out
    // of date.  Multiple eases landed first in Rekapi, then were pushed
    // upstream into Shifty.  There's likely some redundant logic here.
    opt_easing = opt_easing || DEFAULT_EASING;

    if (typeof opt_easing === 'string') {
      originalEasingString = opt_easing;
      opt_easing = {};
      _.each(position, function (positionVal, positionName) {
        opt_easing[positionName] = originalEasingString;
      });
    }

    // If `opt_easing` was passed as an Object, this will fill in any missing
    // opt_easing properties with the default equation.
    _.each(position, function (positionVal, positionName) {
      opt_easing[positionName] = opt_easing[positionName] || DEFAULT_EASING;
    });

    _.each(position, function (value, name) {
      var newKeyframeProperty = new Kapi.KeyframeProperty(this, when, name, value,
          opt_easing[name]);
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
   * @param {string} property
   * @param {number} index
   * @return {Kapi.KeyframeProperty|undefined}
   */
  Actor.prototype.getKeyframeProperty = function (property, index) {
    if (this._propertyTracks[property]
        && this._propertyTracks[property][index]) {
      return this._propertyTracks[property][index];
    }
  };


  /**
   * @param {string} property
   * @param {number} index
   * @param {Object} newProperties
   * @return {Kapi.Actor}
   */
  Actor.prototype.modifyKeyframeProperty = function (property, index,
      newProperties) {
    if (this._propertyTracks[property]
        && this._propertyTracks[property][index]) {
      this._propertyTracks[property][index].modifyWith(newProperties);
    }

    sortPropertyTracks(this);
    invalidatePropertyCache(this);
    recalculateAnimationLength(this.kapi);
    return this;
  };


  /**
   * @return {Array}
   */
  Actor.prototype.getTrackNames = function () {
    return _.keys(this._propertyTracks);
  };


  /**
   * @param {string} trackName
   * @return {number}
   */
  Actor.prototype.getTrackLength = function (trackName) {
    if (!this._propertyTracks[trackName]) {
      return;
    }

    return this._propertyTracks[trackName].length;
  };


  /**
   * @param {number} copyTo
   * @param {number} copyFrom
   * @return {Kapi.Actor}
   */
  Actor.prototype.copyProperties = function (copyTo, copyFrom) {
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
   * @param {number} until
   * @return {Kapi.Actor}
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


  /**
   * @param {string} opt_trackName
   * @return {number}
   */
  Actor.prototype.getStart = function (opt_trackName) {
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
   * @param {string} opt_trackName
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
   * @param {string} opt_trackName
   * @return {number}
   */
  Actor.prototype.getLength = function (opt_trackName) {
    return this.getEnd(opt_trackName) - this.getStart(opt_trackName);
  };


  /*
   * Determines if an actor has a keyframe set at a given millisecond.
   * Can optionally look for an existing keyframe on a single property track.
   *
   * @param {number} when Millisecond
   * @param {string} opt_trackName Optional name of a property track
   * @return {boolean}
   */
  Actor.prototype.hasKeyframeAt = function(when, opt_trackName) {
    var tracks = this._propertyTracks;

    if (opt_trackName) {
      if (!_.has(tracks, opt_trackName)) {
        return false;
      }
      tracks = _.pick(tracks, opt_trackName);
    }

    return _.find(tracks, function (propertyTrack, trackName) {
      var retrievedProperty =
          findPropertyAtMillisecondInTrack(this, trackName, when);
      return retrievedProperty !== undefined;
    }, this) !== undefined;
  };


  /**
   * @param {number} when
   * @param {Object} stateModification
   * @param {Object} opt_easingModification
   * @return {Kapi.Actor}
   */
  Actor.prototype.modifyKeyframe = function (when, stateModification,
      opt_easingModification) {

    opt_easingModification = opt_easingModification || {};

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var property = findPropertyAtMillisecondInTrack(this, trackName, when);

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
   * @param {when} when
   * @return {Kapi.Actor}
   */
  Actor.prototype.removeKeyframe = function (when) {
    _.each(this._propertyTracks, function (propertyTrack, propertyName) {
      var i = -1;
      var foundProperty = false;

      _.find(propertyTrack, function (keyframeProperty) {
        i++;
        foundProperty = (when === keyframeProperty.millisecond);
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
   * @return {Kapi.Actor}
   */
  Actor.prototype.removeAllKeyframeProperties = function () {
    _.each(this._propertyTracks, function (propertyTrack, propertyName) {
      propertyTrack.length = 0;
    }, this);

    this._keyframeProperties = {};
    return this.removeKeyframe(0);
  };


  /**
   * @param {number} millisecond
   * @return {Kapi.Actor}
   */
  Actor.prototype.updateState = function (millisecond) {
    var startMs = this.getStart();
    var endMs = this.getEnd();

    if (startMs <= millisecond && millisecond <= endMs) {
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
   * @param {Object} opt_newData
   * @return {Object}
   */
  Actor.prototype.data = function (opt_newData) {
    if (opt_newData) {
      this._data = opt_newData;
    }

    return this._data;
  };


  /**
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

};
