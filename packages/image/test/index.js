import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import process from 'node:process'
import test from 'node:test'
import {createGfmFixtures} from 'create-gfm-fixtures'
import rehypeGithubImage, {camo} from 'rehype-github-image'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import semver from 'semver'
import {unified} from 'unified'

const hasCrypto = semver.gt(process.versions.node, '19.0.0')

test('rehypeGithubImage', async () => {
  assert.deepEqual(
    Object.keys(await import('rehype-github-image')).sort(),
    ['camo', 'default'],
    'should expose the public api'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubImage)
        .use(rehypeStringify)
        .process('<img src="https://foo.bar/image.png">')
    ),
    '<p><a target="_blank" rel="noopener noreferrer" href="https://foo.bar/image.png"><img src="https://foo.bar/image.png" style="max-width: 100%;"></a></p>',
    'should transform a image'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubImage)
        .use(rehypeStringify)
        .process('<img src="image.png">')
    ),
    '<p><a target="_blank" rel="noopener noreferrer" href="image.png"><img src="image.png" style="max-width: 100%;"></a></p>',
    'should transform a local image'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubImage)
        .use(rehypeStringify)
        .process('<img src="https://foo.bar/image.png">')
    ),
    '<p><a target="_blank" rel="noopener noreferrer" href="https://foo.bar/image.png"><img src="https://foo.bar/image.png" style="max-width: 100%;"></a></p>',
    'should transform a image'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubImage, {
          toProxyUrl: camo('https://camo.potatos.com', 'potato'),
          internal: 'potatos.com'
        })
        .use(rehypeStringify)
        .process('<img src="https://foo.bar/image.png">')
    ),
    '<p><a target="_blank" href="https://camo.potatos.com/9fb8ad6349b1c0ccbfde86e14c74b2dc5897eb12/68747470733a2f2f666f6f2e6261722f696d6167652e706e67"><img src="https://camo.potatos.com/9fb8ad6349b1c0ccbfde86e14c74b2dc5897eb12/68747470733a2f2f666f6f2e6261722f696d6167652e706e67" data-canonical-src="https://foo.bar/image.png" style="max-width: 100%;"></a></p>',
    'should support a camo proxy'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubImage, {
          toProxyUrl: camo('https://camo.potatos.com', 'potato')
        })
        .use(rehypeStringify)
        .process('<img src="https://potatos/image.png">')
    ),
    '<p><a target="_blank" href="https://camo.potatos.com/d25c4c44911a8c546dd3018f75a82934bd9af604/68747470733a2f2f706f7461746f732f696d6167652e706e67"><img src="https://camo.potatos.com/d25c4c44911a8c546dd3018f75a82934bd9af604/68747470733a2f2f706f7461746f732f696d6167652e706e67" data-canonical-src="https://potatos/image.png" style="max-width: 100%;"></a></p>',
    'should support a camo proxy w/o `internal`'
  )

  if (hasCrypto) {
    const {camo: camoDom} = await import('../lib/camo.dom.js')

    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubImage, {
            toProxyUrl: camoDom('https://camo.potatos.com', 'potato'),
            internal: ['potatos.com']
          })
          .use(rehypeStringify)
          .process('<img src="https://foo.bar/image.png">')
      ),
      '<p><a target="_blank" href="https://camo.potatos.com/9fb8ad6349b1c0ccbfde86e14c74b2dc5897eb12/68747470733a2f2f666f6f2e6261722f696d6167652e706e67"><img src="https://camo.potatos.com/9fb8ad6349b1c0ccbfde86e14c74b2dc5897eb12/68747470733a2f2f666f6f2e6261722f696d6167652e706e67" data-canonical-src="https://foo.bar/image.png" style="max-width: 100%;"></a></p>',
      'should support the DOM version of the camo proxy (which is async)'
    )
  }

  assert.throws(
    () => {
      unified()
        .use(rehypeGithubImage, {
          toProxyUrl: camo('https://camo.potatos.com', 'potato'),
          internal: 'https://potatos.com'
        })
        .freeze()
    },
    /Expected valid hostname for URL/,
    'should throw when a protocol is used in `internal`, for a single string'
  )

  assert.throws(
    () => {
      unified()
        .use(rehypeGithubImage, {
          toProxyUrl: camo('https://camo.potatos.com', 'potato'),
          internal: ['potatos.com/asd']
        })
        .freeze()
    },
    /Expected valid hostname for URL/,
    'should throw when a path is used in `internal`, for an array'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubImage, {rel: 'ugc'})
        .use(rehypeStringify)
        .process('<img src="image.png">')
    ),
    '<p><a target="_blank" rel="ugc" href="image.png"><img src="image.png" style="max-width: 100%;"></a></p>',
    'should support `rel` as `string`'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubImage, {
          rel: ['nofollow', 'noopener', 'noreferrer', 'ugc']
        })
        .use(rehypeStringify)
        .process('<img src="image.png">')
    ),
    '<p><a target="_blank" rel="nofollow noopener noreferrer ugc" href="image.png"><img src="image.png" style="max-width: 100%;"></a></p>',
    'should support `rel` as `Array`'
  )

  assert.throws(
    () => {
      unified()
        .use(rehypeGithubImage, {rel: 'nofollow noopener noreferrer ugc'})
        .freeze()
    },
    /Expected valid `rel` value, without space/,
    'should throw when `rel` includes spaces'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubImage, {targetBlank: false})
        .use(rehypeStringify)
        .process('<img src="image.png">')
    ),
    '<p><a rel="noopener noreferrer" href="image.png"><img src="image.png" style="max-width: 100%;"></a></p>',
    'should support `rel` as `string`'
  )
})

