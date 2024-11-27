# rehype-github-alert

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[rehype][]** plugin to support alerts like on GitHub.

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`rehypeGithubAlert()`](#rehypegithubalert)
* [Bugs](#bugs)
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

This plugin enhances turns the format that `github.com` uses for alerts
into actual alerts.
It turns blockquotes that start with a specific paragraph (such as `[!note]`)
into `div`s with a particular class:

> \[!note]
>
> This is a note!

This plugin is part of a monorepo [`rehype-github`][monorepo].
See its readme for more info.

## When should I use this?

You can use this plugin when you want to match how github.com works.
For your own pipelines,
similar to github.com,
I would recommend using directives instead.
See [`remark-directive`][remark-directive] for more info.

## Install

This package is [ESM only][esm].
In Node.js (version 16+),
install with [npm][]:

```sh
npm install rehype-github-alert
```

In Deno with [`esm.sh`][esmsh]:

```js
import rehypeGithubAlert from 'https://esm.sh/rehype-github-alert@0'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import rehypeGithubAlert from 'https://esm.sh/rehype-github-alert@0?bundle'
</script>
```

## Use

Say our module `example.js` looks as follows:

```js
import rehypeGithubAlert from 'rehype-github-alert'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'

const file = await unified()
  .use(rehypeParse, {fragment: true})
  .use(rehypeGithubAlert)
  .use(rehypeStringify)
  .process('<blockquote><p>[!note]</p><p>hi</p></blockquote>')

console.log(String(file))
```

…now running `node example.js` yields:

```html
<div class="markdown-alert markdown-alert-note"><p class="markdown-alert-title"><svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>Note</p><p>hi</p></div>
```

## API

This package exports no identifiers.
The default export is
[`rehypeGithubAlert`][api-rehype-github-alert].

### `rehypeGithubAlert()`

Plugin to enhance alerts.

###### Parameters

There are no parameters.

###### Returns

Transform (`(tree: Root, file: VFile) => Promise<Root>`).

## Bugs

There are just many oddities with how this all works.
If you can,
I would recommend using [`remark-directive`][remark-directive] instead.

For a combination of the two,
see
[`remark-github-admonitions-to-directives`][remark-github-admonitions-etc].

## Authoring

You do not need to use screaming uppercase:
`[!note]` is fine!

## HTML

The markup for that github.com adds is:

```html
<div class="markdown-alert markdown-alert-note"><p class="markdown-alert-title"><svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>Note</p><p>hi</p></div>
```

Each different label (such as `tip`) is turned into a different class
(`tip` turns into `markdown-alert-tip`).
They each also get a different icon (`tip` gets `octicon-light-bulb`).

For different HTML,
see
[`rehype-github-alerts`][rehype-github-alerts].

## CSS

See [`github-markdown-css`][github-markdown-css] for the CSS that GitHub uses.
Relevant styles are under `.markdown-alert` and `.octicon`.

## Syntax

No syntax is applicable.

## Types

This package is fully typed with [TypeScript][].
It exports no additional types.

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

[downloads-badge]: https://img.shields.io/npm/dm/rehype-github-alert.svg

[downloads]: https://www.npmjs.com/package/rehype-github-alert

[size-badge]: https://img.shields.io/bundlephobia/minzip/rehype-github-alert.svg

[size]: https://bundlephobia.com/result?p=rehype-github-alert

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

[github-markdown-css]: https://github.com/sindresorhus/github-markdown-css

[rehype-github-alerts]: https://github.com/chrisweb/rehype-github-alerts

[rehype]: https://github.com/rehypjs/rehype

[remark-directive]: https://github.com/remarkjs/remark-directive

[remark-github-admonitions-etc]: https://github.com/incentro-ecx/remark-github-admonitions-to-directives

[api-rehype-github-alert]: #rehypegithubalert
