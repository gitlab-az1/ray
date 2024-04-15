import fs from 'node:fs';
import path from 'node:path';
import { mask, unmask } from '@@internals/buffer';
import { jsonSafeParser, jsonSafeStringify } from '@@internals/safe-json';

import env from '@env';
import { Lazy } from './lazy';
import { ensureDirSync } from '@fs/ensure';
import type { Dict, Writable } from '@@types';



const bufferMask = new Lazy(() => Buffer.from('722f895c', 'hex')); // 8 bytes long mask for the buffer
const base = path.join(env.getVariableDataPath(), '.store');


type Str = string | { toString(): string; } | { [Symbol.toPrimitive](kind: 'string'): string; } | { [Symbol.toStringTag]: string; };

export type ValueMetadata = {
  readonly created: number;
  readonly updated: number;
}

type RawMetadata = {
  [key: string]: any;
  $keyPath: Record<string, Writable<ValueMetadata>>;
}

type SetOptions = {
  override?: boolean;
  metadata?: Dict<any>;
}

export type ValueWithMetadata<V = any> = ValueMetadata & {
  readonly value: V;
}


export class Store<K extends string | Str = string, V = any> {
  readonly #name: string;
  #dict: Dict<V> = {};
  #metadata: RawMetadata = { $keyPath: {} };

  public constructor(name: string) {
    // eslint-disable-next-line no-extra-boolean-cast
    if(!!process.env.VERCEL_ENV) {
      throw new Error('Cannot use file system in Vercel environment');
    }

    ensureDirSync(base);
    this.#name = name;

    const p = path.join(base, name);
    if(!fs.existsSync(p)) return;

    const buf = Buffer.from(fs.readFileSync(p, { encoding: 'utf-8' }), 'base64');
    unmask(buf, bufferMask.value);

    const parsed = jsonSafeParser<any>(buf.toString());

    if(parsed.isLeft()) {
      throw new Error(`Failed to parse store ${name}. It may be corrupted.`);
    }

    if(typeof parsed.value !== 'object' || Array.isArray(parsed.value)) {
      throw new Error(`Failed to parse store ${name}. It may be corrupted.`);
    }

    if(!parsed.value['$store-metadata']) {
      throw new Error(`Failed to parse store ${name}. It may be corrupted.`);
    }

    this.#dict = parsed.value.$c;
    this.#metadata = parsed.value['$store-metadata'];
  }

  public get(key: K): V | null;
  public get(key: K, includeMetadata: false): V | null;
  public get(key: K, includeMetadata: true): ValueWithMetadata<V> | null;
  public get(key: K, includeMetadata?: boolean): V | ValueWithMetadata<V> | null {
    const k = this.#keyToString(key);
    if(includeMetadata !== true) return this.#dict[k] ?? null;

    const metadata = (this.#metadata.$keyPath?.[k] ?? {}) as ValueMetadata;
    const value = this.#dict[k] ?? null;

    if(!value) return null;
    return Object.assign({ value }, metadata);
  }

  public set(key: K, value: V, options?: SetOptions): void {
    const k = this.#keyToString(key);
    if(this.#dict[k] && !options?.override) return;

    const exists = !!this.#dict[k];
    this.#dict[k] = value;

    if(!this.#metadata.$keyPath) this.#metadata.$keyPath = {};

    if(!exists) {
      this.#metadata.$keyPath[k] = (options?.metadata ?? {}) as Writable<ValueMetadata> & ValueMetadata;

      Object.assign(this.#metadata.$keyPath[k], {
        created: Date.now(),
        updated: Date.now(),
      });
    } else {
      Object.assign(this.#metadata.$keyPath[k], {
        ...options?.metadata,
        updated: Date.now(),
      });
    }

    this.#save();
  }

  public delete(key: K): void {
    const k = this.#keyToString(key);
    if(!this.#dict[k]) return;
    
    delete this.#dict[k];
    delete this.#metadata.$keyPath[k];
    
    this.#save();
  }

  public setGlobalMetadata(metadata: Dict<any>): void {
    delete metadata.$keyPath;
    Object.assign(this.#metadata, metadata);
  }

  public getGlobalMetadata(): Dict<any> {
    return Object.assign({}, this.#metadata);
  }

  public getGlobalMetadataValue<T = any>(key: string): T | undefined {
    return this.#metadata[key];
  }

  public *entries(): IterableIterator<[K, V]> {
    for(const [k, v] of Object.entries(this.#dict)) {
      yield [k as K, v];
    }
  }

  public *serializedEntries(): IterableIterator<[string, V]> {
    for(const [k, v] of this.entries()) {
      yield [this.#keyToString(k), v];
    }
  }

  public *keys(): IterableIterator<K> {
    for(const [k] of this.entries()) {
      yield k;
    }
  }

  public *values(): IterableIterator<V> {
    for(const [, v] of this.entries()) {
      yield v;
    }
  }

  public has(key: K): boolean {
    return this.#dict[this.#keyToString(key)] !== undefined;
  }

  public clear(): void {
    this.#dict = {};
    this.#metadata = { $keyPath: {} };
    this.#save();
  }

  public get size(): number {
    return Object.keys(this.#dict).length;
  }

  public *serializedKeys(): IterableIterator<string> {
    for(const k of this.keys()) {
      yield this.#keyToString(k);
    }
  }

  public toArray(): [K, V][] {
    return [...this.entries()];
  }

  public toSerializedArray(): [string, V][] {
    return this.toArray().map(([k, v]) => [this.#keyToString(k), v]);
  }

  public erase(): void {
    fs.unlinkSync(path.join(base, this.#name));
    this.clear();
  }

  #keyToString(key: K): string {
    if(typeof key === 'string') return key;
    if(typeof key.toString === 'function') return key.toString();
    
    if(typeof (key as { [Symbol.toPrimitive](kind: 'string'): string })[Symbol.toPrimitive] === 'function') return (key as { [Symbol.toPrimitive](kind: 'string'): string })[Symbol.toPrimitive]('string');
    if(typeof (key as { [Symbol.toStringTag]: string })[Symbol.toStringTag] === 'string') return (key as { [Symbol.toStringTag]: string })[Symbol.toStringTag];

    throw new Error(`Failed to convert key to string: ${key}`);
  }

  #save(): void {
    const str = jsonSafeStringify({
      $c: this.#dict,
      '$store-metadata': this.#metadata,
    });

    if(!str) {
      throw new Error('Failed to stringify store data');
    }

    const buf = Buffer.from(str);
    const output = Buffer.alloc(buf.length);
  
    mask(buf, bufferMask.value, output, 0, buf.length);
    ensureDirSync(base);

    fs.writeFileSync(
      path.join(base, this.#name),
      output.toString('base64') // eslint-disable-line comma-dangle
    );
  }

  public [Symbol.toStringTag](): string {
    return '[object Store]';
  }

  public [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }
}


export default Store;
