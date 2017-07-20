import _ from 'lodash';
import { Tweenable, setBezierFunction } from 'shifty';

const UPDATE_TIME = 1000 / 60;

export const DEFAULT_EASING = 'linear';

/*!
 * Fire an event bound to a Rekapi.
 * @param {Rekapi} rekapi
 * @param {string} eventName
 * @param {Object=} opt_data Optional event-specific data
 */
export const fireEvent = (rekapi, eventName, opt_data) =>
  rekapi._events[eventName].forEach(handler => handler(rekapi, opt_data));

/*!
 * @param {Rekapi} rekapi
 * @param {Underscore} _
 */
export const invalidateAnimationLength = rekapi =>
  rekapi._animationLengthValid = false;

/*!
 * Determines which iteration of the loop the animation is currently in.
 * @param {Rekapi} rekapi
 * @param {number} timeSinceStart
 */
export const determineCurrentLoopIteration = (rekapi, timeSinceStart) => {
  const animationLength = rekapi.getAnimationLength();

  if (animationLength === 0) {
    return timeSinceStart;
  }

  return Math.floor(timeSinceStart / animationLength);
};

/*!
 * Calculate how many milliseconds since the animation began.
 * @param {Rekapi} rekapi
 * @return {number}
 */
export const calculateTimeSinceStart = rekapi =>
  Tweenable.now() - rekapi._loopTimestamp;

/*!
 * Determines if the animation is complete or not.
 * @param {Rekapi} rekapi
 * @param {number} currentLoopIteration
 * @return {boolean}
 */
export const isAnimationComplete = (rekapi, currentLoopIteration) =>
  currentLoopIteration >= rekapi._timesToIterate
    && rekapi._timesToIterate !== -1;

/*!
 * Stops the animation if it is complete.
 * @param {Rekapi} rekapi
 * @param {number} currentLoopIteration
 */
export const updatePlayState = (rekapi, currentLoopIteration) => {
  if (isAnimationComplete(rekapi, currentLoopIteration)) {
    rekapi.stop();
    fireEvent(rekapi, 'animationComplete');
  }
};

/*!
 * Calculate how far in the animation loop `rekapi` is, in milliseconds,
 * based on the current time.  Also overflows into a new loop if necessary.
 * @param {Rekapi} rekapi
 * @param {number} forMillisecond
 * @param {number} currentLoopIteration
 * @return {number}
 */
export const calculateLoopPosition = (rekapi, forMillisecond, currentLoopIteration) => {
  const animationLength = rekapi.getAnimationLength();

  return animationLength === 0 ?
    0 :
    isAnimationComplete(rekapi, currentLoopIteration) ?
      animationLength :
      forMillisecond % animationLength;
};

/*!
 * Calculate the timeline position and state for a given millisecond.
 * Updates the `rekapi` state internally and accounts for how many loop
 * iterations the animation runs for.
 * @param {Rekapi} rekapi
 * @param {number} forMillisecond
 */
export const updateToMillisecond = (rekapi, forMillisecond) => {
  const currentIteration = determineCurrentLoopIteration(rekapi, forMillisecond);
  const loopPosition = calculateLoopPosition(
    rekapi, forMillisecond, currentIteration
  );

  rekapi._loopPosition = loopPosition;

  let keyframeResetList = [];

  if (currentIteration > rekapi._latestIteration) {
    fireEvent(rekapi, 'animationLooped');

    // Reset function keyframes
    const lookupObject = { name: 'function' };

    _.each(rekapi._actors, actor => {
      const fnKeyframes = _.where(actor._keyframeProperties, lookupObject);
      const lastFnKeyframe = _.last(fnKeyframes);

      if (lastFnKeyframe && !lastFnKeyframe.hasFired) {
        lastFnKeyframe.invoke();
      }

      keyframeResetList = keyframeResetList.concat(fnKeyframes);
    });
  }

  rekapi._latestIteration = currentIteration;
  rekapi.update(loopPosition, true);
  updatePlayState(rekapi, currentIteration);

  _.each(keyframeResetList, fnKeyframe => {
    fnKeyframe.hasFired = false;
  });
};

