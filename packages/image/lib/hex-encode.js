/**
 * Encode bytes.
 *
 * @param {Iterable<number, undefined, undefined>} bytes
 */
export function hexEncode(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  )
}
