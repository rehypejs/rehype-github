/**
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('hast').Root} Root
 */

/**
 * @typedef {'append' | 'replace'} Behavior
 *   What to do with the result from the builder.
 *
 *   You can either append to the code element or replace it.
 *
 * @callback Build
 *   Make rich content from a color.
 * @param {string} value
 *   Color matched by expression.
 * @returns {ElementContent | Array<ElementContent>}
 *   Rich content.
 *
 * @typedef Options
 *   Configuration.
 * @property {Behavior | null | undefined} [behavior]
 *   What to do with the existing code and the built content.
 * @property {Build | null | undefined} [build]
 *   Make rich content from a color.
 * @property {RegExp | null | undefined} [expression]
 *   Match colors.
 */

import {visit} from 'unist-util-visit'
import {toString} from 'hast-util-to-string'

/** @type {Options} */
const emptyOptions = {}

const hex = /#[\da-fA-F]{6}/
// 👉 **Note**: the regex for RGB is weird!
// It allows giant numbers, or decimals without dots.
// But hey, that’s GitHub!
const rgb = /rgb\( *(?:\d+(?!\.)|\d*\.\d*) *(, *(?:\d+(?!\.)|\d*\.\d*) *){2}\)/
// 👉 **Note**: group for `rgba` is same as `rgb`, other than that `a`, and 3
// groups instead of 2.
const rgba =
  /rgba\( *(?:\d+(?!\.)|\d*\.\d*) *(, *(?:\d+(?!\.)|\d*\.\d*) *){3}\)/
// 👉 **Note**: you’d think that GitHub would, just like rgb and rgba, implement
// hsl and hsla, and just like they don’t support alpha in rgb and do support
// it in rgba, the same would be true for hsl and hsla?
// NO!
// They don’t.
const hsl =
  /hsl\( *(?:\d+(?!\.)|\d*\.\d*) *(, *(?:\d+(?!\.)|\d*\.\d*)% *){2}(, *(?:\d+(?!\.)|\d*\.\d*) *)?\)/

/**
 * The default builder to turn a color into rich content.
 *
 * @param {string} value
 *   Color matched by expression.
 * @returns {ElementContent}
 *   The markup for a color chip that is appended to the code by github.com.
 */
export function defaultBuild(value) {
  return {
    type: 'element',
    tagName: 'span',
    properties: {
      className: [
        'ml-1',
        'd-inline-block',
        'border',
        'circle',
        'color-border-subtle'
      ],
      style: 'background-color: ' + value + '; height: 8px; width: 8px;'
    },
    children: []
  }
}

/**
 * The default expression that GitHub uses to match colors.
 *
 * Supports some formats of hex (`#00eaff`), RGB (`rgb(1, 2, 3)`), RGBA
 * (`rgba(1, 2, 3, 0.4)`), and HSL (`hsl(0, 1%, 2%)`) colors.
 */
export const defaultExpression = new RegExp(
  '^(?:' + [hex.source, rgb.source, rgba.source, hsl.source].join('|') + ')$'
)

/**
 * Plugin to enhance code for colors.
 *
 * @type {import('unified').Plugin<[(Options | null | undefined)?], Root>}
 * @param options
 *   Configuration.
 */
export default function rehypeGithubColor(options) {
  const config = options || emptyOptions
  const expression = config.expression || defaultExpression
  const build = config.build || defaultBuild
  const behavior = config.behavior || 'append'

  return function (tree) {
    visit(tree, 'element', (node, index, parent) => {
      if (
        node.tagName === 'code' &&
        node.properties &&
        typeof index === 'number' &&
        parent
      ) {
        const value = toString(node)

        if (expression.test(value)) {
          const result = build(value)

          if (behavior === 'replace') {
            if (Array.isArray(result)) {
              parent.children.splice(index, 1, ...result)
              return index + result.length
            }

            parent.children[index] = result
          }
          // Append.
          else if (Array.isArray(result)) {
            node.children.push(...result)
          } else {
            node.children.push(result)
          }
        }
      }
    })
  }
}
