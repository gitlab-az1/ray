const kindOf = (cache => (thing: any) => {
  const str = Object.prototype.toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));


export const kindOfTest = (type: string) => {
  type = type.toLowerCase();
  return (thing: any) => kindOf(thing) === type;
};


export function isPlainObject(val: any): boolean {
  if(Array.isArray(val)) return false;
  if(kindOf(val) !== 'object' || typeof val !== 'object') return false;

  const prototype = Object.getPrototypeOf(val);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
}


export function assertString(value: unknown, message?: string): asserts value is string {
  if(typeof value !== 'string') {
    throw new TypeError(message || `Expected a string, got ${kindOf(value)}`);
  }
}


export function strShuffle(str: string): string {
  assertString(str);

  const arr = str.split('');

  // Loop through the array
  for(let i = arr.length - 1; i > 0; i--) {
    // Generate a random index
    const j = Math.floor(Math.random() * (i + 1));

    // Swap the current element with the random element
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  // Convert the array back to a string and return it
  return arr.join('');
}


export function isString(value: unknown): value is string {
  return (
    typeof value === 'string' ||
    (value instanceof String)
  );
}


/**
 * Checks if the value is a number.
 * 
 * @param {*} value The value to be checked 
 * @returns {boolean} True if the value is a number, false otherwise
 */
export function isDigit(value: unknown): value is number {
  return (
    typeof value === 'number' ||
    (value instanceof Number)
  ) && !Number.isNaN(value);
} 


export function convertUint8ArrayToHex(arr: Uint8Array): string {
  return Array.prototype.map.call(arr, function(byte) {
    return ('0' + byte.toString(16)).slice(-2);
  }).join('');
}

export function removeDuplicates<T>(arr: Array<T>, key: keyof T): Array<T> {
  const unique: Record<any, boolean> = {};

  return arr.filter(item => {
    if(unique[item[key]] === true) return false;
    
    unique[item[key] as any] = true;
    return true;
  });
}


export function exclude<
  T extends Record<any, any>,
  K extends keyof T
>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  if(typeof obj !== 'object' || Array.isArray(obj)) return obj;

  const o = { ...obj };

  for(const key of keys) {
    if(!Object.prototype.hasOwnProperty.call(o, key)) continue;
    delete o[key];
  }

  return o;
}
