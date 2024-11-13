/* eslint-env browser */

/**
 * @import {Feature, GeoJSON as GeoJson, Geometry} from 'geojson'
 * @import {GeoJSON as LeafletGeoJson} from 'leaflet'
 * @import {Topology} from 'topojson-specification'
 */

/**
 * @callback OnReject
 *   Callback called when rejecting.
 * @param {string} value
 *   Reason.
 * @returns {undefined}
 *   Nothing.
 *
 * @callback OnResolve
 *   Callback called when resolving.
 * @returns {undefined}
 *   Nothing.
 *
 * @callback OnSizeSuggestion
 *   Callback called when there’s a new size suggestion for the viewscreen.
 * @param {number} width
 *   Current width.
 * @param {number} height
 *   Preferred height for `width`.
 * @returns {undefined}
 *   Nothing.
 *
 * @typedef Options
 *   Configuration.
 * @property {OnReject | null | undefined} [onReject]
 *   Callback called when rejecting.
 * @property {OnResolve | null | undefined} [onResolve]
 *   Callback called when resolving.
 * @property {OnSizeSuggestion | null | undefined} [onSizeSuggestion]
 *   Callback called on a size suggestion.
 */

import L from 'leaflet'
// eslint-disable-next-line import/no-unassigned-import
import 'leaflet.markercluster'
import {feature} from 'topojson-client'

/**
 * Render a map in `node`.
 *
 * @param {HTMLElement} node
 *   Node to work in.
 * @param {Options | null | undefined} [options]
 *   Configuration.
 * @returns
 *   Actions.
 */
export function create(node, options) {
  // Not available in JSDOM.
  const observer =
    'ResizeObserver' in window ? new ResizeObserver(onresize) : undefined
  if (observer) observer.observe(node)

  // `unicorn` is wrong, this is not an array.
  // eslint-disable-next-line unicorn/no-array-callback-reference
  const map = L.map(node)
  const tileLayer = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }
  )
  /** @type {LeafletGeoJson<Record<string, unknown>, Geometry>} */
  const geoJsonLayer = L.geoJSON(undefined, {
    onEachFeature(feature, layer) {
      const description = createFeatureDescription(feature)
      if (description) layer.bindPopup(description)
    }
  })
  // @ts-expect-error: untyped.
  const clusterGroup = L.markerClusterGroup()
  tileLayer.addTo(map)
  clusterGroup.addTo(map)

  return {change}

  /**
   * Change the topology.
   *
   * @param {string} data
   *   Data to change.
   * @returns {undefined}
   *   Nothing.
   */
  function change(data) {
    // To do: handle changes?
    /** @type {GeoJson | Topology} */
    let json

    try {
      json = JSON.parse(data)
    } catch (error) {
      const exception = /** @type {Error} */ (error)
      if (options && options.onReject) {
        return options.onReject(exception.message)
      }

      return
    }

    geoJsonLayer.clearLayers()
    // Removing/adding this seems to cause the clusters to recalculate.
    clusterGroup.removeLayer(geoJsonLayer)

    // `topojson`.
    if (json.type === 'Topology') {
      for (const value of Object.values(json.objects)) {
        geoJsonLayer.addData(feature(json, value))
      }
    }
    // `geojson`.
    else {
      geoJsonLayer.addData(json)
    }

    geoJsonLayer.addTo(clusterGroup)
    map.fitBounds(geoJsonLayer.getBounds())
    if (options && options.onResolve) options.onResolve()
    onresize([])
  }

  /**
   * Handle a resize from an observer.
   *
   * Also supports being called with `[]` for `entries` to force this behavior.
   *
   * @param {Array<ResizeObserverEntry>} entries
   *   Resize observer entries.
   * @returns {undefined}
   *   Nothing.
   */
  function onresize(entries) {
    const entry = entries[0]
    const rect = entry ? entry.contentRect : node.getBoundingClientRect()
    if (options && options.onSizeSuggestion) {
      return options.onSizeSuggestion(rect.width, rect.height)
    }
  }
}

const tr = document.createElement('tr')
const th = document.createElement('th')
const td = document.createElement('td')
tr.append(th)
tr.append(td)

/**
 * Create the markup for a tooltip.
 *
 * We display all fields.
 * Assumes values are strings, at some point we could support arrays and
 * objects and whatnot.
 *
 * @param {Feature<Geometry, Record<string, unknown>>} feature
 *   Feature to create a description for.
 * @returns {string}
 *   Description.
 */
function createFeatureDescription(feature) {
  let buf = ''

  if (feature.properties) {
    for (const [key, value] of Object.entries(feature.properties)) {
      th.textContent = key
      td.textContent = String(value)
      buf += tr.outerHTML
    }
  }

  if (buf) buf = '<table>' + buf + '</table>'

  return buf
}
