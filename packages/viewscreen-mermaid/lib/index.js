/* eslint-env browser */

/**
 * @typedef {import('@primer/octicons').IconName} IconName
 */

/**
 * @callback OnSizeSuggestion
 *   Callback called when there’s a new size suggestion for the viewscreen.
 * @param {number} width
 *   Current width.
 * @param {number} height
 *   Preferred height for `width`.
 * @returns {void}
 *   Nothing.
 *
 * @typedef State
 *   Internal state.
 * @property {string | undefined} value
 *   Diagram value.
 * @property {boolean} darkMode
 *   Whether a dark theme is preferred.
 * @property {[[number, number], [number, number]]} translateExtent
 *   Current translate extent.
 *
 *   Not yet used.
 * @property {[number, number]} scaleExtent
 *   Current scale extent.
 *
 * @typedef Context
 *   Current context.
 * @property {SVGElement | undefined} diagram
 *   Current SVG element that includes a mermaid diagram.
 * @property {HTMLElement} node
 *   Container.
 * @property {HTMLElement} panel
 *   Control panel.
 * @property {HTMLElement} zoomArea
 *   Zoom area.
 * @property {import('d3-selection').Selection<HTMLDivElement, unknown, null, undefined>} zoomAreaSelection
 *   D3 selection of zoom area.
 * @property {HTMLElement} zoomedArea
 *   Zoomed area.
 * @property {import('d3-zoom').ZoomBehavior<HTMLDivElement, unknown>} zoomBehavior
 *   D3 zoom behavior.
 *
 * @typedef Button
 *   Control.
 * @property {string} className
 *   Class.
 * @property {IconName} icon
 *   Octicon.
 * @property {Action} action
 *   Action.
 *
 * @callback Action
 *   Do something.
 * @param {Context} context
 *   Context.
 * @returns {void}
 *   Nothing.
 *
 * @typedef UpdateValueOptions
 *   Configuration.
 * @property {boolean | null | undefined} [resetZoom=false]
 *   Whether to reset the zoom.
 *
 * @typedef Options
 *   Configuration.
 * @property {OnSizeSuggestion | null | undefined} [onSizeSuggestion]
 *   Callback called on a size suggestion.
 */

// To do: generate the icons statically so we don’t need to include everything.
import octicons from '@primer/octicons'
import {select} from 'd3-selection'
import {transition} from 'd3-transition'
import {zoom, ZoomTransform} from 'd3-zoom'
import DOMPurify from 'dompurify'
import mermaid from 'mermaid'

// To do: better sanitizer.
const ADD_TAGS = [
  'a',
  'b',
  'blockquote',
  'br',
  'dd',
  'div',
  'dl',
  'dt',
  'em',
  // `foreignObject` is necessary for links to work
  'foreignObject',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'h7',
  'h8',
  'hr',
  'i',
  'li',
  'ul',
  'ol',
  'p',
  'pre',
  'span',
  'strike',
  'strong',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr'
]

/**
 * @param {string} value
 * @returns {DocumentFragment}
 */
function sanitizeSvg(value) {
  // To do: better sanitizer.
  return DOMPurify.sanitize(value, {
    RETURN_DOM_FRAGMENT: true,
    USE_PROFILES: {svg: true},
    // Basically:
    // addToSet(ALLOWED_TAGS, TAGS.svg);
    // https://github.com/cure53/DOMPurify/blob/a3c39078170548966651e23378b514f82a91a930/src/tags.js#L124
    // addToSet(ALLOWED_ATTR, ATTRS.svg);
    // https://github.com/cure53/DOMPurify/blob/a3c39078170548966651e23378b514f82a91a930/src/attrs.js#L115
    // addToSet(ALLOWED_ATTR, ATTRS.xml);
    // https://github.com/cure53/DOMPurify/blob/a3c39078170548966651e23378b514f82a91a930/src/attrs.js#L356
    ADD_TAGS,
    ADD_ATTR: ['transform-origin']
  })
}

