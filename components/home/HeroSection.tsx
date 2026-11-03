'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

const STATUS_BARS = [
  { label: 'Время ответа', value: 72, caption: '≤ 30 мин' },
  { label: 'Часы работы', value: 61, caption: '09:00–23:00' },
  { label: 'Довольных клиентов', value: 83 },
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
    <div ref={ref} className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] text-ink-soft">{label}</span>
        <span className="font-mono text-[13px] font-bold text-title tabular-nums">{count}%</span>
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

export function HeroSection() {
  return (
    <section className="relative bg-desk dither border-b-2 border-chrome-shadow overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-16 md:pt-20 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16 items-start">
          {/* Left: headline */}
          <div>
            <span className="inline-flex items-center gap-2 btn-95 px-3 py-1 sm:py-1.5 text-[12px] font-mono font-semibold mb-4 sm:mb-7">
              <span className="w-1.5 h-1.5 bg-success" aria-hidden="true" />
              Более 1000 студентов уже сдали
            </span>

            <h1
              className="font-display text-paper leading-[1.35] mb-3 sm:mb-6 max-w-[16ch] break-words"
              style={{ fontSize: 'clamp(22px, 6vw, 40px)' }}
            >
              <span className="block">Дедлайн завтра?</span>
              <span className="block">Мы уже за компьютером.</span>
              <span
                className="block font-sans font-normal mt-2 sm:mt-3 max-w-[46ch]"
                style={{ fontSize: 'clamp(16px, 2.2vw, 26px)', lineHeight: 1.4 }}
              >
                Помощь с курсовой, дипломом, рефератом{' '}— разберёмся и подготовим работу вместе.
              </span>
            </h1>

            <p className="text-[17px] sm:text-[18px] text-paper leading-[1.55] max-w-[52ch] mb-4 sm:mb-9">
              Профильный специалист, ответ за 30 минут, консультация по задаче любой сложности.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="#order"
                className="btn-95-primary min-h-[44px] px-8 font-display text-[11px] inline-flex items-center"
              >
                Оставить заявку
              </Link>
              <Link href="#how-it-works" className="btn-95 min-h-[44px] px-8 font-display text-[11px] inline-flex items-center">
                Как это работает
              </Link>
            </div>
          </div>

          {/* Right: СТАТУС.EXE window card */}
          <div className="window w-full lg:sticky lg:top-24">
            <div className="titlebar">
              <span className="truncate">СТАТУС.EXE</span>
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
            <div className="p-5 sm:p-6 flex flex-col gap-4">
              {STATUS_BARS.map((row, i) => (
                <ProgressBar key={row.label} label={row.label} value={row.value} caption={row.caption} delay={i * 150} />
              ))}
              <Link
                href="#order"
                className="btn-95-primary min-h-[44px] px-4 font-display text-[11px] inline-flex items-center justify-center mt-1"
              >
                Написать сейчас →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
