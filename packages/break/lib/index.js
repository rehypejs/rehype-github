/**
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast-util-find-and-replace').ReplaceFunction} ReplaceFunction
 */

import {findAndReplace} from 'mdast-util-find-and-replace'

/**
 * Plugin to turn normal line endings into hard breaks.
 *
 * @returns
 *   Transform.
 */
export default function remarkGithubBreaks() {
  /**
   * Transform.
   *
   * @param {Root} tree
   *   Tree.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree) {
    findAndReplace(tree, [/\r?\n|\r/g, replace])
  }
}

/**
 * Replace line endings.
 *
 * @returns {Array<PhrasingContent>}
 * @satisfies {ReplaceFunction}
 */
function replace() {
  return [{type: 'break'}]
}
