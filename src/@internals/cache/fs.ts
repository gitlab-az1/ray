import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import env from '@env';
import type { Dict } from '@@types';
import Exception from '@errors/exception';
import { unmask } from '@@internals/buffer';
import { jsonSafeParser, jsonSafeStringify } from '@@internals/safe-json';
import { FileSystemCacheWriteQueue, bufferMask } from '@@internals/queue/fscache-flush';


type FSValue = {
  value: any;
  length: number;
  score?: number;
  createdAt: number;
  fieldType: 'z-index' | 'key-value';
}

export class FileSystemCache {
  readonly #pathname: string;

  #timeToLiveTable: Dict<number> = {};
  #items: Dict<FSValue> = {};

  private readonly _namespace: string;

  public constructor(namespace?: string) {
    // eslint-disable-next-line no-extra-boolean-cast
    if(!!process.env.VERCEL_ENV) {
      throw new Error('Cannot use file system in Vercel environment');
    }
    
    this._namespace = namespace ?? 'rayrc';
    this.#pathname = path.join(env.getCachePath(), this._namespace);

    if(!fs.existsSync(this.#pathname)) return;

    const buf = Buffer.from(fs.readFileSync(this.#pathname).toString(), 'binary');
    unmask(buf, bufferMask.value);
    
    const parsed = jsonSafeParser<any>(buf.toString());
    
    if(parsed.isLeft()) {
      throw parsed.value;
    }

    if(!parsed.value.$ttl || !parsed.value.$data) {
      throw new Error('Invalid or corrupted cache data');
    }

    if(!parsed.value.$metadata || !parsed.value.$metadata.signedAt) {
      throw new Error('Invalid or corrupted cache metadata');
    }

    
    const hash = crypto.createHmac('sha512', env.getEnvironmentVariable('HMAC_KEY')!);
    hash.update(`${jsonSafeStringify(parsed.value.$ttl)}:${Object.values(parsed.value.$data).join('|')}`);
    hash.update(this._namespace);

    const signature = hash.digest('hex');

    if(signature !== parsed.value.$signature) {
      throw new Exception('Invalid cache signature');
    }

    this.#timeToLiveTable = parsed.value.$ttl;
    this.#items = parsed.value.$data;
  }

  public set<T, K extends string = ''>(key: K, value: T, ttl?: number): void {
    const str = jsonSafeStringify(value);

    if(!str) {
      throw new Exception(`Unserializable value received under key "${key}"`);
    }

    this.#items[key] = {
      value: str,
      length: Buffer.byteLength(str, 'utf-8'),
      createdAt: Date.now(),
      fieldType: 'key-value',
    };

    if(ttl && ttl > 0) {
      this.#timeToLiveTable[`key-value_${key}`] = ttl;
    }

    FileSystemCacheWriteQueue.add({
      $ttl: this.#timeToLiveTable,
      $data: this.#items,
      namespace: this._namespace,
      pathname: this.#pathname,
    });
  }

  public get<T, K extends string = ''>(key: K): T | null {
    const item = this.#items[key];
    if(!item) return null;

    const ttl = this.#timeToLiveTable[`${item.fieldType}_${key}`];
    let output: T | null = null;

    if(!!ttl && ttl > 0 && Date.now() - item.createdAt > ttl) {
      delete this.#items[key];
      delete this.#timeToLiveTable[`${item.fieldType}_${key}`];
      output = null;

      FileSystemCacheWriteQueue.add({
        $ttl: this.#timeToLiveTable,
        $data: this.#items,
        namespace: this._namespace,
        pathname: this.#pathname,
      });
    } else {
      const parsed = jsonSafeParser<T>(item.value);

      if(parsed.isLeft()) {
        throw parsed.value;
      }

      output = parsed.value;
    }

    return output;
  }

  public del<K extends string = ''>(key: K): void {
    const item = this.#items[key];
    if(!item) return;

    delete this.#items[key];
    delete this.#timeToLiveTable[`${item.fieldType}_${key}`];

    FileSystemCacheWriteQueue.add({
      $ttl: this.#timeToLiveTable,
      $data: this.#items,
      namespace: this._namespace,
      pathname: this.#pathname,
    });
  }

  public exists(key: string): boolean {
    const item = this.#items[key];
    if(!item) return false;

    const ttl = this.#timeToLiveTable[`${item.fieldType}_${key}`];
    if(!ttl) return true;

    return Date.now() - item.createdAt <= ttl;
  }

  public expire(key: string, ttl: number): void {
    if(!this.exists(key)) {
      throw new Exception(`Key "${key}" does not exist in cache or has expired`);
    }

    const item = this.#items[key];

    if(!item) {
      throw new Exception(`Key "${key}" does not exist in cache`);
    }

    this.#timeToLiveTable[`${item.fieldType}_${key}`] = ttl;

    FileSystemCacheWriteQueue.add({
      $ttl: this.#timeToLiveTable,
      $data: this.#items,
      namespace: this._namespace,
      pathname: this.#pathname,
    });
  }

  public ttl(key: string): number {
    const item = this.#items[key];
    if(!item) return -2;

    const ttl = this.#timeToLiveTable[`${item.fieldType}_${key}`];
    if(!ttl) return -1;

    return ttl - (Date.now() - item.createdAt);
  }

  public dispose(): void {
    // FileSystemCacheWriteQueue.dispose();

    this.#items = {};
    this.#timeToLiveTable = {};
  }
}

export default FileSystemCache;
