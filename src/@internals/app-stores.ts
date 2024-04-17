import Store from './store';
import { assertString } from './utils';
import type { LooseAutocomplete } from '@@types/common';



type NetClient = {
  ip: string;
  port: number;
  connected_at: number;
}

export interface RayStores {
  network: {
    connected_clients: NetClient[];
  };
}


export function getAppStore<
  K extends keyof RayStores
>(
  name: LooseAutocomplete<K> // eslint-disable-line comma-dangle
): Store<keyof RayStores[K] | Omit<string, keyof RayStores[K]>, RayStores[K][keyof RayStores[K]]> {
  assertString(name);
  return new Store<keyof RayStores[K] | Omit<string, keyof RayStores[K]>, RayStores[K][keyof RayStores[K]]>(name);
}

export default getAppStore;
