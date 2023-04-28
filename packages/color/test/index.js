import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {createGfmFixtures} from 'create-gfm-fixtures'
import rehypeGithubColor from 'rehype-github-color'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('rehypeGithubColor', async () => {
  assert.deepEqual(
    Object.keys(await import('rehype-github-color')).sort(),
    ['default', 'defaultBuild', 'defaultExpression'],
    'should expose the public api'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubColor)
        .use(rehypeStringify)
        .process('<code>#00eaff</code>')
    ),
    '<code>#00eaff<span class="ml-1 d-inline-block border circle color-border-subtle" style="background-color: #00eaff; height: 8px; width: 8px;"></span></code>',
    'should transform a 6-digit hex color'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubColor, {
          expression: /^#(?:[\da-f]{3}|[\da-f]{6})$/i
        })
        .use(rehypeStringify)
        .process('<code>#123</code>')
    ),
    '<code>#123<span class="ml-1 d-inline-block border circle color-border-subtle" style="background-color: #123; height: 8px; width: 8px;"></span></code>',
    'should support `expression`'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubColor, {
          behavior: 'replace'
        })
        .use(rehypeStringify)
        .process('<code>#123123</code>')
    ),
    '<span class="ml-1 d-inline-block border circle color-border-subtle" style="background-color: #123123; height: 8px; width: 8px;"></span>',
    "should support `behavior: 'replace'`"
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubColor, {
          build() {
            return [
              {type: 'text', value: ' '},
              {type: 'element', tagName: 'i', properties: {}, children: []}
            ]
          }
        })
        .use(rehypeStringify)
        .process('<code>#123123</code>')
    ),
    '<code>#123123 <i></i></code>',
    'should support `build` yielding an array (with `append`)'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubColor, {
          behavior: 'replace',
          build(value) {
            return [
              {type: 'text', value},
              {type: 'element', tagName: 'i', properties: {}, children: []}
            ]
          }
        })
        .use(rehypeStringify)
        .process('<code>#123123</code>')
    ),
    '#123123<i></i>',
    'should support `build` yielding an array (with `replace`)'
  )
})

test('fixtures', async function () {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {
    rehypeStringify: {closeSelfClosing: true}
  })

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
      .use(remarkRehype, {allowDangerousHtml: true})
      .use(rehypeRaw)
      .use(name.endsWith('.comment') ? [rehypeGithubColor] : [])
      .use(rehypeStringify)

    let actual = String(await processor.process(input))

    if (actual && !/\n$/.test(actual)) {
      actual += '\n'
    }

    // To do: add to `create-gfm-fixtures`.
    // GH adds `notranslate`, this should be (optionally) removed by `crate-gfm-fixtures`.
    expected = expected.replace(/ class="notranslate"/g, '')

    assert.equal(actual, expected, name)
  }
})
