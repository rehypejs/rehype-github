# rehype-github-image

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[rehype][]** plugin to enhance images.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`camo(path, secret)`](#camopath-secret)
    *   [`rehypeGithubImage(options?)`](#rehypegithubimageoptions)
    *   [`Options`](#options)
    *   [`ToProxyUrl`](#toproxyurl)
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

This plugin enhances images by dropping them if they are invalid, creating
links around them, and optionally passing images through an image proxy.

An image proxy requires a dedicated server, which could become costly if you
have tons of user content, but it prevents leaking the readers information
to external servers, and it solves CORS errors.

This plugin is part of a monorepo `rehype-github`.
See its readme for more info.

## When should I use this?

You can use this plugin when you want to match how github.com works or when you
want to build similar pipelines that have user content.

You should likely use this in combination with an image proxy, such as
[`camo`][camo] (Node, untmaintained) or [`go-camo`][go-camo] (Go, maintained).

## Install

This package is [ESM only][esm].
In Node.js (version 16.0+), install with [npm][]:

```sh
npm install rehype-github-image
```

In Deno with [`esm.sh`][esmsh]:

```js
import rehypeGithubImage from 'https://esm.sh/rehype-github-image@0'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import rehypeGithubImage from 'https://esm.sh/rehype-github-image@0?bundle'
</script>
```

## Use

Say our module `example.js` looks as follows:

```js
import rehypeGithubImage from 'rehype-github-image'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'

const file = await unified()
  .use(rehypeParse, {fragment: true})
  .use(rehypeGithubImage)
  .use(rehypeStringify)
  .process('<img src="https://example.com/index.png">')

console.log(String(file))
```

…now running `node example.js` yields:

```html
<p><a target="_blank" rel="noopener noreferrer" href="https://example.com/index.png"><img src="https://example.com/index.png" style="max-width: 100%;"></a></p>
```

## API

This package exports the identifier [`camo`][api-camo].
The default export is
[`rehypeGithubImage`][api-rehype-github-image].

### `camo(path, secret)`

Create a `toProxyUrl` for a camo server.

See for example:

*   [`camo`][camo]
*   [`go-camo`][go-camo]

###### Parameters

*   `path` (`string`, **required**)
    — where the camo server runs (such as `https://camo.githubusercontent.com`)
*   `secret` (`string`, **required**)
    — shared secret with your camo server (such as `myVerySecretSecret`)

###### Returns

Function to create a URL to a proxy from an external URL
([`ToProxyUrl`][api-to-proxy-url]).

### `rehypeGithubImage(options?)`

Plugin to enhance images.

###### Parameters

*   `options` ([`Options`][api-options], optional)
    — configuration

### `Options`

Configuration (TypeScript type).

###### Fields

*   `toProxyUrl` ([`ToProxyUrl`][api-to-proxy-url], optional)
    — change external URLs to go through an image proxy
*   `internal` (`Array<string>` or `string`, optional)
    — hostname or hostnames to not mark as external; URLs to these hostnames
    will not be passed through the image proxy
*   `rel` (`Array<string>` or `string`, default: `['noopener', 'noreferrer']`)
    — relationship(s) of your site to external content, used in `rel` on `a`s
    wrapping the images; no `rel` field is set on URLs that go to your image
    proxy
*   `targetBlank` (`boolean`, default: `true`)
    — whether to open images in a new window

###### Notes

These options are safe by default, but you should change them.
You should likely include `'nofollow'` and `'ugc'` in `rel`.
If you have `targetBlank: true` (default), make sure to include
`'noopener'` and `'noreferrer'` (default).

> 👉 **Note**: to summarize, with `targetBlank: false`, use
> `rel: ['nofollow', 'ugc']`.
> With `targetBlank: true` (default), use
> `rel: ['nofollow', 'noopener', 'noreferrer', 'ugc']`.

### `ToProxyUrl`

Create a URL to a proxy from an external URL (TypeScript type).

###### Parameters

*   `url` (`string`)
    — URL to hash

###### Returns

URL to proxy (`Promise<string>` or `string`).

## Bugs

There are no bugs with how GitHub does this, but they drop the `target` and use
`['nofollow', 'ugc']` in the `rel`.

## Authoring

There are no additional recommendations on how to author links in markdown.

## HTML

The markup that github.com uses for invalid URLs is:

```html
<img src="" alt="" style="max-width: 100%;">
```

For valid URLs, they keep the value in `src`:

```html
<img src="../image.jpg" alt="" style="max-width: 100%;">
```

If the image is not in an `a` element, they add one:

```html
<a target="_blank" rel="noopener noreferrer" href="image.jpg"><img src="image.jpg" alt="alt" style="max-width: 100%;"></a>
```

If the image goes to some domain, that isn’t `http://github.com` (or `https:`),
they pass the image through a camo image proxy:

```html
<a target="_blank" href="https://camo.githubusercontent.com/559e4923433749bd3cd9c1e4ddb7317442c7ca8e836e2a843189d13e264c9ff2/68747470733a2f2f6578616d706c652e636f6d"><img src="https://camo.githubusercontent.com/559e4923433749bd3cd9c1e4ddb7317442c7ca8e836e2a843189d13e264c9ff2/68747470733a2f2f6578616d706c652e636f6d" data-canonical-src="https://example.com" style="max-width: 100%;"></a>
```

These urls have the following format:

```text
<base>/<digest>/<hex>
```

…where `hex` is the hex encoded original URL, `digest` is the hex encoded HMAC
digest generated with a shared secret key and the original URL, and `base` is
the path where camo is running (such as `https://camo.githubusercontent.com`).

## CSS

No CSS is needed.

## Syntax

No syntax is applicable.

## Types

This package is fully typed with [TypeScript][].
It exports the additional type [`Options`][api-options] and
[`ToProxyUrl`][api-to-proxy-url].

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

[camo]: https://github.com/atmos/camo

[go-camo]: https://github.com/cactus/go-camo/tree/master

[api-camo]: #camopath-secret

[api-options]: #options

[api-rehype-github-image]: #rehypegithubimageoptions

[api-to-proxy-url]: #toproxyurl
