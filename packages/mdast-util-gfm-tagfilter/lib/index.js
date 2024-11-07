/**
 * @import {CompileContext, Extension as FromMarkdownExtension, Token} from 'mdast-util-from-markdown'
 */

import {ok as assert} from 'devlop'

// An opening or closing tag start,
// followed by a case-insensitive specific tag name,
// followed by HTML whitespace,
// a greater than,
// or a slash.
const reFlow =
  /<(\/?)(iframe|noembed|noframes|plaintext|script|style|title|textarea|xmp)(?=[\t\n\f\r />])/gi

// As HTML (text) parses tags separately (and very strictly),
// we don’t need to be global.
const reText = new RegExp('^' + reFlow.source, 'i')

/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM tag filter
 * in markdown.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM tag filter.
 */
export function gfmTagfilterFromMarkdown() {
  return {
    exit: {
      htmlFlowData(token) {
        exitHtmlData.call(this, token, reFlow)
      },
      htmlTextData(token) {
        exitHtmlData.call(this, token, reText)
      }
    }
  }
}

/**
 * @this {CompileContext}
 *   Context.
 * @param {Token} token
 *   Current token.
 * @param {RegExp} filter
 *   Expression.
 * @returns {undefined}
 *   Nothing.
 */
function exitHtmlData(token, filter) {
  const tail = this.stack.pop()
  assert(tail, 'expected a `node` to be on the stack')
  assert('value' in tail, 'expected a `literal` to be on the stack')
  assert(tail.position, 'expected `node` to have an open position')
  tail.value += this.sliceSerialize(token).replace(filter, '&lt;$1$2')
  tail.position.end = {
    line: token.end.line,
    column: token.end.column,
    offset: token.end.offset
  }
}
