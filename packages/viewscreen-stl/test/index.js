import assert from 'node:assert/strict'
import test from 'node:test'

test('viewscreenStl', async function () {
  assert.deepEqual(
    Object.keys(await import('viewscreen-stl')).sort(),
    ['viewscreenStl'],
    'should expose the public api'
  )
})

// Note: we can’t really test 3D geometry nicely in JSDOM.
// Even with JSDOM, it needs a `canvas` package, which fails in Node 19 and 20 currently.
