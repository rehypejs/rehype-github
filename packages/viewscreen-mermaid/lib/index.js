/* eslint-env browser */

/**
 * @import {IconName} from '@primer/octicons'
 * @import {Selection} from 'd3-selection'
 * @import {Transition} from 'd3-transition'
 * @import {D3ZoomEvent, ZoomBehavior} from 'd3-zoom'
 */

/**
 * @callback OnSizeSuggestion
 *   Callback called when there’s a new size suggestion for the viewscreen.
 * @param {number} width
 *   Current width.
 * @param {number} height
 *   Preferred height for `width`.
 * @returns {undefined}
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
 * @property {Selection<HTMLDivElement, unknown, null, undefined>} zoomAreaSelection
 *   D3 selection of zoom area.
 * @property {HTMLElement} zoomedArea
 *   Zoomed area.
 * @property {ZoomBehavior<HTMLDivElement, unknown>} zoomBehavior
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
 * @returns {undefined}
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
import {ZoomTransform, zoom} from 'd3-zoom'
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
 *   Value to sanitize.
 * @returns {DocumentFragment}
 *   Sanitized value.
 */
function sanitizeSvg(value) {
  // To do: better sanitizer.
  return DOMPurify.sanitize(value, {
    ADD_ATTR: ['transform-origin'],
    // Basically:
    // addToSet(ALLOWED_TAGS, TAGS.svg);
    // https://github.com/cure53/DOMPurify/blob/a3c39078170548966651e23378b514f82a91a930/src/tags.js#L124
    // addToSet(ALLOWED_ATTR, ATTRS.svg);
    // https://github.com/cure53/DOMPurify/blob/a3c39078170548966651e23378b514f82a91a930/src/attrs.js#L115
    // addToSet(ALLOWED_ATTR, ATTRS.xml);
    // https://github.com/cure53/DOMPurify/blob/a3c39078170548966651e23378b514f82a91a930/src/attrs.js#L356
    ADD_TAGS,
    RETURN_DOM_FRAGMENT: true,
    USE_PROFILES: {svg: true}
  })
}

/**
 * Controls.
 *
 * @type {Array<Button>}
 */
const buttons = [
  {action: zoomIn, className: 'zoom-in', icon: 'zoom-in'},
  {action: zoomOut, className: 'zoom-out', icon: 'zoom-out'},
  {action: reset, className: 'reset', icon: 'sync'},
  {action: up, className: 'up', icon: 'chevron-up'},
  {action: down, className: 'down', icon: 'chevron-down'},
  {action: left, className: 'left', icon: 'chevron-left'},
  {action: right, className: 'right', icon: 'chevron-right'}
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
    darkMode: window.matchMedia(query).matches,
    scaleExtent: [1 / 2, 4],
    translateExtent: [
      [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY],
      [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]
    ],
    value: undefined
  }

  const zoomArea = document.createElement('div')

  /** @type {Context} */
  const context = {
    diagram: undefined,
    node,
    panel: document.createElement('div'),
    zoomAreaSelection: select(zoomArea),
    zoomArea,
    // @ts-expect-error: we’ll attach an `HTMLElement` later, not an `Element.
    zoomBehavior: zoom()
      // We’ll set `translateExtent` when we know sizes.
      .scaleExtent(state.scaleExtent)
      .on('zoom', onzoom),
    zoomedArea: document.createElement('div')
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
   * @returns {Promise<undefined>}
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
   *   Event.
   * @returns {Promise<undefined>}
   *   Promise that resolves with nothing.
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
   *   Entries.
   * @returns {undefined}
   *   Nothing.
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
   * @param {D3ZoomEvent<HTMLElement, unknown>} event
   *   Event.
   * @returns {undefined}
   *   Nothing.
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
   * @returns {undefined}
   *   Nothing.
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
 *   Context.
 * @param {State} state
 *   State.
 * @param {UpdateValueOptions | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Promise<undefined>}
 *   Promise that resolves to nothing.
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
 *   State.
 * @returns {undefined}
 *   Nothing.
 */
function updateDarkmode(state) {
  mermaid.initialize({
    flowchart: {diagramPadding: 48},
    gantt: {useWidth: 1200},
    pie: {useWidth: 1200},
    startOnLoad: false,
    // Escape tags and disable click events within the diagram
    securityLevel: 'strict',
    // Stop user configs in the mermaid files from overriding these keys
    secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize'],
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
 *   Context.
 * @returns {Transition<HTMLDivElement, unknown, null, undefined>}
 *   Transition.
 */
function createTransition(context) {
  return context.zoomAreaSelection.transition(transition().duration(100))
}
