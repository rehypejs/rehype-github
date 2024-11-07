/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Root} Root
 * @typedef {import('unified').TransformCallback} TransformCallback
 * @typedef {import('vfile').VFile} VFile
 */

/**
 * @callback ToProxyUrl
 *   Create a URL to a proxy from an external URL.
 * @param {string} url
 *   URL to hash.
 * @return {Promise<string> | string}
 *   URL to proxy.
 *
 * @typedef Options
 *   Configuration.
 *
 *   ###### Notes
 *
 *   These options are safe by default, but you should change them.
 *   You should likely include `'nofollow'` and `'ugc'` in `rel`.
 *   If you have `targetBlank: true` (default), make sure to include
 *   `'noopener'` and `'noreferrer'` (default).
 *
 *   > 👉 **Note**: to summarize, with `targetBlank: false`, use
 *   > `rel: ['nofollow', 'ugc']`.
 *   > With `targetBlank: true` (default), use
 *   > `rel: ['nofollow', 'noopener', 'noreferrer', 'ugc']`.
 * @property {ToProxyUrl | null | undefined} [toProxyUrl]
 *   Change external URLs to go through an image proxy.
 * @property {Array<string> | string | null | undefined} [internal]
 *   Hostname or hostnames to not mark as external.
 *
 *   URLs to these hostnames will not be passed through the image proxy.
 * @property {Array<string> | string | null | undefined} [rel=['noopener', 'noreferrer']]
 *   Relationship(s) of your site to external content, used in `rel` on `a`s
 *   wrapping the images.
 *
 *   No `rel` field is set on URLs that go to your image proxy.
 * @property {boolean | null | undefined} [targetBlank=true]
 *   Whether to open images in a new window (`boolean`, default: `true`).
 */

import {visitParents} from 'unist-util-visit-parents'

/**
 * If no `internal` is configured, we use this to parse URLs to images from.
 *
 * This is safe, because `example.com` is reserved by `iana`:
 * <https://www.iana.org/domains/reserved>.
 */
const magicDefaultHostname = 'example.com'

/** @type {Options} */
const emptyOptions = {}
/** @type {[]} */
const emptySource = []

/**
 * Plugin to enhance images.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns
 *   Transform.
 */
export default function rehypeGithubImage(options) {
  const config = options || emptyOptions
  const toProxyUrl = config.toProxyUrl || undefined
  const blank =
    typeof config.targetBlank === 'boolean' ? config.targetBlank : true
  // eslint-disable-next-line unicorn/prevent-abbreviations
  const rel =
    typeof config.rel === 'string'
      ? [config.rel]
      : config.rel || ['noopener', 'noreferrer']
  const internal =
    typeof config.internal === 'string'
      ? [config.internal]
      : config.internal || []

  for (const value of internal) {
    assertHostname(value)
  }

  for (const relation of rel) {
    if (relation.includes(' ')) {
      throw new Error(
        'Expected valid `rel` value, without space (note: use arrays to pass multiple values)'
      )
    }
  }

  /**
   * Transform.
   *
   * @param {Root} tree
   *   Tree.
   * @param {VFile} _
   *   File.
   * @param {TransformCallback} next
   *   Callback.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree, _, next) {
    /** @type {Array<Promise<void>>} */
    const promises = []

    visitParents(tree, 'element', onelement)

    // If a sync algorithm was used, stay sync.
    if (promises.length === 0) {
      next()
      /* c8 ignore next 3 -- the DOM version cannot be tested in Node 18 and lower. */
    } else {
      Promise.all(promises).then(() => next(), next)
    }

    /** @type {import('unist-util-visit-parents').BuildVisitor<Root, 'element'>} */
    function onelement(node, parents) {
      if (
        node.type === 'element' &&
        node.tagName === 'img' &&
        node.properties
      ) {
        let fragment = node
        const sources = [fragment]
        const raw = node.properties.src
        const [source, proxy] = sanitizeSource(raw, toProxyUrl, internal)

        if (proxy) node.properties.dataCanonicalSrc = raw
        node.properties.src = ''
        node.properties.style = 'max-width: 100%;'

        // Wrap in a link if possible.
        if (!interactive(parents)) {
          fragment = {
            type: 'element',
            tagName: 'a',
            properties: {
              target: blank ? '_blank' : undefined,
              rel: proxy ? undefined : [...rel],
              href: ''
            },
            children: [fragment]
          }
          sources.push(fragment)
        }

        // Weird edge case: GH adds a paragraph here, if we’re otherwise
        // directly in root, which only happens with HTML:
        //
        // ```markdown
        // <div></div>
        // <img>
        // ```
        //
        // This doesn’t happen when directly in list items or block quotes.
        const parent = parents[parents.length - 1]
        if (parent.type === 'root') {
          fragment = {
            type: 'element',
            tagName: 'p',
            properties: {},
            children: [fragment]
          }
        }

        // Replace if needed.
        if (fragment !== node) {
          parent.children.splice(parent.children.indexOf(node), 1, fragment)
        }

        // Handle async or sync behavior of `toProxyUrl`.
        /* c8 ignore next 6 -- the DOM version cannot be tested in Node 18 and lower. */
        if (typeof source === 'object') {
          promises.push(
            source.then((source) => {
              set(sources, source)
            })
          )
        } else {
          set(sources, source)
        }
      }
    }
  }
}

/**
 * @param {Array<Element>} nodes
 * @param {string | undefined} source
 */
function set(nodes, source) {
  for (const node of nodes) {
    // Either links or images.
    if (node.tagName === 'a') {
      node.properties.href = source || ''
    } else {
      node.properties.src = source
    }
  }
}

/**
 * Clean an `src`.
 *
 * @param {unknown} value
 *   The property value.
 * @param {ToProxyUrl | undefined} toProxyUrl
 *   Whether to generate a URL to a proxy.
 * @param {Array<string>} internal
 *   Hostnames to mark as internal.
 * @returns {[] | [Promise<string> | string, true?]}
 */
function sanitizeSource(value, toProxyUrl, internal) {
  // Ignore when `src` is not defined.
  if (value === undefined || value === null) {
    return emptySource
  }

  const source = String(value).replace(/^(?:\?[^#]*)?(?:#[\s\S]*)?$/, '')
  const defaultHostname = internal[0] || magicDefaultHostname

  /** @type {URL} */
  let url

  try {
    url = new URL(source, 'https://' + defaultHostname)
  } catch {
    // Do not allow invalid URLs.
    return emptySource
  }

  // Do not allow non-http protocols.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return emptySource
  }

  // For some reason GH uses `src=""` for this instead of
  // dropping the attribute.
  if (url.username || url.password) {
    return ['']
  }

  if (toProxyUrl && !internal.includes(url.hostname)) {
    return [toProxyUrl(source), true]
  }

  return [source]
}

/**
 * Whether the image is already interactive: as in, it is inside a
 * link.
 *
 * @param {Array<Root | Element>} nodes
 * @returns {boolean}
 */
function interactive(nodes) {
  let index = nodes.length

  while (index--) {
    const parent = nodes[index]

    if (parent.type === 'element' && parent.tagName === 'a') {
      return true
    }
  }

  return false
}

/**
 * @param {string} value
 */
function assertHostname(value) {
  try {
    const url = new URL('https://' + value)
    if (url.hostname !== value) {
      throw new Error(
        'Value `' + value + '` is parsed as hostname `' + url.hostname + '`'
      )
    }
  } catch (error) {
    const exception = new Error(
      'Expected valid hostname for URL, not `' + value + '`'
    )
    // @ts-expect-error: not in TS yet.
    exception.cause = error
    throw exception
  }
}
