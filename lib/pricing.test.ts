/// <reference types="vitest/globals" />
/**
 * Pricing engine unit tests
 * Run with:  npm test
 *       or:  npx vitest run lib/pricing.test.ts
 */

import {
  calculateEstimate,
  getDeadlineCoef,
  getSubjectCoef,
  parseDescription,
  roundPrice,
  formatRub,
  BASE_PRICES,
} from './pricing'

// ─── helpers ──────────────────────────────────────────────────────────────────

function futureDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

// ─── roundPrice ───────────────────────────────────────────────────────────────

describe('roundPrice', () => {
  test('< 1000 rounds to nearest 100', () => {
    expect(roundPrice(850)).toBe(900)
    expect(roundPrice(701)).toBe(800)
    expect(roundPrice(500)).toBe(500)
  })

  test('1000–4999 rounds to nearest 500', () => {
    expect(roundPrice(1200)).toBe(1500)
    expect(roundPrice(3001)).toBe(3500)
    expect(roundPrice(4500)).toBe(4500)
  })

  test('5000–19999 rounds to nearest 1000', () => {
    expect(roundPrice(5100)).toBe(6000)
    expect(roundPrice(7001)).toBe(8000)
    expect(roundPrice(15000)).toBe(15000)
  })

  test('>= 20000 rounds to nearest 5000', () => {
    expect(roundPrice(20001)).toBe(25000)
    expect(roundPrice(25000)).toBe(25000)
  })
})

// ─── formatRub ────────────────────────────────────────────────────────────────

describe('formatRub', () => {
  test('formats with non-breaking space and ₽', () => {
    const result = formatRub(5000)
    expect(result).toContain('₽')
    expect(result).toContain('5')
  })
})

// ─── getDeadlineCoef ──────────────────────────────────────────────────────────

describe('getDeadlineCoef', () => {
  test('returns ×2.0 for 1 day', () => {
    expect(getDeadlineCoef(futureDate(1)).coef).toBe(2.0)
  })

  test('returns ×1.5 for 3 days', () => {
    expect(getDeadlineCoef(futureDate(3)).coef).toBe(1.5)
  })

  test('returns ×1.3 for 7 days', () => {
    expect(getDeadlineCoef(futureDate(7)).coef).toBe(1.3)
  })

  test('returns ×1.1 for 14 days', () => {
    expect(getDeadlineCoef(futureDate(14)).coef).toBe(1.1)
  })

  test('returns ×1.0 for 30 days', () => {
    expect(getDeadlineCoef(futureDate(30)).coef).toBe(1.0)
  })

  test('daysLeft is returned correctly', () => {
    const { daysLeft } = getDeadlineCoef(futureDate(10))
    expect(daysLeft).toBeGreaterThanOrEqual(9)
    expect(daysLeft).toBeLessThanOrEqual(11)
  })
})

// ─── getSubjectCoef ───────────────────────────────────────────────────────────

describe('getSubjectCoef', () => {
  test('programming subjects get higher coef', () => {
    expect(getSubjectCoef('Python и базы данных').coef).toBe(1.4)
    expect(getSubjectCoef('программирование на Java').coef).toBe(1.4)
  })

  test('math/physics subjects get 1.3', () => {
    expect(getSubjectCoef('Высшая математика').coef).toBe(1.3)
    expect(getSubjectCoef('Физика — электродинамика').coef).toBe(1.3)
  })

  test('humanities get 0.9', () => {
    expect(getSubjectCoef('История России').coef).toBe(0.9)
    expect(getSubjectCoef('Философия').coef).toBe(0.9)
  })

  test('economics get 1.0', () => {
    expect(getSubjectCoef('Экономика организации').coef).toBe(1.0)
  })

  test('unknown subject defaults to 1.0', () => {
    expect(getSubjectCoef('Астрология и эзотерика').coef).toBe(1.0)
  })
})

// ─── parseDescription ────────────────────────────────────────────────────────

describe('parseDescription', () => {
  test('returns defaults for empty string', () => {
    const h = parseDescription('')
    expect(h.complexityCoef).toBe(1.0)
    expect(h.detectedFactors).toHaveLength(0)
  })

  test('detects anti-plagiarism', () => {
    const h = parseDescription('нужен антиплагиат не менее 80%')
    expect(h.hasAntiPlagiat).toBe(true)
    expect(h.complexityCoef).toBeGreaterThan(1.0)
    expect(h.detectedFactors.some((f) => f.toLowerCase().includes('антиплагиат'))).toBe(true)
  })

  test('detects calculations', () => {
    const h = parseDescription('есть расчёты и формулы')
    expect(h.hasCalculations).toBe(true)
  })

  test('detects code', () => {
    const h = parseDescription('написать программу на Python, код должен работать')
    expect(h.hasCode).toBe(true)
    expect(h.complexityCoef).toBeGreaterThanOrEqual(1.25)
  })

  test('detects volume', () => {
    const h = parseDescription('работа на 40 страниц')
    expect(h.volume).toBe(40)
    expect(h.detectedFactors.some((f) => f.includes('40'))).toBe(true)
  })

  test('large volume (>50 pages) adds extra coefficient', () => {
    const h = parseDescription('работа на 60 страниц')
    expect(h.volume).toBe(60)
    expect(h.complexityCoef).toBeGreaterThan(1.1)
  })

  test('detects methodology mention', () => {
    const h = parseDescription('нужно выполнить строго по методичке кафедры')
    expect(h.hasMethodology).toBe(true)
  })

  test('detects urgency', () => {
    const h = parseDescription('срочно, нужно сегодня')
    expect(h.isUrgent).toBe(true)
  })

  test('multiple factors stack up', () => {
    const h = parseDescription('нужен антиплагиат, расчёты, код на Python, 55 страниц')
    expect(h.complexityCoef).toBeGreaterThan(1.5)
  })
})

