// Compares a parsed document with the requirements the student typed in.
// An empty requirement field means "do not check". Doubtful findings are
// reported as `warn` ("проверьте вручную"), never as errors.

import type { DocModel, Para } from './model'

export interface Requirements {
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  font?: string
  /** pt */
  size?: number
  /** multiple, e.g. 1.5 */
  line?: number
  /** cm */
  indent?: number
  align?: 'both' | 'left' | 'center' | 'right'
  pageNumber?: 'top' | 'bottom'
  noNumberOnTitle?: boolean
}

export interface Issue {
  severity: 'error' | 'warn'
  group: string
  title: string
  howTo: string
  /** Text snippets that let the student find the place with Ctrl+F. */
  where: string[]
}

export interface Report {
  issues: Issue[]
  checkedParagraphs: number
  notes: string[]
}

const MM_TOL = 0.6
const CM_TOL = 0.06
const LINE_TOL = 0.03

const ALIGN_RU: Record<string, string> = { both: 'по ширине', left: 'по левому краю', center: 'по центру', right: 'по правому краю' }

const HOWTO = {
  margins: 'Word: «Макет» → «Поля» → «Настраиваемые поля».',
  page: 'Word: «Макет» → «Размер» → «A4».',
  font: 'Выделите абзацы и нажмите Ctrl+Пробел (сброс ручного шрифта), затем поменяйте шрифт в стиле «Обычный»: правый клик по стилю → «Изменить».',
  size: 'Поменяйте размер в стиле «Обычный» (правый клик по стилю → «Изменить»), а у отдельных абзацев сбросьте ручное форматирование: Ctrl+Пробел.',
  line: 'Выделите абзацы → правый клик → «Абзац» → «Междустрочный»: «Множитель» или «1,5 строки».',
  indent: 'Выделите абзацы → правый клик → «Абзац» → «Первая строка»: «Отступ» на нужное значение.',
  align: 'Выделите абзацы и выберите выравнивание на вкладке «Главная» (по ширине — Ctrl+J).',
  empty: 'Удалите пустые строки и вставьте разрыв страницы: Ctrl+Enter.',
  spaces: 'Удалите пробелы или табуляцию в начале абзаца — отступ первой строки задаётся в настройках абзаца.',
  doubleSpaces: 'Ctrl+H → «Найти»: два пробела, «Заменить на»: один пробел → «Заменить все». Повторите, пока Word не найдёт ни одного.',
  heading: 'Поставьте курсор в заголовок и выберите стиль «Заголовок 1» или «Заголовок 2» (Ctrl+Alt+1 / Ctrl+Alt+2).',
  toc: 'Оформите заголовки стилями, затем «Ссылки» → «Оглавление» → «Автособираемое оглавление».',
  pageNumber: 'Word: «Вставка» → «Номер страницы» → вверху или внизу страницы.',
  titleNumber: 'Двойной щелчок по колонтитулу → отметьте «Особый колонтитул для первой страницы» и удалите номер на первой странице.',
}

const MAX_WHERE = 30

function snippet(p: Para | undefined): string {
  if (!p) return ''
  const t = p.text.replace(/\s+/g, ' ').trim()
  return t.length > 70 ? t.slice(0, 70) + '…' : t
}

const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol
const sameFont = (a: string | undefined, b: string) => (a ?? '').trim().toLowerCase() === b.trim().toLowerCase()
const fmt = (n: number, digits = 1) => String(Number(n.toFixed(digits))).replace('.', ',')

/** Captions typed by hand ("Рисунок 1 — …") are exempt from indent/alignment checks. */
const CAPTION_RE = /^\s*(рисунок|рис\.|таблица|продолжение таблицы|источник|примечание)\b/i

