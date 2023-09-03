# remark-github-break

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[remark][]** plugin to turn normal line endings into hard breaks.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`remarkGithubBreak()`](#remarkgithubbreak)
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
*   [Notice](#notice)
*   [License](#license)

## What is this?

This plugin turns normal line endings (soft breaks) into `<br>` elements
(hard breaks).

This behavior is specific to github.com that only work in comments, not in
files.

This plugin is part of a monorepo `rehype-github`.
See its readme for more info.

## When should I use this?

You can use this plugin when you want to match how github.com works or when you
want to build similar pipelines.

This plugin is useful if you want to display user content closer to how it was
authored, because when a user includes a line ending, it’ll show as such.
This is *not* semantic according to HTML and not compliant to markdown.
Markdown already has two ways to include hard breaks, namely trailing spaces and
escapes (note that `␠` represents a normal space):

```markdown
lorem␠␠
ipsum

lorem\
ipsum
```

Both will turn into `<br>`s.
If you control who authors content or can document how markdown works, it’s
recommended to use escapes instead.

## Install

This package is [ESM only][esm].
In Node.js (version 16.0+), install with [npm][]:

```sh
npm install remark-github-break
```

In Deno with [`esm.sh`][esmsh]:

```js
import remarkGithubBreak from 'https://esm.sh/remark-github-break@0'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import remarkGithubBreak from 'https://esm.sh/remark-github-break@0?bundle'
</script>
```

## Use

Say our module `example.js` looks as follows:

```js
import remarkGithubBreak from 'remark-github-break'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'

const file = await unified()
  .use(remarkParse)
  .use(remarkGithubBreak)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process('Hello,\nworld!\n======')

console.log(String(file))
```

…now running `node example.js` yields:

```html
<h1>Hello,<br>
world!</h1>
```

## API

This package exports no identifiers.
The default export is
[`remarkGithubBreak`][api-remark-github-break].

### `remarkGithubBreak()`

Plugin to turn normal line endings into hard breaks.

## Bugs

GitHub performs this behavior in their parser (`cmark-gfm`), operating on the
markdown, similar to how GFM is implemented as syntax extensions.
That means that breaks only work in paragraphs and headings when authored
with markdown, not with HTML.

This behavior being not semantic according to HTML can also be considered a
bug.

## Authoring

It’s recommended not to depend on this behavior.

## HTML

The markup for breaks is:

```html
<br>
```

## CSS

No CSS is needed.

## Syntax

Breaks form with the following BNF:

```bnf
break ::= '\n'
```

## Types

This package is fully typed with [TypeScript][].
It exports no additional types.

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

This plugin works with `unified` version 6+ and `remark` version 7+.

## Security

This package is safe.

## Related

*   [`remark-gfm`](https://github.com/remarkjs/remark-gfm)
    — support GFM in remark
*   [`remark-breaks`](https://github.com/remarkjs/remark-breaks)
    — same

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

[downloads-badge]: https://img.shields.io/npm/dm/remark-github-break.svg

[downloads]: https://www.npmjs.com/package/remark-github-break

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-github-break.svg

[size]: https://bundlephobia.com/result?p=remark-github-break

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

[remark]: https://github.com/remarkjs/remark

[api-remark-github-break]: #remarkgithubbreak
