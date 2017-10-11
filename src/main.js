/**
 * @namespace rekapi
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
 */

/**
 * @typedef {Object} rekapi.actorData
 * @property {Array.<string>} trackNames The values of this array must
 * correspond 1:1 to the key names in `propertyTracks`.
 * @property {Object.<Array.<rekapi.propertyData>>} propertyTracks
 * @property {number} end
 * @property {number} start
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
 * @property {Array.<rekapi.ActorData>} actors
 * @property {Object.<rekapi.curveData>} curves
 * @property {number} duration
 */

/**
 * A function that is called when an event is fired.  See {@link
 * rekapi.Rekapi#on} for a list of valid events.
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

export { Rekapi } from './rekapi';
export { Actor } from './actor';
export { KeyframeProperty } from './keyframe-property';
export { CanvasRenderer } from './renderers/canvas';
export { DOMRenderer } from './renderers/dom';