/*!
 * Calculate how far into the animation loop `rekapi` is, in milliseconds,
 * and update based on that time.
 * @param {Rekapi} rekapi
 */
export const updateToCurrentMillisecond = rekapi =>
  updateToMillisecond(rekapi, calculateTimeSinceStart(rekapi));

/*!
 * This is the heartbeat of an animation.  This updates `rekapi`'s state and
 * then calls itself continuously.
 * @param {Rekapi} rekapi
 */
const tick = rekapi =>
  // Need to check for .call presence to get around an IE limitation.  See
  // annotation for cancelLoop for more info.
  rekapi._loopId = rekapi._scheduleUpdate.call ?
    rekapi._scheduleUpdate.call(global, rekapi._updateFn, UPDATE_TIME) :
    setTimeout(rekapi._updateFn, UPDATE_TIME);

/*!
 * @return {Function}
 */
const getUpdateMethod = () =>
  // requestAnimationFrame() shim by Paul Irish (modified for Rekapi)
  // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  global.requestAnimationFrame       ||
  global.webkitRequestAnimationFrame ||
  global.oRequestAnimationFrame      ||
  global.msRequestAnimationFrame     ||
  (global.mozCancelRequestAnimationFrame && global.mozRequestAnimationFrame) ||
  global.setTimeout;

/*!
 * @return {Function}
 */
const getCancelMethod = () =>
  global.cancelAnimationFrame           ||
  global.webkitCancelAnimationFrame     ||
  global.oCancelAnimationFrame          ||
  global.msCancelAnimationFrame         ||
  global.mozCancelRequestAnimationFrame ||
  global.clearTimeout;

/*!
 * Cancels an update loop.  This abstraction is needed to get around the fact
 * that in IE, clearTimeout is not technically a function
 * (https://twitter.com/kitcambridge/status/206655060342603777) and thus
 * Function.prototype.call cannot be used upon it.
 * @param {Rekapi} rekapi
 */
const cancelLoop = rekapi =>
  rekapi._cancelUpdate.call ?
    rekapi._cancelUpdate.call(global, rekapi._loopId) :
    clearTimeout(rekapi._loopId);

const STOPPED = 'stopped';
const PAUSED = 'paused';
const PLAYING = 'playing';

/*!
 * @type {Object.<function>} Contains the context init function to be called in
 * the Rekapi constructor.  This array is populated by modules in the
 * renderers/ directory.
 */
export const renderers = [];

/**
 * If this is a rendered animation, the appropriate renderer is accessible as
 * `this.renderer`.  If provided, a reference to `context` is accessible
 * as `this.context`.
 * @class Rekapi
 * @param {Object|CanvasRenderingContext2D|HTMLElement=} context This
 * determines how to render the animation.  If this is not provided or is a
 * plain object (`{}`), the animation will not render anything and
 * `this.renderer` will be `undefined`.  If this is a reference to a
 * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D),
 * `{{#crossLink "Rekapi.CanvasRenderer"}}{{/crossLink}}` will be initialized
 * as `this.renderer` for HTML5 canvas-based rendering.  This this is a
 * reference to a DOM element, `{{#crossLink
 * "Rekapi.DOMRenderer"}}{{/crossLink}}` will be initialized as
 * `this.renderer` for either a DOM or CSS `@keyframe`-based rendering.
 * @constructor
 * @chainable
 */
