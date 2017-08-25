import { Rekapi, Actor, CanvasRenderer, DOMRenderer } from '../src/main';

export const setupTestRekapi = opts => new Rekapi(opts);

export const setupTestActor = (rekapi, actorArgs) =>
  rekapi.addActor(new Actor(actorArgs)
);

export const getCanvasRendererInstance = rekapi =>
  rekapi.renderers.filter(renderer =>
    renderer instanceof CanvasRenderer
  )[0];

export const getDomRendererInstance = rekapi =>
  rekapi.renderers.filter(renderer =>
    renderer instanceof DOMRenderer
  )[0];
