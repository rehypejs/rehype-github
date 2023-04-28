/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('hast').Text} Text
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast-util-from-markdown').Options} FromMdastOptions
 * @typedef {import('mdast-util-from-markdown').Extension} FromMdastExtension
 * @typedef {import('micromark-util-types').Extension} MicromarkExtension
 * @typedef {import('unist').Point} Point
 * @typedef {import('yaml').DocumentOptions} DocumentOptions
 * @typedef {import('yaml').ParseOptions} ParseOptions_
 * @typedef {import('yaml').SchemaOptions} SchemaOptions
 * @typedef {import('yaml').ToJSOptions} ToJSOptions
 * @typedef {import('yaml').YAMLParseError} ParseError
 */

/**
 * @callback CreateErrorMessage
 *   Create rich content to display an error message to the user.
 * @param {ErrorInfo} info
 *   Info on what went wrong.
 * @returns {Array<ElementContent> | ElementContent}
 *   One or more hast nodes.
 *
 * @typedef ErrorInfo
 *   Info on what went wrong.
 *
 *   > 👉 **Note**: `point` and `summary` are defined by default, but not when
 *   > turning `parseOptions.prettyErrors: false`.
 * @property {string} message
 *   Human readable parse error (from `yaml`).
 * @property {Point | undefined} point
 *   Where the error happened in the original file.
 * @property {string | undefined} summary
 *   Summary with a pointer showing a codeframe of where the error happened.
 * @property {string} yaml
 *   Original input YAML.
 *
 * @typedef Options
 *   Configuration.
 *
 *   > 👉 **Note**: it is recommended to turn `allowArrayAtRoot` and
 *   > `allowPrimitiveAtRoot` on, so that arrays and primitives can be shown
 *   > too.
 *   > You should also probably pass `parseOptions: {}`, as that uses
 *   > modern defaults of `yaml`: YAML 1.2 (which for example does not turn
 *   > `no` into `false`) and not allowing duplicate keys in objects.
 * @property {boolean | null | undefined} [allowArrayAtRoot=false]
 *   Whether to allow arrays at the top of the YAML.
 * @property {boolean | null | undefined} [allowPrimitiveAtRoot=false]
 *   Whether to allow primitives (and dates) at the top of the YAML.
 * @property {CreateErrorMessage | null | undefined} [createErrorMessage=defaultCreateErrorMessage]
 *   Options defining how to show YAML errors.
 * @property {ParseOptions | null | undefined} [parseOptions=defaultParseOptions]
 *   Options defining how to parse YAML.
 *
 * @typedef {ParseOptions_ & DocumentOptions & SchemaOptions & ToJSOptions} ParseOptions
 *   Options defining how to parse YAML.
 */

import {parse} from 'yaml'
import {fromMarkdown} from 'mdast-util-from-markdown'

/** @type {Options} */
const emptyOptions = {}

/**
 * Create rich content to display an error message to the user, like GitHub
 * does.
 *
 * @param {ErrorInfo} info
 *   Info on what went wrong.
 * @returns {Array<ElementContent>}
 *   Rich content.
 */
export function defaultCreateErrorMessage(info) {
  return [
    {
      type: 'element',
      tagName: 'div',
      properties: {className: ['flash', 'flash-error', 'mb-3']},
      children: [
        {
          type: 'text',
          value:
            'Error in user YAML: (<unknown>): ' +
            info.message +
            (info.point
              ? ' at line ' + info.point.line + ' column ' + info.point.column
              : '')
        }
      ]
    },
    {
      type: 'element',
      tagName: 'div',
      properties: {className: ['highlight', 'highlight-source-yaml']},
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [{type: 'text', value: info.yaml}]
        }
      ]
    }
  ]
}

/**
 * Options defining how to parse YAML like GitHub.
 *
 * GH mostly follows YAML 1.1, with some non-standard behavior.
 *
 * @satisfies {ParseOptions}
 */
// See: <https://github.com/gjtorikian/html-pipeline/pull/83/files>
// for more info on how this works.
export const defaultParseOptions = {
  // GH mostly seems to follow YAML 1.1.
  version: '1.1',
  // GH allows duplicate keys.
  uniqueKeys: false
}

