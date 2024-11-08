/**
 * @import {ReplaceFunction} from 'mdast-util-find-and-replace'
 * @import {PhrasingContent, Root} from 'mdast'
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
 *   Break.
 * @satisfies {ReplaceFunction}
 */
function replace() {
  return [{type: 'break'}]
}
