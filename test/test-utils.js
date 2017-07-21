import { Rekapi } from '../src/main';

export const setupTestRekapi = opts => new Rekapi(opts);

export const setupTestActor = (rekapi, actorArgs) =>
  rekapi.addActor(new Rekapi.Actor(actorArgs)
);
