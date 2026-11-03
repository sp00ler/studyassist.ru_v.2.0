'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { analyzeDocx, checkDocument, NotDocxError, type Report, type Requirements } from '@/lib/docx-check'

const STORAGE_KEY = 'studyassist.docxcheck.req.v1'
const MAX_FILE = 30 * 1024 * 1024

type Fields = Record<
  'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft' | 'font' | 'size' | 'line' | 'indent' | 'align' | 'pageNumber',
  string
> & { noNumberOnTitle: boolean }

const EMPTY: Fields = {
  marginTop: '', marginRight: '', marginBottom: '', marginLeft: '',
  font: '', size: '', line: '', indent: '', align: '', pageNumber: '', noNumberOnTitle: false,
}

const input =
  'field-95 flex h-11 w-full px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink'

/** "1,5" and "1.5" both parse; empty or invalid means "do not check". */
function num(s: string): number | undefined {
  const v = parseFloat(s.replace(',', '.'))
  return Number.isFinite(v) && v > 0 ? v : undefined
}

function toRequirements(f: Fields): Requirements {
  return {
    marginTop: num(f.marginTop), marginRight: num(f.marginRight),
    marginBottom: num(f.marginBottom), marginLeft: num(f.marginLeft),
    font: f.font.trim() || undefined,
    size: num(f.size), line: num(f.line),
    indent: f.indent.trim() === '0' ? 0 : num(f.indent),
    align: (f.align || undefined) as Requirements['align'],
    pageNumber: (f.pageNumber || undefined) as Requirements['pageNumber'],
    noNumberOnTitle: f.noNumberOnTitle || undefined,
  }
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

export function DocxCheckTool() {
  const [f, setF] = useState<Fields>(EMPTY)
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<Report | null>(null)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastFile = useRef<File | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) setF({ ...EMPTY, ...JSON.parse(saved) })
    } catch {}
  }, [])

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setF((prev) => {
      const next = { ...prev, [k]: v }
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const run = async (file: File) => {
    lastFile.current = file
    setFileName(file.name)
    setError('')
    setReport(null)
    if (/\.doc$/i.test(file.name)) {
      setError('Это файл старого формата .doc. Откройте его в Word и сохраните как .docx: «Файл» → «Сохранить как» → «Документ Word (.docx)».')
      return
    }
    if (file.size > MAX_FILE) {
      setError('Файл больше 30 МБ. Чаще всего вес дают картинки — сожмите их в Word: выделите рисунок → «Формат рисунка» → «Сжать рисунки».')
      return
    }
    setBusy(true)
    try {
      const model = await analyzeDocx(await file.arrayBuffer())
      setReport(checkDocument(model, toRequirements(f)))
    } catch (e) {
      setError(
        e instanceof NotDocxError
          ? 'Не получилось прочитать файл как .docx. Возможно, это другой формат или документ защищён паролем. Сохраните его в Word как «Документ Word (.docx)» без пароля.'
          : 'Не получилось разобрать документ. Попробуйте пересохранить его в Word как .docx и проверить ещё раз.',
      )
    } finally {
      setBusy(false)
    }
  }

  const filled = Object.values(toRequirements(f)).some((v) => v !== undefined)
  const errors = report?.issues.filter((i) => i.severity === 'error').length ?? 0
  const warns = (report?.issues.length ?? 0) - errors
  const groups = report ? Array.from(new Set(report.issues.map((i) => i.group))) : []

  const numField = (k: keyof Fields, label: string, placeholder: string, unit: string) => (
    <div>
      <Label htmlFor={`dc-${k}`} className="mb-1.5 block text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input id={`dc-${k}`} inputMode="decimal" className={input} placeholder={placeholder}
          value={f[k] as string} onChange={(e) => set(k, e.target.value)} />
        <span className="text-xs text-ink-soft w-6 flex-shrink-0">{unit}</span>
      </div>
    </div>
  )

  return (
    <div className="window" id="tool">
      <div className="titlebar">
        <span className="truncate">НОРМОКОНТРОЛЬ.EXE — StudyAssist</span>
        <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
          <span className="titlebar-btn">_</span>
          <span className="titlebar-btn">□</span>
          <span className="titlebar-btn">×</span>
        </div>
      </div>

      <div className="bg-paper p-4 sm:p-6 space-y-6">
        <section aria-labelledby="dc-req">
          <h2 id="dc-req" className="font-display text-base text-ink mb-1 leading-[1.4]">1. Требования из вашей методички</h2>
          <p className="text-sm text-ink-soft leading-[1.6] mb-4 max-w-[70ch]">
            Заполните то, что указано в методичке. <strong>Пустое поле не проверяется.</strong> Серые цифры в полях — только пример.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {numField('marginLeft', 'Левое поле', '30', 'мм')}
            {numField('marginRight', 'Правое поле', '15', 'мм')}
            {numField('marginTop', 'Верхнее поле', '20', 'мм')}
            {numField('marginBottom', 'Нижнее поле', '20', 'мм')}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="col-span-2">
              <Label htmlFor="dc-font" className="mb-1.5 block text-xs">Шрифт основного текста</Label>
              <input id="dc-font" className={input} placeholder="Times New Roman" value={f.font} onChange={(e) => set('font', e.target.value)} />
            </div>
            {numField('size', 'Размер шрифта', '14', 'пт')}
            {numField('line', 'Межстрочный интервал', '1,5', '')}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {numField('indent', 'Абзацный отступ', '1,25', 'см')}
            <div>
              <Label htmlFor="dc-align" className="mb-1.5 block text-xs">Выравнивание текста</Label>
              <select id="dc-align" className={input} value={f.align} onChange={(e) => set('align', e.target.value)}>
                <option value="">не проверять</option>
                <option value="both">по ширине</option>
                <option value="left">по левому краю</option>
              </select>
            </div>
            <div>
              <Label htmlFor="dc-pn" className="mb-1.5 block text-xs">Номер страницы</Label>
              <select id="dc-pn" className={input} value={f.pageNumber} onChange={(e) => set('pageNumber', e.target.value)}>
                <option value="">не проверять</option>
                <option value="bottom">внизу</option>
                <option value="top">вверху</option>
              </select>
            </div>
            <label className="flex items-end gap-2 text-sm text-ink pb-2.5 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-[rgb(var(--title))]" checked={f.noNumberOnTitle}
                onChange={(e) => set('noNumberOnTitle', e.target.checked)} />
              Без номера на титульном
            </label>
          </div>
          {!filled && (
            <p className="text-xs text-ink-soft mt-3">
              Поля не заполнены — проверим только то, что ошибочно при любых требованиях: формат A4, пустые строки, отступы пробелами, двойные пробелы, заголовки без стиля.
            </p>
          )}
        </section>

        <section aria-labelledby="dc-file">
          <h2 id="dc-file" className="font-display text-base text-ink mb-3 leading-[1.4]">2. Ваша работа (.docx)</h2>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              const file = e.dataTransfer.files?.[0]
              if (file) run(file)
            }}
            className={`field-95 flex flex-col items-center justify-center text-center min-h-[140px] p-6 cursor-pointer transition-colors ${drag ? 'bg-title/10' : ''}`}
          >
            <p className="font-display text-sm text-ink mb-2">{busy ? 'Проверяю…' : fileName || 'Перетащите файл сюда или нажмите, чтобы выбрать'}</p>
            <p className="text-xs text-ink-soft">🔒 Файл не загружается на сервер — проверка идёт прямо в вашем браузере.</p>
          </div>
          <input ref={fileRef} type="file" accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) run(file); e.target.value = '' }} />
          {report && lastFile.current && (
            <button type="button" className="btn-95 font-display text-[11px] h-10 px-4 mt-3" onClick={() => run(lastFile.current!)}>
              Проверить заново с новыми требованиями
            </button>
          )}
        </section>

        {error && <p role="alert" className="field-95 p-4 text-sm text-danger leading-[1.6]">{error}</p>}

        {report && (
          <section aria-labelledby="dc-report" aria-live="polite">
            <h2 id="dc-report" className="font-display text-base text-ink mb-3 leading-[1.4]">3. Результат</h2>
            <div className="field-95 p-4 mb-4">
              {report.issues.length === 0 ? (
                <p className="text-base text-success font-bold">✓ Ошибок оформления не найдено</p>
              ) : (
                <p className="text-base text-ink">
                  {errors > 0 && <><strong className="text-danger">{errors} {plural(errors, 'ошибка', 'ошибки', 'ошибок')}</strong>{warns > 0 ? ' и ' : ''}</>}
                  {warns > 0 && <strong>{warns} {plural(warns, 'место', 'места', 'мест')} проверить вручную</strong>}
                </p>
              )}
              <p className="text-xs text-ink-soft mt-1">Проверено абзацев основного текста: {report.checkedParagraphs}.</p>
            </div>

            <div className="space-y-5">
              {groups.map((g) => (
                <div key={g}>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-[1.5px] text-ink-soft mb-2">{g}</h3>
                  <ul className="space-y-3">
                    {report.issues.filter((i) => i.group === g).map((i) => (
                      <li key={i.title} className="window">
                        <div className="bg-paper p-4">
                          <p className="text-[15px] text-ink leading-[1.6] font-bold">
                            <span className={i.severity === 'error' ? 'text-danger' : 'text-title'}>{i.severity === 'error' ? '✗ ' : '? '}</span>
                            {i.title}
                          </p>
                          {i.where.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-sm text-title cursor-pointer">
                                Где: {i.where.length}{i.where.length >= 30 ? '+' : ''} {plural(i.where.length, 'место', 'места', 'мест')} (найдите в Word через Ctrl+F)
                              </summary>
                              <ul className="mt-2 space-y-1 text-sm text-ink-soft leading-[1.5] list-disc pl-5">
                                {i.where.map((w) => <li key={w} className="break-words">«{w}»</li>)}
                              </ul>
                            </details>
                          )}
                          <p className="text-sm text-ink-soft leading-[1.6] mt-2"><strong>Как исправить:</strong> {i.howTo}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {report.notes.length > 0 && (
              <ul className="mt-4 text-xs text-ink-soft space-y-1 list-disc pl-5">
                {report.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            )}

            <div className="window mt-6">
              <div className="bg-paper p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-ink leading-[1.7]">
                  {report.issues.length > 0 ? 'Не хотите исправлять сами? Поможем привести оформление в порядок по вашей методичке.' : 'Начинаете новую работу? Возьмите шаблон, в котором оформление уже настроено.'}
                </p>
                <Link href={report.issues.length > 0 ? '/tseny' : '/gid/shablon-word-po-gostu'} className="btn-95-primary font-display text-[11px] h-10 px-4 inline-flex items-center flex-shrink-0">
                  {report.issues.length > 0 ? 'Помощь с оформлением' : 'Шаблон Word'}
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
