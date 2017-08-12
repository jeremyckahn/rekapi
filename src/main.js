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

export { Rekapi } from './rekapi';
export { Actor } from './actor';
export { KeyframeProperty } from './keyframe-property';
export { CanvasRenderer } from './renderers/canvas';
export { DOMRenderer } from './renderers/dom';
