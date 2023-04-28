# rehype-github-link

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[rehype][]** plugin to enhance links.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`rehypeGithubLink(options?)`](#rehypegithublinkoptions)
    *   [`Options`](#options)
*   [Bugs](#bugs)
*   [Authoring](#authoring)
*   [HTML](#html)
*   [CSS](#css)
*   [Syntax](#syntax)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This plugin enhances links by marking them as external.
By default it appends `rel="nofollow"` to links that are neither local nor
go to `github.com`.

This plugin is part of a monorepo `rehype-github`.
See its readme for more info.

## When should I use this?

You can use this plugin when you want to match how github.com works or when you
want to build similar pipelines that have user content.

## Install

This package is [ESM only][esm].
In Node.js (version 16.0+), install with [npm][]:

```sh
npm install rehype-github-link
```

In Deno with [`esm.sh`][esmsh]:

```js
import rehypeGithubLink from 'https://esm.sh/rehype-github-link@0'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import rehypeGithubLink from 'https://esm.sh/rehype-github-link@0?bundle'
</script>
```

## Use

Say our module `example.js` looks as follows:

```js
import rehypeGithubLink from 'rehype-github-link'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'

const file = await unified()
  .use(rehypeParse, {fragment: true})
  .use(rehypeGithubLink)
  .use(rehypeStringify)
  .process('<a href="https://example.com">link</a>')

console.log(String(file))
```

…now running `node example.js` yields:

```html
<a href="https://example.com" rel="nofollow">link</a>
```

## API

This package exports no identifiers.
The default export is
[`rehypeGithubLink`][api-rehype-github-link].

### `rehypeGithubLink(options?)`

Plugin to enhance links.

###### Parameters

*   `options` ([`Options`][api-options], optional)
    — configuration

### `Options`

Configuration (TypeScript type).

###### Fields

*   `internal` (`Array<string>` or `string`, default: `'github.com'`)
    — hostname or hostnames to not mark as external
*   `rel` (`Array<string>` or `string`, default: `'nofollow'`)
    — relationship(s) of your site to external content, used in `rel`; You
    should probably set `['nofollow', 'ugc']`

## Bugs

There are no bugs with how GitHub does this, but they could use
`['nofollow', 'ugc']` instead.

## Authoring

There are no additional recommendations on how to author links in markdown.

## HTML

The markup that github.com adds is:

```html
rel="nofollow"
```

## CSS

No CSS is needed.

## Syntax

No syntax is applicable.

## Types

This package is fully typed with [TypeScript][].
It exports the additional type [`Options`][api-options].

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

This plugin works with `rehype-parse` version 3+, `rehype-stringify` version
3+, `rehype` version 5+, and `unified` version 6+.

## Security

This package is safe.

## Related

*   [`remark-gfm`](https://github.com/remarkjs/remark-gfm)
    — support GFM in remark
*   [`rehype-external-links`](https://github.com/rehypejs/rehype-external-links)
    — similar plugin

## Contribute

See [`contributing.md` in `rehypejs/.github`][contributing] for ways to get
started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## Notice

This project is not affiliated with **GitHub**.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/rehypejs/rehype-github/workflows/main/badge.svg

[build]: https://github.com/rehypejs/rehype-github/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/rehypejs/rehype-github.svg

[coverage]: https://codecov.io/github/rehypejs/rehype-github

[downloads-badge]: https://img.shields.io/npm/dm/rehype-github-color.svg

[downloads]: https://www.npmjs.com/package/rehype-github-color

[size-badge]: https://img.shields.io/bundlephobia/minzip/rehype-github-color.svg

[size]: https://bundlephobia.com/result?p=rehype-github-color

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

[rehype]: https://github.com/rehypjs/rehype

[api-options]: #options

[api-rehype-github-link]: #rehypegithublinkoptions
