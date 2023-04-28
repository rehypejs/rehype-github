/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('hast').Root} Root
 */

/**
 * @typedef {'append' | 'prepend'} Behavior
 *   What to do with the new link to the existing heading.
 *
 * @callback Build
 *   Make rich content to link to a heading.
 * @param {string} id
 *   ID of heading.
 * @param {Element} node
 *   Heading.
 * @returns {Array<ElementContent> | ElementContent}
 *   Rich content.
 *
 * @typedef Options
 *   Configuration.
 * @property {Behavior | null | undefined} [behavior='prepend']
 *   What to do with the new link to the existing heading.
 * @property {Build | null | undefined} [build]
 *   Make rich content to link to a heading.
 * @property {Array<string> | null | undefined} [include]
 *   Elements to link.
 *
 *   The default behavior is to enhance `h1`, `h2`, `h3`, `h4`, `h5`, and `h6`.
 */

import {visit, SKIP} from 'unist-util-visit'
import {toString} from 'hast-util-to-string'
import GithubSlugger from 'github-slugger'

/** @type {Options} */
const emptyOptions = {}

/**
 * The chain link icon used by GH.
 */
const d =
  'm7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z'

/**
 * Make rich content to link to a heading like github.com.
 *
 * @param {string} id
 *   ID corresponding to heading.
 * @returns {Element}
 *   Link with icon.
 */
export function defaultBuild(id) {
  return {
    type: 'element',
    tagName: 'a',
    properties: {id, className: ['anchor'], ariaHidden: 'true', href: '#' + id},
    children: [
      {
        type: 'element',
        tagName: 'svg',
        properties: {
          className: ['octicon', 'octicon-link'],
          viewBox: '0 0 16 16',
          version: '1.1',
          width: '16',
          height: '16',
          ariaHidden: 'true'
        },
        children: [
          {type: 'element', tagName: 'path', properties: {d}, children: []}
        ]
      }
    ]
  }
}

/**
 * Elements to look for to link.
 */
export const defaultInclude = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

/**
 * Plugin to enhance headings.
 *
 * @type {import('unified').Plugin<[(Options | null | undefined)?], Root>}
 * @param options
 *   Configuration.
 */
export default function rehypeGithubHeading(options) {
  const config = options || emptyOptions
  const build = config.build || defaultBuild
  const behavior = config.behavior || 'prepend'
  const include = config.include || defaultInclude
  const slugger = new GithubSlugger()

  return function (tree) {
    visit(tree, 'element', function (node) {
      if (node.type === 'element' && node.properties) {
        // Do not enter the footnote section.
        if (
          node.tagName === 'section' &&
          Array.isArray(node.properties.className) &&
          node.properties.className.includes('footnotes')
        ) {
          return SKIP
        }

        if (include.includes(node.tagName)) {
          const text = toString(node)

          if (text) {
            const id = slugger.slug(text)
            const result = build(id, node)
            const fn = behavior === 'prepend' ? 'unshift' : 'push'
            if (Array.isArray(result)) {
              node.children[fn](...result)
            } else {
              node.children[fn](result)
            }
          }
        }
      }
    })
  }
}
