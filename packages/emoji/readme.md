# rehype-github-emoji

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[rehype][]** plugin to enhance emoji and gemoji.

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`defaultBuild(info, value)`](#defaultbuildinfo-value)
  * [`defaultCustom`](#defaultcustom)
  * [`defaultIgnore`](#defaultignore)
  * [`rehypeGithubEmoji(options?)`](#rehypegithubemojioptions)
  * [`Build`](#build)
  * [`Gemoji`](#gemoji)
  * [`Options`](#options)
* [Authoring](#authoring)
* [HTML](#html)
* [CSS](#css)
* [Syntax](#syntax)
* [Types](#types)
* [Compatibility](#compatibility)
* [Security](#security)
* [Related](#related)
* [Contribute](#contribute)
* [Notice](#notice)
* [License](#license)

## What is this?

This plugin enhances unicode emoji (👍),
gemoji shortcodes (`:+1:`),
and custom gemoji (`:shipit:`, :shipit:).
By default it wraps them with a custom element,
specific to GitHub,
which you will want to change.

This plugin is part of a monorepo [`rehype-github`][monorepo].
See its readme for more info.

## When should I use this?

You can use this plugin when you want to match how github.com works or when you
want to build similar pipelines that enhance emoji.

## Install

This package is [ESM only][esm].
In Node.js (version 16+),
install with [npm][]:

```sh
npm install rehype-github-emoji
```

In Deno with [`esm.sh`][esmsh]:

```js
import rehypeGithubEmoji from 'https://esm.sh/rehype-github-emoji@1'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import rehypeGithubEmoji from 'https://esm.sh/rehype-github-emoji@1?bundle'
</script>
```

## Use

Say our module `example.js` looks as follows:

```js
import rehypeGithubEmoji from 'rehype-github-emoji'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'

const file = await unified()
  .use(rehypeParse, {fragment: true})
  .use(rehypeGithubEmoji)
  .use(rehypeStringify)
  .process(':shipit: 👍')

console.log(String(file))
```

…now running `node example.js` yields:

```html
<img class="emoji" title=":shipit:" alt=":shipit:" src="https://github.githubassets.com/images/icons/emoji/shipit.png" height="20" width="20" align="absmiddle"> 👍
```

## API

This package exports the identifiers
[`defaultBuild`][api-default-build],
[`defaultCustom`][api-default-custom],
and
[`defaultIgnore`][api-default-ignore].
The default export is
[`rehypeGithubEmoji`][api-rehype-github-emoji].

### `defaultBuild(info, value)`

The default builder to turn an emoji or gemoji into rich content.

###### Parameters

* `info` ([`Gemoji`][api-gemoji] or `string`)
  — info on the known emoji or gemoji,
  or the custom gemoji name
* `value` (`string`)
  — literal match the way it was written

###### Returns

Markup for the emoji or gemoji ([`Element`][element]).

### `defaultCustom`

Default custom gemoji names (`Array<string>`).

### `defaultIgnore`

Default tests for elements to not enhance (`Array<string>`).

### `rehypeGithubEmoji(options?)`

Plugin to enhance emoji and gemoji.

###### Parameters

* `options` ([`Options`][api-options], optional)
  — configuration

### `Build`

Make rich content from an emoji or a gemoji (TypeScript type).

###### Parameters

* `info` ([`Gemoji`][api-gemoji] or `string`)
  — info on the known emoji or gemoji,
  or the custom gemoji name
* `value` (`string`)
  — literal match the way it was written

###### Returns

Rich content ([`ElementContent`][element],
`Array<ElementContent>`,
`false`).

### `Gemoji`

Info on an emoji (TypeScript type).

###### Fields

* `emoji` (`string`)
  — example: `'😀'`
* `names` (`Array<string>`)
  — example: `['grinning']`
* `tags` (`Array<string>`)
  — example: `['smile', 'happy']`
* `description` (`string`)
  — example: `'grinning face'`
* `category` (`string`)
  — example: `'Smileys & Emotion'`

### `Options`

Configuration (TypeScript type).

###### Fields

* `build` ([`Build`][api-build],
  default: [`defaultBuild`][api-default-build])
  — make rich content from an emoji or a gemoji
* `custom` (`Array<string>`,
  default: [`defaultCustom`][api-default-custom])
  — custom gemoji names to enable without colons,
  such as `['shipit']`;
  the default is to enable ±20 custom GitHub-specific shortcodes
* `ignore` ([`Test`][test],
  default: [`defaultIgnore`][api-default-ignore])
  — custom test for elements to not enhance;
  the default is to ignore `pre`, `code`, `tt`, and `g-emoji`

## Authoring

If you want the text representation of an emoji,
add VS 15 (`\uFE0E`) after it.

See [§ Writing on GitHub][github-docs] for more info.

## HTML

The markup for known emoji on github.com used to be a `g-emoji` but is now
just the unicide itself:

```html
👍
```

For custom emoji,
they generate:

```html
<img class="emoji" title=":shipit:" alt=":shipit:" src="https://github.githubassets.com/images/icons/emoji/shipit.png" height="20" width="20" align="absmiddle">
```

You could generate a `g-emoji` and enhance custom element
(such as with [`@github/g-emoji-element`][g-emoji])
or you can generate anything you want.

## CSS

The following CSS is needed to make emoji markup look like GitHub.

```css
.emoji {
  background-color: transparent;
  box-sizing: content-box;
  vertical-align: text-top;
}
```

## Syntax

The syntax for emoji and gemoji cannot be captured in BNF.
Or at least,
it doesn’t get more readable than the source code.
Check out `lib/index.js` for how things work!

## Types

This package is fully typed with [TypeScript][].
It exports the additional types [`Build`][api-build],
[`Gemoji`][api-gemoji],
and [`Options`][api-options].

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now,
that is Node.js 16+.
Our projects sometimes work with older versions,
but this is not guaranteed.

This plugin works with `rehype-parse` version 3+,
`rehype-stringify` version 3+,
`rehype` version 5+,
and `unified` version 6+.

## Security

This package is safe.
The `build` option is unsafe when used with user content as it allows for
arbitrary HTML.

## Related

* [`remark-gfm`](https://github.com/remarkjs/remark-gfm)
  — support GFM in remark

## Contribute

See [`contributing.md` in `rehypejs/.github`][contributing] for ways to get
started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository,
organization,
or community you agree to abide by its terms.

## Notice

This project is not affiliated with **GitHub**.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/rehypejs/rehype-github/workflows/main/badge.svg

[build]: https://github.com/rehypejs/rehype-github/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/rehypejs/rehype-github.svg

[coverage]: https://codecov.io/github/rehypejs/rehype-github

[downloads-badge]: https://img.shields.io/npm/dm/rehype-github-emoji.svg

[downloads]: https://www.npmjs.com/package/rehype-github-emoji

[size-badge]: https://img.shields.io/bundlephobia/minzip/rehype-github-emoji.svg

[size]: https://bundlephobia.com/result?p=rehype-github-emoji

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/rehypejs/rehype/discussions

[npm]: https://docs.npmjs.com/cli/install

[esmsh]: https://esm.sh

[license]: ../../license

[author]: https://wooorm.com

[contributing]: https://github.com/rehypejs/.github/blob/main/contributing.md

[support]: https://github.com/rehypejs/.github/blob/main/support.md

[coc]: https://github.com/rehypejs/.github/blob/main/code-of-conduct.md

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[typescript]: https://www.typescriptlang.org

[monorepo]: https://github.com/rehypejs/rehype-github

[rehype]: https://github.com/rehypjs/rehype

[element]: https://github.com/syntax-tree/hast#element

[test]: https://github.com/syntax-tree/hast-util-is-element/tree/main#test

[github-docs]: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#using-emoji

[g-emoji]: https://github.com/github/g-emoji-element#readme

[api-build]: #build

[api-default-build]: #defaultbuildinfo-value

[api-default-custom]: #defaultcustom

[api-default-ignore]: #defaultignore

[api-gemoji]: #gemoji

[api-options]: #options

[api-rehype-github-emoji]: #rehypegithubemojioptions
