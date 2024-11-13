import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {createGfmFixtures} from 'create-gfm-fixtures'
import {h} from 'hastscript'
import rehypeGithubEmoji from 'rehype-github-emoji'
import rehypeGithubHeading from 'rehype-github-heading'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('rehypeGithubHeading', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('rehype-github-heading')).sort(),
      ['default', 'defaultBuild', 'defaultInclude']
    )
  })

  await t.test('should transform a heading', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubHeading)
          .use(rehypeStringify)
          .process('<h1>hi</h1>')
      ),
      '<div class="markdown-heading"><h1 class="heading-element">hi</h1><a id="hi" class="anchor" aria-label="Permalink: hi" href="#hi"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path></svg></a></div>'
    )
  })

  await t.test('should support `build`', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubHeading, {
            build(id, node) {
              return {
                ...node,
                children: [h('a', {href: '#' + id}, '!'), ...node.children]
              }
            }
          })
          .use(rehypeStringify)
          .process('<h1>hi</h1>')
      ),
      '<h1><a href="#hi">!</a>hi</h1>'
    )
  })

  await t.test('should support `build` yielding an array', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubHeading, {
            build(id, node) {
              return [node, h('a', {href: '#' + id}, '!')]
            }
          })
          .use(rehypeStringify)
          .process('<h1>hi</h1>')
      ),
      '<h1>hi</h1><a href="#hi">!</a>'
    )
  })
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {keep: {heading: true}})

  const files = await fs.readdir(base)
  const extension = '.md'

  for (const d of files) {
    if (!d.endsWith(extension)) continue

    const name = d.slice(0, -extension.length)

    await t.test(name, async function () {
      const input = await fs.readFile(new URL(name + '.md', base), 'utf8')
      let expected = await fs.readFile(new URL(name + '.html', base), 'utf8')

      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeRaw)
        .use(rehypeGithubHeading)
        .use(rehypeGithubEmoji)
        .use(rehypeStringify)

      let actual = String(await processor.process(input))

      actual = actual
        // To do: `remark-rehype` should change the order.
        .replace(
          /class="sr-only" id="footnote-label"/g,
          'id="footnote-label" class="sr-only"'
        )
        // To do: consolidate all the tools that add `user-content-`?
        .replace(/id="(?!user-content-|footnote-label|")/g, 'id="user-content-')
        .replace(
          /name="(?!user-content-|footnote-label|")/g,
          'name="user-content-'
        )

      if (actual && !/\n$/.test(actual)) {
        actual += '\n'
      }

      // To do: add to `create-gfm-fixtures`.
      // GH adds `notranslate`, this should be (optionally) removed by `crate-gfm-fixtures`.
      expected = expected.replace(/ class="notranslate"/g, '')

      assert.equal(actual, expected)
    })
  }
})
