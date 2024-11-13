import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {createGfmFixtures} from 'create-gfm-fixtures'
import {gfmTagfilterFromMarkdown} from 'mdast-util-gfm-tagfilter'
import rehypeGithubEmoji from 'rehype-github-emoji'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('rehypeGithubEmoji', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('rehype-github-emoji')).sort(), [
      'default',
      'defaultBuild',
      'defaultCustom',
      'defaultIgnore'
    ])
  })

  await t.test('should support an emoji', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubEmoji)
          .use(rehypeStringify)
          .process('🤗')
      ),
      '🤗'
    )
  })

  await t.test('should support a gemoji', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubEmoji)
          .use(rehypeStringify)
          .process(':hugs:')
      ),
      '🤗'
    )
  })

  await t.test('should support `custom`', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubEmoji, {custom: ['xxx']})
          .use(rehypeStringify)
          .process(':xxx:')
      ),
      '<img class="emoji" title=":xxx:" alt=":xxx:" src="https://github.githubassets.com/images/icons/emoji/xxx.png" height="20" width="20" align="absmiddle">'
    )
  })

  await t.test('should throw on an invalid gemoji', async function () {
    assert.throws(function () {
      String(
        unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubEmoji, {custom: [' ']})
          .freeze()
      )
    }, /Custom gemoji ` ` must match/)
  })

  await t.test('should support `ignore`', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubEmoji, {ignore: ['var']})
          .use(rehypeStringify)
          .process('<var>:+1:</var>')
      ),
      '<var>:+1:</var>'
    )
  })

  await t.test('should support `build`', async function () {
    assert.equal(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubEmoji, {
            build(info) {
              return {
                type: 'element',
                tagName: 'span',
                properties: {className: ['emoji']},
                children: [
                  {
                    type: 'text',
                    value: typeof info === 'string' ? info : info.emoji
                  }
                ]
              }
            }
          })
          .use(rehypeStringify)
          .process(':+1:')
      ),
      '<span class="emoji">👍</span>'
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
      const input = await fs.readFile(new URL(name + '.md', base), 'utf8')
      let expected = await fs.readFile(new URL(name + '.html', base), 'utf8')

      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(function () {
          const data = this.data()
          const fromMarkdownExtensions =
            data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
          fromMarkdownExtensions.push(gfmTagfilterFromMarkdown())
        })
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeRaw)
        .use(rehypeGithubEmoji, {})
        .use(rehypeStringify)

      let actual = String(await processor.process(input))

      if (actual && !/\n$/.test(actual)) {
        actual += '\n'
      }

      expected = expected
        // Drop their custom element.
        .replace(/<themed-picture data-catalyst-inline="true">/, '')
        .replace(/<\/themed-picture>/, '')
        .replace(/<\/?markdown-accessiblity-table>/g, '')

      if (name === 'html') {
        // Elements that GH drops the tags of.
        actual = actual
          .replace(
            /<\/?(?:a|abbr|acronym|address|applet|article|aside|audio|bdi|bdo|big|blink|button|canvas|center|cite|content|data|datalist|dfn|dialog|dir|element|fieldset|figcaption|figure|font|footer|form|header|hgroup|label|legend|listing|main|map|marquee|math|menu|meter|multicol|nav|nobr|noscript|object|optgroup|option|output|progress|rb|rbc|rtc|search|select|shadow|slot|small|spacer|svg|template|time|u)>/g,
            ''
          )
          // Elements that GitHub drops entirely
          .replace(/<video>.*?<\/video>/g, '')
          // Elements that GitHub cleans (To do: implemment tagfilter somewhere?)
          .replace(
            /(&#x3C;(?:iframe|noembed|noframes|plaintext|script|style|textarea|title|xmp)>)👍/g,
            '$1:+1:'
          )

        // Don’t test `template`, they drop the tags first, so they transform the contents.
        // We see `template` and don’t transform its `element.content`.
        const re = /<code>template<\/code>: .+?<\/li>/
        actual = actual.replace(re, 'xxx')
        expected = expected.replace(re, 'xxx')
      }

      // For some reason,
      // GH still returns a `g-emoji` for a typically textual `☹️` when with VS16.
      // It doesn’t for anything else as far as I see.
      if (name === 'variant-selector') {
        expected = expected.replace(
          /<g-emoji class="g-emoji" alias="frowning_face">☹️<\/g-emoji>/,
          '☹️'
        )
      }

      assert.equal(actual, expected)
    })
  }
})
