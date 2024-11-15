import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {controlPictures} from 'control-pictures'
import {createGfmFixtures} from 'create-gfm-fixtures'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkGithubBreak from 'remark-github-break'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('remarkGithubBreak', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('remark-github-break')).sort(), [
      'default'
    ])
  })

  await t.test('should transform a break', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkGithubBreak)
          .use(remarkRehype)
          .use(rehypeStringify)
          .process('a\nb.')
      ),
      '<p>a<br>\nb.</p>'
    )
  })
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {controlPictures: true})

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
        .use(name.endsWith('.comment') ? [remarkGithubBreak] : [])
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeRaw)
        .use(rehypeStringify)

      let actual = String(await processor.process(controlPictures(input)))

      if (actual && !/\n$/.test(actual)) {
        actual += '\n'
      }

      actual = actual
        // GitHub performs line ending expansion into breaks when parsing,
        // and does not consider character references.
        // We could do this, if we operated in the parser.
        // To do: consider `micromark-extension-github-break`?
        .replace(/(<p>Character)<br>(\nreference break\.<\/p>)/, '$1$2')
        // See `rehype-github-image` — GH removes line endings in `alt` on image.
        .replace(/(alt="im)\n(age")/, '$1 $2')
        // GitHub drops HTML comments.
        .replace(/<!--[\s\S]*?-->/g, '')
        // Elements that GH drops the tags of.
        .replace(/<\/?article>/g, '')
        // GitHub uses weird code.
        // To do: `create-github-fixtures` should support this.
        .replace(
          /<pre><code class="language-markdown">a\nb\.\n<\/code><\/pre>/g,
          '<div class="highlight highlight-text-md"><pre>a\nb.</pre></div>'
        )
        // Elements that GitHub cleans (To do: implemment tagfilter somewhere?)
        .replace(/<(\/?script>)/g, '&#x3C;$1')
        // To do: `remark-rehype` should change the order.
        .replace(/checked disabled/g, 'disabled checked')
        .replace(
          /class="sr-only" id="footnote-label"/g,
          'id="footnote-label" class="sr-only"'
        )
        // To do: `remark-rehype` should implement new labels.
        .replace(
          /class="data-footnote-backref" aria-label="Back to content"/g,
          'aria-label="Back to reference 1" class="data-footnote-backref"'
        )
        // To do: `create-github-fixtures` should remove this on `ol`s too.
        .replace(/ class="contains-task-list"/g, '')
        // To do: `create-github-fixtures` should support this.
        .replace(/ class="task-list-item"/g, '')

      expected = expected
        // GitHub performs line ending expansion into breaks when parsing,
        // and does not consider character references.
        // We could do this, if we operated in the parser.
        // To do: consider `micromark-extension-github-break`?
        .replace(/(<br>\n) {2}(reference (after|both)\.)/g, '$1$2')
        // To do: add to `create-gfm-fixtures`.
        // GH adds `notranslate`, this should be (optionally) removed by `crate-gfm-fixtures`.
        .replace(/ class="notranslate"/g, '')
        // To do: `create-github-fixtures` should remove this on `ol`s too.
        .replace(/ class="contains-task-list"/g, '')
        // To do: `create-github-fixtures` should support this.
        .replace(/ class="task-list-item"/g, '')

      assert.equal(actual, expected)
    })
  }
})
