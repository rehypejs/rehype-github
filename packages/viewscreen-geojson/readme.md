# viewscreen-geojson

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

Viewscreen component for geojson and topojson.

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`viewscreenGeojson(node, options?)`](#viewscreengeojsonnode-options)
  * [`OnSizeSuggestion`](#onsizesuggestion)
  * [`OnReject`](#onreject)
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
to display geojson or topojson on a map.

This behavior is specific to github.com that works in comments and files.
Using `<iframe>`s is a way to create components agnostic to a framework: you
can use this with plain JavaScript or with React, for example.

This library is part of a monorepo `rehype-github`.
See its readme for more info.

## When should I use this?

You can use this library when you want to match how github.com works or when
you want to build similar pipelines.

This library is useful if you want to user content to include maps.

## Install

This package is [ESM only][esm].
In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {viewscreenGeojson} from 'https://esm.sh/viewscreen-geojson@0?bundle'
</script>
```

## Use

Say our file `viewscreen-geojson.html` looks as follows:

```html
<!doctype html>
<html lang=en>
<meta content=initial-scale=1,width=device-width name=viewport>
<meta charset=utf8>
<title>viewscreen: geojson</title>
<link href=https://esm.sh/leaflet@1.9/dist/leaflet.css rel=stylesheet>
<link href=https://esm.sh/leaflet.markercluster@1.5/dist/MarkerCluster.css rel=stylesheet>
<link href=https://esm.sh/leaflet.markercluster@1.5/dist/MarkerCluster.Default.css rel=stylesheet>
<style>/* … */</style>
<script type=module>
  import {viewscreenGeojson} from 'https://esm.sh/viewscreen-geojson@0?bundle'

  const id = window.location.hash.slice(1)
  if (!id) throw new Error('Expected `id` in hash')
  const parent = window.parent
  if (!parent) throw new Error('Expected parent window')

  const viewer = viewscreenGeojson(document.body, {
    onReject(value) {
      parent.postMessage({id, type: 'reject', value})
    },
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
<meta content=initial-scale=1,width=device-width name=viewport>
<title>example</title>
<link href=https://esm.sh/github-markdown-css@5/github-markdown.css rel=stylesheet>
<style>/* … */</style>
<div class=markdown-body>
<pre><code class=language-geojson>{
  "type": "Feature",
  "geometry": {"type": "Point", "coordinates": [125.6, 10.1]},
  "properties": {"name": "Dinagat Islands"}
}
</code></pre>
</div>
<script type=module>
  const types = {
    geojson: '/viewscreen-geojson.html',
    topojson: '/viewscreen-geojson.html'
  }

  const viewscreens = new Map()

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
    } else if (event.data.type === 'resolve') {
      const viewscreen = viewscreens.get(event.data.id)
      if (!viewscreen) throw new Error('Expected viewscreen')
      // Note: this never happens.
      // When `reject` is added to the DOM, it replaces the frame, which
      // offloads it, so `resolve` will never happen.
      if (viewscreen.reject.parentElement) {
        viewscreen.reject.replaceWith(viewscreen.resolve)
      }
    } else if (event.data.type === 'reject') {
      const viewscreen = viewscreens.get(event.data.id)
      if (!viewscreen) throw new Error('Expected viewscreen')
      const body = viewscreen.reject.querySelector('.flash-body')
      if (!body) throw new Error('Expected body')
      body.textContent = event.data.value
      if (viewscreen.resolve.parentElement) {
        viewscreen.resolve.replaceWith(viewscreen.reject)
      }
    } else {
      console.log('on unknown message from viewscreen:', event)
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
      const message = {type: 'content', id, value}
      iframe.setAttribute('style', '')
      otherWindow.postMessage(message)
    })

    const scope =
      node.parentElement && node.parentElement.nodeName === 'PRE'
        ? node.parentElement
        : node
    // Append the frame, assume it will resolve.
    scope.replaceWith(iframe)

    // Create error display, for when the frame rejects.
    const heading = document.createElement('p')
    heading.classList.add('flash-heading')
    heading.textContent = 'Unable to render rich display'
    heading.style.fontWeight = 'bold'
    const body = document.createElement('p')
    body.classList.add('flash-body')
    const errorMessage = document.createElement('div')
    errorMessage.classList.add('flash', 'flash-error')
    errorMessage.append(heading, body)
    const reject = document.createElement('div')
    reject.append(errorMessage, scope)

    viewscreens.set(id, {reject, resolve: iframe})
  }
</script>
```

…now assuming both run on a server `localhost:8000`, opening that in a browser
shows the diagram!

## API

This package exports the identifier
[`viewscreenGeojson`][api-viewscreen-geojson].
There is no default export.

### `viewscreenGeojson(node, options?)`

Render a map in `node`.

###### Parameters

* `node` (`HTMLElement`, required)
  — node to work in
* `options` ([`Options`][api-options], optional)
  — configuration

###### Returns

Object with the following fields:

* `change` (`(value: string) => Promise<undefined>`)
  — change the diagram

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

### `OnReject`

Callback called when rejecting (TypeScript type).

###### Parameters

* `value` (`string`)
  — reason

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

* `onReject` ([`OnReject`][api-on-reject], optional)
  — callback called when rejecting
* `onResolve` ([`OnResolve`][api-on-resolve], optional)
  — callback called when resolving
* `onSizeSuggestion` ([`OnSizeSuggestion`][api-on-size-suggestion], optional)
  — callback called on a size suggestion

## Bugs

GitHubs behavior for this is pretty good!
GitHub uses Azure maps, which is apparently a thing.
This instead uses Leaflet with tiles from OpenStreetMap.

## Authoring

See the geojson or topojson docs for more on how to author geographic data.

## HTML

The given `node` will be entirely controlled by Leaflet.

## CSS

The CSS you could use:

```css
:root {
  color-scheme: light;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans',
    Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }

  .leaflet-tile-pane {
    filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg)
      saturate(0.3) brightness(0.7);
  }
}

* {
  box-sizing: border-box;
}

body {
  aspect-ratio: 8 / 5;
  margin: 0;
}
```

## Types

This package is fully typed with [TypeScript][].
It exports the additional types [`OnReject`][api-on-reject],
[`OnResolve`][api-on-resolve], [`OnSizeSuggestion`][api-on-size-suggestion],
and [`Options`][api-options].

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

[api-viewscreen-geojson]: #viewscreengeojsonnode-options

[api-options]: #options

[api-on-reject]: #onreject

[api-on-resolve]: #onresolve

[api-on-size-suggestion]: #onsizesuggestion
