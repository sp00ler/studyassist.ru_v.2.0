// Bibliographic description generator per ГОСТ Р 7.0.100-2018.
// Pure functions, no React, no I/O. Area separator is «. – » with EN DASH (U+2013).

const EN = '–'
const AREA_SEP = `. ${EN} ` // normal area separator
const AREA_SEP_SHORT = ` ${EN} ` // used after a part that already ends with . ? ! …

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Author {
  surname: string
  /** Raw initials as typed: «И.И.», «И И», «ИИ», «И. И.» — normalized on output. */
  initials: string
}

export type ActSource = 'official' | 'site'

export interface BookInput {
  kind: 'book'
  authors: Author[]
  /** Editor string AS TYPED, e.g. «под редакцией И. И. Иванова». */
  editor?: string
  title: string
  subtitle?: string
  edition?: string
  city?: string
  publisher?: string
  year?: string
  pages?: string
  isbn?: string
}

export interface ArticleInput {
  kind: 'article'
  authors: Author[]
  title: string
  journal: string
  year?: string
  volume?: string
  issue?: string
  pages?: string
  electronic?: boolean
  url?: string
  accessDate?: string
}

export interface WebInput {
  kind: 'web'
  authors: Author[]
  title: string
  site: string
  year?: string
  /** Day and month as typed, e.g. «5 мая». */
  date?: string
  url: string
  accessDate?: string
}

export interface LawInput {
  kind: 'law'
  title: string
  actType: string
  actDate: string
  actNumber?: string
  /** Edition date, e.g. «12.12.2023» (or «ред. от 12.12.2023»). */
  edition?: string
  source: ActSource
  // official publication
  publication?: string
  year?: string
  issue?: string
  article?: string
  // legal database / site
  site?: string
  url?: string
  accessDate?: string
}

export interface ThesisInput {
  kind: 'thesis'
  /** Full name, «Иванов Иван Иванович». */
  fullName: string
  title: string
  specialtyCode?: string
  specialtyName?: string
  degree: 'кандидата' | 'доктора'
  /** Genitive plural, e.g. «экономических наук». */
  sciences: string
  type: 'dissertation' | 'abstract'
  organization?: string
  city?: string
  year?: string
  pages?: string
}

export type SourceInput = BookInput | ArticleInput | WebInput | LawInput | ThesisInput
export type SourceKind = SourceInput['kind']

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

