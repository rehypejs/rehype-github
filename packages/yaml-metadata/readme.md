# remark-github-yaml-metadata

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[remark][]** plugin to show frontmatter as a table.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`defaultCreateErrorMessage(info)`](#defaultcreateerrormessageinfo)
    *   [`defaultParseOptions`](#defaultparseoptions)
    *   [`remarkGithubYamlMetadata(options?)`](#remarkgithubyamlmetadataoptions)
    *   [`CreateErrorMessage`](#createerrormessage)
    *   [`ErrorInfo`](#errorinfo)
    *   [`Options`](#options)
    *   [`ParseOptions`](#parseoptions)
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

This plugin shows metadata authored with YAML frontmatter to readers.

This behavior is specific to github.com that only work in files, not in
comments.

This plugin is part of a monorepo `rehype-github`.
See its readme for more info.

## When should I use this?

You can use this plugin when you want to match how github.com works or when you
want to build similar pipelines.

This plugin is useful if you want to display metadata when the markdown is
rendered as a *preview* and not as a finished, production, page.
If *you* don’t use the metadata but something else might.

## Install

This package is [ESM only][esm].
In Node.js (version 16.0+), install with [npm][]:

```sh
npm install remark-github-yaml-metadata
```

In Deno with [`esm.sh`][esmsh]:

```js
import remarkGithubYamlMetadata from 'https://esm.sh/remark-github-yaml-metadata@0'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import remarkGithubYamlMetadata from 'https://esm.sh/remark-github-yaml-metadata@0?bundle'
</script>
```

## Use

Say our module `example.js` looks as follows:

```js
import remarkFrontmatter from 'remark-frontmatter'
import remarkGithubYamlMetadata from 'remark-github-yaml-metadata'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'

const file = await unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGithubYamlMetadata)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process('---\na: b\n---\n\n# hi')

console.log(String(file))
```

…now running `node example.js` yields:

```html
<table><thead><tr><th>a</th></tr></thead><tbody><tr><td><div>b</div></td></tr></tbody></table>
<h1>hi</h1>
```

## API

This package exports the identifiers
[`defaultCreateErrorMessage`][api-default-create-error-message] and
[`defaultParseOptions`][api-default-parse-options].
The default export is
[`remarkGithubYamlMetadata`][api-remark-github-yaml-metadata].

### `defaultCreateErrorMessage(info)`

Create rich content to display an error message to the user, like GitHub does
([`CreateErrorMessage`][api-create-error-message]).

### `defaultParseOptions`

Options defining how to parse YAML like GitHub
([`ParseOptions`][api-parse-options]).

GH mostly follows YAML 1.1, with some non-standard behavior.

### `remarkGithubYamlMetadata(options?)`

Plugin to show frontmatter as a table.

###### Parameters

*   `options` ([`Options`][api-options])
    — configuration

### `CreateErrorMessage`

Create rich content to display an error message to the user (TypeScript type).

###### Parameters

*   `info` ([`ErrorInfo`][api-error-info])
    — info on what went wrong

###### Returns

One or more hast nodes ([`ElementContent`][hast-element] or
`Array<ElementContent>`).

### `ErrorInfo`

Info on what went wrong (TypeScript type).

> 👉 **Note**: `point` and `summary` are defined by default, but not when
> turning `parseOptions.prettyErrors: false`.

###### Fields

*   `message` (`string`)
    — human readable parse error (from [`yaml`][yaml])
*   `point` ([`Point`][unist-position] or `undefined`)
    — where the error happened in the original file
*   `summary` (`string` or `undefined`)
    — summary with a pointer showing a codeframe of where the error happened
*   `yaml` (`string`)
    — original input YAML

### `Options`

Configuration (TypeScript type).

> 👉 **Note**: it is recommended to turn `allowArrayAtRoot` and
> `allowPrimitiveAtRoot` on, so that arrays and primitives can be shown
> too.
> You should also probably pass `parseOptions: {}`, as that uses
> modern defaults of `yaml`: YAML 1.2 (which for example does not turn
> `no` into `false`) and not allowing duplicate keys in objects.

###### Fields

*   `allowArrayAtRoot` (`boolean`, default: `false`)
    — whether to allow arrays at the top of the YAML
*   `allowPrimitiveAtRoot` (`boolean`, default: `false`)
    — whether to allow primitives (and dates) at the top of the YAML
*   `createErrorMessage`
    ([`CreateErrorMessage`][api-create-error-message], default:
    [`defaultCreateErrorMessage`][api-default-create-error-message])
    — options defining how to show YAML errors
*   `parseOptions` ([`ParseOptions`][api-parse-options], default:
    [`defaultParseOptions`][api-default-parse-options])
    — options defining how to parse YAML

### `ParseOptions`

Options defining how to parse YAML (TypeScript type).

###### Type

```ts
type ParseOptions = import('yaml').ParseOptions &
  import('yaml').DocumentOptions &
  import('yaml').SchemaOptions &
  import('yaml').ToJSOptions
```

## Bugs

GitHub only allows top-level objects, not arrays or primitives.
Instead, it parses that as if it was markdown.
Which I believe to be unexpected and a bug.

GitHub also mostly follows the rules of YAML 1.1, which treats `no` as `false`,
which I consider a bug.

## Authoring

See [§ Authoring in
`micromark-extension-frontmatter`][micromark-extension-frontmatter-authoring]
for more info.

## HTML

The markup for frontmatter is something like the following, for an object with
one field:

```html
<table>
  <thead>
    <tr><th>a</th></tr>
  </thead>
  <tbody>
    <tr><td><div>b</div></td></tr>
  </tbody>
</table>
```

## CSS

The following CSS is needed to make frontmatter tables look like GitHub.

```css
/* Default dark */
:root {
  --color-border-default: #30363d;
  --color-border-muted: #21262d;
  --color-canvas-default: #0d1117;
}

table {
  display: block;
  width: 100%;
  width: max-content;
  max-width: 100%;
  overflow: auto;
}

tr {
  background-color: var(--color-canvas-default);
  border-top: 1px solid var(--color-border-muted);
}

th, td {
  padding: 6px 13px;
  border: 1px solid var(--color-border-default);
}

th {
  font-weight: 600;
}
```

## Syntax

See [§ Syntax in
`micromark-extension-frontmatter`][micromark-extension-frontmatter-syntax]
for more info.

## Types

This package is fully typed with [TypeScript][].
It exports the additional types
[`CreateErrorMessage`][api-create-error-message],
[`ErrorInfo`][api-error-info],
[`Options`][api-options], and
[`ParseOptions`][api-parse-options].

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
*   [`remark-frontmatter`](https://github.com/remarkjs/remark-frontmatter)
    — support frontmatter syntax in remark

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

[downloads-badge]: https://img.shields.io/npm/dm/remark-github-yaml-metadata.svg

[downloads]: https://www.npmjs.com/package/remark-github-yaml-metadata

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-github-yaml-metadata.svg

[size]: https://bundlephobia.com/result?p=remark-github-yaml-metadata

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

[hast-element]: https://github.com/syntax-tree/hast#element

[micromark-extension-frontmatter-authoring]: https://github.com/micromark/micromark-extension-frontmatter#authoring

[micromark-extension-frontmatter-syntax]: https://github.com/micromark/micromark-extension-frontmatter#syntax

[remark]: https://github.com/remarkjs/remark

[unist-position]: https://github.com/syntax-tree/unist#position

[yaml]: https://github.com/eemeli/yaml

[api-default-create-error-message]: #defaultcreateerrormessageinfo

[api-default-parse-options]: #defaultparseoptions

[api-remark-github-yaml-metadata]: #remarkgithubyamlmetadataoptions

[api-error-info]: #errorinfo

[api-create-error-message]: #createerrormessage

[api-options]: #options

[api-parse-options]: #parseoptions
