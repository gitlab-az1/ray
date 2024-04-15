import math from 'next-math';

import Lazy from '@@internals/lazy';
import Exception from '@errors/exception';
import { mask, unmask } from '@@internals/buffer';
import { jsonSafeStringify } from '@@internals/safe-json';


export const strMask = new Lazy(() => Buffer.from([0xc0, 0xc0, 0xc0, 0xc0]));
export const intMask = new Lazy(() => Buffer.from([0x30, 0x30, 0x30, 0x30]));


type SortedListItem = {
  value: any;
  score: number;
  mask?: 'i' | 's';
}

export type IterableSortedListItem<T> = {
  value: T;
  score: number;
  index: number;
}

export class SortedList<T = any> {
  #items: SortedListItem[] = [];

  public static readonly LIST_END: number = 255;

  public constructor(items?: IterableIterator<[T, number] | { score: number; value: T }>) {
    if(!items) return;

    for(const item of items) {
      if(Array.isArray(item)) {
        this.add(item[0], item[1]);
      } else {
        this.add(item.value, item.score);
      }
    }
  }

  public get length(): number {
    return this.#items.length;
  }

  public add(value: T, score: number): void {
    if(!score || typeof score !== 'number') {
      throw new Exception(`Argument 'score' must be a number, got ${typeof score}`);
    }

    if(!['string', 'number'].includes(typeof value)) {
      this.#items.push({ value, score });
    } else {
      switch(typeof value) {
        case 'string': {
          const base = Buffer.from(value);
          const output = Buffer.alloc(base.length);

          mask(base, strMask.value, output, 0, base.length);

          this.#items.push({
            value: output,
            mask: 's',
            score,
          });

          break;
        }
        case 'number': {
          if(!Number.isInteger(value)) return void this.#items.push({ value, score });
      
          const base = Buffer.from(value.toString());
          const output = Buffer.alloc(base.length);

          mask(base, intMask.value, output, 0, base.length);

          this.#items.push({
            value: output,
            mask: 'i',
            score,
          });