/**
 * Plugin to show frontmatter as a table.
 *
 * @this {import('unified').Processor}
 * @type {import('unified').Plugin<[(Options | null | undefined)?], Root>}
 */
export default function remarkGithubYamlMetadata(options) {
  const config = options || emptyOptions
  const parseOptions = config.parseOptions || defaultParseOptions
  const createErrorMessage =
    config.createErrorMessage || defaultCreateErrorMessage
  const allowArrayAtRoot = config.allowArrayAtRoot || false
  const allowPrimitiveAtRoot = config.allowPrimitiveAtRoot || false

  const extensions = /** @type {Array<MicromarkExtension>} */ (
    this.data('micromarkExtensions') || []
  )
  /** @type {FromMdastOptions} */
  const fromMdastOptions = {
    extensions: extensions.filter((d) => {
      // To do: `micromark-extension-*` should support names on non-core
      // constructs, so that YAML can more easily be turned off.
      const keys = Object.keys(d)
      /* c8 ignore next -- always defined with markdown. */
      const flowKeys = Object.keys(d.flow || {})

      // Keep anything else.
      if (
        keys.length !== 1 ||
        keys[0] !== 'flow' ||
        flowKeys.length !== 1 ||
        flowKeys[0] !== '45'
      ) {
        return true
      }

      // Remove YAML.
      return false
    }),
    mdastExtensions: /** @type {Array<FromMdastExtension>} */ (
      this.data('fromMarkdownExtensions') || []
    )
  }

  return function (tree) {
    const node = tree.children[0]

    if (!node || node.type !== 'yaml') {
      return
    }

    // Due to the grammar of YAML, we know exactly what the prefix and suffix
    // are, and we don’t need to slice the source document.
    const value = '---\n' + node.value + '\n---'

    /** @type {Array<ElementContent> | ElementContent | undefined} */
    let result

    try {
      /** @type {unknown} */
      const yamlData = parse(node.value, parseOptions)

      if (Array.isArray(yamlData) && !allowArrayAtRoot) {
        // Empty.
      } else {
        result = transformValue(yamlData)

        if (allowPrimitiveAtRoot) {
          if (!result || result.type !== 'element') {
            result = createTable([
              createTableSection('tbody', [
                createTableCell('td', asChildren(result))
              ])
            ])
          }
        } else if (result && result.type === 'text') {
          result = undefined
        }
      }
    } catch (error) {
      const exception = /** @type {ParseError} */ (error)
      // Reverse: <https://github.com/eemeli/yaml/blob/6f6b0bc/src/errors.ts#L97>.
      const parts = exception.message.split('\n')
      let message = parts[0]
      const match = message.match(/ at line (\d+), column (\d+):$/)
      /** @type {Point | undefined} */
      let point

      if (match) {
        point = {
          line: Number.parseInt(match[1], 10),
          column: Number.parseInt(match[2], 10)
        }
        message = message.slice(0, message.length - match[0].length)
      }

      result = createErrorMessage({
        message,
        summary: parts.length > 1 ? parts.slice(2, -1).join('\n') : undefined,
        yaml: value,
        point
      })
    }

    if (result) {
      result = Array.isArray(result)
        ? {type: 'element', tagName: 'div', properties: {}, children: result}
        : result.type === 'element'
        ? result
        : /* c8 ignore next -- comment/text/raw shouldn’t occur, but good to handle them. */
          {type: 'element', tagName: 'div', properties: {}, children: [result]}

      const data = node.data || (node.data = {})
      data.hName = result.tagName
      data.hProperties = result.properties
      data.hChildren = result.children

      // To do: `mdast-util-to-hast` should keep the `h*` stuff on `yaml`.
      // @ts-expect-error
      node.type = '_custom'
    }
    // If the YAML contains an array, a date, or a primitive (string, etc), or
    // nothing, which is filtered out (default), then the entirety of the YAML
    // is parsed as markdown again.
    // *Weird* I know.
    else {
      const fragment = fromMarkdown(value, fromMdastOptions)
      tree.children.splice(0, 1, ...fragment.children)
    }
  }
}

