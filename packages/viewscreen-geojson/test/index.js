import assert from 'node:assert/strict'
import test from 'node:test'

test('viewscreenGeojson', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('viewscreen-stl')).sort(), [
      'viewscreenGeojson'
    ])
  })
})

// Note: we can’t really test much for most viewscreens.
// We can test some more for leaflet with JSDOM.
// But that’s fake, isn’t very extensive, and JSDOM is super heavy.
// So instead,
// no tests.
