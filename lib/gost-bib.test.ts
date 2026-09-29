/// <reference types="vitest/globals" />
/**
 * ГОСТ Р 7.0.100-2018 formatter tests.
 * Run with:  node node_modules/vitest/vitest.mjs run lib/gost-bib.test.ts
 */

import {
  formatBook,
  formatArticle,
  formatWeb,
  formatLaw,
  formatThesis,
  formatEntry,
  normalizeInitials,
  normalizeDate,
  missingFields,
  sortEntries,
  numbered,
  type Author,
  type BookInput,
} from './gost-bib'

const ivanov: Author = { surname: 'Иванов', initials: 'И. И.' }
const petrov: Author = { surname: 'Петров', initials: 'П. П.' }
const sidorov: Author = { surname: 'Сидоров', initials: 'С. С.' }
const andreev: Author = { surname: 'Андреев', initials: 'А. А.' }
const kuznetsov: Author = { surname: 'Кузнецов', initials: 'К. К.' }

const book = (over: Partial<BookInput> = {}): BookInput => ({
  kind: 'book',
  authors: [ivanov, petrov],
  title: 'Экономика предприятия',
  subtitle: 'учебник для вузов',
  edition: '3-е изд., перераб. и доп.',
  city: 'Москва',
  publisher: 'Юрайт',
  year: '2023',
  pages: '320',
  isbn: '978-5-534-00000-0',
  ...over,
})

describe('A. книга, 1–3 автора', () => {
  it('formats the full example', () => {
    expect(formatBook(book())).toBe(
      'Иванов, И. И. Экономика предприятия : учебник для вузов / И. И. Иванов, П. П. Петров. – 3-е изд., перераб. и доп. – Москва : Юрайт, 2023. – 320 с. – ISBN 978-5-534-00000-0. – Текст : непосредственный.',
    )
  })

  it('one author, no edition, no ISBN, no subtitle', () => {
    expect(
      formatBook(book({ authors: [ivanov], subtitle: '', edition: '', isbn: '' })),
    ).toBe(
      'Иванов, И. И. Экономика предприятия / И. И. Иванов. – Москва : Юрайт, 2023. – 320 с. – Текст : непосредственный.',
    )
  })

  it('three authors: heading is the first, all three in responsibility', () => {
    const s = formatBook(book({ authors: [ivanov, petrov, sidorov], edition: '', isbn: '' }))
    expect(s.startsWith('Иванов, И. И. Экономика')).toBe(true)
    expect(s).toContain('/ И. И. Иванов, П. П. Петров, С. С. Сидоров. – Москва')
  })
})

describe('B/C. 4 и 5+ авторов', () => {
  it('4 authors: no heading, all four listed', () => {
    expect(
      formatBook(
        book({
          authors: [ivanov, petrov, sidorov, andreev],
          subtitle: 'учебник',
          edition: '',
          isbn: '',
        }),
      ),
    ).toBe(
      'Экономика предприятия : учебник / И. И. Иванов, П. П. Петров, С. С. Сидоров, А. А. Андреев. – Москва : Юрайт, 2023. – 320 с. – Текст : непосредственный.',
    )
  })

  it('5 authors: no heading, first three then [и др.]', () => {
    const s = formatBook(
      book({ authors: [ivanov, petrov, sidorov, andreev, kuznetsov], subtitle: 'учебник', edition: '', isbn: '' }),
    )
    expect(s).toBe(
      'Экономика предприятия : учебник / И. И. Иванов, П. П. Петров, С. С. Сидоров [и др.]. – Москва : Юрайт, 2023. – 320 с. – Текст : непосредственный.',
    )
    expect(s).not.toContain('Андреев')
  })

  it('6 authors behave like 5', () => {
    const s = formatBook(
      book({ authors: [ivanov, petrov, sidorov, andreev, kuznetsov, ivanov], edition: '', isbn: '' }),
    )
    expect(s).toContain('Сидоров [и др.]. – Москва')
  })
})

describe('D. книга под редакцией', () => {
  it('uses the editor string as typed and has no heading', () => {
    expect(
      formatBook({
        kind: 'book',
        authors: [],
        editor: 'под редакцией И. И. Иванова',
        title: 'Менеджмент',
        subtitle: 'учебник',
        city: 'Москва',
        publisher: 'Юрайт',
        year: '2023',
        pages: '400',
      }),
    ).toBe('Менеджмент : учебник / под редакцией И. И. Иванова. – Москва : Юрайт, 2023. – 400 с. – Текст : непосредственный.')
  })
})

