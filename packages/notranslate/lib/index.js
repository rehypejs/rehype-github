/**
 * @typedef {import('hast').Root} Root
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {Array<string> | null | undefined} [include]
 *   Elements to enhance.
 *
 *   The default behavior is to add `notranslate` to `code` and `pre`.
 */

import {visit} from 'unist-util-visit'

/** @type {Options} */
const emptyOptions = {}

/**
 * List of tag names that github.com enhances.
 */
export const defaultInclude = ['code', 'pre']

/**
 * Plugin to enhance raw text with `notranslate`.
 *
 * @type {import('unified').Plugin<[(Options | null | undefined)?], Root>}
 * @param options
 *   Configuration.
 */
export default function rehypeGithubNoTranslate(options) {
  const config = options || emptyOptions
  const include = config.include || defaultInclude

  return function (tree) {
    visit(tree, 'element', function (node) {
      if (
        node.type === 'element' &&
        include.includes(node.tagName) &&
        node.properties
      ) {
        const className = Array.isArray(node.properties.className)
          ? node.properties.className
          : (node.properties.className = [])
        className.push('notranslate')
      }
    })
  }
}
