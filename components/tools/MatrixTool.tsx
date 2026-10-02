'use client'

import { useMemo, useState } from 'react'
import { Q, determinant, inverse, rank, solveSlae, type Matrix, type Step } from '@/lib/matrix'

export type MatrixOp = 'det' | 'inverse' | 'rank' | 'slae'

const SIZES = [2, 3, 4, 5, 6]

const EXAMPLES: Record<MatrixOp, string[][]> = {
  det: [['2', '-3', '1'], ['2', '0', '-1'], ['1', '4', '5']],
  inverse: [['2', '5', '7'], ['6', '3', '4'], ['5', '-2', '-3']],
  rank: [['1', '2', '3'], ['2', '4', '6'], ['1', '0', '1']],
  slae: [['2', '1', '-1', '8'], ['-3', '-1', '2', '-11'], ['-2', '1', '2', '-3']],
}

// Cells live in a fixed 6×7 store; changing the size only changes the visible part.
const blank = () => Array.from({ length: 6 }, () => Array<string>(7).fill(''))
const padded = (ex: string[][]) => blank().map((r, i) => r.map((v, j) => ex[i]?.[j] ?? v))

const cell =
  'field-95 w-14 sm:w-16 h-10 px-1 text-center text-sm font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-ink'

function MatrixView({ m, bar }: { m: Matrix; bar?: number }) {
  return (
    <div className="inline-block border-l-2 border-r-2 border-ink px-2 py-1 rounded-[3px] overflow-x-auto max-w-full align-middle">
      <table className="font-mono text-sm">
        <tbody>
          {m.map((row, i) => (
            <tr key={i}>
              {row.map((x, j) => (
                <td key={j} className={`px-2 py-0.5 text-right whitespace-nowrap ${bar !== undefined && j === bar ? 'border-l border-ink/60' : ''}`}>
                  {x.toString()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={i} className="flex flex-col gap-2">
          <p className="text-sm text-ink">
            <span className="font-mono text-ink-soft mr-2">Шаг {i}.</span>
            {s.op || 'Исходная матрица'}
          </p>
          <MatrixView m={s.m} bar={s.bar} />
        </li>
      ))}
    </ol>
  )
}

export function MatrixTool({ op }: { op: MatrixOp }) {
  const square = op === 'det' || op === 'inverse'
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  // For a system the matrix has one more column (right-hand side).
  const width = op === 'slae' ? cols + 1 : square ? rows : cols
  const [cells, setCells] = useState<string[][]>(() => padded(EXAMPLES[op]))
  const [solved, setSolved] = useState(false)

  const grid = useMemo(() => cells.slice(0, rows).map((r) => r.slice(0, width)), [cells, rows, width])

  const setCell = (i: number, j: number, v: string) => {
    setSolved(false)
    setCells((prev) => prev.map((r, ri) => (ri === i ? r.map((x, cj) => (cj === j ? v : x)) : r)))
  }

  const parsed = grid.map((r) => r.map((v) => (v.trim() === '' ? Q.of(0) : Q.parse(v))))
  const bad = parsed.some((r) => r.some((x) => x === null))
  const m = parsed as Matrix

  const result = useMemo(() => {
    if (!solved || bad) return null
    if (op === 'det') return { kind: 'det' as const, ...determinant(m) }
    if (op === 'inverse') return { kind: 'inverse' as const, ...inverse(m) }
    if (op === 'rank') return { kind: 'rank' as const, ...rank(m) }
    return { kind: 'slae' as const, ...solveSlae(m) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, bad, grid, op])

  const sizeSelect = (label: string, value: number, onChange: (v: number) => void) => (
    <label className="flex items-center gap-2 text-sm text-ink">
      {label}
      <select className="field-95 h-10 px-2 text-sm" value={value} onChange={(e) => { setSolved(false); onChange(Number(e.target.value)) }}>
        {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </label>
  )

  return (
    <div className="window" id="tool">
      <div className="titlebar">
        <span className="truncate">МАТРИЦЫ.EXE — StudyAssist</span>
        <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
          <span className="titlebar-btn">_</span>
          <span className="titlebar-btn">□</span>
          <span className="titlebar-btn">×</span>
        </div>
      </div>

      <div className="bg-paper p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          {square
            ? sizeSelect('Размер матрицы', rows, (v) => { setRows(v); setCols(v) })
            : op === 'slae'
              ? <>{sizeSelect('Уравнений', rows, setRows)}{sizeSelect('Неизвестных', cols, setCols)}</>
              : <>{sizeSelect('Строк', rows, setRows)}{sizeSelect('Столбцов', cols, setCols)}</>}
        </div>

        <div className="overflow-x-auto">
          {op === 'slae' && (
            <div className="flex gap-1 mb-1 font-mono text-xs text-ink-soft">
              {Array.from({ length: width }, (_, j) => (
                <span key={j} className={`w-14 sm:w-16 text-center ${j === cols ? 'ml-3' : ''}`}>{j < cols ? `x${j + 1}` : '='}</span>
              ))}
            </div>
          )}
          <div className="inline-flex flex-col gap-1">
            {grid.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((v, j) => (
                  <input
                    key={j}
                    aria-label={`Строка ${i + 1}, столбец ${j + 1}`}
                    inputMode="text"
                    className={`${cell} ${op === 'slae' && j === cols ? 'ml-3' : ''} ${v.trim() && Q.parse(v) === null ? 'text-danger' : ''}`}
                    value={v}
                    placeholder="0"
                    onChange={(e) => setCell(i, j, e.target.value)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-ink-soft">Целые числа, десятичные (1,5) и дроби (3/4). Пустая ячейка — это 0.</p>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-95-primary font-display text-[11px] h-10 px-5" onClick={() => setSolved(true)} disabled={bad}>
            Решить
          </button>
          <button type="button" className="btn-95 font-display text-[11px] h-10 px-4" onClick={() => { setSolved(false); setCells(blank()) }}>
            Очистить
          </button>
          <button type="button" className="btn-95 font-display text-[11px] h-10 px-4" onClick={() => {
            setSolved(false)
            const ex = EXAMPLES[op]
            setRows(ex.length); setCols(op === 'slae' ? ex[0].length - 1 : ex[0].length)
            setCells(padded(ex))
          }}>
            Пример
          </button>
        </div>
        {bad && <p role="alert" className="text-sm text-danger">В красных ячейках не число. Используйте, например, 5, −2, 1,5 или 3/4.</p>}

        {result && (
          <section aria-live="polite" className="space-y-5">
            <div className="field-95 p-4">
              <h2 className="font-display text-base text-ink mb-3 leading-[1.4]">Ответ</h2>
              {result.kind === 'det' && <p className="font-mono text-lg">det A = {result.value.toString()}</p>}
              {result.kind === 'rank' && <p className="font-mono text-lg">rang A = {result.value}</p>}
              {result.kind === 'inverse' && (result.value
                ? <div className="flex items-center gap-3 flex-wrap"><span className="font-mono text-lg">A⁻¹ =</span><MatrixView m={result.value} /></div>
                : <p className="text-base text-ink">Обратной матрицы не существует: матрица вырожденная (её определитель равен 0) — в левой части не получилось единичной матрицы.</p>)}
              {result.kind === 'slae' && (
                result.result.kind === 'unique'
                  ? <ul className="font-mono text-lg space-y-1">{result.result.x.map((x, i) => <li key={i}>x{i + 1} = {x.toString()}</li>)}</ul>
                  : result.result.kind === 'none'
                    ? <p className="text-base text-ink">Система несовместна — решений нет: ранг матрицы системы ({result.rankA}) меньше ранга расширенной матрицы ({result.rankAb}).</p>
                    : <div className="text-base text-ink space-y-2">
                        <p>Система имеет бесконечно много решений (ранг {result.rankA} меньше числа неизвестных {cols}). Общее решение:</p>
                        <ul className="font-mono space-y-1">{result.result.general.map((g) => <li key={g}>{g}</li>)}</ul>
                      </div>
              )}
              {result.kind === 'det' && <p className="text-sm text-ink-soft mt-3 leading-[1.6]">{result.explanation}</p>}
            </div>

            <div>
              <h2 className="font-display text-base text-ink mb-3 leading-[1.4]">Решение по шагам</h2>
              <p className="text-sm text-ink-soft mb-4 leading-[1.6]">
                R1, R2, … — строки матрицы. Запись «R2 = R2 − 3·R1» значит: из второй строки вычли первую, умноженную на 3.
                {op === 'inverse' && ' Справа от черты — единичная матрица, которая в конце превращается в обратную.'}
                {op === 'slae' && ' Справа от черты — столбец свободных членов.'}
              </p>
              <Steps steps={result.steps} />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
