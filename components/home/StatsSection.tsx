'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

const STATS_BARS = [
  { label: 'Студентов сдали работы', value: 94, caption: '1000+ студентов' },
  { label: 'Время ответа', value: 72, caption: '≤ 30 мин' },
  { label: 'Довольных клиентов', value: 83 },
  { label: 'Часы работы', value: 61, caption: '09:00–23:00, ежедневно' },
]

function ProgressBar({
  label,
  value,
  caption,
  duration = 1500,
  delay = 0,
}: {
  label: string
  value: number
  caption?: string
  duration?: number
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-40px' })
  const reduceMotion = useReducedMotion()
  const [started, setStarted] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    if (reduceMotion) {
      setStarted(true)
      setCount(value)
      return
    }
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [isInView, reduceMotion, value, delay])

  useEffect(() => {
    if (!started || reduceMotion) return
    const steps = 14
    const stepDuration = duration / steps
    let cur = 0
    const iv = setInterval(() => {
      cur += 1
      setCount(Math.min(Math.round((cur / steps) * value), value))
      if (cur >= steps) clearInterval(iv)
    }, stepDuration)
    return () => clearInterval(iv)
  }, [started, duration, value, reduceMotion])

  const width = started ? value : 0

  return (
    <div ref={ref} className="flex flex-col gap-1.5 py-3 sm:py-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] sm:text-[14px] text-ink-soft">{label}</span>
        <span className="font-mono text-[16px] sm:text-[18px] font-bold text-title tabular-nums">{count}%</span>
      </div>
      <div
        className="bevel-in bg-paper h-[18px] sm:h-[20px] p-[2px]"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full"
          style={{
            width: `${width}%`,
            transitionProperty: 'width',
            transitionDuration: reduceMotion ? '0ms' : `${duration}ms`,
            transitionTimingFunction: 'steps(14, end)',
            backgroundImage:
              'repeating-linear-gradient(90deg, rgb(var(--title)) 0px, rgb(var(--title)) 8px, transparent 8px, transparent 10px)',
          }}
        />
      </div>
      {caption && <span className="text-[11px] text-ink-soft font-mono">{caption}</span>}
    </div>
  )
}

export function StatsSection() {
  return (
    <section className="bg-paper">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-14">
        <div className="window max-w-[680px] mx-auto">
          <div className="titlebar">
            <span className="truncate">Свойства: StudyAssist.exe</span>
            <div className="flex gap-1 shrink-0">
              <span className="titlebar-btn" aria-hidden="true">
                _
              </span>
              <span className="titlebar-btn" aria-hidden="true">
                □
              </span>
              <span className="titlebar-btn" aria-hidden="true">
                ×
              </span>
            </div>
          </div>
          <div className="px-5 sm:px-7 py-2 flex flex-col divide-y divide-chrome-shadow/20">
            {STATS_BARS.map((row, i) => (
              <ProgressBar key={row.label} label={row.label} value={row.value} caption={row.caption} delay={i * 150} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
