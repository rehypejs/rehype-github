import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {createGfmFixtures} from 'create-gfm-fixtures'
import rehypeGithubDir from 'rehype-github-dir'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('rehypeGithubDir', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('rehype-github-dir')).sort(), [
      'default',
      'defaultInclude'
    ])
  })
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {keep: {dir: true}})

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
        .use(rehypeRaw, {tagfilter: true})
        .use(rehypeGithubDir)
        .use(rehypeStringify)

      let actual = String(await processor.process(input))

      if (actual && !/\n$/.test(actual)) {
        actual += '\n'
      }

      // To do: add to `create-gfm-fixtures`.
      // GH adds `notranslate`, this should be (optionally) removed by `crate-gfm-fixtures`.
      expected = expected
        .replace(/ class="notranslate"/g, '')
        // To do: `create-github-fixtures` should remove this on `ol`s too.
        .replace(/ class="contains-task-list"/g, '')
        // To do: `create-github-fixtures` should support this.
        .replace(/ class="task-list-item"/g, '')
        .replace(/<\/?markdown-accessiblity-table>/g, '')
        // To do: add custom plugin.
        // Drop their custom element.
        .replace(/<themed-picture data-catalyst-inline="true">/, '')
        .replace(/<\/themed-picture>/, '')

      if (name === 'markdown') {
        // There’s something weird about line endings. Perhaps related to `rehype-raw`?
        // To do: investigate.
        actual = actual.replace(
          /\n*(<\/?(?:table|thead|tbody|tr|th|td)>)\n*/g,
          '$1'
        )
        expected = expected.replace(
          /\n*(<\/?(?:table|thead|tbody|tr|th|td)>)\n*/g,
          '$1'
        )
      }

      actual = actual
        // To do: `create-github-fixtures` should remove this on `ol`s too.
        .replace(/ class="contains-task-list"/g, '')
        // To do: `create-github-fixtures` should support this.
        .replace(/ class="task-list-item"/g, '')
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
        // GitHub uses weird code.
        // To do: `create-github-fixtures` should support this.
        .replace(
          /<pre><code class="language-markdown">a\nb\.\n<\/code><\/pre>/g,
          '<div class="highlight highlight-text-md" dir="auto"><pre>a\nb.</pre></div>'
        )

      if (name === 'html') {
        // Elements that GH drops the tags of.
        // To do: improve `rehype-sanitize`?
        actual = actual
          .replace(
            /<\/?(?:a|abbr|acronym|address|applet|article|aside|audio|bdi|bdo|big|blink|button|canvas|center|cite|content|data|datalist|dfn|dialog|dir|element|fieldset|figcaption|figure|font|footer|form|header|hgroup|label|legend|listing|main|map|marquee|math|menu|meter|multicol|nav|nobr|noscript|object|optgroup|option|output|progress|rb|rbc|rtc|search|select|shadow|slot|small|spacer|svg|template|time|u)>/g,
            ''
          )
          // Elements that GitHub drops entirely
          .replace(/<video>.*?<\/video>/g, '')
      }

      assert.equal(actual, expected)
    })
  }
})