export default class Rekapi {
  constructor (context = {}) {
    this.context = context;
    this._actors = {};
    this._playState = STOPPED;

    this._events = {
      animationComplete: [],
      playStateChange: [],
      play: [],
      pause: [],
      stop: [],
      beforeUpdate: [],
      afterUpdate: [],
      addActor: [],
      removeActor: [],
      beforeAddKeyframeProperty: [],
      addKeyframeProperty: [],
      removeKeyframeProperty: [],
      removeKeyframePropertyComplete: [],
      beforeRemoveKeyframeProperty: [],
      addKeyframePropertyTrack: [],
      removeKeyframePropertyTrack: [],
      timelineModified: [],
      animationLooped: []
    };

    // How many times to loop the animation before stopping
    this._timesToIterate = -1;

    // Millisecond duration of the animation
    this._animationLength = 0;
    this._animationLengthValid = false;

    // The setTimeout ID of `tick`
    this._loopId = null;

    // The UNIX time at which the animation loop started
    this._loopTimestamp = null;

    // Used for maintaining position when the animation is paused
    this._pausedAtTime = null;

    // The last millisecond position that was updated
    this._lastUpdatedMillisecond = 0;

    // The most recent loop iteration a frame was calculated for
    this._latestIteration = 0;

    // The most recent millisecond position within the loop that the animation
    // was updated to
    this._loopPosition = null;

    this._scheduleUpdate = getUpdateMethod();
    this._cancelUpdate = getCancelMethod();

    this._updateFn = () => {
      tick(this);
      updateToCurrentMillisecond(this);
    };

    renderers.forEach(renderer => renderer(this));
  }

  /**
   * Add an actor to the animation.  Decorates the added `actor` with a
   * reference to this `Rekapi` instance as `this.rekapi`.
   *
   * @method addActor
   * @param {Rekapi.Actor|Object} actor If this is an `Object`, it is used to
   * as the constructor parameters for a new `{{#crossLink
   * "Rekapi.Actor"}}{{/crossLink}}` instance that is created by this method.
   * @return {Rekapi.Actor} The actor that was added.
   */
  addActor (actor) {
    const rekapiActor = actor instanceof Rekapi.Actor ?
      actor :
      new Rekapi.Actor(actor);

    // You can't add an actor more than once.
    if (_.contains(this._actors, rekapiActor)) {
      return rekapiActor;
    }

    rekapiActor.context = rekapiActor.context || this.context;
    rekapiActor.rekapi = this;

    // Store a reference to the actor internally
    this._actors[rekapiActor.id] = rekapiActor;

    invalidateAnimationLength(this);
    rekapiActor.setup();

    fireEvent(this, 'addActor', rekapiActor);

    return rekapiActor;
  }

  /**
   * Get a reference to an actor from the animation by its `id`.  You can use
   * `{{#crossLink "Rekapi/getActorIds:method"}}{{/crossLink}}` to get a list
   * of IDs for all actors in the animation.
   * @method getActor
   * @param {number} actorId
   * @return {Rekapi.Actor}
   */
  getActor (actorId) {
    return this._actors[actorId];
  }

  /**
   * Retrieve the `id`'s of all actors in an animation.
   *
   * @method getActorIds
   * @return {Array(number)}
   */
  getActorIds () {
    return _.pluck(this._actors, 'id');
  }

  /**
   * Retrieve all actors in the animation as an Object.
   * @method getAllActors
   * @return {Object} The keys of this Object correspond to the Actors' `id`s.
   */
  getAllActors () {
    return _.clone(this._actors);
  }

  /**
   * Return the number of actors in the animation.
   * @method getActorCount
   * @return {number}
   */
  getActorCount () {
    return _.size(this._actors);
  }

  /**
   * Remove an actor from the animation.  This does not destroy the actor, it
   * only removes the link between it and the `Rekapi` instance.  This method
   * calls the actor's `teardown` method, if it is defined.
   * @method removeActor
   * @param {Rekapi.Actor} actor
   * @return {Rekapi.Actor}
   */
  removeActor (actor) {
    // Remove the link between Rekapi and actor
    delete this._actors[actor.id];
    delete actor.rekapi;

    actor.teardown();
    invalidateAnimationLength(this);

    fireEvent(this, 'removeActor', actor);

    return actor;
  }

  /**
   * Remove all actors from the animation.
   * @method removeAllActors
   * @return {Array.<Rekapi.Actor>}
   */
  removeAllActors () {
    return _.map(this.getAllActors(), this.removeActor, this);
  }

