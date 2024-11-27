import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {controlPictures} from 'control-pictures'
import {createGfmFixtures} from 'create-gfm-fixtures'
import rehypeGithubAlert from 'rehype-github-alert'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('rehypeGithubSanitizeSchema', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('rehype-github-alert')).sort(), [
      'default'
    ])
  })

  await t.test('should clean', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubAlert)
          .use(rehypeStringify)
          .process('<blockquote><p>[!note]</p><p>hi</p></blockquote>')
      ),
      '<div class="markdown-alert markdown-alert-note"><p class="markdown-alert-title"><svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>Note</p><p>hi</p></div>'
    )
  })
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {controlPictures: true})

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, {allowDangerousHtml: true})
    .use(rehypeRaw, {tagfilter: true})
    .use(rehypeGithubAlert)
    // .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)

  const files = await fs.readdir(base)
  const extension = '.md'

  for (const d of files) {
    if (!d.endsWith(extension)) continue

    const name = d.slice(0, -extension.length)

    await t.test(name, async function () {
      const input = await fs.readFile(new URL(name + '.md', base), 'utf8')
      let expected = await fs.readFile(new URL(name + '.html', base), 'utf8')

      let actual = String(await processor.process(controlPictures(input)))

      if (name === 'code') {
        expected = expected
          .replace(/<span class="pl-.+?">(.+?)<\/span>/g, '$1')
          .replace(
            /<div class="highlight highlight-source-rust"><pre>/g,
            '<pre><code class="language-rs">'
          )
          .replace(/<\/pre><\/div>/g, '\n</code></pre>')
      }

      if (actual && !/\n$/.test(actual)) {
        actual += '\n'
      }

      assert.equal(actual, expected)
    })
  }
})
