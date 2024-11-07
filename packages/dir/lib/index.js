/**
 * @typedef {import('hast').Root} Root
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {Array<string> | null | undefined} [include]
 *   Elements to enhance.
 *
 *   The default behavior is to add `dir` to `div`, `h1`, `h2`, `h3`, `h4`,
 *   `h5`, `h6`, `ol`, `p`, and `ul`.
 */

import {visit} from 'unist-util-visit'

/** @type {Options} */
const emptyOptions = {}

/**
 * List of tag names that github.com enhances.
 */
export const defaultInclude = [
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ol',
  'p',
  'ul'
]

/**
 * Plugin to add `dir=auto` to elements.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns
 *   Transform.
 */
// eslint-disable-next-line unicorn/prevent-abbreviations
export default function rehypeGithubDir(options) {
  const config = options || emptyOptions
  const include = config.include || defaultInclude

  /**
   * Transform.
   *
   * @param {Root} tree
   *   Tree.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree) {
    visit(tree, 'element', function (node) {
      if (
        node.type === 'element' &&
        include.includes(node.tagName) &&
        node.properties
      ) {
        // Do not add them to `:is(ol, ul).contains-task-list`.
        if (
          Array.isArray(node.properties.className) &&
          node.properties.className.includes('contains-task-list')
        ) {
          return
        }

        node.properties.dir = 'auto'
      }
    })
  }
}