  /**
   * Play the animation.
   *
   * __[Example](../../../../examples/play.html)__
   * @method play
   * @param {number=} iterations If omitted, the animation will loop
   * endlessly.
   * @chainable
   */
  play (iterations = -1) {
    cancelLoop(this);

    if (this._playState === PAUSED) {
      // Move the playhead to the correct position in the timeline if resuming
      // from a pause
      this._loopTimestamp += Tweenable.now() - this._pausedAtTime;
    } else {
      this._loopTimestamp = Tweenable.now();
    }

    this._timesToIterate = iterations;
    this._playState = PLAYING;

    // Start the update loop
    tick(this);

    fireEvent(this, 'playStateChange');
    fireEvent(this, 'play');

    return this;
  }

  /**
   * Move to a specific millisecond on the timeline and play from there.
   *
   * __[Example](../../../../examples/play_from.html)__
   * @method playFrom
   * @param {number} millisecond
   * @param {number=} iterations Works as it does in {{#crossLink
   * "Rekapi/play:method"}}{{/crossLink}}.
   * @chainable
   */
  playFrom (millisecond, iterations) {
    this.play(iterations);
    this._loopTimestamp = Tweenable.now() - millisecond;

    _.invoke(this._actors, '_resetFnKeyframesFromMillisecond', millisecond);

    return this;
  }

  /**
   * Play from the last frame that was rendered with {{#crossLink
   * "Rekapi/update:method"}}{{/crossLink}}.
   *
   * __[Example](../../../../examples/play_from_current.html)__
   * @method playFromCurrent
   * @param {number=} iterations Works as it does in {{#crossLink
   * "Rekapi/play:method"}}{{/crossLink}}.
   * @chainable
   */
  playFromCurrent (iterations) {
    return this.playFrom(this._lastUpdatedMillisecond, iterations);
  }

  /**
   * Pause the animation.  A "paused" animation can be resumed from where it
   * left off with {{#crossLink "Rekapi/play:method"}}{{/crossLink}}.
   *
   * __[Example](../../../../examples/pause.html)__
   * @method pause
   * @param pause
   * @chainable
   */
  pause () {
    if (this._playState === PAUSED) {
      return this;
    }

    this._playState = PAUSED;
    cancelLoop(this);
    this._pausedAtTime = Tweenable.now();

    fireEvent(this, 'playStateChange');
    fireEvent(this, 'pause');

    return this;
  }

  /**
   * Stop the animation.  A "stopped" animation will start from the beginning
   * if {{#crossLink "Rekapi/play:method"}}{{/crossLink}} is called.
   *
   * __[Example](../../../../examples/stop.html)__
   * @method stop
   * @chainable
   */
  stop () {
    this._playState = STOPPED;
    cancelLoop(this);

    // Also kill any shifty tweens that are running.
    _.each(this._actors, actor =>
      actor._resetFnKeyframesFromMillisecond(0)
    );

    fireEvent(this, 'playStateChange');
    fireEvent(this, 'stop');

    return this;
  }

  /**
   * @method isPlaying
   * @return {boolean} Whether or not the animation is playing (meaning not paused or
   * stopped).
   */
  isPlaying () {
    return this._playState === PLAYING;
  }

  /**
   * @method isPaused
   * @return {boolean} Whether or not the animation is paused (meaning not playing or
   * stopped).
   */
  isPaused () {
    return this._playState === PAUSED;
  }

  /**
   * @method isStopped
   * @return {boolean} Whether or not the animation is stopped (meaning not playing or
   * paused).
   */
  isStopped () {
    return this._playState === STOPPED;
  }

  /**
   * Render an animation frame at a specific point in the timeline.
   *
   * __[Example](../../../../examples/update.html)__
   * @method update
   * @param {number=} millisecond The point in the timeline at which to
   * render.  If omitted, this renders the last millisecond that was rendered
   * (it's a re-render).
   * @param {boolean=} doResetLaterFnKeyframes If true, allow all function
   * keyframes later in the timeline to be run again.  This is a low-level
   * feature, it should not be `true` (or even provided) for most use cases.
   * @chainable
   */
  update (
    millisecond = this._lastUpdatedMillisecond,
    doResetLaterFnKeyframes = false
  ) {
    const skipRender = this.renderer && this.renderer._batchRendering;

    fireEvent(this, 'beforeUpdate');

    // Update and render each of the actors
    _.each(this._actors, actor => {
      actor._updateState(millisecond, doResetLaterFnKeyframes);

      if (!skipRender && actor.wasActive && typeof actor.render === 'function') {
        actor.render(actor.context, actor.get());
      }
    });

    this._lastUpdatedMillisecond = millisecond;
    fireEvent(this, 'afterUpdate');

    return this;
  }

