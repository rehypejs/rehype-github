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

test('remarkGithubYamlMetadata', async () => {
  assert.deepEqual(
    Object.keys(await import('remark-github-yaml-metadata')).sort(),
    ['default', 'defaultCreateErrorMessage', 'defaultParseOptions'],
    'should expose the public api'
  )

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
    '<table><thead><tr><th>a</th></tr></thead><tbody><tr><td><div>b</div></td></tr></tbody></table>',
    'should transform a table'
  )

  assert.equal(
    String(
      await unified()
        .use(remarkParse)
        .use(remarkGithubYamlMetadata)
        .use(remarkRehype)
        .use(rehypeStringify)
        .process('---\na: b\n---')
    ),
    '<hr>\n<h2>a: b</h2>',
    'should not fail w/o `remark-frontmatter`'
  )

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
    '<table><thead><tr><th>a</th></tr></thead><tbody><tr><td><div>123</div></td></tr></tbody></table>',
    'should support `parseOptions.intAsBigInt`'
  )

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
    '<div><div class="flash flash-error mb-3">Error in user YAML: (&#x3C;unknown>): Missing closing "quote</div><div class="highlight highlight-source-yaml"><pre>---\na:\n  "b\n---</pre></div></div>',
    'should support `parseOptions.prettyErrors`'
  )

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
    '<table><thead><tr><th><table><tbody><tr><td><div>1</div></td><td><div>2</div></td></tr></tbody></table>\n</th></tr></thead><tbody><tr><td><div>many</div></td></tr></tbody></table>',
    'should support `parseOptions.mapAsMap`'
  )

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
    '<table><tbody><tr><td><div>a</div></td></tr></tbody></table>',
    'should support `allowArrayAtRoot`'
  )

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
    '<table><tbody><tr><td><div>a</div></td></tr></tbody></table>',
    'should support `allowPrimitiveAtRoot` (string)'
  )

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
    '<table><tbody><tr><td><div></div></td></tr></tbody></table>',
    'should support `allowPrimitiveAtRoot` (null)'
  )

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
    '<div></div>',
    'should support `createErrorMessage`'
  )
})

test('fixtures', async () => {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {
    controlPictures: true,
    keep: {frontmatter: true}
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

    if (name === 'blockquote') {
      // To do: fix `micromark` to *not* support block quotes in frontmatter
      continue
    }

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
    actual = actual.replaceAll(re, '$1').replaceAll(re, '$1')
    expected = expected.replaceAll(re, '$1').replaceAll(re, '$1')

    // Undo GH-specific highlighting.

    expected = expected
      // To do: fix `rehype-raw` in fragment mode w/ whitespace in tables, then add whitespace.
      .replaceAll(/\n {2}</g, '<')
      // GH adds a weird amount of blank lines.
      .replaceAll(/\n{2}/g, '\n')
      .replaceAll('</tbody>\n</table>', '</tbody></table>')
      // GH uses a custom parser that mostly follows YAML 1.1 but not exactly.
      // In YAML 1.1, `y` and `n` should transform to `true` and `false`, but they don’t.
      .replaceAll('<td><div>y</div></td>', '<td><div>true</div></td>')
      .replaceAll('<td><div>n</div></td>', '<td><div>false</div></td>')
      // GH sometimes does or doesn’t an eol after YAML code blocks.
      .replace('---\n</pre>', '---</pre>')

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
      actual = actual.replaceAll(looksLikeADate, 'xxxx:yy:zz')
      expected = expected.replaceAll(looksLikeADate, 'xxxx:yy:zz')
    }

    assert.equal(actual, expected, name)
  }
})
