import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {createGfmFixtures} from 'create-gfm-fixtures'
import {h} from 'hastscript'
import rehypeGithubHeading from 'rehype-github-heading'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('rehypeGithubHeading', async () => {
  assert.deepEqual(
    Object.keys(await import('rehype-github-heading')).sort(),
    ['default', 'defaultBuild', 'defaultInclude'],
    'should expose the public api'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubHeading)
        .use(rehypeStringify)
        .process('<h1>hi</h1>')
    ),
    '<h1><a id="hi" class="anchor" aria-hidden="true" href="#hi"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path></svg></a>hi</h1>',
    'should transform a heading'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubHeading, {
          build(id) {
            return h('a', {href: '#' + id}, '!')
          }
        })
        .use(rehypeStringify)
        .process('<h1>hi</h1>')
    ),
    '<h1><a href="#hi">!</a>hi</h1>',
    'should support `build`'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubHeading, {
          build(id) {
            return [h('a', {href: '#' + id}, '!'), h('span', '?')]
          }
        })
        .use(rehypeStringify)
        .process('<h1>hi</h1>')
    ),
    '<h1><a href="#hi">!</a><span>?</span>hi</h1>',
    'should support `build` yielding an array'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubHeading, {
          behavior: 'append',
          build(id) {
            return h('a', {href: '#' + id}, '!')
          }
        })
        .use(rehypeStringify)
        .process('<h1>hi</h1>')
    ),
    '<h1>hi<a href="#hi">!</a></h1>',
    'should support `behavior: append`'
  )
})

test('fixtures', async function () {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {keep: {heading: true}})

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
      .use(rehypeGithubHeading)
      .use(rehypeStringify)

    let actual = String(await processor.process(input))

    actual = actual
      // To do: `remark-rehype` should change the order.
      .replace(
        /class="sr-only" id="footnote-label"/g,
        'id="footnote-label" class="sr-only"'
      )
      // To do: `remark-rehype` should implement new labels.
      .replace(
        /class="data-footnote-backref" aria-label="Back to content"/g,
        'aria-label="Back to reference 1" class="data-footnote-backref"'
      )
      // Emoji, not supported in this transform, see `rehype-github-emoji`.
      // To do: use it?
      .replace(/:smile:/g, '😄')
      .replace(/:ok_hand:/g, '👌')
      .replace(/:hatched_chick:/g, '🐥')
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

    assert.equal(actual, expected, name)
  }
})
