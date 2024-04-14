export type MaybeArray<T> = T | T[];

export type MaybePromise<T> = T | Promise<T>;

export type LooseAutocomplete<T extends string> = T | Omit<string, T>;


export type Dict<T> = {
  [key: string]: T;
}
