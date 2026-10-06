import { describe, expect, it } from 'vitest'
import { fileNotes, parseNote } from './blog-files'

describe('parseNote', () => {
  it('reads the header comment and keeps the body as HTML', () => {
    const note = parseNote('test', `<!--
title: Как написать введение: курсовая
excerpt: Коротко
date: 2026-10-06
-->
<p>Текст</p>`)
    expect(note).toMatchObject({
      slug: 'test',
      title: 'Как написать введение: курсовая',
      excerpt: 'Коротко',
      coverImage: null,
      content: '<p>Текст</p>',
    })
    expect(note?.publishedAt.toISOString().slice(0, 10)).toBe('2026-10-06')
  })

  it('rejects files without a header, title or valid date', () => {
    expect(parseNote('a', '<p>no header</p>')).toBeNull()
    expect(parseNote('a', '<!--\ndate: 2026-10-06\n-->x')).toBeNull()
    expect(parseNote('a', '<!--\ntitle: T\ndate: завтра\n-->x')).toBeNull()
  })
})

describe('content/blog', () => {
  it('every note in the repo parses', () => {
    // Far-future "now" so scheduled notes are checked too.
    for (const n of fileNotes(new Date('2100-01-01'))) {
      expect(n.title.length).toBeGreaterThan(0)
      expect(n.content.length).toBeGreaterThan(0)
    }
  })
})