describe('E. статья в журнале', () => {
  const base = {
    kind: 'article' as const,
    authors: [ivanov, petrov],
    title: 'Цифровизация бухгалтерского учёта',
    journal: 'Бухгалтерский учёт',
    year: '2024',
    issue: '3',
    pages: '15-20',
  }

  it('paper journal', () => {
    expect(formatArticle(base)).toBe(
      'Иванов, И. И. Цифровизация бухгалтерского учёта / И. И. Иванов, П. П. Петров. – Текст : непосредственный // Бухгалтерский учёт. – 2024. – № 3. – С. 15–20.',
    )
  })

  it('volume goes before the issue', () => {
    expect(formatArticle({ ...base, volume: '12' })).toContain('. – 2024. – Т. 12, № 3. – С. 15–20.')
  })

  it('electronic journal ends with URL and access date', () => {
    expect(
      formatArticle({ ...base, electronic: true, url: 'https://example.ru/a', accessDate: '15.07.2026' }),
    ).toBe(
      'Иванов, И. И. Цифровизация бухгалтерского учёта / И. И. Иванов, П. П. Петров. – Текст : электронный // Бухгалтерский учёт. – 2024. – № 3. – С. 15–20. – URL: https://example.ru/a (дата обращения: 15.07.2026).',
    )
  })

  it('4+ authors follow the book rule (no heading)', () => {
    const s = formatArticle({ ...base, authors: [ivanov, petrov, sidorov, andreev, kuznetsov] })
    expect(s.startsWith('Цифровизация бухгалтерского учёта / И. И. Иванов, П. П. Петров, С. С. Сидоров [и др.]. – Текст')).toBe(true)
  })
})

describe('F. электронный ресурс', () => {
  it('with author and publication date', () => {
    expect(
      formatWeb({
        kind: 'web',
        authors: [ivanov],
        title: 'Как оформить список литературы',
        site: 'Название сайта',
        year: '2024',
        date: '5 мая',
        url: 'https://example.ru/page',
        accessDate: '15.07.2026',
      }),
    ).toBe(
      'Иванов, И. И. Как оформить список литературы / И. И. Иванов. – Текст : электронный // Название сайта : [сайт]. – 2024. – 5 мая. – URL: https://example.ru/page (дата обращения: 15.07.2026).',
    )
  })

  it('without author and without date', () => {
    expect(
      formatWeb({
        kind: 'web',
        authors: [],
        title: 'Как оформить список литературы',
        site: 'Название сайта',
        url: 'https://example.ru/page',
        accessDate: '15.07.2026',
      }),
    ).toBe(
      'Как оформить список литературы. – Текст : электронный // Название сайта : [сайт]. – URL: https://example.ru/page (дата обращения: 15.07.2026).',
    )
  })

  it('defaults the access date to today (ДД.ММ.ГГГГ)', () => {
    const s = formatWeb({ kind: 'web', authors: [], title: 'T', site: 'S', url: 'https://a.ru' })
    expect(s).toMatch(/\(дата обращения: \d{2}\.\d{2}\.\d{4}\)\.$/)
  })
})

