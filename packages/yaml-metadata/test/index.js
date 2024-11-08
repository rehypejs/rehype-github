import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {controlPictures} from 'control-pictures'
import {createGfmFixtures} from 'create-gfm-fixtures'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGithubYamlMetadata from 'remark-github-yaml-metadata'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('remarkGithubYamlMetadata', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('remark-github-yaml-metadata')).sort(),
      ['default', 'defaultCreateErrorMessage', 'defaultParseOptions']
    )
  })

  await t.test('should transform a table', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkFrontmatter)
          .use(remarkGithubYamlMetadata)
          .use(remarkRehype)
          .use(rehypeStringify)
          .process('---\na: b\n---')
      ),
      '<table><thead><tr><th>a</th></tr></thead><tbody><tr><td><div>b</div></td></tr></tbody></table>'
    )
  })

  await t.test('should not fail w/o `remark-frontmatter`', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkGithubYamlMetadata)
          .use(remarkRehype)
          .use(rehypeStringify)
          .process('---\na: b\n---')
      ),
      '<hr>\n<h2>a: b</h2>'
    )
  })

  await t.test('should support `parseOptions.intAsBigInt`', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkFrontmatter)
          .use(remarkGithubYamlMetadata, {parseOptions: {intAsBigInt: true}})
          .use(remarkRehype)
          .use(rehypeStringify)
          .process('---\na: 123\n---')
      ),
      '<table><thead><tr><th>a</th></tr></thead><tbody><tr><td><div>123</div></td></tr></tbody></table>'
    )
  })

  await t.test('should support `parseOptions.prettyErrors`', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkFrontmatter)
          .use(remarkGithubYamlMetadata, {parseOptions: {prettyErrors: false}})
          .use(remarkRehype)
          .use(rehypeStringify)
          .process('---\na:\n  "b\n---')
      ),
      '<div><div class="flash flash-error mb-3">Error in user YAML: (&#x3C;unknown>): Missing closing "quote</div><div class="highlight highlight-source-yaml"><pre>---\na:\n  "b\n---</pre></div></div>'
    )
  })

  await t.test('should support `parseOptions.mapAsMap`', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkFrontmatter)
          .use(remarkGithubYamlMetadata, {parseOptions: {mapAsMap: true}})
          .use(remarkRehype)
          .use(rehypeStringify)
          .process('---\n{[1, 2]: many}\n---')
      ),
      '<table><thead><tr><th><table><tbody><tr><td><div>1</div></td><td><div>2</div></td></tr></tbody></table>\n</th></tr></thead><tbody><tr><td><div>many</div></td></tr></tbody></table>'
    )
  })

  await t.test('should support `allowArrayAtRoot`', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkFrontmatter)
          .use(remarkGithubYamlMetadata, {allowArrayAtRoot: true})
          .use(remarkRehype)
          .use(rehypeStringify)
          .process('---\n- a\n---')
      ),
      '<table><tbody><tr><td><div>a</div></td></tr></tbody></table>'
    )
  })

  await t.test(
    'should support `allowPrimitiveAtRoot` (string)',
    async function () {
      assert.equal(
        String(
          await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkFrontmatter)
            .use(remarkGithubYamlMetadata, {allowPrimitiveAtRoot: true})
            .use(remarkRehype)
            .use(rehypeStringify)
            .process('---\na\n---')
        ),
        '<table><tbody><tr><td><div>a</div></td></tr></tbody></table>'
      )
    }
  )

  await t.test(
    'should support `allowPrimitiveAtRoot` (null)',
    async function () {
      assert.equal(
        String(
          await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkFrontmatter)
            .use(remarkGithubYamlMetadata, {allowPrimitiveAtRoot: true})
            .use(remarkRehype)
            .use(rehypeStringify)
            .process('---\nnull\n---')
        ),
        '<table><tbody><tr><td><div></div></td></tr></tbody></table>'
      )
    }
  )

  await t.test('should support `createErrorMessage`', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkFrontmatter)
          .use(remarkGithubYamlMetadata, {
            createErrorMessage(info) {
              assert.deepEqual(info, {
                message: 'Missing closing "quote',
                point: {line: 2, column: 5},
                summary: '  "b\n    ^',
                yaml: '---\na:\n  "b\n---'
              })
              return []
            }
          })
          .use(remarkRehype)
          .use(rehypeStringify)
          .process('---\na:\n  "b\n---')
      ),
      '<div></div>'
    )
  })
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {
    controlPictures: true,
    keep: {frontmatter: true}
  })

  const files = await fs.readdir(base)
  const extension = '.md'

  for (const d of files) {
    if (!d.endsWith(extension)) continue

    const name = d.slice(0, -extension.length)

    if (name === 'blockquote') {
      // To do: fix `micromark` to *not* support block quotes in frontmatter
      continue
    }

    await t.test(name, async function () {
      const input = controlPictures(
        String(await fs.readFile(new URL(name + '.md', base)))
      )
      let expected = String(await fs.readFile(new URL(name + '.html', base)))

      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(
          name.endsWith('.comment')
            ? []
            : [remarkFrontmatter, remarkGithubYamlMetadata]
        )
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeRaw)
        .use(rehypeStringify)

      let actual = String(await processor.process(input))

      if (actual && !/\n$/.test(actual)) {
        actual += '\n'
      }

      // To do: use `starry-night`?
      const re = /<span class="pl-.+?">(.+?)<\/span>/g
      actual = actual.replace(re, '$1').replace(re, '$1')
      expected = expected.replace(re, '$1').replace(re, '$1')

      // Undo GH-specific highlighting.

      expected = expected
        // To do: fix `rehype-raw` in fragment mode w/ whitespace in tables, then add whitespace.
        .replace(/\n {2}</g, '<')
        // GH adds a weird amount of blank lines.
        .replace(/\n{2}/g, '\n')
        .replace(/<\/tbody>\n<\/table>/g, '</tbody></table>')
        // GH uses a custom parser that mostly follows YAML 1.1 but not exactly.
        // In YAML 1.1, `y` and `n` should transform to `true` and `false`, but they don’t.
        .replace(/<td><div>y<\/div><\/td>/g, '<td><div>true</div></td>')
        .replace(/<td><div>n<\/div><\/td>/g, '<td><div>false</div></td>')
        // GH sometimes does or doesn’t an eol after YAML code blocks.
        .replace('---\n</pre>', '---</pre>')
        // Drop their custom element.
        .replace(/<\/?markdown-accessiblity-table>/g, '')

      actual = actual
        // Different YAML parser has different error messages.
        .replace(
          'Implicit keys need to be on a single line',
          "could not find expected ':' while scanning a simple key"
        )
        .replace(
          'Tabs are not allowed as indentation',
          'found character that cannot start any token while scanning for the next token'
        )
        // We currently have to wrap things in an extra div for parse errors.
        .replace('<div><div class="flash', '<div class="flash')
        .replace('</pre></div></div>', '</pre></div>')

      if (name === 'data-object') {
        // GH parses dates relative to their server, plus they have different
        // formats for different date types in source YAML.
        // We can’t do that.
        const looksLikeADate =
          /\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2}( [-+]\d{1,4})?)?/g
        actual = actual.replace(looksLikeADate, 'xxxx:yy:zz')
        expected = expected.replace(looksLikeADate, 'xxxx:yy:zz')
      }

      assert.equal(actual, expected)
    })
  }
})
