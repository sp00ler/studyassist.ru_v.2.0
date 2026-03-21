'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Zap, Shield } from 'lucide-react'

const trustBadges = [
  { icon: Zap, text: '1000+ студентов получили помощь' },
  { icon: Shield, text: 'Проверенные специалисты' },
  { icon: CheckCircle, text: 'Оплата после согласования' },
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
                Образовательные консультации онлайн
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Образовательные{' '}
              <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
                консультации
              </span>
              {' '}для студентов — понятно и эффективно
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg text-white/60 leading-relaxed mb-8 max-w-xl"
            >
              Объясним сложные темы, подберём материалы, поможем подготовиться к экзаменам.
              Индивидуальный подход. Оплата после согласования.
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
                  Оставить заявку
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

          {/* Right: Animated illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-md">
              {/* Main illustration */}
              <svg
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                {/* Background circle */}
                <circle cx="200" cy="200" r="180" fill="url(#heroGrad1)" fillOpacity="0.1" />
                <circle cx="200" cy="200" r="150" stroke="url(#heroGrad1)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 4" />

                {/* Laptop */}
                <g className="animate-float">
                  <rect x="100" y="160" width="200" height="140" rx="12" fill="#1A1A2E" stroke="#6C3EF4" strokeWidth="2" />
                  <rect x="110" y="170" width="180" height="100" rx="6" fill="#0F0F1A" />
                  {/* Screen content */}
                  <rect x="120" y="180" width="60" height="6" rx="3" fill="#6C3EF4" fillOpacity="0.8" />
                  <rect x="120" y="192" width="100" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.3" />
                  <rect x="120" y="202" width="80" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.2" />
                  <rect x="120" y="212" width="90" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.2" />
                  {/* Chart */}
                  <rect x="210" y="180" width="70" height="80" rx="6" fill="#6C3EF4" fillOpacity="0.1" />
                  <rect x="218" y="220" width="10" height="30" rx="3" fill="#6C3EF4" fillOpacity="0.7" />
                  <rect x="232" y="210" width="10" height="40" rx="3" fill="#3B82F6" fillOpacity="0.7" />
                  <rect x="246" y="200" width="10" height="50" rx="3" fill="#A78BFA" fillOpacity="0.7" />
                  <rect x="260" y="215" width="10" height="35" rx="3" fill="#6C3EF4" fillOpacity="0.7" />
                  {/* Laptop base */}
                  <rect x="80" y="298" width="240" height="12" rx="6" fill="#1A1A2E" stroke="#6C3EF4" strokeWidth="1.5" />
                </g>

                {/* Graduation cap - floating */}
                <g style={{ animation: 'float 8s ease-in-out infinite', animationDelay: '1s' }}>
                  <rect x="280" y="80" width="80" height="10" rx="5" fill="#F59E0B" />
                  <polygon points="320,50 300,85 340,85" fill="#F59E0B" />
                  <rect x="340" y="80" width="4" height="20" fill="#F59E0B" />
                  <circle cx="344" cy="104" r="6" fill="#F59E0B" />
                </g>

                {/* Book stack - floating */}
                <g style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '0.5s' }}>
                  <rect x="40" y="220" width="60" height="12" rx="3" fill="#6C3EF4" />
                  <rect x="44" y="208" width="60" height="14" rx="3" fill="#8B5CF6" />
                  <rect x="40" y="194" width="56" height="16" rx="3" fill="#3B82F6" />
                </g>

                {/* Stars/sparkles */}
                <g fill="#F59E0B">
                  <circle cx="350" cy="160" r="4" fillOpacity="0.8" />
                  <circle cx="50" cy="140" r="3" fillOpacity="0.6" />
                  <circle cx="370" cy="280" r="3" fillOpacity="0.7" />
                  <circle cx="30" cy="300" r="4" fillOpacity="0.5" />
                </g>

                {/* Check marks */}
                <g fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M355 210 L362 218 L374 204" />
                  <path d="M22 200 L29 208 L41 194" />
                </g>

                <defs>
                  <linearGradient id="heroGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6C3EF4" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 bg-[#1A1A2E] border border-white/10 rounded-xl p-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white font-semibold">Тема понята!</p>
                    <p className="text-xs text-white/40">Консультация прошла</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-[#1A1A2E] border border-white/10 rounded-xl p-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white font-semibold">Быстро</p>
                    <p className="text-xs text-white/40">от 24 часов</p>
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
