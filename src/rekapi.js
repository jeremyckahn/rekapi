import _ from 'lodash';
import { Tweenable, setBezierFunction } from 'shifty';
import { Actor } from './actor';

const UPDATE_TIME = 1000 / 60;

export const DEFAULT_EASING = 'linear';

/*!
 * Fire an event bound to a Rekapi.
 * @param {Rekapi} rekapi
 * @param {string} eventName
 * @param {Object} [data={}] Optional event-specific data
 */
export const fireEvent = (rekapi, eventName, data = {}) =>
  rekapi._events[eventName].forEach(handler => handler(rekapi, data));

/*!
 * @param {Rekapi} rekapi
 * @param {Underscore} _
 */
export const invalidateAnimationLength = rekapi =>
  rekapi._animationLengthValid = false;

/*!
 * Determines which iteration of the loop the animation is currently in.
 * @param {Rekapi} rekapi
 * @param {Number} timeSinceStart
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
 * @return {Number}
 */
export const calculateTimeSinceStart = rekapi =>
  Tweenable.now() - rekapi._loopTimestamp;

/*!
 * Determines if the animation is complete or not.
 * @param {Rekapi} rekapi
 * @param {Number} currentLoopIteration
 * @return {Boolean}
 */
export const isAnimationComplete = (rekapi, currentLoopIteration) =>
  currentLoopIteration >= rekapi._timesToIterate
    && rekapi._timesToIterate !== -1;

/*!
 * Stops the animation if it is complete.
 * @param {Rekapi} rekapi
 * @param {Number} currentLoopIteration
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
 * @param {Number} forMillisecond
 * @param {Number} currentLoopIteration
 * @return {Number}
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
 * @param {Number} forMillisecond
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
 * @typedef {Object} rekapi.renderer
 * @property {rekapi.renderActor} render A function that renders a {@link
 * rekapi.Actor}.
 */

/**
 * @callback rekapi.eventHandler
 * @param {rekapi.Rekapi} rekapi This `{@link rekapi.Rekapi}` instance
 * @param {Object} data Data provided from the event (see `{@link
 * rekapi.Rekapi#on}` for a list).
 */

/**
 * A function that gets called every time the actor's state is updated (once
 * every frame). This function should do something meaningful with state of the
 * actor (for example, visually rendering to the screen).
 * @callback rekapi.renderActor
 * @param {Object} context This actor's `context` Object.
 * @param {Object} state This actor's current state properties.
 */

/**
 * @callback rekapi.keyframeFunction
 * @param {number} drift A number that represents the delay between when the
 * function is called and when it was scheduled.
 */

/**
 * If this is a rendered animation, the appropriate renderer is accessible as
 * `this.renderer`.  If provided, a reference to `context` is accessible
 * as `this.context`.
 * @param {(Object|CanvasRenderingContext2D|HTMLElement)} [context] This
 * determines how to render the animation.  If this is not provided or is a
 * plain object (`{}`), the animation will not render anything and
 * `this.renderer` will be `undefined`.  If this is a reference to a
 * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D),
 * `{@link rekapi.CanvasRenderer}` will be initialized as `this.renderer` for
 * HTML5 canvas-based rendering.  If this is a reference to a DOM element,
 * `{@link rekapi.DOMRenderer}` will be initialized as `this.renderer` for
 * either a DOM or CSS `@keyframe`-based rendering.
 * @property {Array.<rekapi.renderer>} renderers
 * @constructs rekapi.Rekapi
 */
