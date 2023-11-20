/**
 * @typedef {import('hast').Root} Root
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {Array<string> | string | null | undefined} [internal='github.com']
 *   Hostname or hostnames to not mark as external.
 * @property {Array<string> | string | null | undefined} [rel='nofollow']
 *   Relationship(s) of your site to external content, used in `rel`.
 *
 *   You should probably set `['nofollow', 'ugc']`.
 */

import {visit} from 'unist-util-visit'

/** @type {Options} */
const emptyOptions = {}

/**
 * Plugin to enhance links.
 *
 * @type {import('unified').Plugin<[(Options | null | undefined)?], Root>}
 * @param options
 *   Configuration.
 */
export default function rehypeGithubLink(options) {
  const config = options || emptyOptions
  const internals =
    typeof config.internal === 'string'
      ? [config.internal]
      : config.internal || ['github.com']
  const relations =
    typeof config.rel === 'string' ? [config.rel] : config.rel || ['nofollow']

  for (const internal of internals) {
    try {
      const url = new URL('https://' + internal)
      if (url.hostname !== internal) {
        throw new Error(
          'Value `' +
            internal +
            '` is parsed as hostname `' +
            url.hostname +
            '`'
        )
      }
    } catch (error) {
      const exception = new Error(
        'Expected valid hostname for URL, not `' + internal + '`'
      )
      // @ts-expect-error: not in TS yet.
      exception.cause = error
      throw exception
    }
  }

  for (const relation of relations) {
    if (relation.includes(' ')) {
      throw new Error(
        'Expected valid `rel` value, without space (note: use arrays to pass multiple values)'
      )
    }
  }

  return function (tree) {
    visit(tree, 'element', (node, index, parent) => {
      if (
        node.type === 'element' &&
        node.tagName === 'a' &&
        node.properties &&
        parent &&
        typeof index === 'number'
      ) {
        /** @type {URL | undefined} */
        let url

        const defaultHostname = internals[0]

        if (defaultHostname) {
          try {
            url = new URL(
              String(node.properties.href),
              'https://' + defaultHostname
            )
          } catch {}
        }

        let known = false

        if (url) {
          const hostname = url.hostname

          known =
            // For `mailto:` and such.
            !hostname ||
            internals.some((d) => hostname === d || hostname.endsWith('.' + d))
        }

        if (known) {
          // Local or known.
        } else {
          const rel = Array.isArray(node.properties.rel)
            ? node.properties.rel
            : (node.properties.rel = [])

          for (const relation of relations) {
            if (!rel.includes(relation)) {
              rel.push(relation)
            }
          }
        }
      }
    })
  }
}
