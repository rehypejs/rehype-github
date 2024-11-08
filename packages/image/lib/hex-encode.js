/**
 * Encode bytes.
 *
 * @param {Iterable<number, undefined, undefined>} bytes
 *   Bytes.
 * @returns {string}
 *   Result.
 */
export function hexEncode(bytes) {
  return Array.from(bytes, toHex).join('')
}

/**
 * @param {number} byte
 *   Byte.
 * @returns {string}
 *   Hex.
 */
function toHex(byte) {
  return byte.toString(16).padStart(2, '0')
}
