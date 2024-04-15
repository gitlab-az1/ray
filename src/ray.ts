import { hmac } from 'cryptx-sdk/hash';

import env from '@env';
import type { Dict } from './@types';
import { Exception } from './errors';
import SetList from '@@datastructures/set-list';
import SortedList from '@@datastructures/sorted-list';
import { jsonSafeStringify } from '@@internals/safe-json';


type TTLTableItem = {
  dataType: 'zeta-index' | 'set' | 'list' | 'hash' | 'bitmap';
  ttl: number;
}

export class RayInstance {
  #z: Dict<SortedList>;
  #s: Dict<SetList>;
  #timeToLiveTable: Dict<TTLTableItem>;

  public async zset<T, K extends string>(key: K, value: T, score: number): Promise<void> {
    if(!this.#z[key]) {
      this.#z[key] = new SortedList();
    }

    this.#z[key].add(value, score);
    await this.#flushToDisk();
  }

  async #flushToDisk(): Promise<void> {
    try {
      const h = env.getEnvironmentVariable('HMAC_KEY');

      if(!h) {
        throw new Exception('HMAC_KEY not found in environment variables');
      }

      const $data = {
        '$zeta-index': Object.entries(this.#z).map(([key, value]) => [key, value.toJSON()] as const),
        '$set': Object.entries(this.#s).map(([key, value]) => [key, value.toJSON()] as const),
      };

      const $sign = await hmac(
        Buffer.from(jsonSafeStringify($data) || '{}'),
        Buffer.from(h),
        'sha512',
        'bytearray' // eslint-disable-line comma-dangle
      );

      const o = {
        $data,
        $sign,
        $ts: Date.now(),
        $ttl: jsonSafeStringify(this.#timeToLiveTable) || '{}',
      };
    } catch (err: any) {
      //
    }
  }
}
