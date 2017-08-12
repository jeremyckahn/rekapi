/**
* @namespace rekapi
*/

/**
 * @typedef {Object} rekapi.renderer
 * @property {rekapi.renderActor} render A function that renders a {@link
 * rekapi.Actor}.
 */

/**
 * @callback rekapi.eventHandler
 * @param {rekapi.Rekapi} rekapi This {@link rekapi.Rekapi} instance
 * @param {Object} data Data provided from the event (see {@link
 * rekapi.Rekapi#on} for a list).
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
 * @param {rekapi.Actor} actor The {@link rekapi.Actor} to which this
 * {@link rekapi.keyframeFunction} was provided.
 * @param {number} drift A number that represents the delay between when the
 * function is called and when it was scheduled. There is typically some amount
 * of delay due to the nature of JavaScript timers.
 */

export { Rekapi } from './rekapi';
export { Actor } from './actor';
export { KeyframeProperty } from './keyframe-property';
export { CanvasRenderer } from './renderers/canvas';
export { DOMRenderer } from './renderers/dom';
