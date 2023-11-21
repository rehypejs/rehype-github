import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {createGfmFixtures} from 'create-gfm-fixtures'
import rehypeGithubNoTranslate from 'rehype-github-notranslate'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkGithubBreak from 'remark-github-break'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('rehypeGithubNoTranslate', async () => {
  assert.deepEqual(
    Object.keys(await import('rehype-github-notranslate')).sort(),
    ['default', 'defaultInclude'],
    'should expose the public api'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubNoTranslate)
        .use(rehypeStringify)
        .process('<code>a</code>')
    ),
    '<code class="notranslate">a</code>',
    'should transform `code`'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubNoTranslate, {include: ['kbd']})
        .use(rehypeStringify)
        .process('<kbd>a</kbd>')
    ),
    '<kbd class="notranslate">a</kbd>',
    'should support `include`'
  )
})

test('fixtures', async () => {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base)

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
      .replaceAll(' class="contains-task-list"', '')
      // To do: `create-github-fixtures` should support this.
      .replaceAll(' class="task-list-item"', '')

    actual = actual
      // To do: `create-github-fixtures` should remove this on `ol`s too.
      .replaceAll(' class="contains-task-list"', '')
      // To do: `create-github-fixtures` should support this.
      .replaceAll(' class="task-list-item"', '')
      // To do: `remark-rehype` should change the order.
      .replaceAll('checked disabled', 'disabled checked')
      .replaceAll(
        'class="sr-only" id="footnote-label"',
        'id="footnote-label" class="sr-only"'
      )
      // To do: `remark-rehype` should implement new labels.
      .replaceAll(
        'class="data-footnote-backref" aria-label="Back to content"',
        'aria-label="Back to reference 1" class="data-footnote-backref"'
      )
      // GitHub uses weird code.
      // To do: `create-github-fixtures` should support this.
      // File form:
      .replaceAll(
        '<pre><code class="language-markdown">a\nb.\n</code></pre>',
        '<div class="highlight highlight-source-gfm"><pre>a\nb.</pre></div>'
      )
      // Comment form:
      .replaceAll(
        /<pre class="notranslate"><code class="language-markdown notranslate">a\nb.\n<\/code><\/pre>/g,
        '<div class="highlight highlight-source-gfm"><pre class="notranslate">a\nb.</pre></div>'
      )

    if (name === 'html.comment') {
      // Elements that GH drops the tags of.
      // To do: improve `rehype-sanitize`?
      actual = actual
        .replaceAll(
          /<\/?(?:a|abbr|acronym|address|applet|article|aside|audio|bdi|bdo|big|blink|button|canvas|center|cite|content|data|datalist|dfn|dialog|dir|element|fieldset|figcaption|figure|font|footer|form|header|hgroup|label|legend|listing|main|map|mark|marquee|math|menu|meter|multicol|nav|nobr|noscript|object|optgroup|option|output|progress|rb|rbc|rtc|search|select|shadow|slot|small|spacer|svg|template|time|u)>/g,
          ''
        )
        // Elements that GitHub drops entirely
        .replaceAll(/<video>.*?<\/video>/g, '')
        // Elements that GitHub cleans (To do: implemment tagfilter somewhere?)
        .replaceAll(
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

    assert.equal(actual, expected, name)
  }
})
