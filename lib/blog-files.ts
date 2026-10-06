// Blog notes stored as files, shown alongside DB posts. Read from content/blog in the repo
// and from the sibling clone ../studyassist-blog (branch blog-content), which the server
// pulls every 10 min (scripts/blog-auto.sh) — so a new note needs no rebuild or deploy.
// File format: a header comment with "key: value" lines, then the HTML body.
//
//   <!--
//   title: Заголовок
//   excerpt: Короткое описание для карточки и meta description
//   date: 2026-10-06
//   cover: /covers/slug.webp        (optional, file in public/covers/)
//   -->
//   <p>Текст…</p>
//
// The files are written by us (reviewed in PRs), so the HTML is trusted like admin posts.

import { readdirSync, readFileSync } from 'fs'
import path from 'path'

export interface FileNote {
  slug: string
  type: 'blog'
  title: string
  excerpt: string | null
  coverImage: string | null
  content: string
  publishedAt: Date
}

// ponytail: fixed sibling path matches the server layout (/var/www/studyassist + /var/www/studyassist-blog).
const DIRS = [
  path.join(process.cwd(), 'content', 'blog'),
  path.join(process.cwd(), '..', 'studyassist-blog', 'content', 'blog'),
]
const SLUG_RE = /^[a-z0-9-]+$/

export function parseNote(slug: string, raw: string): FileNote | null {
  const m = raw.match(/^\s*<!--([\s\S]*?)-->([\s\S]*)$/)
  if (!m) return null
  const meta: Record<string, string> = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  const date = new Date(meta.date)
  if (!meta.title || isNaN(date.getTime())) return null
  return {
    slug,
    type: 'blog',
    title: meta.title,
    excerpt: meta.excerpt || null,
    coverImage: meta.cover || null,
    content: m[2].trim(),
    publishedAt: date,
  }
}

// ponytail: reads the dir on every request; fine for dozens of notes, cache if it grows to hundreds.
// Notes dated in the future stay hidden until that day (lets a PR be merged ahead of time).
export function fileNotes(now = new Date()): FileNote[] {
  const bySlug = new Map<string, FileNote>()
  for (const dir of DIRS) {
    let names: string[]
    try {
      names = readdirSync(dir)
    } catch {
      continue
    }
    for (const n of names) {
      const slug = n.slice(0, -5)
      if (!n.endsWith('.html') || !SLUG_RE.test(slug) || bySlug.has(slug)) continue
      const note = parseNote(slug, readFileSync(path.join(dir, n), 'utf8'))
      if (note && note.publishedAt <= now) bySlug.set(slug, note)
    }
  }
  return Array.from(bySlug.values())
}

export function fileNote(slug: string): FileNote | null {
  return fileNotes().find((n) => n.slug === slug) ?? null
}
