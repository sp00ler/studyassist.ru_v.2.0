'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  formatDateRu,
  formatEntry,
  missingFields,
  numbered,
  sortEntries,
  type Author,
  type SourceInput,
  type SourceKind,
} from '@/lib/gost-bib'

const STORAGE_KEY = 'studyassist.gostbib.list.v1'
const MAX_AUTHORS = 6

const KINDS: { id: SourceKind; label: string }[] = [
  { id: 'book', label: 'Книга' },
  { id: 'article', label: 'Статья' },
  { id: 'web', label: 'Сайт' },
  { id: 'law', label: 'Закон' },
  { id: 'thesis', label: 'Диссертация' },
]

const ACT_TYPES = [
  'федеральный закон',
  'федеральный конституционный закон',
  'указ Президента Российской Федерации',
  'постановление Правительства Российской Федерации',
  'приказ',
  'распоряжение',
  'постановление',
]

type FormValues = Record<string, string>

interface FieldDef {
  key: string
  label: string
  placeholder?: string
  hint?: string
  half?: boolean
  select?: string[]
  datalist?: string[]
  showIf?: (v: FormValues) => boolean
}

const FIELDS: Record<SourceKind, FieldDef[]> = {
  book: [
    { key: 'title', label: 'Заглавие', placeholder: 'Экономика предприятия' },
    { key: 'subtitle', label: 'Сведения к заглавию (необязательно)', placeholder: 'учебник для вузов' },
    {
      key: 'editor',
      label: 'Под редакцией (необязательно)',
      placeholder: 'под редакцией И. И. Иванова',
      hint: 'Вводите как нужно в тексте, в родительном падеже. Если у книги нет авторов, оставьте авторов пустыми.',
    },
    { key: 'edition', label: 'Издание (необязательно)', placeholder: '3-е изд., перераб. и доп.' },
    { key: 'city', label: 'Город', placeholder: 'Москва', half: true },
    { key: 'publisher', label: 'Издательство', placeholder: 'Юрайт', half: true },
    { key: 'year', label: 'Год', placeholder: '2023', half: true },
    { key: 'pages', label: 'Число страниц', placeholder: '320', half: true },
    { key: 'isbn', label: 'ISBN (необязательно)', placeholder: '978-5-534-00000-0' },
  ],
  article: [
    { key: 'title', label: 'Название статьи', placeholder: 'Цифровизация бухгалтерского учёта' },
    { key: 'journal', label: 'Журнал', placeholder: 'Бухгалтерский учёт' },
    { key: 'year', label: 'Год', placeholder: '2024', half: true },
    { key: 'volume', label: 'Том (необязательно)', placeholder: '12', half: true },
    { key: 'issue', label: 'Номер (необязательно)', placeholder: '3', half: true },
    { key: 'pages', label: 'Страницы', placeholder: '15-20', half: true },
    { key: 'electronic', label: 'Электронный журнал (с URL и датой обращения)' },
    { key: 'url', label: 'URL', placeholder: 'https://example.ru/article', showIf: (v) => v.electronic === '1' },
    { key: 'accessDate', label: 'Дата обращения', placeholder: 'ДД.ММ.ГГГГ', showIf: (v) => v.electronic === '1' },
  ],
  web: [
    { key: 'title', label: 'Название страницы или документа', placeholder: 'Как оформить список литературы' },
    { key: 'site', label: 'Название сайта', placeholder: 'Название сайта' },
    { key: 'year', label: 'Год публикации (необязательно)', placeholder: '2024', half: true },
    { key: 'date', label: 'Дата публикации (необязательно)', placeholder: '5 мая', half: true },
    { key: 'url', label: 'URL', placeholder: 'https://example.ru/page' },
    { key: 'accessDate', label: 'Дата обращения', placeholder: 'ДД.ММ.ГГГГ' },
  ],
  law: [
    { key: 'title', label: 'Название', placeholder: 'О бухгалтерском учёте' },
    {
      key: 'actType',
      label: 'Вид акта',
      placeholder: 'федеральный закон',
      datalist: ACT_TYPES,
      hint: 'Выберите из списка или впишите свой вид акта.',
    },
    { key: 'actDate', label: 'Дата принятия', placeholder: '06.12.2011', half: true },
    { key: 'actNumber', label: 'Номер', placeholder: '402-ФЗ', half: true },
    { key: 'edition', label: 'Редакция от (необязательно)', placeholder: '12.12.2023' },
    { key: 'source', label: 'Где опубликован', select: ['official', 'site'] },
    {
      key: 'publication',
      label: 'Издание',
      placeholder: 'Собрание законодательства Российской Федерации',
      showIf: (v) => v.source !== 'site',
    },
    { key: 'year', label: 'Год', placeholder: '2011', half: true, showIf: (v) => v.source !== 'site' },
    { key: 'issue', label: 'Номер выпуска', placeholder: '50', half: true, showIf: (v) => v.source !== 'site' },
    { key: 'article', label: 'Статья', placeholder: '7344', showIf: (v) => v.source !== 'site' },
    { key: 'site', label: 'Сайт или база', placeholder: 'КонсультантПлюс', showIf: (v) => v.source === 'site' },
    {
      key: 'url',
      label: 'URL',
      placeholder: 'https://www.consultant.ru/document/cons_doc_LAW_122855/',
      showIf: (v) => v.source === 'site',
    },
    { key: 'accessDate', label: 'Дата обращения', placeholder: 'ДД.ММ.ГГГГ', showIf: (v) => v.source === 'site' },
  ],
  thesis: [
    { key: 'fullName', label: 'ФИО автора полностью', placeholder: 'Иванов Иван Иванович' },
    { key: 'title', label: 'Тема', placeholder: 'Управление затратами на промышленном предприятии' },
    { key: 'specialtyCode', label: 'Код специальности (необязательно)', placeholder: '5.2.3', half: true },
    {
      key: 'specialtyName',
      label: 'Название специальности (необязательно)',
      placeholder: 'Региональная и отраслевая экономика',
      half: true,
    },
    { key: 'type', label: 'Вид работы', select: ['dissertation', 'abstract'], half: true },
    { key: 'degree', label: 'Степень', select: ['кандидата', 'доктора'], half: true },
    { key: 'sciences', label: 'Отрасль наук', placeholder: 'экономических наук' },
    { key: 'organization', label: 'Организация (необязательно)', placeholder: 'Московский государственный университет' },
    { key: 'city', label: 'Город', placeholder: 'Москва', half: true },
    { key: 'year', label: 'Год', placeholder: '2022', half: true },
    { key: 'pages', label: 'Число страниц', placeholder: '180' },
  ],
}

