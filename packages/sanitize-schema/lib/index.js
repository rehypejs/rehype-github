/**
 * @import {Schema} from 'hast-util-sanitize'
 */

import {ok as assert} from 'devlop'
import {defaultSchema} from 'hast-util-sanitize'

assert(defaultSchema.attributes)
assert(defaultSchema.tagNames)

/**
 * @type {Schema}
 */
export const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': ['disabled', 'type', ...defaultSchema.attributes['*']]
  },
  tagNames: [...defaultSchema.tagNames, 'mark']
}
