/**
 * @import {RegExpMatchObject, ReplaceFunction} from 'hast-util-find-and-replace'
 * @import {Test} from 'hast-util-is-element'
 * @import {Element, Root} from 'hast'
 * @import {Gemoji} from 'gemoji'
 */

/**
 * @callback Build
 *   Make rich content from an emoji or a gemoji.
 * @param {Gemoji | string} info
 *   Info on the known emoji or gemoji, or the custom gemoji name.
 * @param {string} value
 *   Literal match the way it was written.
 * @returns {ReturnType<ReplaceFunction>}
 *   Markup for the emoji or gemoji.
 *
 * @typedef Options
 *   Configuration.
 * @property {Build | null | undefined} [build]
 *   Make rich content from an emoji or a gemoji.
 * @property {Array<string> | null | undefined} [custom]
 *   Custom gemoji names to enable without colons, such as `['shipit']`.
 *
 *   The default is to enable ±20 custom GitHub-specific shortcodes.
 * @property {Test | null | undefined} [ignore]
 *   Custom test for elements to not enhance.
 *
 *   The default is to ignore `pre`, `code`, `tt`, and `g-emoji`.
 */

import escapeStringRegexp from 'escape-string-regexp'
import {gemoji as listOfGemoji} from 'gemoji'
import {findAndReplace} from 'hast-util-find-and-replace'

/** @type {Options} */
const emptyOptions = {}

const base = 'https://github.githubassets.com/images/icons/emoji/'
/** @type {Array<string>} */
const emojis = []

for (const gemoji of listOfGemoji) {
  // Some emoji contain a VS 16 in their string representation.
  // We’ll use that later,
  // but we’ll also search for versions without them.
  emojis.push(escapeStringRegexp(gemoji.emoji.replace(/\uFE0F$/, '')))
}

// Sort longest first, which means that emoji that are fine on their own (such
// as man) which can also combine to make more extensive emoji (such as man
// with orange hair), comes with combinations first, allowing them to match.
emojis.sort(compareLength)

// Optionally followed by VS 16.
const emojiRegex = new RegExp('(' + emojis.join('|') + ')(?:\\uFE0F)?', 'g')
const gemojiGroup = '\\+1|[-\\w]+'
const gemojiOkRegex = new RegExp('^(' + gemojiGroup + ')$')
const gemojiRegex = new RegExp(':(' + gemojiGroup + '):', 'g')

/**
 * The default builder to turn an emoji or gemoji into rich content.
 *
 * @param {Gemoji | string} info
 *   Info on the known emoji or gemoji, or the custom gemoji name.
 * @param {string} value
 *   Literal match the way it was written.
 * @returns {Element | string}
 *   Markup for the emoji or gemoji.
 */
export function defaultBuild(info, value) {
  // Replace custom gemoji.
  if (typeof info === 'string') {
    return {
      type: 'element',
      tagName: 'img',
      properties: {
        // To do: sort.
        className: ['emoji'],
        title: value,
        alt: value,
        src: base + info + '.png',
        height: 20,
        width: 20,
        align: 'absmiddle'
      },
      children: []
    }
  }

  return value.charAt(0) === ':' ? info.emoji : value
}

/**
 * Default custom gemoji names.
 *
 * @type {Array<string>}
 */
export const defaultCustom = [
  'atom',
  'basecamp',
  'basecampy',
  'bowtie',
  'electron',
  'feelsgood',
  'finnadie',
  'goberserk',
  'godmode',
  'hurtrealbad',
  'neckbeard',
  'octocat',
  'rage1',
  'rage2',
  'rage3',
  'rage4',
  'shipit',
  'suspect',
  'trollface'
]

/**
 * Default tests for elements to not enhance.
 *
 * See: <https://github.com/gjtorikian/html-pipeline/blob/4f1aab0/lib/html/pipeline/emoji_filter.rb#L16>
 *
 * @type {Array<string>}
 */
export const defaultIgnore = ['pre', 'code', 'tt', 'g-emoji']

/**
 * Plugin to enhance emoji and gemoji.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns
 *   Transform.
 */
export default function rehypeGithubEmoji(options) {
  const config = options || emptyOptions
  const ignore = config.ignore || defaultIgnore
  const build = config.build || defaultBuild
  const custom = config.custom || defaultCustom

  for (const name of custom) {
    if (!gemojiOkRegex.test(name)) {
      throw new Error('Custom gemoji `' + name + '` must match `[-\\w]+`')
    }
  }

  /**
   * Transform.
   *
   * @param {Root} tree
   *   Tree.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree) {
    findAndReplace(
      tree,
      [
        [emojiRegex, replaceEmoji],
        [gemojiRegex, replaceGemoji]
      ],
      {ignore}
    )
  }

  /**
   * @param {string} $0
   *   Full match.
   * @param {string} $1
   *   Emoji.
   * @param {RegExpMatchObject} match
   *   Match.
   * @returns {ReturnType<ReplaceFunction>}
   *   Result.
   * @satisfies {ReplaceFunction}
   */
  function replaceEmoji($0, $1, match) {
    const before = match.input.codePointAt(match.index - 1)
    const after = match.input.codePointAt(match.index + $0.length)

    // Not preceded by ZWJ,
    // not followed by VS 15 or ZWJ.
    if (before === 0x20_0d || after === 0x20_0d || after === 0xfe_0e) {
      return false
    }

    /** @type {Gemoji | undefined} */
    let info

    for (const gemoji of listOfGemoji) {
      if (gemoji.emoji === $1 || gemoji.emoji === $1 + '\uFE0F') {
        info = gemoji
        break
      }
    }

    /* c8 ignore next */
    if (!info) throw new Error('Cannot happen')

    return build(info, $0)
  }

  /**
   * @param {string} $0
   *   Full match.
   * @param {string} $1
   *   Emoji.
   * @returns {ReturnType<ReplaceFunction>}
   *   Result.
   * @satisfies {ReplaceFunction}
   */
  function replaceGemoji($0, $1) {
    if (custom.includes($1)) {
      return build($1, $0)
    }

    for (const gemoji of listOfGemoji) {
      if (gemoji.names.includes($1)) {
        return build(gemoji, $0)
      }
    }

    return false
  }
}

/**
 * @param {string} a
 *   Left value.
 * @param {string} b
 *   Right value.
 * @returns {number}
 *   Score.
 */
function compareLength(a, b) {
  return b.length - a.length
}