describe('G. нормативный акт', () => {
  it('official publication', () => {
    expect(
      formatLaw({
        kind: 'law',
        title: 'О бухгалтерском учёте',
        actType: 'федеральный закон',
        actDate: '06.12.2011',
        actNumber: '402-ФЗ',
        source: 'official',
        publication: 'Собрание законодательства Российской Федерации',
        year: '2011',
        issue: '50',
        article: '7344',
      }),
    ).toBe(
      'О бухгалтерском учёте : федеральный закон от 06.12.2011 № 402-ФЗ. – Текст : непосредственный // Собрание законодательства Российской Федерации. – 2011. – № 50. – Ст. 7344.',
    )
  })

  it('from a legal database with edition', () => {
    expect(
      formatLaw({
        kind: 'law',
        title: 'О бухгалтерском учёте',
        actType: 'федеральный закон',
        actDate: '06.12.2011',
        actNumber: '402-ФЗ',
        edition: '12.12.2023',
        source: 'site',
        site: 'КонсультантПлюс',
        url: 'https://www.consultant.ru/document/cons_doc_LAW_122855/',
        accessDate: '15.07.2026',
      }),
    ).toBe(
      'О бухгалтерском учёте : федеральный закон от 06.12.2011 № 402-ФЗ : [ред. от 12.12.2023]. – Текст : электронный // КонсультантПлюс : [сайт]. – URL: https://www.consultant.ru/document/cons_doc_LAW_122855/ (дата обращения: 15.07.2026).',
    )
  })

  it('a title with a parenthesis stays intact', () => {
    const s = formatLaw({
      kind: 'law',
      title: 'Гражданский кодекс Российской Федерации (часть первая)',
      actType: 'федеральный закон',
      actDate: '30.11.1994',
      actNumber: '№ 51-ФЗ',
      source: 'official',
      publication: 'Собрание законодательства Российской Федерации',
      year: '1994',
      issue: '32',
      article: 'Ст. 3301',
    })
    expect(s).toBe(
      'Гражданский кодекс Российской Федерации (часть первая) : федеральный закон от 30.11.1994 № 51-ФЗ. – Текст : непосредственный // Собрание законодательства Российской Федерации. – 1994. – № 32. – Ст. 3301.',
    )
  })
})

describe('H. диссертация и автореферат', () => {
  const base = {
    kind: 'thesis' as const,
    fullName: 'Иванов Иван Иванович',
    title: 'Управление затратами на промышленном предприятии',
    specialtyCode: '5.2.3',
    specialtyName: 'Региональная и отраслевая экономика',
    degree: 'кандидата' as const,
    sciences: 'экономических наук',
    city: 'Москва',
    year: '2022',
  }

  it('dissertation', () => {
    expect(
      formatThesis({ ...base, type: 'dissertation', organization: 'Московский государственный университет', pages: '180' }),
    ).toBe(
      'Иванов, И. И. Управление затратами на промышленном предприятии : специальность 5.2.3 «Региональная и отраслевая экономика» : диссертация на соискание ученой степени кандидата экономических наук / Иванов Иван Иванович ; Московский государственный университет. – Москва, 2022. – 180 с. – Текст : непосредственный.',
    )
  })

  it('автореферат', () => {
    expect(formatThesis({ ...base, type: 'abstract', pages: '24' })).toBe(
      'Иванов, И. И. Управление затратами на промышленном предприятии : специальность 5.2.3 «Региональная и отраслевая экономика» : автореферат диссертации на соискание ученой степени кандидата экономических наук / Иванов Иван Иванович. – Москва, 2022. – 24 с. – Текст : непосредственный.',
    )
  })
})

describe('нормализация инициалов', () => {
  it.each([
    ['И.И.', 'И. И.'],
    ['И И', 'И. И.'],
    ['ИИ', 'И. И.'],
    ['и.и.', 'И. И.'],
    ['  И.   И. ', 'И. И.'],
    ['И.', 'И.'],
    ['Иван Иванович', 'И. И.'],
    ['', ''],
  ])('%s → %s', (raw, expected) => {
    expect(normalizeInitials(raw)).toBe(expected)
  })

  it('is applied in heading and responsibility', () => {
    const s = formatBook(book({ authors: [{ surname: '  Иванов ', initials: 'И.И.' }], subtitle: '', edition: '', isbn: '' }))
    expect(s.startsWith('Иванов, И. И. Экономика предприятия / И. И. Иванов. – ')).toBe(true)
  })
})

