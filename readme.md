# rehype-github

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[rehype][]** plugins that match how GitHub transforms markdown on their site.

> 👉 **Note**:
> Not yet released,
> currently being worked on.

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Packages](#packages)
* [Examples](#examples)
  * [Example: To do](#example-to-do)
* [Types](#types)
* [Compatibility](#compatibility)
* [Security](#security)
* [Related](#related)
* [Contribute](#contribute)
* [Notice](#notice)
* [License](#license)

## What is this?

This project is a monorepo that contains many packages that can be used
together or on their own,
with defaults to match GitHub or with configuration to match your site,
to process user content for safe use on the web.

## When should I use this?

You can use these tools when you need to:

1. match GitHub in how it transforms markdown to HTML
2. build similar pipelines to bring user content to the masses

## Install

Currently,
install and use each package manually.

## Packages

* [`remark-github-break`](packages/break/)
  — turn normal line endings into hard breaks (**comments**)
* [`remark-github-yaml-metadata`](packages/yaml-metadata/)
  — show frontmatter as a table (**files**)
* [`rehype-github-alert`](packages/alert/)
  — enhance alerts (**everywhere**)
* [`rehype-github-color`](packages/color/)
  — enhance code for colors (**comments**)
* [`rehype-github-dir`](packages/dir/)
  — add `dir=auto` to elements (**everywhere**)
* [`rehype-github-emoji`](packages/emoji/)
  — enhance emoji and gemoji (**everywhere**)
* [`rehype-github-heading`](packages/heading/)
  — enhance headings (**files**)
* `rehype-github-highlight`
  — perform syntax highlighting on code (**to do**)
* [`rehype-github-image`](packages/image/)
  — enhance images (**everywhere**)
* [`rehype-github-link`](packages/link/)
  — enhance links (**everywhere**)
* `rehype-github-mention`
  — enhance mentions (**to do**)
* [`rehype-github-notranslate`](packages/notranslate/)
  — enhance raw text with `notranslate` (**comments**)
* `rehype-github-reference`
  — enhance references (**to do**)
* `rehype-github-sanitize`
  — clean dangerous HTML (**to do**)

GitHub additionally includes client side code to enhance certain code blocks
by evaluating their contents.
This behavior is performed by:

* [`viewscreen-geojson`](packages/viewscreen-geojson/)
  — viewscreen component for geojson and topojson
* [`viewscreen-mermaid`](packages/viewscreen-mermaid/)
  — viewscreen component for mermaid
* [`viewscreen-stl`](packages/viewscreen-stl/)
  — viewscreen component for STL (3D geometry)

See [`example/viewscreen/`](example/viewscreen/) on how to use them together.

To do:

* Change some things in `hast-util-to-mdast` to match current things
  that GitHub does there
* Investigate task lists
* Investigate port of treelights
* Investigate linking to labels,
  issues,
  pulls,
  files,
  lines in files

## Examples

### Example: To do

## Types

These packages are fully typed with [TypeScript][].

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now,
that is Node.js 16+.
Our projects sometimes work with older versions,
but this is not guaranteed.

## Security

To do.

## Related

## Contribute

See [`contributing.md`][contributing] in [`rehypejs/.github`][health] for
ways to get started.
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

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/rehypejs/rehype/discussions

[typescript]: https://www.typescriptlang.org

[license]: license

[author]: https://wooorm.com

[health]: https://github.com/rehypejs/.github

[contributing]: https://github.com/rehypejs/.github/blob/main/contributing.md

[support]: https://github.com/rehypejs/.github/blob/main/support.md

[coc]: https://github.com/rehypejs/.github/blob/main/code-of-conduct.md

[rehype]: https://github.com/rehypejs/rehype
