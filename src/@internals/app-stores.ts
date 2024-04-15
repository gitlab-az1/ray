import Store from './store';
import { assertString } from './utils';
import type { LooseAutocomplete } from '@@types/common';



export interface RayStores {
  publishers: {
    name: string;
  };
}


export function getAppStore<
  K extends keyof RayStores
>(
  name: LooseAutocomplete<K> // eslint-disable-line comma-dangle
): Store<keyof RayStores[K] | Omit<string, keyof RayStores[K]>, RayStores[K][keyof RayStores[K]] | any> {
  assertString(name);
  return new Store<keyof RayStores[K] | Omit<string, keyof RayStores[K]>, RayStores[K][keyof RayStores[K]] | any>(name);
}

export default getAppStore;
