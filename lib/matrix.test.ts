import { describe, expect, it } from 'vitest'
import { Q, determinant, inverse, rank, solveSlae, type Matrix } from './matrix'

const M = (rows: (number | string)[][]): Matrix => rows.map((r) => r.map((v) => (typeof v === 'number' ? Q.of(v) : Q.parse(v)!)))
const S = (m: Matrix) => m.map((r) => r.map(String))

describe('Q', () => {
  it('parses integers, decimals with comma or dot and fractions', () => {
    expect(String(Q.parse('3'))).toBe('3')
    expect(String(Q.parse('1,5'))).toBe('3/2')
    expect(String(Q.parse('-0.25'))).toBe('−1/4')
    expect(String(Q.parse('6/4'))).toBe('3/2')
    expect(Q.parse('abc')).toBeNull()
    expect(Q.parse('1/0')).toBeNull()
    expect(Q.parse('')).toBeNull()
  })
  it('keeps arithmetic exact', () => {
    expect(String(Q.parse('1/3')!.add(Q.parse('1/6')!))).toBe('1/2')
  })
})

describe('determinant', () => {
  it('2×2 and 3×3', () => {
    expect(String(determinant(M([[1, 2], [3, 4]])).value)).toBe('−2')
    expect(String(determinant(M([[2, -3, 1], [2, 0, -1], [1, 4, 5]])).value)).toBe('49')
  })
  it('accounts for row swaps and singular matrices', () => {
    expect(String(determinant(M([[0, 1], [1, 0]])).value)).toBe('−1')
    expect(String(determinant(M([[1, 2], [2, 4]])).value)).toBe('0')
  })
  it('records steps starting with the original matrix', () => {
    const { steps } = determinant(M([[1, 2], [3, 4]]))
    expect(steps[0].op).toBe('')
    expect(steps[1].op).toBe('R2 = R2 − 3·R1')
  })
})

describe('inverse', () => {
  it('returns an exact inverse', () => {
    expect(S(inverse(M([[2, 1], [7, 4]])).value!)).toEqual([['4', '−1'], ['−7', '2']])
    expect(S(inverse(M([[1, 2], [3, 4]])).value!)).toEqual([['−2', '1'], ['3/2', '−1/2']])
  })
  it('null for a singular matrix', () => {
    expect(inverse(M([[1, 2], [2, 4]])).value).toBeNull()
  })
})

describe('rank', () => {
  it('works for rectangular matrices', () => {
    expect(rank(M([[1, 2, 3], [2, 4, 6]])).value).toBe(1)
    expect(rank(M([[1, 0], [0, 1], [1, 1]])).value).toBe(2)
  })
})

describe('solveSlae', () => {
  it('unique solution', () => {
    const r = solveSlae(M([[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]])).result
    expect(r.kind).toBe('unique')
    if (r.kind === 'unique') expect(r.x.map(String)).toEqual(['2', '3', '−1'])
  })
  it('no solution', () => {
    const r = solveSlae(M([[1, 1, 2], [1, 1, 3]]))
    expect(r.result.kind).toBe('none')
    expect([r.rankA, r.rankAb]).toEqual([1, 2])
  })
  it('infinitely many solutions in terms of free variables', () => {
    const r = solveSlae(M([[1, 2, -1, 3], [2, 4, -2, 6]])).result
    expect(r.kind).toBe('infinite')
    if (r.kind === 'infinite') expect(r.general).toEqual(['x1 = 3 − 2x2 + x3', 'x2 — любое число', 'x3 — любое число'])
  })
})
