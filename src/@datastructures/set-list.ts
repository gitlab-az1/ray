import { jsonSafeStringify } from '@@internals/safe-json';


export class SetList<T> {
  #items: T[] = [];

  public constructor(items?: IterableIterator<T> | Set<T>) {
    if(items instanceof Set) {
      items.forEach(x => this.add(x));
    } else {
      for(const item of items || []) {
        this.add(item);
      }
    }
  }

  public get length(): number {
    return this.#items.length;
  }

  public add(value: T): void {
    if(this.contains(value)) return;
    this.#items.push(value);
  }

  public contains(value: T): boolean {
    return this.#items.includes(value);
  }

  public remove(value: T): boolean {
    const index = this.indexOf(value);
    if(index < 0) return false;

    this.#items.splice(index, 1);
    return true;
  }

  public indexOf(value: T): number {
    return this.#items.findIndex(x => x === value);
  }

  public forEach(callback: (value: T, index: number) => 'break' | void, stopAt?: number): void {
    for(const [index, item] of this) {
      if(stopAt && index >= stopAt) break;

      const o = callback(item, index);

      if(typeof o === 'string' && o === 'break') break;
    }
  }

  public toArray(): T[] {
    return [...this.#items];
  }

  public toJSON(): string {
    return jsonSafeStringify(this.#items) || '[]';
  }

  public clear(): void {
    this.#items.length = 0;
    this.#items = [];
  }

  public *reverseIterator(): IterableIterator<[number, T]> {
    for(let i = this.#items.length - 1; i >= 0; i--) {
      yield [i, this.#items[i]];
    }
  }

  public *[Symbol.iterator](): IterableIterator<[number, T]> {
    for(let i = 0; i < this.#items.length; i++) {
      yield [i, this.#items[i]]; 
    }
  }
}

export default SetList;
