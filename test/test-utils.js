import { Rekapi, Actor } from '../src/main';

export const setupTestRekapi = opts => new Rekapi(opts);

export const setupTestActor = (rekapi, actorArgs) =>
  rekapi.addActor(new Actor(actorArgs)
);