  /**
   * __[Example](../../../../examples/get_last_position_updated.html)__
   * @method getLastPositionUpdated
   * @return {number} The normalized timeline position (between 0 and 1) that
   * was last rendered.
   */
  getLastPositionUpdated () {
    return (this._lastUpdatedMillisecond / this.getAnimationLength());
  }

  /**
   * @method getLastMillisecondUpdated
   * @return {number} The millisecond that was last rendered.
   */
  getLastMillisecondUpdated () {
    return this._lastUpdatedMillisecond;
  }

  /**
   * @method getAnimationLength
   * @return {number} The length of the animation timeline, in milliseconds.
   */
  getAnimationLength () {
    if (!this._animationLengthValid) {
      this._animationLength = Math.max.apply(
        Math,
        _.map(this._actors, actor => actor.getEnd())
      );

      this._animationLengthValid = true;
    }

    return this._animationLength;
  }

  /**
   * Bind a handler function to a Rekapi event.
   *
   * __[Example](../../../../examples/bind.html)__
   * @method on
   * @param {string} eventName Valid values are:
   *
   * - __animationComplete__: Fires when all animation loops have completed.
   * - __playStateChange__: Fires when the animation is played, paused, or
   *   stopped.
   * - __play__: Fires when the animation is {{#crossLink
   *   "Rekapi/play:method"}}{{/crossLink}}ed.
   * - __pause__: Fires when the animation is {{#crossLink
   *   "Rekapi/pause:method"}}{{/crossLink}}d.
   * - __stop__: Fires when the animation is {{#crossLink
   *   "Rekapi/stop:method"}}{{/crossLink}}ped.
   * - __beforeUpdate__: Fires each frame before all actors are rendered.
   * - __afterUpdate__: Fires each frame after all actors are rendered.
   * - __addActor__: Fires when an actor is added.  `opt_data` is the
   *   {{#crossLink "Rekapi.Actor"}}{{/crossLink}} that was added.
   * - __removeActor__: Fires when an actor is removed.  `opt_data` is the
   *   {{#crossLink "Rekapi.Actor"}}{{/crossLink}} that was removed.
   * - __beforeAddKeyframeProperty__: Fires just before the point where a
   *   {{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}} is added to the
   *   timeline.  This event is called before any modifications to the timeline
   *   are done.
   * - __addKeyframeProperty__: Fires when a keyframe property is added.
   *   `opt_data` is the {{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}
   *   that was added.
   * - __beforeRemoveKeyframeProperty__: Fires just before the point where a
   *   {{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}} is removed.  This
   *   event is called before any modifications to the timeline are done.
   * - __removeKeyframeProperty__: Fires when a {{#crossLink
   *   "Rekapi.KeyframeProperty"}}{{/crossLink}} is removed.  This event is
   *   fired _before_ the internal state of the keyframe (but not the timeline,
   *   in contrast to the `beforeRemoveKeyframeProperty` event) has been
   *   updated to reflect the keyframe property removal (this is in contrast to
   *   `removeKeyframePropertyComplete`).  `opt_data` is the {{#crossLink
   *   "Rekapi.KeyframeProperty"}}{{/crossLink}} that was removed.
   * - __removeKeyframePropertyComplete__: Fires when a {{#crossLink
   *   "Rekapi.KeyframeProperty"}}{{/crossLink}} has finished being removed
   *   from the timeline.  Unlike `removeKeyframeProperty`, this is fired
   *   _after_ the internal state of Rekapi has been updated to reflect the
   *   removal of the keyframe property. `opt_data` is the {{#crossLink
   *   "Rekapi.KeyframeProperty"}}{{/crossLink}} that was removed.
   * - __addKeyframePropertyTrack__: Fires when the a keyframe is added to an
   *   actor that creates a new keyframe property track.  `opt_data` is the
   *   {{#crossLink "Rekapi.KeyframeProperty"}}{{/crossLink}}
   *   that was added to create the property track.  A reference to the actor
   *   that the keyframe property is associated with can be accessed via
   *   `opt_data.actor` and the track name that was added can be determined via
   *   `opt_data.name`.
   * - __removeKeyframePropertyTrack__: Fires when the last keyframe property
   *   in an actor's keyframe property track is removed.  Rekapi automatically
   *   removes property tracks when they are emptied out, which causes this
   *   event to be fired.  `opt_data` is the name of the track that was
   *   removed.
   * - __timelineModified__: Fires when a keyframe is added, modified or
   *   removed.
   * - __animationLooped__: Fires when an animation loop ends and a new one
   *   begins.
   * @param {Function(Rekapi,Object=)} handler Receives the Rekapi instance as
   * the first parameter and event-specific data as the second (`opt_data`).
   * @chainable
   */
  on (eventName, handler) {
    if (!this._events[eventName]) {
      return this;
    }

    this._events[eventName].push(handler);

    return this;
  }

