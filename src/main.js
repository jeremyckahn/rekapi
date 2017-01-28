const Rekapi = require('./rekapi.core');
const Actor = require('./rekapi.actor');
const KeyframeProperty = require('./rekapi.keyframe-property');

const CanvasRenderer = require('../renderers/canvas/rekapi.renderer.canvas');
const DOMRenderer = require('../renderers/dom/rekapi.renderer.dom');

Rekapi.Actor = Actor;
Rekapi.KeyframeProperty = KeyframeProperty;

Rekapi.CanvasRenderer = CanvasRenderer;
Rekapi.DOMRenderer = DOMRenderer;

module.exports = Rekapi;
