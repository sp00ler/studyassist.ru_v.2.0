'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Zap, Lock } from 'lucide-react'

const trustBadges = [
  { icon: Zap, text: 'Ответ за 30 минут' },
  { icon: CheckCircle, text: 'Оплата после согласования' },
  { icon: Lock, text: 'Конфиденциально' },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6C3EF4] rounded-full blur-[128px] opacity-20 animate-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#3B82F6] rounded-full blur-[128px] opacity-15 animate-glow" style={{ animationDelay: '1.5s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6C3EF4]/20 border border-[#6C3EF4]/30 text-[#A78BFA] text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-[#6C3EF4] animate-pulse" />
                ✦ Более 1000 студентов уже сдали то, что откладывали
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Дедлайн завтра,{' '}
              <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
                а ты ещё
              </span>
              {' '}не начал?
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg text-white/60 leading-relaxed mb-8 max-w-xl"
            >
              Разберём тему, подберём материалы, поможем структурировать всё по уму.
              Пока другие часами ищут ответы — ты уже получаешь результат.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              <Link href="#order">
                <Button
                  size="xl"
                  className="shadow-[0_0_30px_rgba(108,62,244,0.4)] hover:shadow-[0_0_50px_rgba(108,62,244,0.6)]"
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as Window & { ym?: Function }).ym) {
                      (window as Window & { ym?: Function }).ym?.(process.env.NEXT_PUBLIC_METRIKA_ID, 'reachGoal', 'hero_cta_click')
                    }
                  }}
                >
                  Получить помощь сейчас
                </Button>
              </Link>
              <Link href="#pricing">
                <Button variant="outline" size="xl">
                  Узнать стоимость
                </Button>
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              {trustBadges.map((badge) => (
                <div
                  key={badge.text}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <badge.icon className="w-4 h-4 text-[#6C3EF4]" />
                  <span className="text-white/70 text-sm">{badge.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Pseudo-chat mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-sm flex flex-col gap-4">
              {/* Card 1: active consultation */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C3EF4] to-[#3B82F6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    А
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">Анна, Экономика</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 text-xs">Консультация идёт</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: progress */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-4 shadow-xl"
              >
                <p className="text-white/50 text-xs mb-1">Тема</p>
                <p className="text-white text-sm font-semibold mb-3">Микроэкономика. Эластичность спроса</p>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '70%' }}
                    transition={{ duration: 1.5, delay: 1, ease: 'easeOut' }}
                    className="h-1.5 rounded-full bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6]"
                  />
                </div>
                <p className="text-white/30 text-xs mt-1.5">70% готово</p>
              </motion.div>

              {/* Card 3: result */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="bg-[#1A1A2E] border border-emerald-500/30 rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Экзамен сдан на 5</p>
                    <p className="text-emerald-400 text-xs mt-0.5">Результат получен</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0F0F1A] to-transparent" />
    </section>
  )
}
