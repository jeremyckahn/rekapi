var rekapiActor = function (global, deps) {

  var DEFAULT_EASING = 'linear'
      ,gk
      ,actorCount
      ,ActorMethods
      ,_ = (deps && deps.underscore) ? deps.underscore : global._
      ,Tweenable = (deps && deps.Tweenable) ?
          deps.Tweenable : global.Tweenable;

  gk = global.Kapi;
  actorCount = 0;


  function getUniqueActorId () {
    return actorCount++;
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

    for (var i = 1; i < len; i++) {
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
   * Gets all of the current and most recent Kapi.KeyframeProperty's for a
   * given millisecond.
   * @param {Kapi.Actor} actor
   * @param {number} forMillisecond
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
   * @param {Object} opt_config
   * @constructor
   */
  gk.Actor = function Actor (opt_config) {

    opt_config = opt_config || {};

    // Steal the `Tweenable` constructor.
    this.constructor.call(this);

    _.extend(this, {
      '_data': {}
      ,'_propertyTracks': {}
      ,'_timelinePropertyCaches': {}
      ,'_timelinePropertyCacheIndex': []
      ,'_keyframeProperties': {}
      ,'_isShowing': false
      ,'_isPersisting': false
      ,'id': getUniqueActorId()
      ,'setup': opt_config.setup || gk.util.noop
      ,'render': opt_config.render || gk.util.noop
      ,'teardown': opt_config.teardown || gk.util.noop
    });

    if (opt_config.context) {
      this.context(opt_context);
    }

    return this;
  };


  // Kind of a fun way to set up an inheritance chain.  `ActorMethods` prevents
  // methods on `Actor.prototype` from polluting `Tweenable`'s prototype with
  // `Actor` specific methods.
  ActorMethods = function () {};
  ActorMethods.prototype = Tweenable.prototype;
  gk.Actor.prototype = new ActorMethods();
  // But the magic doesn't stop here!  `Actor`'s constructor steals the
  // `Tweenable` constructor.


  /**
   * @param {Object} opt_context
   * @return {Object}
   */
  gk.Actor.prototype.context = function (opt_context) {
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
  gk.Actor.prototype.keyframe = function keyframe (when, position,
      opt_easing) {
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
      var newKeyframeProperty;

      newKeyframeProperty = new gk.KeyframeProperty(this, when, name, value,
          opt_easing[name]);
      this._keyframeProperties[newKeyframeProperty.id] = newKeyframeProperty;

      if (!this._propertyTracks[name]) {
        this._propertyTracks[name] = [];
      }

      this._propertyTracks[name].push(newKeyframeProperty);
      sortPropertyTracks(this);
    }, this);

    this.kapi._recalculateAnimationLength();
    this.invalidatePropertyCache();

    return this;
  };


  /**
   * @param {string} property
   * @param {number} index
   * @return {Kapi.KeyframeProperty}
   */
  gk.Actor.prototype.getKeyframeProperty = function (property, index) {
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
  gk.Actor.prototype.modifyKeyframeProperty = function (property, index,
      newProperties) {
    if (this._propertyTracks[property]
        && this._propertyTracks[property][index]) {
      this._propertyTracks[property][index].modifyWith(newProperties);
    }

    sortPropertyTracks(this);
    this.invalidatePropertyCache();
    return this;
  };


  /**
   * @return {Array}
   */
  gk.Actor.prototype.getTrackNames = function () {
    return _.keys(this._propertyTracks);
  };


  /**
   * @param {string} trackName
   * @return {number}
   */
  gk.Actor.prototype.getTrackLength = function (trackName) {
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
  gk.Actor.prototype.copyProperties = function (copyTo, copyFrom) {
    var sourcePositions
        ,sourceEasings;

    sourcePositions = {};
    sourceEasings = {};

    _.each(this._propertyTracks, function (propertyTrack, trackName) {
      var foundProperty;

      foundProperty = findPropertyAtMillisecondInTrack(this, trackName,
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
  gk.Actor.prototype.wait = function (until) {
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
   * @return {number}
   */
  gk.Actor.prototype.getStart = function () {
    var starts = [];

    _.each(this._propertyTracks, function (propertyTrack) {
      if (propertyTrack.length) {
        starts.push(propertyTrack[0].millisecond);
      }
    });

    if (starts.length === 0) {
      starts = [0];
    }

    return Math.min.apply(Math, starts);
  };


  /**
   * @return {number}
   */
  gk.Actor.prototype.getEnd = function () {
    var latest = 0;

    _.each(this._propertyTracks, function (propertyTrack) {
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
   * @return {number}
   */
  gk.Actor.prototype.getLength = function () {
    return this.getEnd() - this.getStart();
  }


  /**
   * @param {number} when
   * @param {Object} stateModification
   * @param {Object} opt_easingModification
   * @return {Kapi.Actor}
   */
  gk.Actor.prototype.modifyKeyframe = function (when, stateModification,
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
  gk.Actor.prototype.removeKeyframe = function (when) {
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
    this.kapi._recalculateAnimationLength();
    this.invalidatePropertyCache();

    return this;
  };


  /**
   * @return {Kapi.Actor}
   */
  gk.Actor.prototype.removeAllKeyframeProperties = function () {
    _.each(this._propertyTracks, function (propertyTrack, propertyName) {
      propertyTrack.length = 0;
    }, this);

    this._keyframeProperties = {};
    return this.removeKeyframe(0);
  };


  /**
   * @param {number} layer
   * @return {Kapi.Actor|undefined}
   */
  gk.Actor.prototype.moveToLayer = function (layer) {
    return this.kapi.moveActorToLayer(this, layer);
  };


  /**
   * @param {boolean} alsoPersist
   * @return {Kapi.Actor}
   */
  gk.Actor.prototype.show = function (alsoPersist) {
    this._isShowing = true;
    this._isPersisting = !!alsoPersist;

    return this;
  };


  /**
   * @param {boolean} alsoUnpersist
   * @return {Kapi.Actor}
   */
  gk.Actor.prototype.hide = function (alsoUnpersist) {
    this._isShowing = false;

    if (alsoUnpersist === true) {
      this._isPersisting = false;
    }

    return this;
  };


  /**
   * @return {boolean}
   */
  gk.Actor.prototype.isShowing = function () {
    return this._isShowing || this._isPersisting;
  };


  /**
   * @param {number} millisecond
   * @return {Kapi.Actor}
   */
  gk.Actor.prototype.calculatePosition = function (millisecond) {
    var startMs = this.getStart();
    var endMs = this.getEnd();
    this.hide();

    if (startMs <= millisecond && millisecond <= endMs) {
      this.show();
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
  gk.Actor.prototype.data = function (opt_newData) {
    if (opt_newData) {
      this._data = opt_newData;
    }

    return this._data;
  };


  /**
   * @return {Object}
   */
  gk.Actor.prototype.exportTimeline = function () {
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
   * Empty out and re-cache internal KeyframeProperty data.
   */
  gk.Actor.prototype.invalidatePropertyCache = function () {
    this._timelinePropertyCaches = {};

    _.each(this._keyframeProperties, function (keyframeProperty) {
      if (!this._timelinePropertyCaches[keyframeProperty.millisecond]) {
        this._timelinePropertyCaches[keyframeProperty.millisecond] = {};
      }

      this._timelinePropertyCaches[keyframeProperty.millisecond][
          keyframeProperty.name] = keyframeProperty;
    }, this);

    this._timelinePropertyCacheIndex = _.keys(this._timelinePropertyCaches);

    _.each(this._timelinePropertyCacheIndex, function (listId, i) {
      this._timelinePropertyCacheIndex[i] = +listId;
    }, this);

    gk.util.sortNumerically(this._timelinePropertyCacheIndex);
    cachePropertiesToSegments(this);
    linkTrackedProperties(this);
  };


  /**
   * Start Shifty interoperability logic...
   ******/

  _.each(['tween', 'to'], function (shiftyMethodName) {
    gk.Actor.prototype[shiftyMethodName] = function () {
      this.show(true);
      Tweenable.prototype[shiftyMethodName].apply(this, arguments);
    }
  }, this);

  /******
   * ...End Shifty interoperability logic.
   */

};
