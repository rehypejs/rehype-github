# Markdown

# Heading (atx)
## h2
### h3
#### h4
##### h5
###### h6

## Heading (setext)

h1
==

h2
--

Autolink: <https://example.com>.
Attention (emphasis): *hi*.
Attention (strong): **hi**.
Attention (strong & emphasis): ***hi***.
Attention (strikethrough): ~~hi~~.
Character escape: \-, \&.
Character reference: &amp; &#123; &#x123;.
Code (text): `hi`.
Label end (resource): [a](https://example.com 'title').
Label end (reference, full): [a][b].
Label end (reference, collapsed, shortcut): [a][], [a].

## Definitions

[a]: <https://example.com> "b"
[b]: #


## Thematic break

***

## Code (indented)

	console.log(1)

## Code (fenced)

```markdown
a
b.
````

## Block quote

> hi

## List

1. hi

* one

  two

## Extension: GFM autolink literals

a a@b.com www.example.com/a https://example.com.

## Extension: GFM footnotes

a[^b].

[^b]: *c
    d*.

## Extension: GFM task list

*  [ ] not done
1. [x] done

## Extension: GFM table

| Stuff? |
| - |
| asdasda |
