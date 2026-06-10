'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView } from 'framer-motion'

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-60px' })

  useEffect(() => {
    if (!isInView) return
    const duration = 1800
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
  {
    value: <Counter target={1000} suffix="+" />,
    label: 'студентов сдали работы',
  },
  {
    value: (
      <span>
        30
        <span className="text-[28px] font-sans font-normal tracking-normal leading-none">мин</span>
      </span>
    ),
    label: 'среднее время ответа',
  },
  {
    value: <Counter target={98} suffix="%" />,
    label: 'довольных клиентов',
  },
  {
    value: (
      <span>
        24
        <span className="text-[28px] font-sans font-normal tracking-normal leading-none">/7</span>
      </span>
    ),
    label: 'онлайн поддержка',
  },
]

export function StatsSection() {
  return (
    <div className="bg-[#0E0E1C] border-t border-b border-white/[.06]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`text-center py-4 px-4 md:px-8 ${
                i < stats.length - 1 ? 'border-r border-white/[.06]' : ''
              }`}
            >
              <div className="font-unbounded text-[clamp(36px,4.5vw,52px)] font-black text-[#C5FF45] tracking-[-2px] leading-none mb-2">
                {stat.value}
              </div>
              <div className="text-[13px] text-[#6A6A88] mt-2 leading-snug">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
