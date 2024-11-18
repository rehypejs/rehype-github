import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {createGfmFixtures} from 'create-gfm-fixtures'
import {htmlElementAttributes} from 'html-element-attributes'
import {htmlTagNames} from 'html-tag-names'
import {htmlVoidElements} from 'html-void-elements'
import {sanitizeSchema} from 'rehype-github-sanitize-schema'
import rehypeSanitize from 'rehype-sanitize'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('rehypeGithubSanitizeSchema', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('rehype-github-sanitize-schema')).sort(),
      ['sanitizeSchema']
    )
  })

  await t.test('should clean', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeSanitize, sanitizeSchema)
          .use(rehypeStringify)
          .process('<p onclick="alert(1)">hi</p>')
      ),
      '<p>hi</p>'
    )
  })
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)

  let tagNames = ''

  for (const tagName of htmlTagNames) {
    tagNames +=
      '# `' +
      tagName +
      '`\n\n' +
      '<' +
      tagName +
      '>' +
      (htmlVoidElements.includes(tagName) ? '' : '</' + tagName + '>') +
      '\n\n'
  }

  // Note: it is intentional that we collect *all* attributes — GH might not follow HTML.
  /** @type {Set<string>} */
  const all = new Set()

  for (const names of Object.values(htmlElementAttributes)) {
    for (const name of names) {
      all.add(name)
    }
  }

  const attributes = [...all].sort().join(' ')

  for (const tagName of sanitizeSchema.tagNames) {
    await fs.writeFile(
      new URL('tag-name-' + tagName + '.md', base),
      '# `' +
        tagName +
        '`\n\n' +
        '<' +
        tagName +
        ' ' +
        attributes +
        '>' +
        (htmlVoidElements.includes(tagName) ? '' : '</' + tagName + '>') +
        '\n'
    )
  }

  await fs.writeFile(new URL('tag-names.md', base), tagNames + '\n')

  await createGfmFixtures(base)

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, {allowDangerousHtml: true})
    .use(rehypeRaw, {tagfilter: true})
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)

  const files = await fs.readdir(base)
  const extension = '.md'

  for (const d of files) {
    if (!d.endsWith(extension)) continue

    const name = d.slice(0, -extension.length)

    await t.test(name, async function () {
      const input = await fs.readFile(new URL(name + '.md', base), 'utf8')
      let expected = await fs.readFile(new URL(name + '.html', base), 'utf8')

      let actual = String(await processor.process(input))

      if (actual && !/\n$/.test(actual)) {
        actual += '\n'
      }

      if (name === 'cdata') {
        // GH mistakingly matches lowercase `cdata`.
        actual = actual.replace(/&#x3C;!\[cdata\[]]>/g, '')
      }

      if (name === 'comments') {
        // GH does not treat `<!x>` as a directive.
        expected = expected.replace(/&#x3C;!x>/g, '')
      }

      if (name === 'directive') {
        // GH only supports uppercase `DOCTYPE` + ` `.
        expected = expected.replace(
          /&#x3C;!(x|X|DOCTYPE|doctype html|DoCtYpE html)>/g,
          ''
        )
      }

      if (name.startsWith('tag-name-')) {
        actual = actual
          // GH drops empty class.
          .replace(/ class=""/g, '')
          // GH does not prefix empty `id` / `name` (clobber prefix).
          .replace(/ (id|name)="user-content-"/g, ' $1=""')

        expected = expected
          // GH does weird things with table whitespace.
          .replace(/(<\/h1>\n)\n$/, '$1')
          // GH wraps `picture` in a custom element.
          .replace(/<themed-picture data-catalyst-inline="true">/g, '')
          .replace(/<\/themed-picture>/g, '')
          // GH wraps tables in a custom element.
          .replace(/<\/?markdown-accessiblity-table>/g, '')
      }

      if (name === 'tag-name-img') {
        expected = expected
          // GH wraps `img` in a paragraph? To do: investigate.
          .replace(/<p>(<img )/g, '$1')
          .replace(/(>)<\/p>/g, '$1')
      }

      if (name === 'tag-name-input') {
        actual = actual
          // GH drops unknown input; we turn them into a checkbox.
          // To do: investigate.
          .replace(/<input [^>]+>\n/g, '')
      }

      if (name === 'tag-names') {
        actual = actual
          // GH drops `a` without attributes? To do: investigate.
          .replace(/<p><a><\/a><\/p>/g, '<p></p>')
          // GH drops `input` w/o attributes; we add `disabled` and `type`; To do: investigate.
          .replace(/<input disabled type="checkbox">/g, '')

        expected = expected
          // GH wraps `img` in a paragraph? To do: investigate.
          .replace(/<p><img><\/p>/g, '<img>')
          // GH wraps `picture` in a custom element.
          .replace(/<themed-picture data-catalyst-inline="true">/g, '')
          .replace(/<\/themed-picture>/g, '')
          // GH wraps tables in a custom element.
          .replace(/<\/?markdown-accessiblity-table>/g, '')
          // Unknown elements are parsed as inline according to CM;
          // `<search>` is a new block element;
          // it’s not yet known to GH because they are out of date.
          .replace(/(<h1><code>search<\/code><\/h1>\n)<p><\/p>/g, '$1')
          // GH uses some weird HTML parser that turns `<isindex>` into this ancient thing.
          .replace(
            /<p><\/p><hr>This is a searchable index. Enter search keywords: <hr>/g,
            ''
          )
      }

      assert.equal(actual, expected)
    })
  }
})
