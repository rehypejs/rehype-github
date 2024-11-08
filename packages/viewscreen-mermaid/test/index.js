import assert from 'node:assert/strict'
import test from 'node:test'

test('viewscreenMermaid', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('viewscreen-mermaid')).sort(), [
      'viewscreenMermaid'
    ])
  })
})

// Note: we can only test this by using a browser: JSDOM doesn’t work.
// But, even with a browser, every OS would yield different results, as they all
// handle fonts differently.
