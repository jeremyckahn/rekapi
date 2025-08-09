import { Rekapi, Actor, KapiActor } from '../src/main';

export const setupTestRekapi = (
  opts?: ConstructorParameters<typeof Rekapi>[0]
) => new Rekapi(opts);

export const setupTestActor = (
  rekapi: Rekapi,
  actorArgs?: KapiActor
): Actor => rekapi.addActor(new Actor(actorArgs));
