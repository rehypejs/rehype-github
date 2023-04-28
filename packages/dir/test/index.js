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

test('rehypeGithubDir', async () => {
  assert.deepEqual(
    Object.keys(await import('rehype-github-dir')).sort(),
    ['default', 'defaultInclude'],
    'should expose the public api'
  )
})

test('fixtures', async function () {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {keep: {dir: true}})

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
        '<div class="highlight highlight-source-gfm" dir="auto"><pre>a\nb.</pre></div>'
      )

    if (name === 'html') {
      // Elements that GH drops the tags of.
      // To do: improve `rehype-sanitize`?
      actual = actual
        .replace(
          /<\/?(?:a|abbr|acronym|address|applet|article|aside|audio|bdi|bdo|big|blink|button|canvas|center|cite|content|data|datalist|dfn|dialog|dir|element|fieldset|figcaption|figure|font|footer|form|header|hgroup|label|legend|listing|main|map|mark|marquee|math|menu|meter|multicol|nav|nobr|noscript|object|optgroup|option|output|progress|rb|rbc|rtc|search|select|shadow|slot|small|spacer|svg|template|time|u)>/g,
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
    }

    assert.equal(actual, expected, name)
  }
})
