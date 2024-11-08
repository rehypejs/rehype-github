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

test('rehypeGithubLink', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('rehype-github-link')).sort(), [
      'default'
    ])
  })

  await t.test('should transform a link', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubLink)
          .use(rehypeStringify)
          .process('<a href="https://example.com">alpha</a>')
      ),
      '<a href="https://example.com" rel="nofollow">alpha</a>'
    )
  })

  await t.test(
    'should support `internal` set to one hostname',
    async function () {
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
        '<a href="https://example.com">alpha</a>\n<a href="https://example.org" rel="nofollow">bravo</a>'
      )
    }
  )

  await t.test('should support `internal` set to hostnames', async function () {
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
      '<a href="https://example.com">alpha</a>\n<a href="https://example.org">bravo</a>'
    )
  })

  await t.test(
    'should support `internal` set to zero hostnames',
    async function () {
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
        '<a href="https://example.com" rel="nofollow">alpha</a>\n<a href="https://example.org" rel="nofollow">bravo</a>'
      )
    }
  )

  await t.test(
    'should throw when a protocol is used in `internal`',
    async function () {
      assert.throws(function () {
        unified()
          .use(rehypeGithubLink, {internal: 'https://example.com'})
          .freeze()
      }, /Expected valid hostname for URL/)
    }
  )

  await t.test(
    'should throw when a path is used in `internal`',
    async function () {
      assert.throws(function () {
        unified().use(rehypeGithubLink, {internal: 'example.com/asd'}).freeze()
      }, /Expected valid hostname for URL/)
    }
  )

  await t.test('should support `rel` set to a string', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubLink, {rel: 'ugc'})
          .use(rehypeStringify)
          .process('<a href="https://example.com">alpha</a>')
      ),
      '<a href="https://example.com" rel="ugc">alpha</a>'
    )
  })

  await t.test('should support `rel` set to an array', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubLink, {rel: ['nofollow', 'ugc']})
          .use(rehypeStringify)
          .process('<a href="https://example.com">alpha</a>')
      ),
      '<a href="https://example.com" rel="nofollow ugc">alpha</a>'
    )
  })

  await t.test('should throw when a `rel` includes spaces', async function () {
    assert.throws(function () {
      unified().use(rehypeGithubLink, {rel: 'nofollow ugc'}).freeze()
    }, /Expected valid `rel` value, without space/)
  })
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {keep: {link: true}})

  const files = await fs.readdir(base)
  const extension = '.md'

  for (const d of files) {
    if (!d.endsWith(extension)) continue

    const name = d.slice(0, -extension.length)

    await t.test(name, async function () {
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
        .replace(
          /<a href="(?:htt|xxx|file|tel):[^"]*"[^>]*>([^<]*)<\/a>/g,
          '$1'
        )
        .replace(/<a>1<\/a>/g, '1')
        .replace(/<a title="">2<\/a>/g, '2')
        // To do: `rehype-sanitize` should drop rels.
        .replace(/ rel="author"/g, '')
        .replace(/ rel="author /g, ' rel="')

      // To do: add to `create-gfm-fixtures`.
      // GH adds `notranslate`, this should be (optionally) removed by `crate-gfm-fixtures`.
      expected = expected.replace(/ class="notranslate"/g, '')

      assert.equal(actual, expected)
    })
  }
})
