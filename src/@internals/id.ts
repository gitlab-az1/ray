import { getRandomValues } from 'cryptx-sdk/core';

import { strShuffle } from '@@internals/utils';



const _UUIDPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const UUIDPattern = new RegExp(_UUIDPattern.source, 'i');


export function uuid(): string {
  let d = new Date().getTime();

  if(typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); // use high-precision timer if available
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
      
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export const uuidWithoutDashes = () => uuid().replace(/-/g, '');


export function shortId(): string {
  const arr = new Uint8Array(16);
  let d = Date.now();

  if(typeof performance !== 'undefined' &&
    typeof performance.now === 'function') {
    d += performance.now();
  }

  const r = (d + Math.random() * 16) % 16 | 0;

  const rand = getRandomValues(new Uint8Array(16));
  const dh = strShuffle(r.toString(16));

  for(let i = 0; i < 16; i++) {
    const char = dh.charCodeAt(i);
    arr[i] = (char & 0xE0 | rand[i] & 0x1F) ^ r & 0x3 | 0x8;
  }

  return Buffer.from(arr).toString('base64url').replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/_/g, '')
    .replace(/-/g, '')
    .slice(0, 12);
}
