import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {createGfmFixtures} from 'create-gfm-fixtures'
import rehypeGithubEmoji from 'rehype-github-emoji'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

test('rehypeGithubEmoji', async () => {
  assert.deepEqual(
    Object.keys(await import('rehype-github-emoji')).sort(),
    ['default', 'defaultBuild', 'defaultCustom', 'defaultIgnore'],
    'should expose the public api'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubEmoji)
        .use(rehypeStringify)
        .process('🤗')
    ),
    '<g-emoji class="g-emoji" alias="hugs" fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/1f917.png">🤗</g-emoji>',
    'should support an emoji'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubEmoji)
        .use(rehypeStringify)
        .process(':hugs:')
    ),
    '<g-emoji class="g-emoji" alias="hugs" fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/1f917.png">🤗</g-emoji>',
    'should support a gemoji'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubEmoji, {custom: ['xxx']})
        .use(rehypeStringify)
        .process(':xxx:')
    ),
    '<img class="emoji" title=":xxx:" alt=":xxx:" src="https://github.githubassets.com/images/icons/emoji/xxx.png" height="20" width="20" align="absmiddle">',
    'should support `custom`'
  )

  assert.throws(
    function () {
      String(
        unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeGithubEmoji, {custom: [' ']})
          .freeze()
      )
    },
    /Custom gemoji ` ` must match/,
    'should throw on an invalid gemoji'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubEmoji, {ignore: ['var']})
        .use(rehypeStringify)
        .process('<var>:+1:</var>')
    ),
    '<var>:+1:</var>',
    'should support `ignore`'
  )

  assert.equal(
    String(
      await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeGithubEmoji, {
          build(info) {
            return {
              type: 'element',
              tagName: 'span',
              properties: {
                className: ['emoji']
              },
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
    '<span class="emoji">👍</span>',
    'should support `build`'
  )
})

test('fixtures', async function () {
  const base = new URL('fixtures/', import.meta.url)

  await createGfmFixtures(base, {
    keep: {gemoji: true}
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
      .use(rehypeGithubEmoji, {})
      .use(rehypeStringify)

    let actual = String(await processor.process(input))

    if (actual && !/\n$/.test(actual)) {
      actual += '\n'
    }

    if (name === 'html') {
      // Elements that GH drops the tags of.
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
        // Drop their custom element.
        .replace(/<themed-picture data-catalyst-inline="true">/, '')
        .replace(/<\/themed-picture>/, '')

      // Don’t test `template`, they drop the tags first, so they transform the contents.
      // We see `template` and don’t transform its `element.content`.
      const re = /<code>template<\/code>: .+?<\/li>/
      actual = actual.replace(re, 'xxx')
      expected = expected.replace(re, 'xxx')
    }

    assert.equal(actual, expected, name)
  }
})
