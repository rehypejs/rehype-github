# rehype-github-heading

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[rehype][]** plugin to enhance headings.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`defaultBuild(id)`](#defaultbuildid)
    *   [`defaultInclude`](#defaultinclude)
    *   [`rehypeGithubHeading(options?)`](#rehypegithubheadingoptions)
    *   [`Behavior`](#behavior)
    *   [`Build`](#build)
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
*   [Notice](#notice)
*   [License](#license)

## What is this?

This plugin enhances headings by adding links from headings back to themselves.
By default it appends markup for an anchor tag with a link icon that, with some
CSS, can be displayed next to the heading, potentially on hover.

These links are markup specific to github.com that only work in files, not in
comments.

This plugin is part of a monorepo `rehype-github`.
See its readme for more info.

## When should I use this?

You can use this plugin when you want to match how github.com works or when you
want to build similar pipelines where you have relatively long documents and
want users to be able to link to particular sections.

## Install

This package is [ESM only][esm].
In Node.js (version 16.0+), install with [npm][]:

```sh
npm install rehype-github-heading
```

In Deno with [`esm.sh`][esmsh]:

```js
import rehypeGithubHeading from 'https://esm.sh/rehype-github-heading@0'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import rehypeGithubHeading from 'https://esm.sh/rehype-github-heading@0?bundle'
</script>
```

## Use

Say our module `example.js` looks as follows:

```js
import rehypeGithubHeading from 'rehype-github-heading'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'

const file = await unified()
  .use(rehypeParse, {fragment: true})
  .use(rehypeGithubHeading)
  .use(rehypeStringify)
  .process('<h1>Hi!</h1>')

console.log(String(file))
```

…now running `node example.js` yields:

```html
<h1><a id="hi" class="anchor" aria-hidden="true" href="#hi"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path></svg></a>Hi!</h1>
```

## API

This package exports the identifiers
[`defaultBuild`][api-default-build] and
[`defaultInclude`][api-default-include].
The default export is
[`rehypeGithubHeading`][api-rehype-github-heading].

### `defaultBuild(id)`

Make rich content to link to a heading like github.com.

###### Parameters

*   `id` (`string`)
    — ID corresponding to heading

###### Returns

Link with icon ([`Element`][element]).

### `defaultInclude`

Elements to look for to link (`Array<string>`).

### `rehypeGithubHeading(options?)`

Plugin to enhance headings.

###### Parameters

*   `options` ([`Options`][api-options], optional)
    — configuration

### `Behavior`

What to do with the new link to the existing heading (TypeScript type).

You can either prepend or append to the heading.

###### Type

```ts
type Behavior = 'append' | 'prepend'
```

### `Build`

Make rich content to link to a heading (TypeScript type).

###### Parameters

*   `id` (`string`)
    — ID of heading
*   `node` ([`Element`][element])
    — heading

###### Returns

Rich content (`Array<ElementContent>` or [`ElementContent`][element]).

### `Options`

Configuration (TypeScript type).

###### Fields

*   `behavior` ([`Behavior`][api-behavior], default: `'prepend'`)
    — what to do with the new link to the existing heading
*   `build` ([`Build`][api-build], default: [`defaultBuild`][api-default-build])
    — make rich content to link to a heading
*   `include` (`Array<string>`, default:
    [`defaultInclude`][api-default-include])
    — elements to link; the default behavior is to enhance `h1`, `h2`, `h3`,
    `h4`, `h5`, and `h6`

## Bugs

GitHubs behavior for this is pretty good!
The main problem is that their behavior isn’t accessible for folks that do not
use a cursor.

## Authoring

Just be careful that GitHub generates links to headings based on the text of
the heading, and to make them unique, appends counters to duplicates.
These counters are in the order the document was written, which means that
if an author swaps sections around, the links will be swapped too.
To solve this, it is recommended to use headings with unique text.

See [§ Writing on GitHub][github-docs] for more info.

## HTML

The markup for links is:

```html
<a id="xxx" class="anchor" aria-hidden="true" href="#xxx"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path></svg></a>
```

…where `xxx` is the slug generated from the heading text.

## CSS

The following CSS is needed to make headings look like GitHub.

```css
/* Default dark */
:root {
  --color-accent-fg: #2f81f7;
  --color-fg-default: #e6edf3;
}

a {
  color: var(--color-accent-fg);
  text-decoration: none;
}

.octicon {
  display: inline-block;
  overflow: visible;
  vertical-align: text-bottom;
  fill: currentColor;
}

.anchor {
  float: left;
  padding-right: 4px;
  margin-left: -20px;
  line-height: 1;
}

:is(h1, h2, h3, h4, h5, h6) .octicon-link {
  color: var(--color-fg-default);
  vertical-align: middle;
  visibility: hidden;
}

:is(h1, h2, h3, h4, h5, h6):hover .octicon-link {
  visibility: visible;
}
```

## Syntax

No syntax is applicable.

## Types

This package is fully typed with [TypeScript][].
It exports the additional types [`Behavior`][api-behavior],
[`Build`][api-build], and [`Options`][api-options].

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

This plugin works with `rehype-parse` version 3+, `rehype-stringify` version
3+, `rehype` version 5+, and `unified` version 6+.

## Security

<!-- To do: document how to solve DOM clobbering. -->

This package is unsafe.

## Related

*   [`remark-gfm`](https://github.com/remarkjs/remark-gfm)
    — support GFM in remark

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

[downloads-badge]: https://img.shields.io/npm/dm/rehype-github-heading.svg

[downloads]: https://www.npmjs.com/package/rehype-github-heading

[size-badge]: https://img.shields.io/bundlephobia/minzip/rehype-github-heading.svg

[size]: https://bundlephobia.com/result?p=rehype-github-heading

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

[element]: https://github.com/syntax-tree/hast#element

[github-docs]: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#section-links

[api-behavior]: #behavior

[api-build]: #build

[api-default-build]: #defaultbuildid

[api-default-include]: #defaultinclude

[api-options]: #options

[api-rehype-github-heading]: #rehypegithubheadingoptions