          break;
        }
        default:
          throw new Exception(`Invalid type '${typeof value}'`);
      }
    }

    this.#insertionSort();
  }

  public get(index: number): T | undefined {
    if(index < 0 || index >= this.#items.length) return void 0;

    const item = this.#items[index];
    if(!item) return void 0;

    if(!item.mask) return item.value;
    if(!Buffer.isBuffer(item.value)) return item.value;

    const buf = Buffer.from(item.value);

    switch(item.mask) {
      case 'i': 
        unmask(buf, intMask.value);
        return parseInt(buf.toString()) as T;
        break;
      case 's':
        unmask(buf, strMask.value);
        return buf.toString() as T;
        break;
      default:
        throw new Exception(`Invalid mask '${item.mask}'`);
    }
  }

  public select(start: number, end: number, withScores: true): [T, number][];
  public select(start: number, end: number, withScores?: false): T[];
  public select(start: number, end: number, withScores?: boolean): T[] | [T, number][] {
    const items = this.#items.filter(x => x.score >= start && x.score <= end)
      .map(item => {
        switch(item.mask) {
          case 'i': 
            unmask(item.value, intMask.value);
            item.value = parseInt(item.value.toString());
            break;
          case 's':
            unmask(item.value, strMask.value);
            item.value = item.value.toString();
            break;
        }

        return item;
      });

    if(!withScores) return items.map(x => x.value);
    return items.map(x => [x.value, x.score]) as [T, number][];
  }

  public remove(value: T): boolean {
    const index = this.#items.findIndex(x => {
      switch(x.mask) {
        case 'i':
          unmask(x.value, intMask.value);
          return parseInt(x.value.toString()) === value;
        case 's':
          unmask(x.value, strMask.value);
          return x.value.toString() === value;
        default:
          return x.value === value;
      }
    });

    if(index < 0) return false;

    this.#items.splice(index, 1);
    return true;
  }

  public removeRange(start: number, end: number): boolean {
    this.#items = this.#items.filter(x => x.score < start || x.score > end);
    return true;
  }

  public minScore(): number {
    return math.min(...this.#items.map(x => x.score));
  }

  public maxScore(): number {
    return math.max(...this.#items.map(x => x.score));
  }

  public indexOf(value: T): number {
    return this.#items.findIndex(x => {
      switch(x.mask) {
        case 'i':
          unmask(x.value, intMask.value);
          return parseInt(x.value.toString()) === value;
        case 's':
          unmask(x.value, strMask.value);
          return x.value.toString() === value;
        default:
          return x.value === value;
      }
    });
  }

  public indexOfScore(score: number): number[] {
    return this.#items.reduce((indexes, item, index) => {
      if(item.score === score) {
        indexes.push(index);
      }
      
      return indexes;
    }, [] as number[]);
  }

  public removeDuplicates(keepScore: 'higher' | 'lower' = 'higher'): void {
    const seenValues = new Set<T>();
    const indexesToRemove: number[] = [];

    for(let i = 0; i < this.#items.length; i++) {
      const currentItem = this.#items[i];
      let value = Buffer.isBuffer(currentItem.value) ? Buffer.from(currentItem.value) : currentItem.value;

      switch(currentItem.mask) {
        case 'i':
          unmask(value, intMask.value);
          value = parseInt(value.toString()) as T;
          break;
        case 's':
          unmask(value, strMask.value);
          value = value.toString() as T;
          break;
      }

      if(seenValues.has(value)) {
        const previousItem = this.#items[i - 1];
      
        if(keepScore === 'higher') {
          if(currentItem.score > previousItem.score) {
            indexesToRemove.push(i - 1);
          } else {
            indexesToRemove.push(i);
          }
        } else {
          if(currentItem.score < previousItem.score) {
            indexesToRemove.push(i - 1);
          } else {
            indexesToRemove.push(i);
          }
        }
      } else {
        seenValues.add(value);
      }
    }

    for(let i = indexesToRemove.length - 1; i >= 0; i--) {
      this.#items.splice(indexesToRemove[i], 1);
    }
  }

  public toArray(): T[] {
    return this.#items.map(item => {
      switch(item.mask) {
        case 'i':
          unmask(item.value, intMask.value);
          return parseInt(item.value.toString()) as T;
        case 's':
          unmask(item.value, strMask.value);
          return item.value.toString() as T;
        default:
          return item.value as T;
      }
    });
  }

  public toSet(): Set<T> {
    return new Set(this.toArray());
  }

  public toJSON(): string {
    const serializable = this.#items.map(item => {
      switch(item.mask) {
        case 'i': 
          unmask(item.value, intMask.value);
          item.value = parseInt(item.value.toString());
          break;
        case 's':
          unmask(item.value, strMask.value);
          item.value = item.value.toString();
          break;
      }

      delete item.mask;
      return item;
    });

    return jsonSafeStringify(serializable) || '[]';
  }

  public clear(): void {
    this.#items.length = 0;
    this.#items = [];
  }

  #insertionSort(): void {
    for(let i = 1; i < this.#items.length; i++) {
      const current = this.#items[i];
      let j = i - 1;

      while(j >= 0 && this.#items[j].score > current.score) {
        this.#items[j + 1] = this.#items[j];
        j--;
      }

      this.#items[j + 1] = current;
    }
  }

  public forEach(callback: (item: T, score: number, index: number, arr: T[]) => 'break' | void, stopAt?: number): void {
    for(const { index, score, value } of this) {
      if(stopAt && index >= stopAt) break;

      const o = callback(value, score, index, this.toArray());

      if(typeof o === 'string' && o === 'break') break;
    }
  }

  public *reverseIterator(): IterableIterator<IterableSortedListItem<T>> {
    for(let i = this.#items.length - 1; i >= 0; i--) {
      const item = this.#items[i];

      switch(item.mask) {
        case 'i':
          unmask(item.value, intMask.value);

          yield {
            value: parseInt(item.value.toString()) as T,
            score: item.score,
            index: i,
          };
          break;
        case 's':
          unmask(item.value, strMask.value);

          yield {
            value: item.value.toString() as T,
            score: item.score,
            index: i, 
          };
          break;
        default:
          yield {
            value: item.value as T,
            score: item.score,
            index: i,
          };
      }
    }
  }

  public *[Symbol.iterator](): IterableIterator<IterableSortedListItem<T>> {
    for(let i = 0; i < this.#items.length; i++) {
      const item = this.#items[i];

      switch(item.mask) {
        case 'i':
          unmask(item.value, intMask.value);

          yield {
            value: parseInt(item.value.toString()) as T,
            score: item.score,
            index: i,
          };
          break;
        case 's':
          unmask(item.value, strMask.value);

          yield {
            value: item.value.toString() as T,
            score: item.score,
            index: i, 
          };
          break;
        default:
          yield {
            value: item.value as T,
            score: item.score,
            index: i,
          };
      }
    }
  }

  public [Symbol.toStringTag](): string {
    return '[object SortedList]';
  }
}

export default SortedList;
