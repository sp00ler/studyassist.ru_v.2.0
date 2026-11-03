// Exact matrix arithmetic for the step-by-step calculators: rationals on BigInt
// (so 1/3 stays 1/3), Gaussian elimination that records every row operation.
// BigInt(...) instead of 0n literals: the project's TS target predates ES2020.

const ZERO = BigInt(0)
const ONE = BigInt(1)

function gcd(a: bigint, b: bigint): bigint {
  a = a < ZERO ? -a : a
  b = b < ZERO ? -b : b
  while (b !== ZERO) [a, b] = [b, a % b]
  return a
}

export class Q {
  readonly n: bigint
  readonly d: bigint

  constructor(n: bigint, d: bigint = ONE) {
    if (d === ZERO) throw new Error('division by zero')
    if (d < ZERO) { n = -n; d = -d }
    const g = gcd(n, d) || ONE
    this.n = n / g
    this.d = d / g
  }

  static of(v: number | bigint) { return new Q(BigInt(v)) }

  /** "3", "-2", "1,5", "0.25", "3/4", "-7/2". Returns null for anything else. */
  static parse(raw: string): Q | null {
    const s = raw.trim().replace(',', '.').replace(/^\+/, '').replace('−', '-')
    if (s === '' || s === '-') return null
    let m = /^(-?\d+)\/(\d+)$/.exec(s)
    if (m) return m[2] === '0' || /^0+$/.test(m[2]) ? null : new Q(BigInt(m[1]), BigInt(m[2]))
    m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(s)
    if (!m || (m[2] === '' && !m[3])) return null
    const frac = m[3] ?? ''
    const n = BigInt((m[2] || '0') + frac) * (m[1] ? -ONE : ONE)
    return new Q(n, BigInt('1' + '0'.repeat(frac.length)))
  }

  add(o: Q) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d) }
  sub(o: Q) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d) }
  mul(o: Q) { return new Q(this.n * o.n, this.d * o.d) }
  div(o: Q) { return new Q(this.n * o.d, this.d * o.n) }
  neg() { return new Q(-this.n, this.d) }
  isZero() { return this.n === ZERO }
  isOne() { return this.n === ONE && this.d === ONE }
  eq(o: Q) { return this.n === o.n && this.d === o.d }

  toString() {
    const s = this.d === ONE ? this.n.toString() : `${this.n}/${this.d}`
    return s.replace('-', '−')
  }
}

export type Matrix = Q[][]

export interface Step {
  /** What was done, e.g. "R2 = R2 − 3·R1". Empty for the starting matrix. */
  op: string
  m: Matrix
  /** Columns before the augmented bar (undefined = no bar). */
  bar?: number
}

const clone = (m: Matrix): Matrix => m.map((r) => r.slice())

/** "3·R1", "1/2·R1", "R1" */
function coefText(k: Q, row: number): string {
  return k.isOne() ? `R${row + 1}` : `${k.d === ONE ? k.toString() : `(${k})`}·R${row + 1}`
}

interface EliminationResult {
  steps: Step[]
  m: Matrix
  swaps: number
  /** Pivot column for each pivot row, in order. */
  pivots: number[]
}

/**
 * Row reduction over the first `cols` columns (the rest is carried along, e.g.
 * the right-hand side or the identity block). `jordan` also clears entries
 * above pivots and scales pivots to 1 (reduced row echelon form).
 */
function eliminate(start: Matrix, cols: number, jordan: boolean, bar?: number): EliminationResult {
  const m = clone(start)
  const steps: Step[] = [{ op: '', m: clone(m), bar }]
  const rows = m.length
  const pivots: number[] = []
  let swaps = 0
  let r = 0
  for (let c = 0; c < cols && r < rows; c++) {
    let p = r
    while (p < rows && m[p][c].isZero()) p++
    if (p === rows) continue
    if (p !== r) {
      ;[m[p], m[r]] = [m[r], m[p]]
      swaps++
      steps.push({ op: `Меняем местами строки R${r + 1} и R${p + 1}`, m: clone(m), bar })
    }
    if (jordan && !m[r][c].isOne()) {
      const k = m[r][c]
      m[r] = m[r].map((x) => x.div(k))
      steps.push({ op: `R${r + 1} = R${r + 1} : ${k.d === ONE ? k.toString() : `(${k})`}`, m: clone(m), bar })
    }
    const ops: string[] = []
    for (let i = jordan ? 0 : r + 1; i < rows; i++) {
      if (i === r || m[i][c].isZero()) continue
      const k = m[i][c].div(m[r][c])
      m[i] = m[i].map((x, j) => x.sub(k.mul(m[r][j])))
      ops.push(k.n > ZERO ? `R${i + 1} = R${i + 1} − ${coefText(k, r)}` : `R${i + 1} = R${i + 1} + ${coefText(k.neg(), r)}`)
    }
    if (ops.length) steps.push({ op: ops.join('; '), m: clone(m), bar })
    pivots.push(c)
    r++
  }
  return { steps, m, swaps, pivots }
}

