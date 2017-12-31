import { Tweenable, setBezierFunction } from 'shifty';
import { Actor } from './actor';

import {
  each,
  pick,
  without
} from './utils';

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
 * @fires rekapi.animationComplete
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
 * @fires rekapi.animationLooped
 */
export const updateToMillisecond = (rekapi, forMillisecond) => {
  const currentIteration = determineCurrentLoopIteration(rekapi, forMillisecond);
  const loopPosition = calculateLoopPosition(
    rekapi, forMillisecond, currentIteration
  );

  rekapi._loopPosition = loopPosition;

  const keyframeResetList = [];

  if (currentIteration > rekapi._latestIteration) {
    fireEvent(rekapi, 'animationLooped');

    rekapi._actors.forEach(actor => {

      const { _keyframeProperties } = actor;
      const fnKeyframes = Object.keys(_keyframeProperties).reduce(
        (acc, propertyId) => {
          const property = _keyframeProperties[propertyId];

          if (property.name === 'function') {
            acc.push(property);
          }

          return acc;
        },
        []
      );

      const lastFnKeyframe = fnKeyframes[fnKeyframes.length - 1];

      if (lastFnKeyframe && !lastFnKeyframe.hasFired) {
        lastFnKeyframe.invoke();
      }

      keyframeResetList.push(...fnKeyframes);
    });
  }

  rekapi._latestIteration = currentIteration;
  rekapi.update(loopPosition, true);
  updatePlayState(rekapi, currentIteration);

  keyframeResetList.forEach(fnKeyframe => {
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
export const rendererBootstrappers = [];

/**
 * If this is a rendered animation, the appropriate renderer is accessible as
 * `this.renderer`.  If provided, a reference to `context` is accessible
 * as `this.context`.
 * @param {(Object|CanvasRenderingContext2D|HTMLElement)} [context={}] Sets
 * {@link rekapi.Rekapi#context}. This determines how to render the animation.
 * {@link rekapi.Rekapi} will also automatically set up all necessary {@link
 * rekapi.Rekapi#renderers} based on this value:
 *
 * * If this is not provided or is a plain object (`{}`), the animation will
 * not render anything and {@link rekapi.Rekapi#renderers} will be empty.
 * * If this is a
 * [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D),
 * {@link rekapi.Rekapi#renderers} will contain a {@link
 * rekapi.CanvasRenderer}.
 * * If this is a DOM element, {@link rekapi.Rekapi#renderers} will contain a
 * {@link rekapi.DOMRenderer}.
 * @constructs rekapi.Rekapi
 */
export class Rekapi {
  constructor (context = {}) {
    /**
     * @member {(Object|CanvasRenderingContext2D|HTMLElement)}
     * rekapi.Rekapi#context The rendering context for an animation.
     * @default {}
     */
    this.context = context;
    this._actors = [];
    this._playState = STOPPED;

    /**
     * @member {(rekapi.actorSortFunction|null)} rekapi.Rekapi#sort Optional
     * function for sorting the render order of {@link rekapi.Actor}s.  If set,
     * this is called each frame before the {@link rekapi.Actor}s are rendered.
     * If not set, {@link rekapi.Actor}s will render in the order they were
     * added via {@link rekapi.Rekapi#addActor}.
     *
     * The following example assumes that all {@link rekapi.Actor}s are circles
     * that have a `radius` {@link rekapi.KeyframeProperty}.  The circles will
     * be rendered in order of the value of their `radius`, from smallest to
     * largest.  This has the effect of layering larger circles on top of
     * smaller circles, thus giving a sense of perspective.
     *
     *     const rekapi = new Rekapi();
     *     rekapi.sort = actor => actor.get().radius;
     * @default null
     */
    this.sort = null;

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

    /**
     * @member {Array.<rekapi.renderer>} rekapi.Rekapi#renderers Instances of
     * {@link rekapi.renderer} classes, as inferred by the `context`
     * parameter provided to the {@link rekapi.Rekapi} constructor.  You can
     * add more renderers to this list manually; see the {@tutorial
     * multiple-renderers} tutorial for an example.
     */
    this.renderers = rendererBootstrappers
      .map(renderer => renderer(this))
      .filter(_ => _);
  }

  /**
   * Add a {@link rekapi.Actor} to the animation.  Decorates the added {@link
   * rekapi.Actor} with a reference to this {@link rekapi.Rekapi} instance as
   * {@link rekapi.Actor#rekapi}.
   *
   * @method rekapi.Rekapi#addActor
   * @param {(rekapi.Actor|Object)} [actor={}] If this is an `Object`, it is used to as
   * the constructor parameters for a new {@link rekapi.Actor} instance that
   * is created by this method.
   * @return {rekapi.Actor} The {@link rekapi.Actor} that was added.
   * @fires rekapi.addActor
   */
  addActor (actor = {}) {
    const rekapiActor = actor instanceof Actor ?
      actor :
      new Actor(actor);

    // You can't add an actor more than once.
    if (~this._actors.indexOf(rekapiActor)) {
      return rekapiActor;
    }

    rekapiActor.context = rekapiActor.context || this.context;
    rekapiActor.rekapi = this;

    // Store a reference to the actor internally
    this._actors.push(rekapiActor);

    invalidateAnimationLength(this);
    rekapiActor.setup();

    fireEvent(this, 'addActor', rekapiActor);

    return rekapiActor;
  }

  /**
   * @method rekapi.Rekapi#getActor
   * @param {number} actorId
   * @return {rekapi.Actor} A reference to an actor from the animation by its
   * `id`.  You can use {@link rekapi.Rekapi#getActorIds} to get a list of IDs
   * for all actors in the animation.
   */
  getActor (actorId) {
    return this._actors.filter(actor => actor.id === actorId)[0];
  }

  /**
   * @method rekapi.Rekapi#getActorIds
   * @return {Array.<number>} The `id`s of all {@link rekapi.Actor}`s in the
   * animation.
   */
  getActorIds () {
    return this._actors.map(actor => actor.id);
  }

  /**
   * @method rekapi.Rekapi#getAllActors
   * @return {Array.<rekapi.Actor>} All {@link rekapi.Actor}s in the animation.
   */
  getAllActors () {
    return this._actors.slice();
  }

  /**
   * @method rekapi.Rekapi#getActorCount
   * @return {number} The number of {@link rekapi.Actor}s in the animation.
   */
  getActorCount () {
    return this._actors.length;
  }

  /**
   * Remove an actor from the animation.  This does not destroy the actor, it
   * only removes the link between it and this {@link rekapi.Rekapi} instance.
   * This method calls the actor's {@link rekapi.Actor#teardown} method, if
   * defined.
   * @method rekapi.Rekapi#removeActor
   * @param {rekapi.Actor} actor
   * @return {rekapi.Actor} The {@link rekapi.Actor} that was removed.
   * @fires rekapi.removeActor
   */
  removeActor (actor) {
    // Remove the link between Rekapi and actor
    this._actors = without(this._actors, actor);
    delete actor.rekapi;

    actor.teardown();
    invalidateAnimationLength(this);

    fireEvent(this, 'removeActor', actor);

    return actor;
  }

  /**
   * Remove all {@link rekapi.Actor}s from the animation.
   * @method rekapi.Rekapi#removeAllActors
   * @return {Array.<rekapi.Actor>} The {@link rekapi.Actor}s that were
   * removed.
   */
  removeAllActors () {
    return this.getAllActors().map(actor => this.removeActor(actor));
  }

  /**
   * Play the animation.
   *
   * @method rekapi.Rekapi#play
   * @param {number} [iterations=-1] If omitted, the animation will loop
   * endlessly.
   * @return {rekapi.Rekapi}
   * @fires rekapi.playStateChange
   * @fires rekapi.play
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
   * @param {number} millisecond
   * @param {number} [iterations] Works as it does in {@link
   * rekapi.Rekapi#play}.
   * @return {rekapi.Rekapi}
   */
  playFrom (millisecond, iterations) {
    this.play(iterations);
    this._loopTimestamp = Tweenable.now() - millisecond;

    this._actors.forEach(
      actor => actor._resetFnKeyframesFromMillisecond(millisecond)
    );

    return this;
  }

  /**
   * Play from the last frame that was rendered with {@link
   * rekapi.Rekapi#update}.
   *
   * @method rekapi.Rekapi#playFromCurrent
   * @param {number} [iterations] Works as it does in {@link
   * rekapi.Rekapi#play}.
   * @return {rekapi.Rekapi}
   */
  playFromCurrent (iterations) {
    return this.playFrom(this._lastUpdatedMillisecond, iterations);
  }

  /**
   * Pause the animation.  A "paused" animation can be resumed from where it
   * left off with {@link rekapi.Rekapi#play}.
   *
   * @method rekapi.Rekapi#pause
   * @return {rekapi.Rekapi}
   * @fires rekapi.playStateChange
   * @fires rekapi.pause
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
   * @return {rekapi.Rekapi}
   * @fires rekapi.playStateChange
   * @fires rekapi.stop
   */
  stop () {
    this._playState = STOPPED;
    cancelLoop(this);

    // Also kill any shifty tweens that are running.
    this._actors.forEach(actor =>
      actor._resetFnKeyframesFromMillisecond(0)
    );

    fireEvent(this, 'playStateChange');
    fireEvent(this, 'stop');

    return this;
  }

  /**
   * @method rekapi.Rekapi#isPlaying
   * @return {boolean} Whether or not the animation is playing (meaning not paused or
   * stopped).
   */
  isPlaying () {
    return this._playState === PLAYING;
  }

  /**
   * @method rekapi.Rekapi#isPaused
   * @return {boolean} Whether or not the animation is paused (meaning not playing or
   * stopped).
   */
  isPaused () {
    return this._playState === PAUSED;
  }

  /**
   * @method rekapi.Rekapi#isStopped
   * @return {boolean} Whether or not the animation is stopped (meaning not playing or
   * paused).
   */
  isStopped () {
    return this._playState === STOPPED;
  }

  /**
   * Render an animation frame at a specific point in the timeline.
   *
   * @method rekapi.Rekapi#update
   * @param {number} [millisecond=this._lastUpdatedMillisecond] The point in
   * the timeline at which to render.  If omitted, this renders the last
   * millisecond that was rendered (it's a re-render).
   * @param {boolean} [doResetLaterFnKeyframes=false] If `true`, allow all
   * {@link rekapi.keyframeFunction}s later in the timeline to be run again.
   * This is a low-level feature, it should not be `true` (or even provided)
   * for most use cases.
   * @return {rekapi.Rekapi}
   * @fires rekapi.beforeUpdate
   * @fires rekapi.afterUpdate
   */
  update (
    millisecond = this._lastUpdatedMillisecond,
    doResetLaterFnKeyframes = false
  ) {
    fireEvent(this, 'beforeUpdate');

    const { sort } = this;

    const renderOrder = sort ?
      this._actors.sort((a, b) => sort(a) - sort(b)) :
      this._actors;

    // Update and render each of the actors
    renderOrder.forEach(actor => {
      actor._updateState(millisecond, doResetLaterFnKeyframes);

      if (actor.wasActive) {
        actor.render(actor.context, actor.get());
      }
    });

    this._lastUpdatedMillisecond = millisecond;
    fireEvent(this, 'afterUpdate');

    return this;
  }

  /**
   * @method rekapi.Rekapi#getLastPositionUpdated
   * @return {number} The normalized timeline position (between 0 and 1) that
   * was last rendered.
   */
  getLastPositionUpdated () {
    return (this._lastUpdatedMillisecond / this.getAnimationLength());
  }

  /**
   * @method rekapi.Rekapi#getLastMillisecondUpdated
   * @return {number} The millisecond that was last rendered.
   */
  getLastMillisecondUpdated () {
    return this._lastUpdatedMillisecond;
  }

  /**
   * @method rekapi.Rekapi#getAnimationLength
   * @return {number} The length of the animation timeline, in milliseconds.
   */
  getAnimationLength () {
    if (!this._animationLengthValid) {
      this._animationLength = Math.max.apply(
        Math,
        this._actors.map(actor => actor.getEnd())
      );

      this._animationLengthValid = true;
    }

    return this._animationLength;
  }

  /**
   * Bind a {@link rekapi.eventHandler} function to a Rekapi event.
   * @method rekapi.Rekapi#on
   * @param {string} eventName
   * @param {rekapi.eventHandler} handler The event handler function.
   * @return {rekapi.Rekapi}
   */
  on (eventName, handler) {
    if (!this._events[eventName]) {
      return this;
    }

    this._events[eventName].push(handler);

    return this;
  }

  /**
   * Manually fire a Rekapi event, thereby calling all {@link
   * rekapi.eventHandler}s bound to that event.
   * @param {string} eventName The name of the event to trigger.
   * @param {any} [data] Optional data to provide to the `eventName` {@link
   * rekapi.eventHandler}s.
   * @method rekapi.Rekapi#trigger
   * @return {rekapi.Rekapi}
   * @fires *
   */
  trigger (eventName, data) {
    fireEvent(this, eventName, data);

    return this;
  }

  /**
   * Unbind one or more handlers from a Rekapi event.
   * @method rekapi.Rekapi#off
   * @param {string} eventName Valid values correspond to the list under
   * {@link rekapi.Rekapi#on}.
   * @param {rekapi.eventHandler} [handler] A reference to the {@link
   * rekapi.eventHandler} to unbind.  If omitted, all {@link
   * rekapi.eventHandler}s bound to `eventName` are unbound.
   * @return {rekapi.Rekapi}
   */
  off (eventName, handler) {
    if (!this._events[eventName]) {
      return this;
    }

    this._events[eventName] = handler ?
      without(this._events[eventName], handler) :
      [];

    return this;
  }

  /**
   * Export the timeline to a `JSON.stringify`-friendly `Object`.
   *
   * @method rekapi.Rekapi#exportTimeline
   * @param {Object} [config]
   * @param {boolean} [config.withId=false] If `true`, include internal `id`
   * values in exported data.
   * @return {rekapi.timelineData} This data can later be consumed by {@link
   * rekapi.Rekapi#importTimeline}.
   */
  exportTimeline ({ withId = false } = {}) {
    const exportData = {
      duration: this.getAnimationLength(),
      actors: this._actors.map(actor => actor.exportTimeline({ withId }))
    };

    const { formulas } = Tweenable;

    const filteredFormulas = Object.keys(formulas).filter(
      formulaName => typeof formulas[formulaName].x1 === 'number'
    );

    const pickProps = ['displayName', 'x1', 'y1', 'x2', 'y2'];

    exportData.curves = filteredFormulas.reduce((acc, formulaName) => {
        const formula = formulas[formulaName];
        acc[formula.displayName] = pick(formula, pickProps);

        return acc;
      },
      {}
    );

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
   * @param {rekapi.timelineData} rekapiData Any object that has the same data
   * format as the object generated from {@link rekapi.Rekapi#exportTimeline}.
   */
  importTimeline (rekapiData) {
    each(rekapiData.curves, (curve, curveName) =>
      setBezierFunction(
        curveName,
        curve.x1,
        curve.y1,
        curve.x2,
        curve.y2
      )
    );

    rekapiData.actors.forEach(actorData => {
      const actor = new Actor();
      actor.importTimeline(actorData);
      this.addActor(actor);
    });
  }

  /**
   * @method rekapi.Rekapi#getEventNames
   * @return {Array.<string>} The list of event names that this Rekapi instance
   * supports.
   */
  getEventNames () {
    return Object.keys(this._events);
  }

  /**
   * Get a reference to a {@link rekapi.renderer} that was initialized for this
   * animation.
   * @method rekapi.Rekapi#getRendererInstance
   * @param {rekapi.renderer} rendererConstructor The type of {@link
   * rekapi.renderer} subclass (such as {@link rekapi.CanvasRenderer} or {@link
   * rekapi.DOMRenderer}) to look up an instance of.
   * @return {rekapi.renderer|undefined} The matching {@link rekapi.renderer},
   * if any.
   */
  getRendererInstance (rendererConstructor) {
    return this.renderers.filter(renderer =>
      renderer instanceof rendererConstructor
    )[0];
  }

  /**
   * Move a {@link rekapi.Actor} around within the internal render order list.
   * By default, a {@link rekapi.Actor} is rendered in the order it was added
   * with {@link rekapi.Rekapi#addActor}.
   *
   * This method has no effect if {@link rekapi.Rekapi#sort} is set.
   *
   * @method rekapi.Rekapi#moveActorToPosition
   * @param {rekapi.Actor} actor
   * @param {number} layer This should be within `0` and the total number of
   * {@link rekapi.Actor}s in the animation.  That number can be found with
   * {@link rekapi.Rekapi#getActorCount}.
   * @return {rekapi.Rekapi}
   */
  moveActorToPosition (actor, position) {
    if (position < this._actors.length && position > -1) {
      this._actors = without(this._actors, actor);
      this._actors.splice(position, 0, actor);
    }

    return this;
  }
}