/**
 * Controls.
 *
 * @type {Array<Button>}
 */
const buttons = [
  // @ts-expect-error: types are out of date: `zoom-in` exists.
  {className: 'zoom-in', icon: 'zoom-in', action: zoomIn},
  // @ts-expect-error: types are out of date: `zoom-out` exists.
  {className: 'zoom-out', icon: 'zoom-out', action: zoomOut},
  {className: 'reset', icon: 'sync', action: reset},
  {className: 'up', icon: 'chevron-up', action: up},
  {className: 'down', icon: 'chevron-down', action: down},
  {className: 'left', icon: 'chevron-left', action: left},
  {className: 'right', icon: 'chevron-right', action: right}
]

/**
 * Render a mermaid graph in `node`.
 *
 * @param {HTMLElement} node
 *   Node to work in.
 * @param {Options | null | undefined} [options]
 *   Configuration.
 * @returns
 *   Actions.
 */
export function create(node, options) {
  const query = '(prefers-color-scheme: dark)'
  const observer =
    'ResizeObserver' in globalThis ? new ResizeObserver(onresize) : undefined

  /** @type {State} */
  const state = {
    translateExtent: [
      [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY],
      [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]
    ],
    scaleExtent: [1 / 2, 4],
    value: undefined,
    darkMode: window.matchMedia(query).matches
  }

  const zoomArea = document.createElement('div')

  /** @type {Context} */
  const context = {
    diagram: undefined,
    node,
    panel: document.createElement('div'),
    zoomArea,
    zoomAreaSelection: select(zoomArea),
    zoomedArea: document.createElement('div'),
    // @ts-expect-error: we’ll attach an `HTMLElement` later, not an `Element.
    zoomBehavior: zoom()
      // We’ll set `translateExtent` when we know sizes.
      .scaleExtent(state.scaleExtent)
      .on('zoom', onzoom)
  }

  context.panel.classList.add('panel')

  for (const button of buttons) {
    const node = document.createElement('button')
    node.classList.add(button.className)
    node.innerHTML = octicons[button.icon].toSVG()
    node.addEventListener('click', function () {
      button.action(context)
    })
    context.panel.append(node)
  }

  context.zoomedArea.setAttribute(
    'style',
    'display: flex; justify-content: center; transform-origin: 0 0;'
  )

  window.matchMedia(query).addEventListener('change', ondarkmode)
  context.zoomAreaSelection.call(context.zoomBehavior)
  if (observer) observer.observe(node)
  updateDarkmode(state)

  context.zoomArea.append(context.zoomedArea)
  node.append(context.zoomArea, context.panel)

  return {change}

  /**
   * Change the diagram.
   *
   * @param {string} value
   *   New diagram
   * @returns {Promise<void>}
   *   Promise that resolves with nothing and never rejects.
   */
  async function change(value) {
    state.value = value
    await updateValue(context, state, {resetZoom: true})
    onresize([])
  }

  /**
   * Handle a dark mode media query change.
   *
   * @param {MediaQueryListEvent} event
   */
  async function ondarkmode(event) {
    state.darkMode = event.matches
    updateDarkmode(state)
    // We have to rerender for the theme change to take effect.
    await updateValue(context, state)
  }

  /**
   * Handle a resize from an observer.
   *
   * Also supports being called with `[]` for `entries` to force this behavior.
   *
   * @param {Array<ResizeObserverEntry>} entries
   */
  function onresize(entries) {
    const entry = entries[0]
    const rect = entry
      ? entry.contentRect
      : context.node.getBoundingClientRect()
    // Minimum for controls.
    const height = Math.max(180, rect.height)

    // To do: figure out if there’s a good way to do this?
    // currently this doesn’t seem very useful, and I can’t
    // detect extents to disable the buttons anyway 🤷‍♂️
    // state.translateExtent = [
    //   [rect.width * -0.25, height * -0.25],
    //   [rect.width * 1.25, height * 1.25]
    // ]
    // context.zoomBehavior.translateExtent(state.translateExtent)

    if (options && options.onSizeSuggestion) {
      options.onSizeSuggestion(rect.width, height)
    }
  }

  /**
   * Handle a d3 zoom event.
   *
   * @param {import('d3-zoom').D3ZoomEvent<HTMLElement, unknown>} event
   */
  function onzoom(event) {
    const t = event.transform

    enabled('zoom-in', t.k < state.scaleExtent[1])
    enabled('zoom-out', t.k > state.scaleExtent[0])
    enabled('reset', t.k !== 1 || t.x !== 0 || t.y !== 0)
    // To do: figure out if there’s a good way to do this?
    // currently this doesn’t seem very useful, and I can’t
    // detect extents to disable the buttons anyway 🤷‍♂️
    // enabled('up', t.y)
    // enabled('left', t.x)
    // enabled('down', t.y)
    // enabled('right', t.x)

    context.zoomedArea.style.transform =
      'matrix(' + [t.k, 0, 0, t.k, t.x, t.y].join(', ') + ')'
  }

  /**
   * Toggle a button.
   *
   * @param {string} name
   *   Name.
   * @param {boolean} value
   *   Whether this action is enabled.
   */
  function enabled(name, value) {
    const node = context.panel.querySelector('.' + name)
    if (node && node instanceof HTMLButtonElement) {
      node.disabled = !value
    }
  }
}