  /**
   * Manually fire a Rekapi event, thereby calling all bound event handlers.
   * @param {string} eventName The name of the event to trigger.
   * @param {any=} data Optional data to provide to `eventName` handlers.
   * @method trigger
   * @chainable
   */
  trigger (eventName, data) {
    fireEvent(this, eventName, data);

    return this;
  }

  /**
   * Unbind one or more handlers from a Rekapi event.
   *
   * __[Example](../../../../examples/unbind.html)__
   * @method off
   * @param {string} eventName Valid values correspond to the list under
   * {{#crossLink "Rekapi/on:method"}}{{/crossLink}}.
   * @param {Function=} handler If omitted, all handler functions bound to
   * `eventName` are unbound.
   * @chainable
   */
  off (eventName, handler) {
    if (!this._events[eventName]) {
      return;
    }

    this._events[eventName] = handler ?
      _.without(this._events[eventName], handler) :
      [];

    return this;
  }

  /**
   * Export the timeline to a JSON-serializable `Object`.
   *
   * __[Example](../../../examples/export_timeline.html)__
   * @method exportTimeline
   * @return {Object} This data can later be consumed by {{#crossLink
   * "Rekapi/importTimeline:method"}}{{/crossLink}}.
   */
  exportTimeline () {
    const exportData = {
      duration: this.getAnimationLength(),
      actors: _.map(this._actors, actor => actor.exportTimeline())
    };


    const curves = {};

    _.chain(Tweenable.formulas)
      .filter(formula => typeof formula.x1 === 'number')
      .each(curve =>
        curves[curve.displayName] =
          _.pick(curve, 'displayName', 'x1', 'y1', 'x2', 'y2')
      )
      .value();

    exportData.curves = curves;

    return exportData;
  }

  /**
   * Import data that was created by {{#crossLink
   * "Rekapi/exportTimeline:method"}}{{/crossLink}}.  This sets up all actors,
   * keyframes, and custom easing curves specified in the `rekapiData`
   * parameter.  These two methods collectively allow you serialize an
   * animation (for sending to a server for persistence, for example) and later
   * recreating an identical animation.
   *
   * @method importTimeline
   * @param {Object} rekapiData Any object that has the same data format as the
   * object generated from Rekapi#exportTimeline.
   */
  importTimeline (rekapiData) {
    _.each(rekapiData.curves, (curve, curveName) =>
      setBezierFunction(
        curveName,
        curve.x1,
        curve.y1,
        curve.x2,
        curve.y2
      )
    );

    _.each(rekapiData.actors, actorData => {
      const actor = new Rekapi.Actor();
      actor.importTimeline(actorData);
      this.addActor(actor);
    });
  }

  /**
   * Get a list of event names that this Rekapi instance supports.
   * @method getEventNames
   * @return Array(string)
   */
  getEventNames () {
    return Object.keys(this._events);
  }
}

// Expose helper functions for unit testing.
// FIXME: Remove this before 2.0 release
Rekapi._private = {};
