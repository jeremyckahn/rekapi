import Rekapi from '../src/main';

export const setupTestRekapi = () => new Rekapi();

export const setupTestActor = (rekapi, actorArgs) =>
  rekapi.addActor(new Rekapi.Actor(actorArgs)
);
