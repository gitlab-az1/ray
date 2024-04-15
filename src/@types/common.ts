export type MaybeArray<T> = T | T[];

export type MaybePromise<T> = T | Promise<T>;

export type LooseAutocomplete<T extends string> = T | Omit<string, T>;


export type Dict<T> = {
  [key: string]: T;
}


export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
}


export type Values<T> = T[keyof T];

export type Or<T, U> = T extends never ? U : T;
