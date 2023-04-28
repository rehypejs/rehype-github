import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {createGfmFixtures} from 'create-gfm-fixtures'
import rehypeGithubLink from 'rehype-github-link'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('rehypeGithubLink', async () => {
  assert.deepEqual(
    Object.keys(await import('rehype-github-link')).sort(),
    ['default'],
    'should expose the public api'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubLink)
        .use(rehypeStringify)
        .process('<a href="https://example.com">alpha</a>')
    ),
    '<a href="https://example.com" rel="nofollow">alpha</a>',
    'should transform a link'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubLink, {internal: 'example.com'})
        .use(rehypeStringify)
        .process(
          '<a href="https://example.com">alpha</a>\n<a href="https://example.org">bravo</a>'
        )
    ),
    '<a href="https://example.com">alpha</a>\n<a href="https://example.org" rel="nofollow">bravo</a>',
    'should support `internal` set to one hostname'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubLink, {internal: ['example.com', 'example.org']})
        .use(rehypeStringify)
        .process(
          '<a href="https://example.com">alpha</a>\n<a href="https://example.org">bravo</a>'
        )
    ),
    '<a href="https://example.com">alpha</a>\n<a href="https://example.org">bravo</a>',
    'should support `internal` set to hostnames'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubLink, {internal: []})
        .use(rehypeStringify)
        .process(
          '<a href="https://example.com">alpha</a>\n<a href="https://example.org">bravo</a>'
        )
    ),
    '<a href="https://example.com" rel="nofollow">alpha</a>\n<a href="https://example.org" rel="nofollow">bravo</a>',
    'should support `internal` set to zero hostnames'
  )

  assert.throws(
    function () {
      unified()
        .use(rehypeGithubLink, {internal: 'https://example.com'})
        .freeze()
    },
    /Expected valid hostname for URL/,
    'should throw when a protocol is used in `internal`'
  )

  assert.throws(
    function () {
      unified().use(rehypeGithubLink, {internal: 'example.com/asd'}).freeze()
    },
    /Expected valid hostname for URL/,
    'should throw when a path is used in `internal`'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubLink, {rel: 'ugc'})
        .use(rehypeStringify)
        .process('<a href="https://example.com">alpha</a>')
    ),
    '<a href="https://example.com" rel="ugc">alpha</a>',
    'should support `rel` set to a string'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubLink, {rel: ['ugc', 'nofollow']})
        .use(rehypeStringify)
        .process('<a href="https://example.com">alpha</a>')
    ),
    '<a href="https://example.com" rel="ugc nofollow">alpha</a>',
    'should support `rel` set to an array'
  )

  assert.throws(
    function () {
      unified().use(rehypeGithubLink, {rel: 'ugc nofollow'}).freeze()
    },
    /Expected valid `rel` value, without space/,
    'should throw when a `rel` includes spaces'
  )
})

test('fixtures', async function () {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {keep: {link: true}})

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
      .use(rehypeGithubLink)
      .use(rehypeStringify)

    let actual = String(await processor.process(input))

    if (actual && !/\n$/.test(actual)) {
      actual += '\n'
    }

    // To do: use an improved `rehype-sanitize` to check this?
    actual = actual
      .replace(/<a href="(?:htt|xxx|file|tel):[^"]*"[^>]*>([^<]*)<\/a>/g, '$1')
      .replace(/<a>1<\/a>/g, '1')
      .replace(/<a title="">2<\/a>/g, '2')
      // To do: `rehype-sanitize` should drop rels.
      .replace(/ rel="author"/g, '')
      .replace(/ rel="author /g, ' rel="')

    // To do: add to `create-gfm-fixtures`.
    // GH adds `notranslate`, this should be (optionally) removed by `crate-gfm-fixtures`.
    expected = expected.replace(/ class="notranslate"/g, '')

    assert.equal(actual, expected, name)
  }
})
