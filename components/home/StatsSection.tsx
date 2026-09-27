'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-60px' })
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!isInView) return
    if (reduceMotion) {
      setCount(target)
      return
    }
    const duration = 1200
    const steps = duration / 16
    const increment = target / steps
    let cur = 0
    const iv = setInterval(() => {
      cur = Math.min(cur + increment, target)
      setCount(Math.floor(cur))
      if (cur >= target) clearInterval(iv)
    }, 16)
    return () => clearInterval(iv)
  }, [isInView, target])

  return <span ref={ref}>{count}{suffix}</span>
}

const stats = [
  { value: <Counter target={1000} suffix="+" />, label: 'студентов сдали работы' },
  { value: '30 мин', label: 'среднее время ответа' },
  { value: <Counter target={98} suffix="%" />, label: 'довольных клиентов' },
  { value: '09:00–23:00', label: 'на связи ежедневно' },
]

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
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between gap-4 py-3 sm:py-3.5">
                <span className="text-[13px] sm:text-[14px] text-ink-soft">{stat.label}</span>
                <span className="font-mono text-[18px] sm:text-[22px] font-bold text-title tabular-nums whitespace-nowrap">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