/**
 * Render with mermaid.
 *
 * @param {Context} context
 * @param {State} state
 * @param {UpdateValueOptions | null | undefined} [options]
 * @returns {Promise<void>}
 */
async function updateValue(context, state, options) {
  const config = options || {}
  const resetZoom = config.resetZoom || false

  if (state.value === undefined) {
    if (context.diagram) context.diagram.remove()
    context.diagram = undefined
  } else {
    const previousSvg = context.diagram
    const result = await mermaid.render('diagram', state.value)
    const fragment = sanitizeSvg(result.svg)
    const nextSvg = fragment.querySelector('svg')
    if (!nextSvg) throw new Error('Expected svg')

    if (result.bindFunctions) result.bindFunctions(nextSvg)
    if (previousSvg) previousSvg.remove()

    context.diagram = nextSvg
    if (resetZoom) reset(context)
    context.zoomedArea.append(nextSvg)
  }
}

/**
 * Reset mermaid options.
 *
 * @param {State} state
 */
function updateDarkmode(state) {
  mermaid.initialize({
    startOnLoad: false,
    // Stop user configs in the mermaid files from overriding these keys
    secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize'],
    // Escape tags and disable click events within the diagram
    securityLevel: 'strict',
    flowchart: {diagramPadding: 48},
    gantt: {useWidth: 1200},
    pie: {useWidth: 1200},
    sequence: {diagramMarginY: 40},
    theme: state.darkMode ? 'dark' : 'default'
  })
}

/** @type {Action} */
function zoomIn(context) {
  context.zoomBehavior.scaleBy(createTransition(context), 4 / 3)
}

/** @type {Action} */
function zoomOut(context) {
  context.zoomBehavior.scaleBy(createTransition(context), 2 / 3)
}

/** @type {Action} */
function reset(context) {
  context.zoomBehavior.transform(
    createTransition(context),
    new ZoomTransform(1, 0, 0)
  )
}

/** @type {Action} */
function up(context) {
  context.zoomBehavior.translateBy(createTransition(context), 0, 100)
}

/** @type {Action} */
function down(context) {
  context.zoomBehavior.translateBy(createTransition(context), 0, -100)
}

/** @type {Action} */
function left(context) {
  context.zoomBehavior.translateBy(createTransition(context), 100, 0)
}

/** @type {Action} */
function right(context) {
  context.zoomBehavior.translateBy(createTransition(context), -100, 0)
}

/**
 * @param {Context} context
 * @returns {import('d3-transition').Transition<HTMLDivElement, unknown, null, undefined>}
 */
function createTransition(context) {
  return context.zoomAreaSelection.transition(transition().duration(100))
}
