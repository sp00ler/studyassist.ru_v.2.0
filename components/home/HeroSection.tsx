'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MagneticButton } from '@/components/MagneticButton'
import { useTextScramble } from '@/hooks/useTextScramble'

export function HeroSection() {
  const [time, setTime] = useState('--:--:--')
  const [mounted, setMounted] = useState(false)
  const line1 = useTextScramble('ДЕДЛАЙН', 600)
  const line2 = useTextScramble('ЗАВТРА?', 800)

  useEffect(() => {
    setMounted(true)
    const tick = () => {
      const n = new Date()
      const pad = (x: number) => String(x).padStart(2, '0')
      setTime(`${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated orbs */}
      <div
        className="absolute rounded-full pointer-events-none animate-orb"
        style={{
          width: 800, height: 800,
          background: 'radial-gradient(circle, rgba(124,58,237,.14) 0%, transparent 70%)',
          top: -260, right: -160,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none animate-orb-reverse"
        style={{
          width: 560, height: 560,
          background: 'radial-gradient(circle, rgba(197,255,69,.07) 0%, transparent 70%)',
          bottom: -80, left: 60,
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 60% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 60% 50%, black 30%, transparent 100%)',
        }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-16 items-center">

          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5FF45]/10 border border-[#C5FF45]/[.18] text-[#C5FF45] text-[11px] font-bold uppercase tracking-[.8px] mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF45] animate-blink" />
                Более 1000 студентов уже сдали
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-unbounded font-black leading-[.93] tracking-[-3px] mb-7"
              style={{ fontSize: 'clamp(52px, 8.5vw, 100px)' }}
            >
              <span className="block text-[#F0F0EC]">{line1}</span>
              <span className="block text-[#C5FF45]">{line2}</span>
              <span
                className="block text-[#6A6A88] font-normal tracking-[-1px]"
                style={{ fontSize: 'clamp(20px, 3.2vw, 42px)' }}
              >
                Мы уже работаем.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[17px] text-[#6A6A88] max-w-[480px] leading-[1.75] mb-10"
            >
              От реферата до диплома — профильный специалист,{' '}
              ответ за 30 минут, работа любой сложности.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <MagneticButton>
                <Link
                  href="#order"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C5FF45] text-[#07070E] font-black font-unbounded text-[13px] tracking-[-0.2px] hover:bg-[#D4FF60] hover:shadow-[0_14px_36px_rgba(197,255,69,.28)] hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as Window & { ym?: Function }).ym) {
                      (window as Window & { ym?: Function }).ym?.(
                        process.env.NEXT_PUBLIC_METRIKA_ID,
                        'reachGoal',
                        'hero_cta_click'
                      )
                    }
                  }}
                >
                  Оставить заявку
                  <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </MagneticButton>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-transparent text-[#F0F0EC] border border-white/10 font-bold font-unbounded text-[13px] hover:border-white/20 hover:bg-white/5 transition-all duration-200"
              >
                Как это работает
              </Link>
            </motion.div>
          </div>

          {/* Right: live panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-[#0E0E1C] border border-white/[.06] rounded-3xl p-5 sm:p-8 flex flex-col gap-6"
          >
            <div className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-[#6A6A88]">
              // Сейчас на связи
            </div>

            <div className="font-mono font-bold text-[#C5FF45] tracking-[-2px] leading-none"
              style={{ fontSize: 'clamp(36px, 9vw, 52px)' }}>
              {mounted ? time : '--:--:--'}
            </div>

            <div className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full bg-[#C5FF45]/10 border border-[#C5FF45]/[.18] text-[#C5FF45] text-[12px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF45] animate-blink" />
              Эксперты онлайн
            </div>

            <div className="h-px bg-white/[.06]" />

            <div className="space-y-3.5">
              {[
                { label: 'Время ответа',       value: '≤ 30 мин' },
                { label: 'Время работы',        value: '09:00–23:00' },
                { label: 'Довольных клиентов',  value: '98%' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-[13px] text-[#6A6A88]">{stat.label}</span>
                  <span className="font-mono text-[15px] font-bold text-[#C5FF45]">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="h-px bg-white/[.06]" />

            <Link
              href="#order"
              className="flex items-center justify-center px-6 py-3.5 rounded-full bg-[#C5FF45] text-[#07070E] font-black font-unbounded text-[12px] tracking-[-0.2px] hover:bg-[#D4FF60] hover:shadow-[0_8px_28px_rgba(197,255,69,.28)] transition-all duration-200"
            >
              Написать прямо сейчас
            </Link>
          </motion.div>

        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#07070E] to-transparent pointer-events-none" />
    </section>
  )
}
