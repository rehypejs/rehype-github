# viewscreen-stl

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

Viewscreen component for STL files (3D geometry).

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`viewscreenStl(node, options?)`](#viewscreenstlnode-options)
  * [`OnSizeSuggestion`](#onsizesuggestion)
  * [`OnResolve`](#onresolve)
  * [`Options`](#options)
* [Bugs](#bugs)
* [Authoring](#authoring)
* [HTML](#html)
* [CSS](#css)
* [Types](#types)
* [Compatibility](#compatibility)
* [Security](#security)
* [Related](#related)
* [Contribute](#contribute)
* [Notice](#notice)
* [License](#license)

## What is this?

This library can run inside an `<iframe>`, with some skeleton HTML.
Then, from the outside, you can embed that frame, and send messages to it,
to display STL files on a canvas.

This behavior is specific to github.com that works in comments and files.
Using `<iframe>`s is a way to create components agnostic to a framework: you
can use this with plain JavaScript or with React, for example.

This library is part of a monorepo `rehype-github`.
See its readme for more info.

## When should I use this?

You can use this library when you want to match how github.com works or when
you want to build similar pipelines.

This library is useful if you want to user content to include plain-text STL
files.

## Install

This package is [ESM only][esm].
In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {viewscreenStl} from 'https://esm.sh/viewscreen-stl@0?bundle'
</script>
```

## Use

Say our file `viewscreen-stl.html` looks as follows:

```html
<!doctype html>
<html lang=en>
<meta content=width=device-width,initial-scale=1 name=viewport>
<meta charset=utf8>
<title>viewscreen: stl</title>
<style>/* … */</style>
<script type=module>
  import {viewscreenStl} from 'https://esm.sh/viewscreen-stl@0?bundle'

  const id = window.location.hash.slice(1)
  if (!id) throw new Error('Expected `id` in hash')
  const parent = window.parent
  if (!parent) throw new Error('Expected parent window')

  const viewer = viewscreenStl(document.body, {
    onSizeSuggestion(width, height) {
      parent.postMessage({id, type: 'resize', value: {height, width}})
    },
    onResolve() {
      parent.postMessage({id, type: 'resolve'})
    }
  })

  window.addEventListener('message', function (event) {
    if (event.data.type === 'content') {
      viewer.change(event.data.value)
    }
  })
</script>
```

…and a file `index.html` looks as follows:

```html
<!doctype html>
<html lang=en>
<meta charset=utf8>
<meta content=width=device-width,initial-scale=1 name=viewport>
<title>example</title>
<link rel=stylesheet href=https://esm.sh/github-markdown-css@5/github-markdown.css>
<style>/* … */</style>
<div class=markdown-body>
<pre><code class=language-stl>solid square
   facet normal -1 0 0
      outer loop
         vertex 0 100 100
         vertex 0 100 0
         vertex 0 0 100
      endloop
   endfacet
   facet normal -1 0 0
      outer loop
         vertex 0 0 100
         vertex 0 100 0
         vertex 0 0 0
      endloop
   endfacet
   facet normal 0 0 1
      outer loop
         vertex 100 100 100
         vertex 0 100 100
         vertex 100 0 100
      endloop
   endfacet
   facet normal 0 0 1
      outer loop
         vertex 100 0 100
         vertex 0 100 100
         vertex 0 0 100
      endloop
   endfacet
   facet normal 1 0 0
      outer loop
         vertex 100 100 0
         vertex 100 100 100
         vertex 100 0 0
      endloop
   endfacet
   facet normal 1 0 0
      outer loop
         vertex 100 0 0
         vertex 100 100 100
         vertex 100 0 100
      endloop
   endfacet
   facet normal 0 0 -1
      outer loop
         vertex 0 100 0
         vertex 100 100 0
         vertex 0 0 0
      endloop
   endfacet
   facet normal 0 0 -1
      outer loop
         vertex 0 0 0
         vertex 100 100 0
         vertex 100 0 0
      endloop
   endfacet
   facet normal 0 1 0
      outer loop
         vertex 100 100 100
         vertex 100 100 0
         vertex 0 100 100
      endloop
   endfacet
   facet normal 0 1 0
      outer loop
         vertex 0 100 100
         vertex 100 100 0
         vertex 0 100 0
      endloop
   endfacet
   facet normal 0 -1 0
      outer loop
         vertex 100 0 0
         vertex 100 0 100
         vertex 0 0 0
      endloop
   endfacet
   facet normal 0 -1 0
      outer loop
         vertex 0 0 0
         vertex 100 0 100
         vertex 0 0 100
      endloop
   endfacet
endsolid
</code></pre>
</div>
<script type=module>
  const types = {stl: '/viewscreen-stl.html'}

  /**
   * Handle a message from any viewscreen iframe.
   */
  window.addEventListener('message', function (event) {
    if (event.data.type === 'resize') {
      // We use unique names, but not bad to handle arrays.
      const nodes = document.getElementsByName(event.data.id)

      for (const node of nodes) {
        node.setAttribute('style', `height:${event.data.value.height}px`)
      }
    }
  })

  const nodes = Array.from(document.body.querySelectorAll('code'))
  const prefix = 'language-'

  for (const node of nodes) {
    /** @type {string | undefined} */
    let name

    for (const className of node.classList) {
      if (className.startsWith(prefix)) {
        name = className.slice(prefix.length)
        break
      }
    }

    if (!name) continue

    const specifier = Object.hasOwn(types, name) ? types[name] : undefined

    if (!specifier) continue

    const value = node.textContent || ''
    const id = crypto.randomUUID()
    const url = new URL(specifier, window.location.href)
    url.hash = id
    const iframe = document.createElement('iframe')

    iframe.classList.add('render-viewer')
    iframe.setAttribute('role', 'presentation')
    iframe.setAttribute('name', id)
    iframe.setAttribute('src', String(url))
    iframe.setAttribute('style', 'opacity:0')

    iframe.addEventListener('load', function () {
      const otherWindow = iframe.contentWindow
      if (!otherWindow) throw new Error('Expected `contentWindow`')
      const message = {id, type: 'content', value}
      iframe.setAttribute('style', '')
      otherWindow.postMessage(message)
    })

    const scope =
      node.parentElement && node.parentElement.nodeName === 'PRE'
        ? node.parentElement
        : node
    scope.replaceWith(iframe)
  }
</script>
```

…now assuming both run on a server `localhost:8000`, opening that in a browser
shows the diagram!

## API

This package exports the identifier
[`viewscreenStl`][api-viewscreen-stl].
There is no default export.

### `viewscreenStl(node, options?)`

Render 3D geometry in `node`.

###### Parameters

* `node` (`HTMLElement`, required)
  — node to work in
* `options` ([`Options`][api-options], optional)
  — configuration

###### Returns

Object with the following fields:

* `change` (`(value: string) => Promise<undefined>`)
  — change the geometry

### `OnSizeSuggestion`

Callback called when there’s a new size suggestion for the viewscreen
(TypeScript type).

###### Parameters

* `width` (`number`)
  — current width
* `height` (`number`)
  — preferred height for `width`

###### Returns

Nothing (`undefined`).

### `OnResolve`

Callback called when resolving (TypeScript type).

###### Parameters

None.

###### Returns

Nothing (`undefined`).

### `Options`

Configuration (TypeScript type).

###### Fields

* `onResolve` ([`OnResolve`][api-on-resolve], optional)
  — callback called when resolving
* `onSizeSuggestion` ([`OnSizeSuggestion`][api-on-size-suggestion], optional)
  — callback called on a size suggestion

## Bugs

GitHubs behavior for this is pretty good!
They don’t support dark mode, but that’s added in this project.

## Authoring

Not a lot of folks author ASCII STL files by hand, but it’s possible!

## HTML

The markup injected into `node` looks like this:

```html
<canvas></canvas> <!-- ThreeJS area -->
<div class="panel">
  <button>normal</button> <!-- use `MeshNormalMaterial` -->
  <button>solid</button> <!-- use `MeshPhongMaterial` -->
  <button>wireframe</button> <!-- use `MeshPhongMaterial`, with wireframe on -->
</div>
```

## CSS

The CSS you could use:

```css
:root {
  --color-accent-fg: #0969da;
  --color-btn-active-bg: hsl(220, 14%, 93%);
  --color-btn-active-border: rgba(31, 35, 40, 0.15);
  --color-btn-bg: #f6f8fa;
  --color-btn-border: rgba(31, 35, 40, 0.15);
  --color-btn-hover-bg: #f3f4f6;
  --color-btn-hover-border: rgba(31, 35, 40, 0.15);
  --color-btn-inset-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
  --color-btn-shadow: 0 1px 0 rgba(31, 35, 40, 0.04);
  --color-btn-text: #24292f;
  --color-primer-fg-disabled: #8c959f;
  color-scheme: light;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans',
    Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-accent-fg: #2f81f7;
    --color-btn-active-bg: hsl(212, 12%, 18%);
    --color-btn-active-border: #6e7681;
    --color-btn-bg: #21262d;
    --color-btn-border: rgba(240, 246, 252, 0.1);
    --color-btn-hover-bg: #30363d;
    --color-btn-hover-border: #8b949e;
    --color-btn-inset-shadow: 0 0 transparent;
    --color-btn-shadow: 0 0 transparent;
    --color-btn-text: #c9d1d9;
    --color-primer-fg-disabled: #484f58;
    color-scheme: dark;
  }
}

* {
  box-sizing: border-box;
}

body {
  aspect-ratio: 8 / 5;
  margin: 0;
}

button {
  appearance: none;
  background-color: var(--color-btn-bg);
  border-radius: 6px;
  border: 1px solid var(--color-btn-border);
  box-shadow: var(--color-btn-shadow), var(--color-btn-inset-shadow);
  color: var(--color-btn-text);
  cursor: pointer;
  display: inline-block;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  padding: 5px 7px;
  position: relative;
  transition: 80ms cubic-bezier(0.33, 1, 0.68, 1);
  transition-property: color, background-color, box-shadow, border-color;
  user-select: none;
  vertical-align: middle;
  white-space: nowrap;
}

button:disabled {
  background-color: var(--color-btn-bg);
  border-color: var(--color-btn-border);
  color: var(--color-primer-fg-disabled);
}

button:hover {
  background-color: var(--color-btn-hover-bg);
  border-color: var(--color-btn-hover-border);
  transition-duration: 0.1s;
}

button:focus {
  box-shadow: none;
  outline: 2px solid var(--color-accent-fg);
  outline-offset: -2px;
}

button:active {
  background-color: var(--color-btn-active-bg);
  border-color: var(--color-btn-active-border);
  transition: none;
}

.panel {
  bottom: 0.5ex;
  display: grid;
  gap: 0.5ex;
  grid-template-columns: 1fr 1fr 1fr;
  position: absolute;
  right: 0.5ex;
  z-index: 1;
}
```

## Types

This package is fully typed with [TypeScript][].
It exports the additional types [`OnResolve`][api-on-resolve],
[`OnSizeSuggestion`][api-on-size-suggestion], and
[`Options`][api-options].

## Compatibility

This project works in browsers only.

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

[downloads-badge]: https://img.shields.io/npm/dm/viewscreen-mermaid.svg

[downloads]: https://www.npmjs.com/package/viewscreen-mermaid

[size-badge]: https://img.shields.io/bundlephobia/minzip/viewscreen-mermaid.svg

[size]: https://bundlephobia.com/result?p=viewscreen-mermaid

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/rehypejs/rehype/discussions

[esmsh]: https://esm.sh

[license]: ../../license

[author]: https://wooorm.com

[contributing]: https://github.com/rehypejs/.github/blob/main/contributing.md

[support]: https://github.com/rehypejs/.github/blob/main/support.md

[coc]: https://github.com/rehypejs/.github/blob/main/code-of-conduct.md

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[typescript]: https://www.typescriptlang.org

[api-viewscreen-stl]: #viewscreenstlnode-options

[api-options]: #options

[api-on-resolve]: #onresolve

[api-on-size-suggestion]: #onsizesuggestion
