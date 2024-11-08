/**
 * @import {ElementContent, Element, Root} from 'hast'
 * @import {VisitorResult} from 'unist-util-visit'
 */

/**
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
 * @property {Build | null | undefined} [build]
 *   Make rich content to link to a heading.
 * @property {Array<string> | null | undefined} [include]
 *   Elements to link.
 *
 *   The default behavior is to enhance `h1`, `h2`, `h3`, `h4`, `h5`, and `h6`.
 */

import GithubSlugger from 'github-slugger'
import {toString} from 'hast-util-to-string'
import {SKIP, visit} from 'unist-util-visit'

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
 * @param {Element} node
 *   Heading.
 * @returns {Element}
 *   Link with icon.
 */
export function defaultBuild(id, node) {
  let text = toString(node)
  if (text.trim() === '') text = ''

  const classes = node.properties.className || []

  if (Array.isArray(classes)) {
    classes.push('heading-element')
  }

  node.properties.className = classes

  return {
    type: 'element',
    tagName: 'div',
    properties: {className: ['markdown-heading']},
    children: [
      node,
      {
        type: 'element',
        tagName: 'a',
        // To do: sort properties.
        properties: {
          id,
          className: ['anchor'],
          // To do: i18n.
          // Note `'\t'` -> `''`.
          ariaLabel: 'Permalink: ' + text,
          href: '#' + id
        },
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
              {
                type: 'element',
                tagName: 'path',
                properties: {d},
                children: []
              }
            ]
          }
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
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns
 *   Transform.
 */
export default function rehypeGithubHeading(options) {
  const config = options || emptyOptions
  const build = config.build || defaultBuild
  const include = config.include || defaultInclude
  const slugger = new GithubSlugger()

  /**
   * Transform.
   *
   * @param {Root} tree
   *   Tree.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree) {
    visit(
      tree,
      'element',
      /**
       * @returns {VisitorResult | undefined}
       *   Skip or index.
       */
      function (node, index, parent) {
        if (typeof index === 'number' && parent) {
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
              const nodes = Array.isArray(result) ? result : [result]
              parent.children.splice(index, 1, ...nodes)
              return [SKIP, index + nodes.length]
            }
          }
        }
      }
    )
  }
}
