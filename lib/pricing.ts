/**
 * Configurable Pricing Engine for StudyAssist
 *
 * Formula:
 *   price = basePrice[type] × subjectGroupCoef × deadlineCoef × complexityCoef
 *   then: clamp to minPrice, round, determine output format
 *
 * Output formats:
 *   "от X ₽"   — when description is absent or too short (low confidence)
 *   "X–Y ₽"   — range estimate with good description (medium/high confidence)
 *   "по договорённости" — type === 'other' or manual review trigger
 */

export type WorkType =
  | 'essay'
  | 'coursework'
  | 'diploma'
  | 'lab'
  | 'presentation'
  | 'practice-report'
  | 'uir'
  | 'other'

// ─── Base prices ──────────────────────────────────────────────────────────────

export const BASE_PRICES: Record<WorkType, number> = {
  essay: 1500,
  coursework: 5000,
  diploma: 20000,
  lab: 1500,
  presentation: 1500,
  'practice-report': 6000,
  uir: 9000,
  other: 0,
}

// ─── Subject groups ───────────────────────────────────────────────────────────

interface SubjectGroup {
  keywords: string[]
  coef: number
  label: string
}

export const SUBJECT_GROUPS: SubjectGroup[] = [
  {
    label: 'Программирование / ИТ',
    keywords: [
      'программирован', 'алгоритм', 'информатик', 'базы данных', 'база данных',
      'сеть', 'компьютер', 'web', 'javascript', 'python', 'java', 'c++', 'sql',
      'html', 'css', 'typescript', 'react', 'backend', 'frontend', 'devops',
    ],
    coef: 1.4,
  },
  {
    label: 'Математика / Физика',
    keywords: [
      'математик', 'алгебр', 'геометр', 'физик', 'механик', 'термодинамик',
      'электродинамик', 'оптик', 'квантов', 'статистик', 'теорвер', 'теория вероятности',
      'дифференциальн', 'интеграл', 'матанализ', 'линейная алгебра',
    ],
    coef: 1.3,
  },
  {
    label: 'Химия',
    keywords: ['хими', 'органическ', 'неорганическ', 'аналитическ', 'биохими'],
    coef: 1.25,
  },
  {
    label: 'Медицина / Биология',
    keywords: ['медицин', 'фармацевт', 'биолог', 'анатом', 'физиолог', 'патолог'],
    coef: 1.3,
  },
  {
    label: 'Право / Юриспруденция',
    keywords: ['право', 'юрид', 'закон', 'граждан', 'уголовн', 'конституц', 'арбитраж'],
    coef: 1.1,
  },
  {
    label: 'Экономика / Финансы',
    keywords: [
      'экономик', 'финанс', 'бухгалтер', 'налог', 'маркетинг', 'менеджмент',
      'управлени', 'логистик', 'аудит', 'инвестиц',
    ],
    coef: 1.0,
  },
  {
    label: 'Гуманитарные науки',
    keywords: ['история', 'философ', 'социолог', 'политолог', 'культурол', 'литература', 'языкознани'],
    coef: 0.9,
  },
  {
    label: 'Психология / Педагогика',
    keywords: ['психолог', 'педагог', 'социальн', 'коррекционн', 'логопед'],
    coef: 0.95,
  },
]

export function getSubjectCoef(subject: string): { coef: number; groupLabel?: string } {
  const lower = subject.toLowerCase()
  for (const group of SUBJECT_GROUPS) {
    if (group.keywords.some((k) => lower.includes(k))) {
      return { coef: group.coef, groupLabel: group.label }
    }
  }
  return { coef: 1.0 }
}

// ─── Deadline coefficient ─────────────────────────────────────────────────────

