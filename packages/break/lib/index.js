/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast-util-find-and-replace').ReplaceFunction} ReplaceFunction
 */

import {findAndReplace} from 'mdast-util-find-and-replace'

/**
 * Plugin to turn normal line endings into hard breaks.
 *
 * @type {import('unified').Plugin<[], Root>}
 */
export default function remarkGithubBreaks() {
  return function (tree) {
    findAndReplace(tree, /\r?\n|\r/g, replace)
  }
}

/**
 * Replace line endings.
 *
 * @type {ReplaceFunction}
 * @param {string} value
 */
function replace(value) {
  return [{type: 'break'}, {type: 'text', value}]
}
