import assert from 'node:assert/strict'
import test from 'node:test'

test('viewscreenMermaid', async () => {
  assert.deepEqual(
    Object.keys(await import('viewscreen-mermaid')).sort(),
    ['viewscreenMermaid'],
    'should expose the public api'
  )
})

// Note: we can only test this by using a browser: JSDOM doesn’t work.
// But, even with a browser, every OS would yield different results, as they all
// handle fonts differently.
