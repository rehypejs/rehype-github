import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {createGfmFixtures} from 'create-gfm-fixtures'
import {gfmTagfilterFromMarkdown} from 'mdast-util-gfm-tagfilter'
import rehypeGithubNoTranslate from 'rehype-github-notranslate'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkGithubBreak from 'remark-github-break'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('rehypeGithubNoTranslate', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('rehype-github-notranslate')).sort(),
      ['default', 'defaultInclude']
    )
  })

  await t.test('should transform `code`', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubNoTranslate)
          .use(rehypeStringify)
          .process('<code>a</code>')
      ),
      '<code class="notranslate">a</code>'
    )
  })

  await t.test('should support `include`', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubNoTranslate, {include: ['kbd']})
          .use(rehypeStringify)
          .process('<kbd>a</kbd>')
      ),
      '<kbd class="notranslate">a</kbd>'
    )
  })
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base)

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
        .use(function () {
          const data = this.data()
          const fromMarkdownExtensions =
            data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
          fromMarkdownExtensions.push(gfmTagfilterFromMarkdown())
        })
        .use(name.endsWith('.comment') ? [remarkGithubBreak] : [])
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeRaw)
        .use(name.endsWith('.comment') ? [rehypeGithubNoTranslate] : [])
        .use(rehypeStringify)

      let actual = String(await processor.process(input))

      if (actual && !/\n$/.test(actual)) {
        actual += '\n'
      }

      expected = expected
        // To do: `create-github-fixtures` should remove this on `ol`s too.
        .replace(/ class="contains-task-list"/g, '')
        // To do: `create-github-fixtures` should support this.
        .replace(/ class="task-list-item"/g, '')
        // Drop their custom element.
        .replace(/<\/?markdown-accessiblity-table>/g, '')

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
        // File form:
        .replace(
          /<pre><code class="language-markdown">a\nb\.\n<\/code><\/pre>/g,
          '<div class="highlight highlight-text-md"><pre>a\nb.</pre></div>'
        )
        // Comment form:
        .replace(
          /<pre class="notranslate"><code class="language-markdown notranslate">a\nb.\n<\/code><\/pre>/g,
          '<div class="highlight highlight-text-md"><pre class="notranslate">a\nb.</pre></div>'
        )

      if (name === 'html.comment') {
        // Elements that GH drops the tags of.
        // To do: improve `rehype-sanitize`?
        actual = actual
          .replace(
            /<\/?(?:a|abbr|acronym|address|applet|article|aside|audio|bdi|bdo|big|blink|button|canvas|center|cite|content|data|datalist|dfn|dialog|dir|element|fieldset|figcaption|figure|font|footer|form|header|hgroup|label|legend|listing|main|map|marquee|math|menu|meter|multicol|nav|nobr|noscript|object|optgroup|option|output|progress|rb|rbc|rtc|search|select|shadow|slot|small|spacer|svg|template|time|u)>/g,
            ''
          )
          // Elements that GitHub drops entirely
          .replace(/<video>.*?<\/video>/g, '')
          // Elements that GitHub cleans (To do: implemment tagfilter somewhere?)
          .replace(
            /<(\/?(?:iframe|noembed|noframes|plaintext|script|style|textarea|title|xmp)>)/g,
            '&#x3C;$1'
          )

        expected = expected
          // To do: add custom plugin.
          // Drop their custom element.
          .replace(/<themed-picture data-catalyst-inline="true">/, '')
          .replace(/<\/themed-picture>/, '')
          // To do: investigate what adds this? Comment-specific it seems?
          .replace(/<table role="table">/, '<table>')
      }

      assert.equal(actual, expected)
    })
  }
})