export function getDeadlineCoef(deadline: string): { coef: number; daysLeft: number } {
  // Parse as local calendar date to avoid timezone shifts
  const [year, month, day] = deadline.split('-').map(Number)
  const deadlineDay = new Date(year, month - 1, day)
  deadlineDay.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysLeft = Math.round((deadlineDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let coef = 1.0
  if (daysLeft <= 1) coef = 2.0
  else if (daysLeft <= 3) coef = 1.5
  else if (daysLeft <= 7) coef = 1.3
  else if (daysLeft <= 14) coef = 1.1
  return { coef, daysLeft }
}

// ─── Description heuristic parser ────────────────────────────────────────────

export interface DescriptionHints {
  /** Detected volume in pages */
  volume?: number
  hasChapters: boolean
  hasAntiPlagiat: boolean
  hasCalculations: boolean
  hasCode: boolean
  hasDrawings: boolean
  hasPresentation: boolean
  hasMethodology: boolean
  isUrgent: boolean
  /** Final complexity multiplier */
  complexityCoef: number
  /** Human-readable list of detected factors */
  detectedFactors: string[]
}

export function parseDescription(description: string): DescriptionHints {
  if (!description) {
    return {
      hasChapters: false,
      hasAntiPlagiat: false,
      hasCalculations: false,
      hasCode: false,
      hasDrawings: false,
      hasPresentation: false,
      hasMethodology: false,
      isUrgent: false,
      complexityCoef: 1.0,
      detectedFactors: [],
    }
  }

  const text = description.toLowerCase()
  const detectedFactors: string[] = []

  // Volume detection (no \b after Cyrillic — \b doesn't work with non-ASCII in JS)
  const volumeMatch = text.match(/(\d{1,3})\s*(?:страниц[аы]?|стр[. ]|листов|листа?(?:\s|$))/i)
  const volume = volumeMatch ? parseInt(volumeMatch[1]) : undefined

  const hasChapters = /\b(?:глав[аыеи]?|раздел[а-я]*|параграф[а-я]*|пункт[а-я]*)\b/i.test(text)
  const hasAntiPlagiat =
    /антиплагиат|антиплагиата|уникальност|оригинальност|plagiat|antiplagiat/i.test(text)
  const hasCalculations =
    /рассчит|расчёт|расчет|формул[аы]|вычислени|задач[аи]|решен(?:ие|ия|ий)/i.test(text)
  const hasCode =
    /\b(?:код|программ|скрипт|функци[яи]|алгоритм|python|java(?:script)?|c\+\+|sql|html|css|typescript|react|vue|node)\b/i.test(
      text,
    )
  const hasDrawings =
    /чертёж|чертеж|схем[аы]|граф[ик]|диаграмм|таблиц[аы]|рисун/i.test(text)
  const hasPresentation =
    /презентаци|слайд[а-я]*|powerpoint|\.pptx?\b/i.test(text)
  const hasMethodology =
    /методичк[аи]|методическ(?:их|ое|ие)|по методичк|согласно методичк/i.test(text)
  const isUrgent =
    /срочно(?:\s|,|$)|asap|быстро(?:\s|,|$)|сегодня(?:\s|,|$)|завтра(?:\s|,|$)|как можно скорее/i.test(text)

  // Compute complexity coefficient
  let complexityCoef = 1.0

  if (hasAntiPlagiat) {
    complexityCoef += 0.2
    detectedFactors.push('Антиплагиат +20%')
  }
  if (hasCalculations) {
    complexityCoef += 0.15
    detectedFactors.push('Расчёты / формулы +15%')
  }
  if (hasCode) {
    complexityCoef += 0.25
    detectedFactors.push('Написание кода +25%')
  }
  if (hasDrawings) {
    complexityCoef += 0.1
    detectedFactors.push('Схемы / чертежи +10%')
  }
  if (hasPresentation) {
    complexityCoef += 0.1
    detectedFactors.push('Создание презентации +10%')
  }
  if (hasMethodology) {
    complexityCoef += 0.05
    detectedFactors.push('По методичке +5%')
  }
  if (volume) {
    detectedFactors.push(`Объём: ~${volume} стр.`)
    if (volume > 50) {
      complexityCoef += 0.15
      detectedFactors.push('Большой объём (>50 стр.) +15%')
    } else if (volume > 30) {
      complexityCoef += 0.1
      detectedFactors.push('Объём >30 стр. +10%')
    }
  }

  return {
    volume,
    hasChapters,
    hasAntiPlagiat,
    hasCalculations,
    hasCode,
    hasDrawings,
    hasPresentation,
    hasMethodology,
    isUrgent,
    complexityCoef,
    detectedFactors,
  }
}

// ─── Price rounding ───────────────────────────────────────────────────────────

export function roundPrice(price: number): number {
  if (price < 1000) return Math.ceil(price / 100) * 100
  if (price < 5000) return Math.ceil(price / 500) * 500
  if (price < 20000) return Math.ceil(price / 1000) * 1000
  return Math.ceil(price / 5000) * 5000
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatRub(amount: number): string {
  return amount.toLocaleString('ru-RU') + '\u00a0₽'
}

// ─── Main estimate ────────────────────────────────────────────────────────────

export type PriceEstimateKind = 'from' | 'range' | 'manual'
export type PriceConfidence = 'low' | 'medium' | 'high'

export interface PriceEstimate {
  kind: PriceEstimateKind
  min: number
  max?: number
  /** Display label, e.g. "от 5 000 ₽" or "5 000–8 000 ₽" */
  label: string
  /** Individual factors that affected the price */
  flags: string[]
  confidence: PriceConfidence
  /** Serialisable snapshot for logging / DB */
  snapshot: {
    basePrice: number
    deadlineCoef: number
    subjectCoef: number
    complexityCoef: number
    daysLeft: number
  }
}

export interface PricingInput {
  type: WorkType
  subject: string
  deadline: string
  description?: string
  filesCount?: number
}

const MIN_PRICE = 500

export function calculateEstimate(input: PricingInput): PriceEstimate {
  const { type, subject, deadline, description = '', filesCount = 0 } = input

  // Other type → manual review
  if (type === 'other') {
    return {
      kind: 'manual',
      min: 0,
      label: 'по договорённости',
      flags: ['Нестандартный тип работы — цена определяется индивидуально'],
      confidence: 'low',
      snapshot: { basePrice: 0, deadlineCoef: 1, subjectCoef: 1, complexityCoef: 1, daysLeft: 0 },
    }
  }

  const basePrice = BASE_PRICES[type]
  const { coef: deadlineCoef, daysLeft } = getDeadlineCoef(deadline)
  const { coef: subjectCoef, groupLabel } = getSubjectCoef(subject)

  const flags: string[] = []

  if (deadlineCoef > 1.0) {
    const pct = Math.round((deadlineCoef - 1) * 100)
    flags.push(
      deadlineCoef >= 2.0
        ? `Срочность менее суток ×2`
        : `Срочность ${daysLeft} дн. +${pct}%`,
    )
  }
  if (subjectCoef !== 1.0 && groupLabel) {
    const pct = Math.round((subjectCoef - 1) * 100)
    flags.push(`${groupLabel}: ${pct >= 0 ? '+' : ''}${pct}%`)
  }

  // No or too-short description → "от X ₽" with low confidence
  const hasDescription = description.trim().length >= 50

  if (!hasDescription) {
    const rawMin = basePrice * deadlineCoef * subjectCoef
    const min = Math.max(roundPrice(rawMin), MIN_PRICE)
    return {
      kind: 'from',
      min,
      label: `от ${formatRub(min)}`,
      flags,
      confidence: 'low',
      snapshot: { basePrice, deadlineCoef, subjectCoef, complexityCoef: 1, daysLeft },
    }
  }

  const hints = parseDescription(description)
  const { complexityCoef, detectedFactors } = hints

  flags.push(...detectedFactors)
  if (filesCount > 0) {
    flags.push(`Прикреплено файлов: ${filesCount}`)
  }

  const rawPrice = basePrice * deadlineCoef * subjectCoef * complexityCoef

  // Range: lower bound = 85%, upper bound = 120%
  const minRaw = rawPrice * 0.85
  const maxRaw = rawPrice * 1.2
  const min = Math.max(roundPrice(minRaw), MIN_PRICE)
  const max = Math.max(roundPrice(maxRaw), min)

  const confidence: PriceConfidence =
    description.length > 200 ? 'high' : description.length > 100 ? 'medium' : 'low'

  // If spread is meaningful show range, else "от X ₽"
  if (max > min * 1.1) {
    return {
      kind: 'range',
      min,
      max,
      label: `${formatRub(min)}\u2009—\u2009${formatRub(max)}`,
      flags,
      confidence,
      snapshot: { basePrice, deadlineCoef, subjectCoef, complexityCoef, daysLeft },
    }
  }

  return {
    kind: 'from',
    min,
    label: `от ${formatRub(min)}`,
    flags,
    confidence,
    snapshot: { basePrice, deadlineCoef, subjectCoef, complexityCoef, daysLeft },
  }
}