test('fixtures', async () => {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {keep: {camo: true, image: true}})

  const files = await fs.readdir(base)
  const extension = '.md'
  let index = -1

  while (++index < files.length) {
    const d = files[index]

    if (!d.endsWith(extension)) {
      continue
    }

    const name = d.slice(0, -extension.length)
    const input = await fs.readFile(new URL(name + '.md', base))
    let expected = String(await fs.readFile(new URL(name + '.html', base)))

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, {allowDangerousHtml: true})
      .use(rehypeRaw)
      .use(rehypeGithubImage, {
        toProxyUrl: camo(
          'https://camo.githubusercontent.com',
          '0x24FEEDFACEDEADBEEFCAFE'
        ),
        internal: 'github.com'
      })
      .use(rehypeStringify)

    let actual = String(await processor.process(input))

    if (actual && !/\n$/.test(actual)) {
      actual += '\n'
    }

    const camoRe = /camo\.githubusercontent\.com\/[\da-f]{32,64}\//g
    const camoRepl = 'camo.githubusercontent.com/xxxyyyzzz/'
    actual = actual.replaceAll(camoRe, camoRepl)
    expected = expected.replaceAll(camoRe, camoRepl)

    // To do: `rehype-github-sanitize`?
    actual = actual.replaceAll(' rel="author"', '')

    if (name === 'urls') {
      // GitHub does not see uppercased domains as themselves.
      // The JS URL standard normalizes the casing of domains, so we can’t see
      // the raw uppercase domain.
      actual = actual.replace(
        /<a target="_blank" rel="noopener noreferrer" href="http:\/\/GITHUB.com\/alpha\/bravo"><img src="http:\/\/GITHUB.com\/alpha\/bravo" alt="q" style="max-width: 100%;"><\/a>/,
        '<a target="_blank" href="https://camo.githubusercontent.com/xxxyyyzzz/687474703a2f2f4749544855422e636f6d2f616c7068612f627261766f"><img src="https://camo.githubusercontent.com/xxxyyyzzz/687474703a2f2f4749544855422e636f6d2f616c7068612f627261766f" alt="q" data-canonical-src="http://GITHUB.com/alpha/bravo" style="max-width: 100%;"></a>'
      )
    }

    if (name === 'errors') {
      // GitHub does not handle invalid URLs.
      // There is no good reason to keep URLs that browser can’t connect to, so
      // drop them.
      expected = expected
        .replace(
          '<a target="_blank" href="https://camo.githubusercontent.com/xxxyyyzzz/68747470733a2f2f6578612532336d706c652e6f7267"><img src="https://camo.githubusercontent.com/xxxyyyzzz/68747470733a2f2f6578612532336d706c652e6f7267" alt="a" data-canonical-src="https://exa%23mple.org" style="max-width: 100%;"></a>',
          '<a target="_blank" rel="noopener noreferrer" href=""><img alt="a" style="max-width: 100%;"></a>'
        )
        .replace(
          '<a target="_blank" href="https://camo.githubusercontent.com/xxxyyyzzz/68747470733a2f2f312e322e332e342e352f"><img src="https://camo.githubusercontent.com/xxxyyyzzz/68747470733a2f2f312e322e332e342e352f" alt="b" data-canonical-src="https://1.2.3.4.5/" style="max-width: 100%;"></a>',
          '<a target="_blank" rel="noopener noreferrer" href=""><img alt="b" style="max-width: 100%;"></a>'
        )
        .replace(
          '<a target="_blank" href="https://camo.githubusercontent.com/xxxyyyzzz/68747470733a2f2f746573742e3432"><img src="https://camo.githubusercontent.com/xxxyyyzzz/68747470733a2f2f746573742e3432" alt="c" data-canonical-src="https://test.42" style="max-width: 100%;"></a>',
          '<a target="_blank" rel="noopener noreferrer" href=""><img alt="c" style="max-width: 100%;"></a>'
        )
    }

    assert.equal(actual, expected, name)
  }
})
