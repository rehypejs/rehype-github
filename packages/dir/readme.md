# rehype-github-dir

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[rehype][]** plugin to add `dir=auto` to elements.

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`defaultInclude`](#defaultinclude)
  * [`rehypeGithubDir(options?)`](#rehypegithubdiroptions)
  * [`Options`](#options)
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

This plugin improves support for bidirectional text in user content.
It adds [`dir=auto`][mdn-dir] to several elements such as `p` and `h1`.
Doing so lets each element infer its directionality.
Without it,
the entire content would be one directionality.

<details><summary>What? Why!</summary>

Take the following HTML and try it in your browser.
It contains examples of paragraphs in Yiddish and in English,
with different combinations of `dir` attributes.

```html
<!doctype html>
<html lang=en>
<meta charset=utf8>
<title>Example</title>
<style>
  body { font-family: system-ui; margin: 0 auto; max-width: 40em }
  div, p { border: 1ex solid tomato; margin: 1ex; padding: 1ex; position: relative }
  p { padding: 1ex 12ex }
  :is(div, p)::after { background-color: tomato; content: "no dir"; padding: 1ex; position: absolute; right: 0; top: 0 }
  :is(div, p)[dir]::after { content: "[dir=" attr(dir) "]" }
</style>
<div>
  <p lang=yi>א גוטן טאג</p>
  <p>Good day</p>
</div>
<div dir="auto">
  <p lang=yi>א גוטן טאג</p>
  <p>Good day</p>
</div>
<div dir="ltr">
  <p lang=yi>א גוטן טאג</p>
  <p>Good day</p>
</div>
<div dir="rtl">
  <p lang=yi>א גוטן טאג</p>
  <p>Good day</p>
</div>
<div>
  <p dir="auto" lang=yi>א גוטן טאג</p>
  <p dir="auto">Good day</p>
</div>
```

Yields:

![Screenshot of above HTML rendered in a browser,
which shows that using dir on wrapping elements does not improve the situation,
but dir=auto on each element does,
because then the Yiddish paragraphs are right aligned,
and the English paragraphs are left aligned.](example.png)

</details>

This plugin is part of a monorepo [`rehype-github`][monorepo].
See its readme for more info.

## When should I use this?

You can use this plugin when you want to match how github.com works or when you
want to build similar pipelines that lets users write in a different
directionality than your own website,
or to use different directionalities in their content.

## Install

This package is [ESM only][esm].
In Node.js (version 16+),
install with [npm][]:

```sh
npm install rehype-github-dir
```

In Deno with [`esm.sh`][esmsh]:

```js
import rehypeGithubDir from 'https://esm.sh/rehype-github-dir@0'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import rehypeGithubDir from 'https://esm.sh/rehype-github-dir@0?bundle'
</script>
```

## Use

Say our module `example.js` looks as follows:

```js
import rehypeGithubDir from 'rehype-github-dir'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'

const file = await unified()
  .use(rehypeParse, {fragment: true})
  .use(rehypeGithubDir)
  .use(rehypeStringify)
  .process('<p>א גוטן טאג</p>\n<p>Good day</p>')

console.log(String(file))
```

…now running `node example.js` yields:

```html
<p dir="auto">א גוטן טאג</p>
<p dir="auto">Good day</p>
```

## API

This package exports the identifier [`defaultInclude`][api-default-include].
The default export is [`rehypeGithubDir`][api-rehype-github-dir].

### `defaultInclude`

List of tag names that github.com enhances (`Array<string>`).

### `rehypeGithubDir(options?)`

Plugin to add `dir=auto` to elements.

###### Parameters

* `options` ([`Options`][api-options])
  — configuration

### `Options`

Configuration (TypeScript type).

###### Fields

* `include` (`Array<string>`,
  default: [`defaultInclude`][api-default-include])
  — elements to enhance;
  the default behavior is to add `dir` to `div`, `h1`, `h2`, `h3`, `h4`, `h5`,
  `h6`, `ol`, `p`, and `ul`

## Bugs

Right-to-left language rendering on GitHub is within progress.
See [`community/community#8115`][8115] for more info.

## Authoring

Just be careful that the behavior on GitHub is,
through HTML itself,
dependent on the *first* character that is strongly right-to-left or
left-to-right.
Not based on a “predominatly used” heuristic.

## HTML

The markup for that github.com adds is:

```html
dir="auto"
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

[downloads-badge]: https://img.shields.io/npm/dm/rehype-github-dir.svg

[downloads]: https://www.npmjs.com/package/rehype-github-dir

[size-badge]: https://img.shields.io/bundlephobia/minzip/rehype-github-dir.svg

[size]: https://bundlephobia.com/result?p=rehype-github-dir

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

[8115]: https://github.com/orgs/community/discussions/8115

[mdn-dir]: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir

[api-default-include]: #defaultinclude

[api-rehype-github-dir]: #rehypegithubdiroptions

[api-options]: #options