describe('пунктуация и пустые части', () => {
  it('no double period when the title ends with «?»', () => {
    const s = formatBook(book({ title: 'Что делать?', subtitle: '', authors: [ivanov], edition: '', isbn: '' }))
    expect(s).toBe('Иванов, И. И. Что делать? / И. И. Иванов. – Москва : Юрайт, 2023. – 320 с. – Текст : непосредственный.')
    expect(s).not.toContain('?.')
    expect(s).not.toContain('..')
  })

  it('a trailing period in the title is not doubled', () => {
    const s = formatBook(book({ title: 'Экономика.', subtitle: '', authors: [ivanov], edition: '', isbn: '' }))
    expect(s.startsWith('Иванов, И. И. Экономика / И. И. Иванов. – ')).toBe(true)
  })

  it('a title that ends with «?» with no authors joins the next area with a bare dash', () => {
    const s = formatBook(book({ title: 'Что делать?', subtitle: '', authors: [], edition: '', isbn: '' }))
    expect(s.startsWith('Что делать? – Москва')).toBe(true)
  })

  it('omits empty optional parts cleanly', () => {
    const s = formatBook({ kind: 'book', authors: [], title: 'Название', city: 'Москва', year: '2020' })
    expect(s).toBe('Название. – Москва : [б. и.], 2020. – Текст : непосредственный.')
    expect(s).not.toMatch(/ : \s|,\s*,|\s{2}|\.\s–\s\./)
  })

  it('article without volume/issue', () => {
    expect(
      formatArticle({ kind: 'article', authors: [], title: 'Статья', journal: 'Журнал', year: '2020', pages: '5' }),
    ).toBe('Статья. – Текст : непосредственный // Журнал. – 2020. – С. 5.')
  })

  it('uses the EN DASH everywhere and never a hyphen separator', () => {
    const all = [
      formatBook(book()),
      formatArticle({ kind: 'article', authors: [ivanov], title: 'T', journal: 'J', year: '2020', pages: '1-2' }),
      formatWeb({ kind: 'web', authors: [], title: 'T', site: 'S', url: 'https://a.ru', accessDate: '01.01.2026' }),
      formatThesis({
        kind: 'thesis', type: 'dissertation', fullName: 'Иванов Иван Иванович', title: 'T',
        degree: 'кандидата', sciences: 'экономических наук', city: 'Москва', year: '2022',
      }),
    ]
    for (const s of all) {
      expect(s).not.toContain(' - ')
      expect(s).not.toContain('—') // em dash
      expect(s).toContain(' – ')
    }
    expect(all[1]).toContain('С. 1–2.')
  })

  it('an en dash in the page range is kept, a hyphen or em dash is converted', () => {
    const f = (pages: string) =>
      formatArticle({ kind: 'article', authors: [], title: 'T', journal: 'J', year: '2020', pages })
    expect(f('15–20')).toContain('С. 15–20.')
    expect(f('15 — 20')).toContain('С. 15–20.')
    expect(f('С. 15-20')).toContain('С. 15–20.')
  })

  it('a publisher without a city gets [Б. м.]', () => {
    const s = formatBook({ kind: 'book', authors: [], title: 'Н', publisher: 'Юрайт', year: '2020' })
    expect(s).toContain('[Б. м.] : Юрайт, 2020')
  })

  it('«с.» typed by the user is not doubled', () => {
    expect(formatBook(book({ pages: '320 с.', edition: '', isbn: '', subtitle: '' }))).toContain('. – 320 с. – Текст')
  })
})

describe('вспомогательное', () => {
  it('normalizeDate', () => {
    expect(normalizeDate('6.12.2011')).toBe('06.12.2011')
    expect(normalizeDate('2026-07-15')).toBe('15.07.2026')
  })

  it('missingFields reports empty required fields and formatEntry dispatches', () => {
    const b = book({ title: '', year: '' })
    expect(missingFields(b)).toEqual(['Заглавие', 'Год'])
    expect(formatEntry(book())).toBe(formatBook(book()))
  })

  it('sortEntries sorts by Russian collation and does not mutate', () => {
    const src = ['Яковлев, Я. Я. А', 'Ёлкин, Е. Е. Б', 'Абрамов, А. А. В', 'Иванов, И. И. Г']
    const sorted = sortEntries(src)
    expect(sorted).toEqual(['Абрамов, А. А. В', 'Иванов, И. И. Г', 'Ёлкин, Е. Е. Б', 'Яковлев, Я. Я. А'].sort((a, b) => new Intl.Collator('ru').compare(a, b)))
    expect(sorted[0]).toBe('Абрамов, А. А. В')
    expect(sorted[sorted.length - 1]).toBe('Яковлев, Я. Я. А')
    expect(src[0]).toBe('Яковлев, Я. Я. А')
  })

  it('numbered', () => {
    expect(numbered(['а', 'б'])).toEqual(['1. а', '2. б'])
  })
})