export function determinant(a: Matrix): { value: Q; steps: Step[]; explanation: string } {
  const n = a.length
  const { steps, m, swaps, pivots } = eliminate(a, n, false)
  if (pivots.length < n) {
    return { value: Q.of(0), steps, explanation: 'После приведения к ступенчатому виду на диагонали появился ноль (строка из нулей), поэтому определитель равен 0.' }
  }
  let value = Q.of(swaps % 2 ? -1 : 1)
  for (let i = 0; i < n; i++) value = value.mul(m[i][i])
  const diag = m.map((row, i) => (row[i].d === ONE && row[i].n >= ZERO ? row[i].toString() : `(${row[i]})`)).join(' · ')
  const sign = swaps % 2 ? `Строки меняли местами ${swaps} раз — нечётное число, поэтому знак меняется: ` : swaps ? `Строки меняли местами ${swaps} раза — чётное число, знак не меняется. ` : ''
  return {
    value,
    steps,
    explanation: `Матрица приведена к треугольному виду. Определитель равен произведению элементов главной диагонали. ${sign}det = ${swaps % 2 ? '−' : ''}${diag} = ${value}.`,
  }
}

export function inverse(a: Matrix): { value: Matrix | null; steps: Step[] } {
  const n = a.length
  const aug = a.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => Q.of(i === j ? 1 : 0))])
  const { steps, m, pivots } = eliminate(aug, n, true, n)
  if (pivots.length < n) return { value: null, steps }
  return { value: m.map((row) => row.slice(n)), steps }
}

export function rank(a: Matrix): { value: number; steps: Step[] } {
  const { steps, pivots } = eliminate(a, a[0].length, false)
  return { value: pivots.length, steps }
}

export type SlaeResult =
  | { kind: 'unique'; x: Q[] }
  | { kind: 'none' }
  | { kind: 'infinite'; /** x_i = expression in free variables */ general: string[]; free: number[] }

/** Solves A·x = b by Gauss–Jordan. `ab` is the augmented matrix [A | b]. */
export function solveSlae(ab: Matrix): { result: SlaeResult; steps: Step[]; rankA: number; rankAb: number } {
  const vars = ab[0].length - 1
  const { steps, m, pivots } = eliminate(ab, vars, true, vars)
  const rankA = pivots.length
  const inconsistent = m.some((row) => row.slice(0, vars).every((x) => x.isZero()) && !row[vars].isZero())
  const rankAb = rankA + (inconsistent ? 1 : 0)
  if (inconsistent) return { result: { kind: 'none' }, steps, rankA, rankAb }
  if (rankA === vars) return { result: { kind: 'unique', x: pivots.map((_, i) => m[i][vars]) }, steps, rankA, rankAb }

  const free = Array.from({ length: vars }, (_, j) => j).filter((j) => !pivots.includes(j))
  const general = Array.from({ length: vars }, (_, j) => {
    if (free.includes(j)) return `x${j + 1} — любое число`
    const i = pivots.indexOf(j)
    let expr = m[i][vars].isZero() ? '' : m[i][vars].toString()
    for (const f of free) {
      const k = m[i][f].neg()
      if (k.isZero()) continue
      const abs = k.n < ZERO ? k.neg() : k
      const term = `${abs.isOne() ? '' : abs.d === ONE ? abs.toString() : `(${abs})`}x${f + 1}`
      expr = expr ? `${expr} ${k.n < ZERO ? '−' : '+'} ${term}` : `${k.n < ZERO ? '−' : ''}${term}`
    }
    return `x${j + 1} = ${expr || '0'}`
  })
  return { result: { kind: 'infinite', general, free }, steps, rankA, rankAb }
}
