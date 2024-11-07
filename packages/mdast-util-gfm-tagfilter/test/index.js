import assert from 'node:assert/strict'
import test from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {gfmTagfilterFromMarkdown} from 'mdast-util-gfm-tagfilter'

test('gfmTagFilter', async () => {
  assert.deepEqual(
    Object.keys(await import('mdast-util-gfm-tagfilter')).sort(),
    ['gfmTagfilterFromMarkdown'],
    'should expose the public api'
  )

  assert.equal(
    typeof gfmTagfilterFromMarkdown,
    'function',
    'should be a function'
  )

  assert.deepEqual(
    fromMarkdown(
      'asd <script>alert(1)</script>\n\n<style>* {color:red}</style>',
      {mdastExtensions: [gfmTagfilterFromMarkdown()]}
    ),
    {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'asd ',
              position: {
                start: {line: 1, column: 1, offset: 0},
                end: {line: 1, column: 5, offset: 4}
              }
            },
            {
              type: 'html',
              value: '&lt;script>',
              position: {
                start: {line: 1, column: 5, offset: 4},
                end: {line: 1, column: 13, offset: 12}
              }
            },
            {
              type: 'text',
              value: 'alert(1)',
              position: {
                start: {line: 1, column: 13, offset: 12},
                end: {line: 1, column: 21, offset: 20}
              }
            },
            {
              type: 'html',
              value: '&lt;/script>',
              position: {
                start: {line: 1, column: 21, offset: 20},
                end: {line: 1, column: 30, offset: 29}
              }
            }
          ],
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 30, offset: 29}
          }
        },
        {
          type: 'html',
          value: '&lt;style>* {color:red}&lt;/style>',
          position: {
            start: {line: 3, column: 1, offset: 31},
            end: {line: 3, column: 29, offset: 59}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 3, column: 29, offset: 59}
      }
    },
    'should work'
  )
})
