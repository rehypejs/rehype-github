/* eslint-env browser */

/**
 * @import {FromViewscreenMessage, ToViewscreenMessage} from './shared.js'
 */

/** @type {Record<string, string>} */
const types = {
  geojson: '/viewscreen-geojson.html',
  mermaid: '/viewscreen-mermaid.html',
  stl: '/viewscreen-stl.html',
  topojson: '/viewscreen-geojson.html'
}

/** @type {Map<string, {reject: HTMLElement, resolve: HTMLIFrameElement}>} */
const viewscreens = new Map()

// The `width` on the iframe is set from the outside, with CSS.
// Based of that, the preferred height is calculated by the viewscreen inside.
// Which we set here.
window.addEventListener(
  'message',
  /**
   * Handle a message from any viewscreen iframe.
   *
   * @param {MessageEvent<FromViewscreenMessage>} event
   *   Event.
   * @returns {undefined}
   *   Nothing.
   */
  function (event) {
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
  }
)

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
  iframe.setAttribute('src', url.href)
  // To do: this is said to be dangerous:
  // <https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe>
  // iframe.setAttribute(
  //   'sandbox',
  //   'allow-scripts allow-same-origin allow-top-navigation'
  // )
  // Hide for now.
  iframe.setAttribute('style', 'opacity:0')

  iframe.addEventListener(
    'load',
    /**
     * @returns {undefined}
     *   Nothing.
     */
    function () {
      const otherWindow = iframe.contentWindow
      if (!otherWindow) throw new Error('Expected `contentWindow`')
      /** @type {ToViewscreenMessage} */
      const message = {id, type: 'content', value}
      iframe.setAttribute('style', '')
      otherWindow.postMessage(message)
    }
  )

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