const SELECT_LABELS: Record<string, string> = {
  official: 'Официальное издание (бумажное)',
  site: 'Сайт или правовая база',
  dissertation: 'Диссертация',
  abstract: 'Автореферат',
  кандидата: 'Кандидатская',
  доктора: 'Докторская',
}

function initialValues(kind: SourceKind, today: string): FormValues {
  const base: FormValues = {}
  if (kind === 'article' || kind === 'web' || kind === 'law') base.accessDate = today
  if (kind === 'law') base.source = 'official'
  if (kind === 'thesis') {
    base.type = 'dissertation'
    base.degree = 'кандидата'
  }
  return base
}

function buildInput(kind: SourceKind, v: FormValues, authors: Author[]): SourceInput {
  const g = (k: string) => v[k] ?? ''
  switch (kind) {
    case 'book':
      return {
        kind, authors, title: g('title'), subtitle: g('subtitle'), editor: g('editor'), edition: g('edition'),
        city: g('city'), publisher: g('publisher'), year: g('year'), pages: g('pages'), isbn: g('isbn'),
      }
    case 'article':
      return {
        kind, authors, title: g('title'), journal: g('journal'), year: g('year'), volume: g('volume'),
        issue: g('issue'), pages: g('pages'), electronic: g('electronic') === '1', url: g('url'),
        accessDate: g('accessDate'),
      }
    case 'web':
      return {
        kind, authors, title: g('title'), site: g('site'), year: g('year'), date: g('date'), url: g('url'),
        accessDate: g('accessDate'),
      }
    case 'law':
      return {
        kind, title: g('title'), actType: g('actType'), actDate: g('actDate'), actNumber: g('actNumber'),
        edition: g('edition'), source: g('source') === 'site' ? 'site' : 'official', publication: g('publication'),
        year: g('year'), issue: g('issue'), article: g('article'), site: g('site'), url: g('url'),
        accessDate: g('accessDate'),
      }
    case 'thesis':
      return {
        kind, fullName: g('fullName'), title: g('title'), specialtyCode: g('specialtyCode'),
        specialtyName: g('specialtyName'), degree: g('degree') === 'доктора' ? 'доктора' : 'кандидата',
        sciences: g('sciences'), type: g('type') === 'abstract' ? 'abstract' : 'dissertation',
        organization: g('organization'), city: g('city'), year: g('year'), pages: g('pages'),
      }
  }
}

