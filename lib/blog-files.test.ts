import { describe, expect, it } from 'vitest'
import { fileNotes, parseNote } from './blog-files'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parseHeader } = require('../scripts/crosspost')

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

describe('scripts/crosspost parseHeader', () => {
  it('reads the same header as parseNote, including a time with zone', () => {
    const raw = `<!--
title: T: x
excerpt: E
date: 2026-10-14T06:30:00+03:00
-->
<p>b</p>`
    const note = parseNote('s', raw)!
    const head = parseHeader(raw)
    expect(head.title).toBe(note.title)
    expect(head.excerpt).toBe(note.excerpt)
    expect(head.date.getTime()).toBe(note.publishedAt.getTime())
    expect(head.date.toISOString()).toBe('2026-10-14T03:30:00.000Z')
    expect(parseHeader('<p>no header</p>')).toBeNull()
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
