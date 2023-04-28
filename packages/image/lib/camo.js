import crypto from 'node:crypto'
import {hexEncode} from './hex-encode.js'

const encoder = new TextEncoder()

/**
 * Create a `toProxyUrl` for a camo server.
 *
 * See for example:
 *
 * * <https://github.com/atmos/camo>
 * * <https://github.com/cactus/go-camo>
 *
 * @param {string} path
 *   Where the camo server runs (such as `https://camo.githubusercontent.com`).
 * @param {string} secret
 *   Shared secret with your camo server (such as `myVerySecretSecret`).
 * @returns
 *   Function to create a URL to a proxy from an external URL.
 */
export function camo(path, secret) {
  return toProxyUrl

  /**
   * Create a URL to a proxy from an external URL.
   *
   * @param {string} url
   *   URL to hash.
   * @returns {string}
   *   URL to proxy.
   */
  function toProxyUrl(url) {
    const hmac = crypto.createHmac('sha1', secret)
    hmac.update(url)
    const digest = hmac.digest('hex')
    // Would be same as: `return Buffer.from(url, 'ascii').toString('hex')`.
    const hex = hexEncode(encoder.encode(url))
    return path + '/' + digest + '/' + hex
  }
}