export class Rekapi {
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
   * @method rekapi.Rekapi#addActor
   * @param {(Actor|Object)} [actor={}] If this is an `Object`, it is used to as
   * the constructor parameters for a new `{@link rekapi.Actor}` instance that
   * is created by this method.
   * @return {Actor} The actor that was added.
   */
  addActor (actor = {}) {
    const rekapiActor = actor instanceof Actor ?
      actor :
      new Actor(actor);

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
   * `{@link rekapi.Rekapi#getActorIds}` to get a list
   * of IDs for all actors in the animation.
   * @method rekapi.Rekapi#getActor
   * @param {Number} actorId
   * @return {Actor}
   */
  getActor (actorId) {
    return this._actors[actorId];
  }

  /**
   * Retrieve the `id`'s of all actors in an animation.
   *
   * @method rekapi.Rekapi#getActorIds
   * @return {Array(Number)}
   */
  getActorIds () {
    return _.pluck(this._actors, 'id');
  }

  /**
   * Retrieve all actors in the animation as an Object.
   * @method rekapi.Rekapi#getAllActors
   * @return {Object} The keys of this Object correspond to the Actors' `id`s.
   */
  getAllActors () {
    return _.clone(this._actors);
  }

  /**
   * @method rekapi.Rekapi#getActorCount
   * @return {Number} The number of actors in the animation.
   */
  getActorCount () {
    return _.size(this._actors);
  }

  /**
   * Remove an actor from the animation.  This does not destroy the actor, it
   * only removes the link between it and the `Rekapi` instance.  This method
   * calls the actor's `teardown` method, if it is defined.
   * @method rekapi.Rekapi#removeActor
   * @param {Actor} actor
   * @return {Actor}
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
   * @method rekapi.Rekapi#removeAllActors
   * @return {Array.<Actor>}
   */
  removeAllActors () {
    return _.map(this.getAllActors(), this.removeActor, this);
  }

  /**
   * Play the animation.
   *
   * @method rekapi.Rekapi#play
   * @param {Number} [iterations=-1] If omitted, the animation will loop
   * endlessly.
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
   * @method rekapi.Rekapi#playFrom
   * @param {Number} millisecond
   * @param {Number} [iterations] Works as it does in {@link
   * rekapi.Rekapi#play}.
   */
  playFrom (millisecond, iterations) {
    this.play(iterations);
    this._loopTimestamp = Tweenable.now() - millisecond;

    _.invoke(this._actors, '_resetFnKeyframesFromMillisecond', millisecond);

    return this;
  }

  /**
   * Play from the last frame that was rendered with {@link
   * rekapi.Rekapi#update}.
   *
   * @method rekapi.Rekapi#playFromCurrent
   * @param {Number} [iterations] Works as it does in {@link
   * rekapi.Rekapi#play}.
   */
  playFromCurrent (iterations) {
    return this.playFrom(this._lastUpdatedMillisecond, iterations);
  }

  /**
   * Pause the animation.  A "paused" animation can be resumed from where it
   * left off with {@link rekapi.Rekapi#play}.
   *
   * @method rekapi.Rekapi#pause
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
   * if {@link rekapi.Rekapi#play} is called.
   *
   * @method rekapi.Rekapi#stop
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
   * @method rekapi.Rekapi#isPlaying
   * @return {Boolean} Whether or not the animation is playing (meaning not paused or
   * stopped).
   */
  isPlaying () {
    return this._playState === PLAYING;
  }

  /**
   * @method rekapi.Rekapi#isPaused
   * @return {Boolean} Whether or not the animation is paused (meaning not playing or
   * stopped).
   */
  isPaused () {
    return this._playState === PAUSED;
  }

  /**
   * @method rekapi.Rekapi#isStopped
   * @return {Boolean} Whether or not the animation is stopped (meaning not playing or
   * paused).
   */
  isStopped () {
    return this._playState === STOPPED;
  }

  /**
   * Render an animation frame at a specific point in the timeline.
   *
   * @method rekapi.Rekapi#update
   * @param {Number} [millisecond=this._lastUpdatedMillisecond] The point in
   * the timeline at which to render.  If omitted, this renders the last
   * millisecond that was rendered (it's a re-render).
   * @param {Boolean} [doResetLaterFnKeyframes=false] If true, allow all
   * function keyframes later in the timeline to be run again.  This is a
   * low-level feature, it should not be `true` (or even provided) for most use
   * cases.
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
   * @method rekapi.Rekapi#getLastPositionUpdated
   * @return {Number} The normalized timeline position (between 0 and 1) that
   * was last rendered.
   */
  getLastPositionUpdated () {
    return (this._lastUpdatedMillisecond / this.getAnimationLength());
  }

  /**
   * @method rekapi.Rekapi#getLastMillisecondUpdated
   * @return {Number} The millisecond that was last rendered.
   */
  getLastMillisecondUpdated () {
    return this._lastUpdatedMillisecond;
  }

  /**
   * @method rekapi.Rekapi#getAnimationLength
   * @return {Number} The length of the animation timeline, in milliseconds.
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
   * @method rekapi.Rekapi#on
   * @param {string} eventName Valid values are:
   *
   * - `"animationComplete"`: Fires when all animation loops have completed.
   * - `"playStateChange"`: Fires when the animation is played, paused, or
   *   stopped.
   * - `"play"`: Fires when the animation is {@link rekapi.Rekapi#play}ed.
   * - `"pause"`: Fires when the animation is {@link rekapi.Rekapi#pause}d.
   * - `"stop"`: Fires when the animation is {@link rekapi.Rekapi#stop}ped.
   * - `"beforeUpdate"`: Fires each frame before all actors are rendered.
   * - `"afterUpdate"`: Fires each frame after all actors are rendered.
   * - `"addActor"`: Fires when an actor is added.  `data` is the
   *   {@link rekapi.Actor} that was added.
   * - `"removeActor"`: Fires when an actor is removed.  `data` is the {@link
   *   rekapi.Actor} that was removed.
   * - `"beforeAddKeyframeProperty"`: Fires just before the point where a
   *   {@link rekapi.KeyframeProperty} is added to the timeline.  This event is
   *   called before any modifications to the timeline are done.
   * - `"addKeyframeProperty"`: Fires when a keyframe property is added.
   *   `data` is the {@link rekapi.KeyframeProperty} that was added.
   * - `"beforeRemoveKeyframeProperty"`: Fires just before the point where a
   *   {@link rekapi.KeyframeProperty} is removed.  This
   *   event is called before any modifications to the timeline are done.
   * - `"removeKeyframeProperty"`: Fires when a {@link rekapi.KeyframeProperty}
   *   is removed.  This event is fired _before_ the internal state of the
   *   keyframe (but not the timeline, in contrast to the
   *   `beforeRemoveKeyframeProperty` event) has been updated to reflect the
   *   keyframe property removal (this is in contrast to
   *   `removeKeyframePropertyComplete`).  `data` is the {@link
   *   rekapi.KeyframeProperty} that was removed.
   * - `"removeKeyframePropertyComplete"`: Fires when a {@link
   *   rekapi.KeyframeProperty} has finished being removed from the timeline.
   *   Unlike `removeKeyframeProperty`, this is fired _after_ the internal
   *   state of Rekapi has been updated to reflect the removal of the keyframe
   *   property. `data` is the {@link rekapi.KeyframeProperty} that was
   *   removed.
   * - `"addKeyframePropertyTrack"`: Fires when the a keyframe is added to an
   *   actor that creates a new keyframe property track.  `data` is the {@link
   *   rekapi.KeyframeProperty} that was added to create the property track.  A
   *   reference to the actor that the keyframe property is associated with can
   *   be accessed via `data.actor` and the track name that was added can be
   *   determined via `data.name`.
   * - `"removeKeyframePropertyTrack"`: Fires when the last keyframe property
   *   in an actor's keyframe property track is removed.  Rekapi automatically
   *   removes property tracks when they are emptied out, which causes this
   *   event to be fired.  `data` is the name of the track that was
   *   removed.
   * - `"timelineModified"`: Fires when a keyframe is added, modified or
   *   removed.
   * - `"animationLooped"`: Fires when an animation loop ends and a new one
   *   begins.
   * @param {rekapi.eventHandler} handler The event handler function.
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
   * @param {any} [data] Optional data to provide to `eventName` handlers.
   * @method rekapi.Rekapi#trigger
   */
  trigger (eventName, data) {
    fireEvent(this, eventName, data);

    return this;
  }

  /**
   * Unbind one or more handlers from a Rekapi event.
   *
   * @method rekapi.Rekapi#off
   * @param {string} eventName Valid values correspond to the list under
   * {@link rekapi.Rekapi#on}.
   * @param {Function} [handler] If omitted, all handler functions bound to
   * `eventName` are unbound.
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
   * @method rekapi.Rekapi#exportTimeline
   * @return {Object} This data can later be consumed by {@link
   * rekapi.Rekapi#importTimeline}.
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
   * Import data that was created by {@link rekapi.Rekapi#exportTimeline}.
   * This sets up all actors, keyframes, and custom easing curves specified in
   * the `rekapiData` parameter.  These two methods collectively allow you
   * serialize an animation (for sending to a server for persistence, for
   * example) and later recreating an identical animation.
   *
   * @method rekapi.Rekapi#importTimeline
   * @param {Object} rekapiData Any object that has the same data format as the
   * object generated from {@link rekapi.Rekapi#exportTimeline}.
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
      const actor = new Actor();
      actor.importTimeline(actorData);
      this.addActor(actor);
    });
  }

  /**
   * Get a list of event names that this Rekapi instance supports.
   * @method rekapi.Rekapi#getEventNames
   * @return Array(string)
   */
  getEventNames () {
    return Object.keys(this._events);
  }
}