export function clean(s: string | undefined | null): string {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

/** «И.И.», «И И», «ИИ», «и.и.», «Иван Иванович» → «И. И.». */
export function normalizeInitials(raw: string | undefined | null): string {
  const s = clean(raw).replace(/\.\s*-\s*/g, '-')
  if (!s) return ''
  const out: string[] = []
  for (const token of s.split(/[\s.]+/).filter(Boolean)) {
    const parts = token
      .split('-')
      .filter(Boolean)
      .map((part) => {
        const letters = part.replace(/[^A-Za-zЀ-ӿ]/g, '')
        if (!letters) return ''
        const isCompact =
          letters.length >= 2 &&
          letters.length <= 3 &&
          (letters === letters.toUpperCase() || letters === letters.toLowerCase())
        const list = isCompact ? letters.split('') : [letters[0]]
        return list.map((l) => l.toUpperCase() + '.').join(' ')
      })
    const joined = parts.filter(Boolean).join('-')
    if (joined) out.push(joined)
  }
  return out.join(' ')
}

/** «Иванов Иван Иванович» → { surname: 'Иванов', initials: 'И. И.' } */
export function splitFullName(full: string): Author {
  const words = clean(full).split(' ').filter(Boolean)
  const surname = words[0] ?? ''
  return { surname, initials: normalizeInitials(words.slice(1).join(' ')) }
}

const TERMINAL = /[.?!…]$/

/** Title without a trailing period (question/exclamation marks and ellipsis stay). */
function cleanTitle(s: string | undefined): string {
  let t = clean(s)
  if (!/(\.\.\.|…)$/.test(t)) t = t.replace(/\.+$/, '')
  return t.trim()
}

/** «15-20», «15 — 20», «15–20» → «15–20». */
function normalizeRange(s: string): string {
  return s.replace(/(\d)\s*[-‐-―−]\s*(\d)/g, `$1${EN}$2`)
}

function joinAreas(areas: Array<string | undefined | false>): string {
  const parts = areas.filter((a): a is string => typeof a === 'string' && a.trim() !== '')
  let out = ''
  for (const p of parts) {
    if (!out) out = p
    else out += (TERMINAL.test(out) ? AREA_SEP_SHORT : AREA_SEP) + p
  }
  return out
}

function finish(s: string): string {
  const t = s.trim()
  if (!t) return ''
  return TERMINAL.test(t) ? t : t + '.'
}

export function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

export function formatDateRu(d: Date): string {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`
}

/** Accepts «5.7.2026», «05/07/2026», ISO «2026-07-05»; anything else is returned as typed. */
export function normalizeDate(raw: string | undefined): string {
  const s = clean(raw)
  let m = /^(\d{1,2})[./\s-](\d{1,2})[./\s-](\d{4})$/.exec(s)
  if (m) return `${pad2(+m[1])}.${pad2(+m[2])}.${m[3]}`
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) return `${m[3]}.${m[2]}.${m[1]}`
  return s
}

function accessPart(url: string | undefined, accessDate: string | undefined): string {
  const u = clean(url)
  if (!u) return ''
  const date = normalizeDate(accessDate) || formatDateRu(new Date())
  return `URL: ${u} (дата обращения: ${date})`
}

// ---------------------------------------------------------------------------
// Authors
// ---------------------------------------------------------------------------

function authorHeading(a: Author): string {
  const ini = normalizeInitials(a.initials)
  const sn = clean(a.surname)
  return ini ? `${sn}, ${ini}` : sn
}

function authorResponsibility(a: Author): string {
  const ini = normalizeInitials(a.initials)
  const sn = clean(a.surname)
  return ini ? `${ini} ${sn}` : sn
}

/**
 * 1–3 authors: heading = first author, responsibility lists all.
 * 4 authors: no heading, responsibility lists all four.
 * 5+ authors: no heading, first three + « [и др.]».
 */
export function authorsBlock(authors: Author[]): { heading: string; responsibility: string } {
  const list = authors.filter((a) => clean(a.surname))
  const n = list.length
  if (n === 0) return { heading: '', responsibility: '' }
  if (n <= 3) {
    return { heading: authorHeading(list[0]), responsibility: list.map(authorResponsibility).join(', ') }
  }
  if (n === 4) {
    return { heading: '', responsibility: list.map(authorResponsibility).join(', ') }
  }
  return {
    heading: '',
    responsibility: list.slice(0, 3).map(authorResponsibility).join(', ') + ' [и др.]',
  }
}

/** [heading ]title[ : subtitle][ / responsibility] */
function titleBlock(heading: string, title: string, subtitle: string, responsibility: string): string {
  let s = cleanTitle(title)
  const sub = cleanTitle(subtitle)
  if (sub) s += ` : ${sub}`
  if (responsibility) s += ` / ${responsibility}`
  return heading ? `${heading} ${s}` : s
}

function publication(city: string, publisher: string, year: string): string {
  const c = clean(city)
  const p = clean(publisher)
  const y = clean(year)
  if (p) return `${c || '[Б. м.]'} : ${p}${y ? ', ' + y : ''}`
  if (c) return `${c}${y ? ', ' + y : ''}`
  return y
}

function pagesTotal(pages: string | undefined): string {
  const p = clean(pages).replace(/\s*с\.?$/i, '')
  return p ? `${p} с.` : ''
}

function isbnPart(isbn: string | undefined): string {
  const v = clean(isbn)
    .replace(/^isbn\s*:?\s*/i, '')
    .replace(/[‐-―−]/g, '-')
  return v ? `ISBN ${v}` : ''
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const MEDIUM_PRINT = 'Текст : непосредственный'
const MEDIUM_ELECTRONIC = 'Текст : электронный'

export function formatBook(i: BookInput): string {
  const { heading, responsibility } = authorsBlock(i.authors)
  const editor = clean(i.editor)
  const resp = [responsibility, editor].filter(Boolean).join(' ; ')
  return finish(
    joinAreas([
      titleBlock(heading, i.title, i.subtitle ?? '', resp),
      clean(i.edition),
      // ГОСТ Р 7.0.100-2018: a book with a place but no publisher gets «[б. и.]»
      // (theses below use «Москва, 2022» with no publisher by design).
      publication(i.city ?? '', clean(i.publisher) || (clean(i.city) ? '[б. и.]' : ''), i.year ?? ''),
      pagesTotal(i.pages),
      isbnPart(i.isbn),
      MEDIUM_PRINT,
    ]),
  )
}

export function formatArticle(i: ArticleInput): string {
  const { heading, responsibility } = authorsBlock(i.authors)
  const first = titleBlock(heading, i.title, '', responsibility)
  const medium = i.electronic ? MEDIUM_ELECTRONIC : MEDIUM_PRINT

  const vol = clean(i.volume).replace(/^т\.?\s*/i, '')
  const iss = clean(i.issue).replace(/^№\s*/, '')
  const volIss = [vol && `Т. ${vol}`, iss && `№ ${iss}`].filter(Boolean).join(', ')
  const pg = normalizeRange(clean(i.pages)).replace(/^[сc]\.?\s*/i, '')

  const head = joinAreas([first, medium])
  const tail = joinAreas([
    cleanTitle(i.journal),
    clean(i.year),
    volIss,
    pg && `С. ${pg}`,
    i.electronic ? accessPart(i.url, i.accessDate) : '',
  ])
  return finish(tail ? `${head} // ${tail}` : head)
}

export function formatWeb(i: WebInput): string {
  const { heading, responsibility } = authorsBlock(i.authors)
  const first = titleBlock(heading, i.title, '', responsibility)
  const site = cleanTitle(i.site)
  const head = joinAreas([first, MEDIUM_ELECTRONIC])
  const tail = joinAreas([
    site && `${site} : [сайт]`,
    clean(i.year),
    clean(i.date),
    accessPart(i.url, i.accessDate),
  ])
  return finish(tail ? `${head} // ${tail}` : head)
}

function editionBracket(raw: string | undefined): string {
  const e = clean(raw)
    .replace(/^\[|\]$/g, '')
    .replace(/^\(|\)$/g, '')
    .replace(/^ред\.?\s*(от\s*)?/i, '')
  return e ? `[ред. от ${normalizeDate(e)}]` : ''
}

/** Parts of the title area joined with « : ». */
function joinTitleParts(parts: string[]): string {
  return parts.filter(Boolean).join(' : ')
}

export function formatLaw(i: LawInput): string {
  const number = clean(i.actNumber).replace(/^№\s*/, '')
  const kind = clean(i.actType)
  const date = normalizeDate(i.actDate)
  const descr = [kind, date && `от ${date}`, number && `№ ${number}`].filter(Boolean).join(' ')
  const first = joinTitleParts([cleanTitle(i.title), descr, editionBracket(i.edition)])

  if (i.source === 'site') {
    const site = cleanTitle(i.site)
    const head = joinAreas([first, MEDIUM_ELECTRONIC])
    const tail = joinAreas([site && `${site} : [сайт]`, accessPart(i.url, i.accessDate)])
    return finish(tail ? `${head} // ${tail}` : head)
  }
  const iss = clean(i.issue).replace(/^№\s*/, '')
  const art = clean(i.article).replace(/^ст\.?\s*/i, '')
  const head = joinAreas([first, MEDIUM_PRINT])
  const tail = joinAreas([cleanTitle(i.publication), clean(i.year), iss && `№ ${iss}`, art && `Ст. ${art}`])
  return finish(tail ? `${head} // ${tail}` : head)
}

export function formatThesis(i: ThesisInput): string {
  const author = splitFullName(i.fullName)
  const heading = author.surname ? authorHeading(author) : ''
  const code = clean(i.specialtyCode)
  const spName = clean(i.specialtyName).replace(/^«|»$/g, '')
  const specialty =
    code || spName ? `специальность ${[code, spName && `«${spName}»`].filter(Boolean).join(' ')}` : ''
  const sciences = clean(i.sciences)
  const kindText =
    (i.type === 'abstract' ? 'автореферат диссертации' : 'диссертация') +
    ` на соискание ученой степени ${i.degree}${sciences ? ' ' + sciences : ''}`
  const org = clean(i.organization)
  const resp = [clean(i.fullName), org].filter(Boolean).join(' ; ')
  const titleArea = joinTitleParts([cleanTitle(i.title), specialty, kindText])
  const withResp = resp ? `${titleArea} / ${resp}` : titleArea
  return finish(
    joinAreas([
      heading ? `${heading} ${withResp}` : withResp,
      publication(i.city ?? '', '', i.year ?? ''),
      pagesTotal(i.pages),
      MEDIUM_PRINT,
    ]),
  )
}

export function formatEntry(i: SourceInput): string {
  switch (i.kind) {
    case 'book':
      return formatBook(i)
    case 'article':
      return formatArticle(i)
    case 'web':
      return formatWeb(i)
    case 'law':
      return formatLaw(i)
    case 'thesis':
      return formatThesis(i)
  }
}

/** Human-readable names of required fields that are still empty. */
export function missingFields(i: SourceInput): string[] {
  const miss: string[] = []
  const need = (v: string | undefined, label: string) => {
    if (!clean(v)) miss.push(label)
  }
  switch (i.kind) {
    case 'book':
      need(i.title, 'Заглавие')
      need(i.city, 'Город')
      need(i.year, 'Год')
      break
    case 'article':
      need(i.title, 'Название статьи')
      need(i.journal, 'Журнал')
      need(i.year, 'Год')
      need(i.pages, 'Страницы')
      if (i.electronic) need(i.url, 'URL')
      break
    case 'web':
      need(i.title, 'Название страницы')
      need(i.site, 'Название сайта')
      need(i.url, 'URL')
      break
    case 'law':
      need(i.title, 'Название')
      need(i.actType, 'Вид акта')
      need(i.actDate, 'Дата')
      if (i.source === 'site') {
        need(i.site, 'Сайт или база')
        need(i.url, 'URL')
      } else {
        need(i.publication, 'Издание')
        need(i.year, 'Год')
      }
      break
    case 'thesis':
      need(i.fullName, 'ФИО автора')
      need(i.title, 'Тема')
      need(i.year, 'Год')
      break
  }
  return miss
}

// ---------------------------------------------------------------------------
// List helpers
// ---------------------------------------------------------------------------

/** Alphabetical order by Russian collation. Returns a new array. */
export function sortEntries(strings: string[]): string[] {
  const collator = new Intl.Collator('ru')
  return [...strings].sort((a, b) => collator.compare(a, b))
}

/** «1. …», «2. …» */
export function numbered(strings: string[]): string[] {
  return strings.map((s, idx) => `${idx + 1}. ${s}`)
}