export function checkDocument(doc: DocModel, req: Requirements): Report {
  const issues: Issue[] = []
  const notes: string[] = []
  const grouped = new Map<string, Issue>()
  const add = (key: string, base: Omit<Issue, 'where'>, where?: string) => {
    let issue = grouped.get(key)
    if (!issue) {
      issue = { ...base, where: [] }
      grouped.set(key, issue)
      issues.push(issue)
    }
    if (where && issue.where.length < MAX_WHERE && !issue.where.includes(where)) issue.where.push(where)
  }

  // --- Page setup -----------------------------------------------------------
  doc.sections.forEach((s, i) => {
    const sect = doc.sections.length > 1 ? ` (раздел ${i + 1})` : ''
    if (!near(s.pageWmm, 210, 1.5) || !near(s.pageHmm, 297, 1.5)) {
      add(`page${i}`, {
        severity: 'error', group: 'Страница и поля',
        title: `Формат страницы ${fmt(s.pageWmm, 0)}×${fmt(s.pageHmm, 0)} мм — не A4${sect}`,
        howTo: HOWTO.page,
      })
    }
    const margins: [keyof Requirements, keyof typeof s.margins, string][] = [
      ['marginTop', 'top', 'Верхнее'], ['marginRight', 'right', 'Правое'],
      ['marginBottom', 'bottom', 'Нижнее'], ['marginLeft', 'left', 'Левое'],
    ]
    for (const [rk, sk, label] of margins) {
      const want = req[rk] as number | undefined
      if (want === undefined) continue
      const got = s.margins[sk]
      if (!near(got, want, MM_TOL)) {
        add(`margin-${sk}-${i}`, {
          severity: 'error', group: 'Страница и поля',
          title: `${label} поле ${fmt(got)} мм, требуется ${fmt(want)} мм${sect}`,
          howTo: HOWTO.margins,
        })
      }
    }
  })

  // --- Paragraph formatting -------------------------------------------------
  const textParas = doc.paras.filter((p) => p.kind === 'body' || p.kind === 'list')
  for (const p of textParas) {
    const where = snippet(p)
    const realRuns = p.runs.filter((r) => r.text.trim())

    if (req.font) {
      const wrong = new Set(realRuns.filter((r) => !sameFont(r.font, req.font!)).map((r) => r.font ?? 'не определён'))
      for (const f of Array.from(wrong)) {
        add(`font-${f}`, {
          severity: 'error', group: 'Шрифт',
          title: `Шрифт «${f}» вместо «${req.font}»`,
          howTo: HOWTO.font,
        }, where)
      }
    }
    if (req.size !== undefined) {
      const wrong = new Set(realRuns.filter((r) => r.size !== req.size).map((r) => r.size))
      for (const sz of Array.from(wrong)) {
        add(`size-${sz}`, {
          severity: 'error', group: 'Шрифт',
          title: `Размер шрифта ${fmt(sz)} пт вместо ${fmt(req.size)} пт`,
          howTo: HOWTO.size,
        }, where)
      }
    }
    if (req.line !== undefined) {
      if (p.lineFixedPt !== undefined) {
        add(`line-fixed-${p.lineFixedPt}`, {
          severity: 'warn', group: 'Интервалы и отступы',
          title: `Междустрочный интервал задан точно (${fmt(p.lineFixedPt)} пт) — проверьте, что он равен ${fmt(req.line, 2)}`,
          howTo: HOWTO.line,
        }, where)
      } else if (p.lineMultiple !== undefined && !near(p.lineMultiple, req.line, LINE_TOL)) {
        add(`line-${fmt(p.lineMultiple, 2)}`, {
          severity: 'error', group: 'Интервалы и отступы',
          title: `Междустрочный интервал ${fmt(p.lineMultiple, 2)} вместо ${fmt(req.line, 2)}`,
          howTo: HOWTO.line,
        }, where)
      }
    }

    // Lists, drawings and hand-typed captions have their own indent/alignment.
    const plainBody = p.kind === 'body' && !p.hasDrawing && !CAPTION_RE.test(p.text)
    if (plainBody && req.indent !== undefined && !near(p.firstLineCm, req.indent, CM_TOL)) {
      // Hand-numbered lines ("1. Иванов И. И. …") often have their own indent rules.
      const numberedByHand = /^\s*\d+[.)]\s/.test(p.text)
      add(`indent-${fmt(p.firstLineCm, 2)}-${numberedByHand}`, {
        severity: numberedByHand ? 'warn' : 'error', group: 'Интервалы и отступы',
        title: numberedByHand
          ? `У пронумерованных вручную строк отступ ${fmt(p.firstLineCm, 2)} см — проверьте по методичке, нужен ли ${fmt(req.indent, 2)} см`
          : `Абзацный отступ ${fmt(p.firstLineCm, 2)} см вместо ${fmt(req.indent, 2)} см`,
        howTo: HOWTO.indent,
      }, where)
    }
    if (plainBody && req.align && p.align !== req.align) {
      // A short centred line in the body is often a figure/heading — doubtful.
      const doubtful = p.text.trim().length < 60
      add(`align-${p.align}-${doubtful}`, {
        severity: doubtful ? 'warn' : 'error', group: 'Выравнивание',
        title: doubtful
          ? `Короткие строки выровнены ${ALIGN_RU[p.align] ?? p.align} — если это основной текст, нужно ${ALIGN_RU[req.align]}`
          : `Текст выровнен ${ALIGN_RU[p.align] ?? p.align}, требуется ${ALIGN_RU[req.align]}`,
        howTo: HOWTO.align,
      }, where)
    }

    if (p.kind === 'body' && /^( {2,}|\t)/.test(p.text)) {
      add('lead-spaces', {
        severity: 'error', group: 'Пробелы и пустые строки',
        title: 'Отступ в начале абзаца сделан пробелами или табуляцией',
        howTo: HOWTO.spaces,
      }, where)
    }
    if (/\S {2,}\S/.test(p.text)) {
      add('double-spaces', {
        severity: 'warn', group: 'Пробелы и пустые строки',
        title: 'Двойные пробелы внутри текста',
        howTo: HOWTO.doubleSpaces,
      }, where)
    }

    // Looks like a heading but has no heading style → will not get into the TOC.
    const t = p.text.trim()
    if (
      p.kind === 'body' && t.length >= 3 && t.length <= 150 && !/[.:;,]$/.test(t) &&
      realRuns.length > 0 && realRuns.every((r) => r.bold) &&
      (p.align === 'center' || t === t.toUpperCase())
    ) {
      add('fake-heading', {
        severity: 'warn', group: 'Заголовки',
        title: 'Похоже на заголовок, но не оформлено стилем заголовка — не попадёт в оглавление',
        howTo: HOWTO.heading,
      }, where)
    }
  }

  // --- Empty lines used as spacing -----------------------------------------
  for (let i = 0; i < doc.paras.length; i++) {
    if (doc.paras[i].kind !== 'empty' || doc.paras[i].hasDrawing) continue
    let j = i
    while (j < doc.paras.length && doc.paras[j].kind === 'empty' && !doc.paras[j].hasDrawing && !doc.paras[j].breaksPage) j++
    if (j - i >= 2) {
      const prev = [...doc.paras.slice(0, i)].reverse().find((p) => p.kind !== 'empty')
      add('empty-lines', {
        severity: 'error', group: 'Пробелы и пустые строки',
        title: 'Несколько пустых строк подряд (страница «добита» Enter\'ами)',
        howTo: HOWTO.empty,
      }, prev ? `${j - i} пустых строки после «${snippet(prev)}»` : `${j - i} пустых строки в начале документа`)
    }
    i = j
  }

  // --- Headings and table of contents --------------------------------------
  const headings = doc.paras.filter((p) => p.kind === 'heading').length
  if (headings === 0 && textParas.length > 30) {
    add('no-headings', {
      severity: 'warn', group: 'Заголовки',
      title: 'Ни один заголовок не оформлен стилем «Заголовок» — автоматическое оглавление не соберётся',
      howTo: HOWTO.heading,
    })
  }
  if (headings > 0 && !doc.hasToc) {
    add('no-toc', {
      severity: 'warn', group: 'Заголовки',
      title: 'Автоматическое оглавление не найдено — если оно набрано вручную, номера страниц могут не совпадать',
      howTo: HOWTO.toc,
    })
  }

  // --- Page numbers ---------------------------------------------------------
  const main = doc.sections[doc.sections.length - 1]
  if (main && req.pageNumber) {
    const { top, bottom } = main.pageNumber
    if (!top && !bottom) {
      add('pn-missing', { severity: 'error', group: 'Нумерация страниц', title: 'Номера страниц не найдены', howTo: HOWTO.pageNumber })
    } else if (req.pageNumber === 'top' && !top) {
      add('pn-pos', { severity: 'error', group: 'Нумерация страниц', title: 'Номер страницы внизу, требуется вверху', howTo: HOWTO.pageNumber })
    } else if (req.pageNumber === 'bottom' && !bottom) {
      add('pn-pos', { severity: 'error', group: 'Нумерация страниц', title: 'Номер страницы вверху, требуется внизу', howTo: HOWTO.pageNumber })
    }
  }
  if (doc.sections[0] && req.noNumberOnTitle && doc.sections[0].firstPageNumbered) {
    add('pn-title', { severity: 'error', group: 'Нумерация страниц', title: 'На титульном листе будет стоять номер страницы', howTo: HOWTO.titleNumber })
  }

  if (doc.paras.some((p) => p.kind === 'title')) notes.push('Титульный лист (всё до первого разрыва страницы) не проверялся — его оформляют по бланку кафедры.')
  if (doc.paras.some((p) => p.kind === 'table')) notes.push('Текст внутри таблиц не проверялся — для таблиц методички часто разрешают меньший шрифт и одинарный интервал.')

  const order = ['Страница и поля', 'Шрифт', 'Интервалы и отступы', 'Выравнивание', 'Пробелы и пустые строки', 'Заголовки', 'Нумерация страниц']
  issues.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1))
  return { issues, checkedParagraphs: textParas.length, notes }
}
