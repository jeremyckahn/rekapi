/**
 * @namespace rekapi
 */

/**
 * Either the name of an [easing
 * curve](https://jeremyckahn.github.io/shifty/doc/Tweenable.html#.formulas) or
 * an array of four `number`s (`[x1, y1, x2, y2]`) that represent the points of
 * a [Bezier curve](https://cubic-bezier.com/).
 * @typedef rekapi.easingOption
 * @type {string|Array.<number>}
 * @see {@link https://jeremyckahn.github.io/shifty/doc/tutorial-easing-function-in-depth.html}
 */

/**
 * An Object that provides utilities for rendering a {@link rekapi.Actor}.
 * @typedef {Object} rekapi.renderer
 * @property {rekapi.render} render A function that renders a {@link
 * rekapi.Actor}.
 */

/**
 * @typedef {Object} rekapi.propertyData
 * @property {number|string} value
 * @property {number} millisecond
 * @property {string} easing
 * @property {string} name
 * @property {string|undefined} id
 */

/**
 * @typedef {Object} rekapi.actorData
 * @property {Array.<string>} trackNames The values of this array must
 * correspond 1:1 to the key names in `propertyTracks`.
 * @property {Object.<Array.<rekapi.propertyData>>} propertyTracks
 * @property {number} end
 * @property {number} start
 * @property {string|undefined} id
 */

/**
 * The properties of this object are used as arguments provided to
 * [`shifty.setBezierFunction`](http://jeremyckahn.github.io/shifty/doc/shifty.html#.setBezierFunction).
 * @typedef {Object} rekapi.curveData
 * @property {number} x1
 * @property {number} x2
 * @property {number} y1
 * @property {number} y2
 * @property {string} displayName
 */

/**
 * The `JSON.stringify`-friendly data format for serializing a Rekapi
 * animation.
 * @typedef {Object} rekapi.timelineData
 * @property {Array.<rekapi.actorData>} actors
 * @property {Object.<rekapi.curveData>} curves
 * @property {number} duration
 */

/**
 * A function that is called when an event is fired.  See the events listed
 * below for details on the types of events that Rekapi supports.
 * @callback rekapi.eventHandler
 * @param {rekapi.Rekapi} rekapi A {@link rekapi.Rekapi} instance.
 * @param {Object} data Data provided from the event (see {@link
 * rekapi.Rekapi#on} for details).
 */

/**
 * A function that gets called every time the actor's state is updated (once
 * every frame). This function should do something meaningful with the state of
 * the actor (for example, visually rendering to the screen).
 * @callback rekapi.render
 * @param {Object} context An actor's {@link rekapi.Actor#context} Object.
 * @param {Object} state An actor's current state properties.
 */

/**
 * @callback rekapi.keyframeFunction
 * @param {rekapi.Actor} actor The {@link rekapi.Actor} to which this
 * {@link rekapi.keyframeFunction} was provided.
 * @param {number} drift A number that represents the delay between when the
 * function is called and when it was scheduled. There is typically some amount
 * of delay due to the nature of JavaScript timers.
 */

/**
 * @callback rekapi.actorSortFunction
 * @param {rekapi.Actor} actor A {@link rekapi.Actor} that should expose a
 * `number` value to sort by.
 * @return {number}
 */

/**
 * Fires when all animation loops have completed.
 * @event rekapi.animationComplete
 */
/**
 * Fires when the animation is played, paused, or stopped.
 * @event rekapi.playStateChange
 */
/**
 * Fires when the animation is {@link rekapi.Rekapi#play}ed.
 * @event rekapi.play
 */
/**
 * Fires when the animation is {@link rekapi.Rekapi#pause}d.
 * @event rekapi.pause
 */
/**
 * Fires when the animation is {@link rekapi.Rekapi#stop}ped.
 * @event rekapi.stop
 */
/**
 * Fires each frame before all actors are rendered.
 * @event rekapi.beforeUpdate
 */
/**
 * Fires each frame after all actors are rendered.
 * @event rekapi.afterUpdate
 */
/**
 * @event rekapi.addActor
 * @param {rekapi.Actor} actor The {@link rekapi.Actor} that was added.
 */
/**
 * @event rekapi.removeActor
 * @param {rekapi.Actor} actor The {@link rekapi.Actor} that was removed.
 */
/**
 * Fires just before the point where a {@link rekapi.KeyframeProperty} is added
 * to the timeline.  This event is called before any modifications to the
 * timeline are done.
 * @event rekapi.beforeAddKeyframeProperty
 */
/**
 * @event rekapi.addKeyframeProperty
 * @param {rekapi.KeyframeProperty} keyframeProperty The {@link
 * rekapi.KeyframeProperty} that was added.
 */
/**
 * Fires just before the point where a {@link rekapi.KeyframeProperty} is
 * removed.  This event is called before any modifications to the timeline are
 * done.
 * @event rekapi.beforeRemoveKeyframeProperty
 */
/**
 * Fires when a {@link rekapi.KeyframeProperty} is removed.  This event is
 * fired _before_ the internal state of the keyframe (but not the timeline, in
 * contrast to {@link rekapi.event:beforeRemoveKeyframeProperty}) has been
 * updated to reflect the keyframe property removal (this is in contrast to
 * {@link rekapi.event:removeKeyframePropertyComplete}).
 * @event rekapi.removeKeyframeProperty
 * @param {rekapi.KeyframeProperty} keyframeProperty The {@link
 * rekapi.KeyframeProperty} that was removed.
 */
/**
 * Fires when a {@link rekapi.KeyframeProperty} has finished being removed from
 * the timeline.  Unlike {@link rekapi.event:removeKeyframeProperty}, this is
 * fired _after_ the internal state of Rekapi has been updated to reflect the
 * removal of the keyframe property.
 * @event rekapi.removeKeyframePropertyComplete
 * @param {rekapi.KeyframeProperty} keyframeProperty The {@link
 * rekapi.KeyframeProperty} that was removed.
 */
/**
 * Fires when the a keyframe is added to an actor that creates a new keyframe
 * property track.
 * @event rekapi.addKeyframePropertyTrack
 * @param {rekapi.KeyframeProperty} keyframeProperty The {@link
 * rekapi.KeyframeProperty} that was added to create the property track.
 */
/**
 * Fires when the last keyframe property in an actor's keyframe property track
 * is removed.  Rekapi automatically removes property tracks when they are
 * emptied out, which causes this event to be fired.
 * @event rekapi.removeKeyframePropertyTrack
 * @param {string} trackName name of the track that was removed.
 */
/**
 * Fires when a keyframe is added, modified or removed.
 * @event rekapi.timelineModified
 */
/**
 * Fires when an animation loop ends and a new one begins.
 * @event rekapi.animationLooped
 */

export { Rekapi } from './rekapi';
export { Actor } from './actor';
export { KeyframeProperty } from './keyframe-property';
export { CanvasRenderer } from './renderers/canvas';
export { DOMRenderer } from './renderers/dom';