// ─── calculateEstimate ───────────────────────────────────────────────────────

describe('calculateEstimate', () => {
  test('"other" type returns manual review', () => {
    const est = calculateEstimate({
      type: 'other',
      subject: 'Что-то нестандартное',
      deadline: futureDate(14),
    })
    expect(est.kind).toBe('manual')
    expect(est.label).toBe('по договорённости')
  })

  test('returns "from" price when no description provided', () => {
    const est = calculateEstimate({
      type: 'essay',
      subject: 'История',
      deadline: futureDate(14),
    })
    expect(est.kind).toBe('from')
    expect(est.min).toBeGreaterThan(0)
    expect(est.confidence).toBe('low')
  })

  test('returns "from" price when description is too short', () => {
    const est = calculateEstimate({
      type: 'coursework',
      subject: 'Экономика',
      deadline: futureDate(14),
      description: 'Короткий текст',
    })
    expect(est.kind).toBe('from')
  })

  test('diploma base price is 20000', () => {
    expect(BASE_PRICES['diploma']).toBe(20000)
    const est = calculateEstimate({
      type: 'diploma',
      subject: 'Математика',
      deadline: futureDate(30),
    })
    expect(est.min).toBeGreaterThanOrEqual(20000)
  })

  test('urgent deadline increases the minimum price', () => {
    const normal = calculateEstimate({
      type: 'essay',
      subject: 'История',
      deadline: futureDate(30),
    })
    const urgent = calculateEstimate({
      type: 'essay',
      subject: 'История',
      deadline: futureDate(1),
    })
    expect(urgent.min).toBeGreaterThan(normal.min)
  })

  test('technical subject increases price vs humanities', () => {
    const humanities = calculateEstimate({
      type: 'coursework',
      subject: 'История России',
      deadline: futureDate(20),
    })
    const technical = calculateEstimate({
      type: 'coursework',
      subject: 'Программирование на Python',
      deadline: futureDate(20),
    })
    expect(technical.min).toBeGreaterThan(humanities.min)
  })

  test('description with anti-plagiat increases price', () => {
    const withoutAP = calculateEstimate({
      type: 'coursework',
      subject: 'Экономика',
      deadline: futureDate(14),
      description:
        'Напишите курсовую работу по теме управление персоналом. Необходима грамотная структура: введение, основная часть, заключение. Тема актуальна для современного бизнеса.',
    })
    const withAP = calculateEstimate({
      type: 'coursework',
      subject: 'Экономика',
      deadline: futureDate(14),
      description:
        'Напишите курсовую работу по теме управление персоналом. Необходима грамотная структура: введение, основная часть, заключение. Нужен антиплагиат не менее 80%.',
    })
    expect(withAP.min).toBeGreaterThan(withoutAP.min)
  })

  test('min price is never below MIN_PRICE', () => {
    const est = calculateEstimate({
      type: 'essay',
      subject: 'История',
      deadline: futureDate(30),
    })
    expect(est.min).toBeGreaterThanOrEqual(500)
  })

  test('range estimate has max >= min', () => {
    const est = calculateEstimate({
      type: 'coursework',
      subject: 'Высшая математика, расчёты',
      deadline: futureDate(5),
      description:
        'Курсовая работа по теме численные методы. Нужны расчёты, формулы, написание кода на Python. Антиплагиат 75%. Объём около 35 страниц. Строго по методичке кафедры.',
    })
    if (est.kind === 'range') {
      expect(est.max).toBeDefined()
      expect(est.max!).toBeGreaterThanOrEqual(est.min)
    }
  })

  test('snapshot includes all coefficients', () => {
    const est = calculateEstimate({
      type: 'coursework',
      subject: 'Математика',
      deadline: futureDate(14),
    })
    expect(est.snapshot.basePrice).toBe(5000)
    expect(est.snapshot.deadlineCoef).toBe(1.1)
    expect(est.snapshot.subjectCoef).toBe(1.3)
  })

  test('filesCount is reflected in flags', () => {
    const est = calculateEstimate({
      type: 'essay',
      subject: 'История',
      deadline: futureDate(14),
      description:
        'Напишите реферат на тему Первая мировая война. Необходима структура: введение, основная часть с двумя разделами, заключение, список литературы минимум 10 источников.',
      filesCount: 3,
    })
    expect(est.flags.some((f) => f.includes('3'))).toBe(true)
  })
})
