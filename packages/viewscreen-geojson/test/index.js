/**
 * @typedef {import('geojson').GeoJSON} GeoJson
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {JSDOM} from 'jsdom'

const {window} = new JSDOM()
const document = window.document

// @ts-expect-error: fine
globalThis.window = window
globalThis.document = document
globalThis.navigator = window.navigator

// Fix crash in `leaflet.markercluster`.
const {default: L} = await import('leaflet')
// @ts-expect-error: fine.
// type-coverage:ignore-next-line
globalThis.L = L

const {viewscreenGeojson} = await import('viewscreen-geojson')

/** @type {GeoJson} */
const geojsonExample = {
  type: 'Feature',
  geometry: {type: 'Point', coordinates: [125.6, 10.1]},
  properties: {name: 'Dinagat Islands'}
}

test('viewscreenGeojson', async function (t) {
  assert.deepEqual(
    Object.keys(await import('viewscreen-geojson')).sort(),
    ['viewscreenGeojson'],
    'should expose the public api'
  )

  // To do: for some reason leaflet, in JSDOM, crashes on Topojson.
  await t.test('topojson', {skip: true}, () => {
    const node = document.createElement('div')
    const {change} = viewscreenGeojson(node)
    assert.match(node.innerHTML, /Leaflet/, 'should generate markup')

    change(
      JSON.stringify({
        type: 'Topology',
        bbox: [0, 0, 10, 10],
        objects: {polygon: {type: 'Polygon', arcs: [[0]]}},
        arcs: [
          [
            [0, 0],
            [0, 10],
            [10, 10],
            [10, 0],
            [0, 0]
          ]
        ]
      })
    )
    assert.match(
      node.innerHTML,
      /leaflet-tile-container/,
      'should render a map'
    )
  })

  await t.test('geojson', () => {
    const node = document.createElement('div')
    const {change} = viewscreenGeojson(node)
    assert.match(node.innerHTML, /Leaflet/, 'should generate markup')

    change(JSON.stringify(geojsonExample))
    assert.match(
      node.innerHTML,
      /leaflet-tile-container/,
      'should render a map'
    )
  })

  await t.test('options.onResolve', () => {
    const node = document.createElement('div')
    let called = false
    const {change} = viewscreenGeojson(node, {
      onResolve() {
        called = true
      }
    })

    change(JSON.stringify(geojsonExample))
    assert.ok(called, 'should call `onResolve` when done')
  })

  await t.test('onReject', () => {
    const node = document.createElement('div')
    let message = ''
    const {change} = viewscreenGeojson(node, {
      onReject(reason) {
        message = reason
      }
    })

    change('{')
    // Different error messages on different Node versions.
    assert.ok(message !== '', 'should call `onReject` with an error')
  })

  await t.test('error w/o onReject', () => {
    const node = document.createElement('div')
    const {change} = viewscreenGeojson(node)

    change('{')
    assert.ok(
      !/leaflet-tile-container/.test(node.innerHTML),
      'should not render a map for broken json'
    )
  })

  await t.test('options.onSizeSuggestion', () => {
    const node = document.createElement('div')
    node.setAttribute('style', 'width:100px')
    let size = [-1, -1]
    const {change} = viewscreenGeojson(node, {
      onSizeSuggestion(w, h) {
        size = [w, h]
      }
    })

    change(JSON.stringify(geojsonExample))
    // JSDOM always returns `0` for boxes.
    assert.deepEqual(size, [0, 0], 'should call `onSizeSuggestion` when done')
  })
})