/**
 * @param {unknown} value
 * @returns {Element | Text | undefined}
 */
function transformValue(value) {
  if (value === null || value === undefined) {
    return
  }

  if (typeof value === 'object') {
    return 'toISOString' in value
      ? transformDate(/** @type {Date} */ (value))
      : Array.isArray(value)
      ? transformArray(/** @type {Array<unknown>} */ (value))
      : // @ts-expect-error: fine
        transformObjectOrMap(value)
  }

  return transformRest(value)
}

/**
 * @param {Record<string, unknown> | Map<unknown, unknown>} value
 * @returns {Element}
 */
function transformObjectOrMap(value) {
  /** @type {Array<[string, unknown]>} */
  // @ts-expect-error: TypeScript doesn’t understand ducktypes.
  const entries = 'entries' in value ? value.entries() : Object.entries(value)
  /** @type {Array<Element>} */
  const head = []
  /** @type {Array<Element>} */
  const body = []

  for (const [key, value] of entries) {
    head.push(createTableCell('th', asChildren(transformValue(key))))
    body.push(createTableCell('td', asChildren(transformValue(value))))
  }

  return createTable([
    createTableSection('thead', head),
    createTableSection('tbody', body)
  ])
}

/**
 * @param {Array<unknown>} value
 * @returns {Element}
 */
function transformArray(value) {
  /** @type {Array<Element>} */
  const body = []

  for (const item of value) {
    body.push(createTableCell('td', asChildren(transformValue(item))))
  }

  return createTable([createTableSection('tbody', body)])
}

/**
 * @param {Array<ElementContent>} children
 * @returns {Element}
 */
function createTable(children) {
  return {type: 'element', tagName: 'table', properties: {}, children}
}

/**
 * @param {'thead' | 'tbody'} tagName
 * @param {Array<ElementContent>} children
 * @returns {Element}
 */
function createTableSection(tagName, children) {
  return {
    type: 'element',
    tagName,
    properties: {},
    children: [{type: 'element', tagName: 'tr', properties: {}, children}]
  }
}

/**
 * @param {'th' | 'td'} tagName
 * @param {Array<ElementContent>} children
 * @returns {Element}
 */
function createTableCell(tagName, children) {
  return {
    type: 'element',
    tagName,
    properties: {},
    children:
      tagName === 'td'
        ? [{type: 'element', tagName: 'div', properties: {}, children}]
        : children
  }
}

/**
 * @param {Date} value
 * @returns {Text}
 */
function transformDate(value) {
  const offset = value.getTimezoneOffset()
  const minutes = Math.abs(offset)
  const hourOffset = Math.floor(minutes / 60)
  const minuteOffset = minutes % 60

  // Note: GH changes datetime’s to their timezone (America/Los_Angeles),
  // we can’t do it, and we probably shouldn’t anyway.
  const result =
    s(value.getFullYear(), 4) +
    '-' +
    s(value.getMonth() + 1, 2) +
    '-' +
    s(value.getDate(), 2) +
    ' ' +
    s(value.getHours(), 2) +
    ':' +
    s(value.getMinutes(), 2) +
    ':' +
    s(value.getSeconds(), 2) +
    ' ' +
    /* c8 ignore next -- Whether this covers depends on where the computer is. */
    (offset <= 0 ? '+' : '-') +
    s(hourOffset, 2) +
    s(minuteOffset, 2)

  return {type: 'text', value: result}
}

/**
 * @param {unknown} value
 * @returns {Text}
 */
function transformRest(value) {
  return {type: 'text', value: String(value)}
}

/**
 * @param {Element | Text | undefined} child
 * @returns {Array<Element | Text>}
 */
function asChildren(child) {
  return child
    ? child.type === 'element'
      ? [child, {type: 'text', value: '\n'}]
      : [child]
    : []
}

/**
 * Format a number, padded with leading zeros.
 *
 * @param {number} value
 * @param {number} size
 */
function s(value, size) {
  return value.toString().padStart(size, '0')
}
