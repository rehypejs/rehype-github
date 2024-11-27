# rehype-github-color

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[rehype][]** plugin to enhance code for colors.

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`defaultBuild(value)`](#defaultbuildvalue)
  * [`defaultExpression`](#defaultexpression)
  * [`rehypeGithubColor(options?)`](#rehypegithubcoloroptions)
  * [`Behavior`](#behavior)
  * [`Build`](#build)
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

This plugin enhances code that contains a color (such as `#00eaff`).
By default it appends markup for a little bullet that,
with some CSS,
can be displayed as a preview of colors.

These “color chips” are markup specific to github.com that only work in
comments,
not in files.

This plugin is part of a monorepo `rehype-github`.
See its readme for more info.

## When should I use this?

You can use this plugin when you want to match how github.com works or when you
want to build similar pipelines that enhance color.

## Install

This package is [ESM only][esm].
In Node.js (version 16+),
install with [npm][]:

```sh
npm install rehype-github-color
```

In Deno with [`esm.sh`][esmsh]:

```js
import rehypeGithubColor from 'https://esm.sh/rehype-github-color@0'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import rehypeGithubColor from 'https://esm.sh/rehype-github-color@0?bundle'
</script>
```

## Use

Say our module `example.js` looks as follows:

```js
import rehypeGithubColor from 'rehype-github-color'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'

const file = await unified()
  .use(rehypeParse, {fragment: true})
  .use(rehypeGithubColor)
  .use(rehypeStringify)
  .process('<code>#00eaff</code>')

console.log(String(file))
```

…now running `node example.js` yields:

```html
<code>#00eaff<span class="ml-1 d-inline-block border circle color-border-subtle" style="background-color: #00eaff; height: 8px; width: 8px;"></span></code>
```

## API

This package exports the identifiers
[`defaultBuild`][api-default-build] and
[`defaultExpression`][api-default-expression].
The default export is
[`rehypeGithubColor`][api-rehype-github-color].

### `defaultBuild(value)`

The default builder to turn a color into rich content.

###### Parameters

* `value` (`string`)
  — color matched by expression

###### Returns

The markup for a color chip that is appended to the code by github.com
([`ElementContent`][element-content]).

### `defaultExpression`

The default expression that GitHub uses to match colors (`RegExp`).

Supports some formats of hex (`#00eaff`),
RGB (`rgb(1, 2, 3)`),
RGBA (`rgba(1, 2, 3, 0.4)`),
and HSL (`hsl(0, 1%, 2%)`) colors.

See [§ Syntax][syntax] for more info.

### `rehypeGithubColor(options?)`

Plugin to enhance code for colors.

###### Parameters

* `options` ([`Options`][api-options], optional)
  — configuration

### `Behavior`

What to do with the result from the builder (TypeScript type).

You can either append to the code element or replace it.

###### Type

```ts
type Behavior = 'append' | 'replace'
```

### `Build`

Make rich content from a color (TypeScript type).

###### Parameters

* `value` (`string`)
  — color matched by expression

###### Returns

Rich content ([`ElementContent`][element-content] or `Array<ElementContent>`).

### `Options`

Configuration (TypeScript type).

###### Fields

* `behavior` ([`Behavior`][api-behavior],
  default: `'append'`)
  — what to do with the existing code and the built content
* `build` ([`Build`][api-build],
  default: [`defaultBuild`][api-default-build])
  — make rich content from a color
* `expression` (`RegExp`,
  default: [`defaultExpression`][api-default-expression])
  — match colors

## Bugs

GitHub supports a very limited set of colors.
It does not support any of the modern features.
See [§ Syntax][syntax] for more info.

## Authoring

Just be careful that the syntax on GitHub is very limited and only works in
comments.

See [§ Writing on GitHub][github-docs] for more info.

## HTML

The markup for color chips on github.com is:

```html
<span class="ml-1 d-inline-block border circle color-border-subtle" style="background-color: xxx; height: 8px; width: 8px;"></span>
```

…where `xxx` is the color as it was authored.

## CSS

The following CSS is needed to make color chips look like GitHub.

```css
/* Default dark */
:root {
  --color-border-default: #30363d;
  --color-border-subtle: rgba(240, 246, 252, 0.1);
}

.d-inline-block {
  display: inline-block !important;
}

.ml-1 {
  margin-left: 4px !important;
}

.color-border-subtle {
  border-color: var(--color-border-subtle) !important;
}

.circle {
  border-radius: 50% !important;
}

.border {
  border: 1px solid var(--color-border-default) !important;
}
```

## Syntax

Color chips form with,
roughly,
the following BNF:

```bnf
color ::= color_hex | color_rgb | color_rgba | color_hsl

color_hex ::= '#' 6*digit_hex
color_rgb ::= 'r' 'g' 'b' '(' ws number_like ws 2( ',' ws number_like ws ) ')'
color_rgba ::= 'r' 'g' 'b' 'a' '(' ws number_like ws 3( ',' ws number_like ws ) ')'
color_hsl ::= 'h' 's' 'l' '(' ws number_like ws 2( ',' ws number_like '%' ws ) ',' ws number_like ws ')'

ws ::= 0*' '
number_like ::= 1*digit | ( 0*digit '.' 0*digit )
hex ::= digit | digit_hex_lower | digit_hex_upper

digit ::= '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
digit_hex_lower ::= 'a' | 'b' | 'c' | 'd' | 'e' | 'f'
digit_hex_upper ::= 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
```

## Types

This package is fully typed with [TypeScript][].
It exports the additional types [`Behavior`][api-behavior],
[`Build`][api-build],
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

[element-content]: https://github.com/syntax-tree/hast#element

[github-docs]: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#supported-color-models

[api-behavior]: #behavior

[api-build]: #build

[api-default-build]: #defaultbuildvalue

[api-default-expression]: #defaultexpression

[api-options]: #options

[api-rehype-github-color]: #rehypegithubcoloroptions

[syntax]: #syntax
