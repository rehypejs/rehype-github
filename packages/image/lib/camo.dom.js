/// <reference lib="dom" />

/* eslint-env browser */

import {hexEncode} from './hex-encode.js'

const encoder = new TextEncoder()

// Note: this algorithm uses DOM features which are in Node 15+.
// However, these DOM features, compared to `node:crypto`, are *async*.
// For that reason, to keep the plugin syntax by default in Node, there are two
// different algorithms.
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
  // Added in Node 15.0.0.
  // <https://nodejs.org/api/webcrypto.html#subtleimportkeyformat-keydata-algorithm-extractable-keyusages>
  const cryptoKeyPromise = crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {hash: 'sha-1', name: 'HMAC'},
    false,
    ['sign']
  )

  return toProxyUrl

  /**
   * Create a URL to a proxy from an external URL.
   *
   * @param {string} url
   *   URL to hash.
   * @returns {Promise<string>}
   *   URL to proxy.
   */
  async function toProxyUrl(url) {
    const cryptoKey = await cryptoKeyPromise
    // Added in Node 15.0.0:
    // <https://nodejs.org/api/webcrypto.html#subtlesignalgorithm-key-data>
    const arrayBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(url)
    )
    const digest = hexEncode(new Uint8Array(arrayBuffer))
    const hex = hexEncode(encoder.encode(url))
    return path + '/' + digest + '/' + hex
  }
}
