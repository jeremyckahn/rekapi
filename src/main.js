import Tweenable from 'shifty';

import Rekapi from './rekapi.core';
import Actor from './rekapi.actor';
import KeyframeProperty from './rekapi.keyframe-property';

import CanvasRenderer from '../renderers/canvas/rekapi.renderer.canvas';
import DOMRenderer from '../renderers/dom/rekapi.renderer.dom';

Rekapi.Actor = Actor;
Rekapi.KeyframeProperty = KeyframeProperty;

Rekapi.CanvasRenderer = CanvasRenderer;
Rekapi.DOMRenderer = DOMRenderer;

// FIXME: This should be unnecessary, export Shifty with a proper UMD wrapper
Rekapi.Tweenable = Tweenable;

module.exports = Rekapi;
