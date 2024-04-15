declare class Denque<T = any> {
  public readonly length: number;

  public constructor();
  public constructor(array: T[]);
  public constructor(array: T[], options: IDenqueOptions);

  public push(item: T): number;
  public unshift(item: T): number;
  public pop(): T | undefined;
  public shift(): T | undefined;
  public peekBack(): T | undefined;
  public peekFront(): T | undefined;
  public peekAt(index: number): T | undefined;
  public get(index: number): T | undefined;
  public remove(index: number, count: number): T[];
  public removeOne(index: number): T | undefined;
  public splice(index: number, count: number, ...item: T[]): T[] | undefined;
  public isEmpty(): boolean;
  public clear(): void;
  public size(): number;
  public toString(): string;
  public toArray(): T[];
}

export interface IDenqueOptions {
  capacity?: number
}


export default Denque;