function loadList(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function saveList(list: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // storage unavailable (private mode, quota): the list still works in memory
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

const selectClass =
  'field-95 flex h-11 w-full px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink'

export function GostBibTool() {
  const [kind, setKind] = useState<SourceKind>('book')
  const [today, setToday] = useState('')
  const [values, setValues] = useState<Record<SourceKind, FormValues>>({
    book: {}, article: {}, web: {}, law: { source: 'official' }, thesis: { type: 'dissertation', degree: 'кандидата' },
  })
  const [authors, setAuthors] = useState<Author[]>([{ surname: '', initials: '' }])
  const [list, setList] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState('')
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Client-only init: today's date and the saved list (avoids hydration mismatch).
  useEffect(() => {
    const t = formatDateRu(new Date())
    setToday(t)
    setValues((prev) => ({
      ...prev,
      article: { accessDate: t, ...prev.article },
      web: { accessDate: t, ...prev.web },
      law: { accessDate: t, ...prev.law },
    }))
    setList(loadList())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveList(list)
  }, [list, loaded])

  useEffect(() => () => {
    if (statusTimer.current) clearTimeout(statusTimer.current)
  }, [])

  const announce = useCallback((msg: string) => {
    setStatus(msg)
    if (statusTimer.current) clearTimeout(statusTimer.current)
    statusTimer.current = setTimeout(() => setStatus(''), 2500)
  }, [])

  const v = values[kind]
  const usesAuthors = kind === 'book' || kind === 'article' || kind === 'web'

  const input = useMemo(() => buildInput(kind, v, authors), [kind, v, authors])
  const preview = useMemo(() => formatEntry(input), [input])
  const missing = useMemo(() => missingFields(input), [input])
  const filled = (v.title ?? v.fullName ?? '').trim() !== '' || (v.fullName ?? '').trim() !== ''

  const setField = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [kind]: { ...prev[kind], [key]: value } }))

  const setAuthor = (idx: number, patch: Partial<Author>) =>
    setAuthors((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)))

  const addAuthor = () => setAuthors((prev) => (prev.length < MAX_AUTHORS ? [...prev, { surname: '', initials: '' }] : prev))
  const removeAuthor = (idx: number) =>
    setAuthors((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : [{ surname: '', initials: '' }]))

  const onCopy = async (text: string, msg: string) => {
    announce((await copyText(text)) ? msg : 'Не удалось скопировать: выделите текст вручную')
  }

  const addToList = () => {
    if (!preview || missing.length > 0) return
    setList((prev) => [...prev, preview])
    setValues((prev) => ({ ...prev, [kind]: initialValues(kind, today) }))
    setAuthors([{ surname: '', initials: '' }])
    announce('Источник добавлен в список')
  }

  const fullList = numbered(list).join('\n')

  return (
    <div className="window" id="tool">
      <div className="titlebar">
        <span className="truncate">ГОСТ-ГЕНЕРАТОР.EXE</span>
        <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
          <span className="titlebar-btn">_</span>
          <span className="titlebar-btn">□</span>
          <span className="titlebar-btn">×</span>
        </div>
      </div>

      <div className="bg-paper p-4 sm:p-6">
        {/* Source type tabs */}
        <div role="tablist" aria-label="Тип источника" className="flex flex-wrap gap-2 mb-6">
          {KINDS.map((k) => {
            const active = k.id === kind
            return (
              <button
                key={k.id}
                type="button"
                role="tab"
                id={`tab-${k.id}`}
                aria-selected={active}
                aria-controls="gost-panel"
                onClick={() => setKind(k.id)}
                className={(active ? 'btn-95-primary' : 'btn-95') + ' font-display text-[11px] leading-none h-10 px-4'}
              >
                {k.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div id="gost-panel" role="tabpanel" aria-labelledby={`tab-${kind}`}>
            {usesAuthors && (
              <fieldset className="mb-5">
                <legend className="text-sm font-bold text-ink mb-2">Авторы</legend>
                <div className="space-y-2">
                  {authors.map((a, idx) => (
                    <div key={idx} className="flex items-end gap-2">
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`author-surname-${idx}`} className="text-xs text-ink-soft mb-1 block">
                          Фамилия
                        </Label>
                        <Input
                          id={`author-surname-${idx}`}
                          value={a.surname}
                          placeholder="Иванов"
                          autoComplete="off"
                          onChange={(e) => setAuthor(idx, { surname: e.target.value })}
                        />
                      </div>
                      <div className="w-[104px] flex-shrink-0">
                        <Label htmlFor={`author-initials-${idx}`} className="text-xs text-ink-soft mb-1 block">
                          Инициалы
                        </Label>
                        <Input
                          id={`author-initials-${idx}`}
                          value={a.initials}
                          placeholder="И. И."
                          autoComplete="off"
                          onChange={(e) => setAuthor(idx, { initials: e.target.value })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 flex-shrink-0"
                        aria-label={`Удалить автора ${idx + 1}`}
                        onClick={() => removeAuthor(idx)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAuthor}
                    disabled={authors.length >= MAX_AUTHORS}
                  >
                    + Добавить автора
                  </Button>
                  <span className="text-xs text-ink-soft">Не больше {MAX_AUTHORS}. Инициалы можно писать как «ИИ» или «И.И.».</span>
                </div>
              </fieldset>
            )}

            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              {FIELDS[kind].map((f) => {
                if (f.showIf && !f.showIf(v)) return null
                const id = `f-${kind}-${f.key}`
                const wrap = f.half ? 'col-span-2 sm:col-span-1' : 'col-span-2'
                if (f.key === 'electronic') {
                  return (
                    <div key={f.key} className="col-span-2 flex items-center gap-2">
                      <input
                        id={id}
                        type="checkbox"
                        className="h-5 w-5 accent-[#000080]"
                        checked={v.electronic === '1'}
                        onChange={(e) => setField('electronic', e.target.checked ? '1' : '')}
                      />
                      <Label htmlFor={id} className="leading-snug">{f.label}</Label>
                    </div>
                  )
                }
                return (
                  <div key={f.key} className={wrap}>
                    <Label htmlFor={id} className="mb-1.5 block">{f.label}</Label>
                    {f.select ? (
                      <select
                        id={id}
                        className={selectClass}
                        value={v[f.key] ?? f.select[0]}
                        onChange={(e) => setField(f.key, e.target.value)}
                      >
                        {f.select.map((o) => (
                          <option key={o} value={o}>{SELECT_LABELS[o] ?? o}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={id}
                        value={v[f.key] ?? ''}
                        placeholder={f.placeholder}
                        autoComplete="off"
                        list={f.datalist ? `${id}-list` : undefined}
                        aria-describedby={f.hint ? `${id}-hint` : undefined}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    )}
                    {f.datalist && (
                      <datalist id={`${id}-list`}>
                        {f.datalist.map((o) => (
                          <option key={o} value={o} />
                        ))}
                      </datalist>
                    )}
                    {f.hint && (
                      <p id={`${id}-hint`} className="text-xs text-ink-soft mt-1 leading-snug">{f.hint}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          <div>
            <h2 className="font-display text-base text-ink mb-3">Готовое описание</h2>
            <div
              aria-live="polite"
              className="field-95 min-h-[140px] p-4 text-[15px] leading-[1.7] text-ink break-words"
            >
              {filled ? preview : <span className="text-ink-soft">Заполните поля слева: описание появится здесь.</span>}
            </div>
            {filled && missing.length > 0 && (
              <p className="text-xs text-ink-soft mt-2">Ещё нужно заполнить: {missing.join(', ')}.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onCopy(preview, 'Скопировано')}
                disabled={!filled}
              >
                Скопировать
              </Button>
              <Button type="button" onClick={addToList} disabled={!filled || missing.length > 0}>
                Добавить в список
              </Button>
            </div>
            <p role="status" className="text-xs font-mono text-title mt-3 min-h-[1rem]">{status}</p>
          </div>
        </div>

        {/* Saved list */}
        <section className="mt-8 pt-6 border-t border-chrome-shadow/40" aria-labelledby="gost-list-title">
          <h2 id="gost-list-title" className="font-display text-base text-ink mb-4">
            Ваш список литературы <span className="font-mono text-ink-soft">({list.length})</span>
          </h2>

          {list.length === 0 ? (
            <p className="text-sm text-ink-soft leading-[1.7]">
              Пока пусто. Добавьте первый источник кнопкой «Добавить в список». Список сохраняется в вашем браузере и никуда не отправляется.
            </p>
          ) : (
            <>
              <ol className="space-y-3">
                {list.map((entry, idx) => (
                  <li key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                    <p className="flex-1 min-w-0 text-[15px] text-ink leading-[1.7] break-words">
                      <span className="font-mono font-bold text-title">{idx + 1}.</span> {entry}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 self-start"
                      aria-label={`Удалить источник ${idx + 1}`}
                      onClick={() => setList((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Удалить
                    </Button>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => setList((prev) => sortEntries(prev))}>
                  Сортировать по алфавиту
                </Button>
                <Button type="button" onClick={() => onCopy(fullList, 'Список скопирован')}>
                  Скопировать весь список
                </Button>
                <Button type="button" variant="ghost" onClick={() => setList([])}>
                  Очистить список
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
