/**
 * Masks a buffer using the given mask.
 *
 * @param {Buffer} source The buffer to mask
 * @param {Buffer} mask The mask to use
 * @param {Buffer} output The buffer where to store the result
 * @param {Number} offset The offset at which to start writing
 * @param {Number} length The number of bytes to mask.
 */
function _mask(source: Buffer, mask: Buffer, output: Buffer, offset: number, length: number): void {
  for (let i = 0; i < length; i++) {
    output[offset + i] = source[i] ^ mask[i & 3];
  }
}

/**
 * Unmasks a buffer using the given mask.
 *
 * @param {Buffer} buffer The buffer to unmask
 * @param {Buffer} mask The mask to use
 */
function _unmask(buffer: Buffer, mask: Buffer): void {
  for(let i = 0; i < buffer.length; i++) {
    buffer[i] ^= mask[i & 3];
  }
}

/**
 * Converts a buffer to an `ArrayBuffer`.
 *
 * @param {Buffer} buf The buffer to convert
 * @return {ArrayBuffer} Converted buffer
 * @public
 */
export function toArrayBuffer(buf: Buffer): ArrayBuffer {
  if(buf.length === buf.buffer.byteLength) return buf.buffer;
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
}


/**
 * Masks a buffer using the given mask.
 *
 * @param {Buffer} source The buffer to mask
 * @param {Buffer} mask The mask to use
 * @param {Buffer} output The buffer where to store the result
 * @param {Number} offset The offset at which to start writing
 * @param {Number} length The number of bytes to mask.
 */
export function mask(source: Buffer, mask: Buffer, output: Buffer, offset: number, length: number): void {
  if(process.env.NO_BUFFER_UTILS === '1') return _mask(source, mask, output, offset, length);
  if(length < 48) return _mask(source, mask, output, offset, length);

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bufferUtil = require('bufferutil');
    return bufferUtil.mask(source, mask, output, offset, length);

    // eslint-disable-next-line no-empty
  } catch {}
}


/**
 * Unmasks a buffer using the given mask.
 *
 * @param {Buffer} buffer The buffer to unmask
 * @param {Buffer} mask The mask to use
 */
export function unmask(buffer: Buffer, mask: Buffer): void {
  if(process.env.NO_BUFFER_UTILS === '1') return _unmask(buffer, mask);
  if(buffer.length < 32) return _unmask(buffer, mask);

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bufferUtil = require('bufferutil');
    return bufferUtil.unmask(buffer, mask);

    // eslint-disable-next-line no-empty
  } catch {}
}


/**
 * Masks a buffer using the given mask.
 *
 * @param {Buffer} source The buffer to mask
 * @param {Buffer} mask The mask to use
 * @param {Buffer} output The buffer where to store the result
 * @param {Number} offset The offset at which to start writing
 * @param {Number} length The number of bytes to mask.
 */
export const unsafeMask = _mask;

/**
 * Unmasks a buffer using the given mask.
 *
 * @param {Buffer} buffer The buffer to unmask
 * @param {Buffer} mask The mask to use
 */
export const unsafeUnmask = _unmask;
