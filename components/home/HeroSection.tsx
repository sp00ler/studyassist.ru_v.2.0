'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Zap, Lock } from 'lucide-react'

const trustBadges = [
  { icon: Zap, text: 'Ответ за 30 минут' },
  { icon: CheckCircle, text: 'Оплата после согласования' },
  { icon: Lock, text: 'Конфиденциально' },
]

// ─── Пул данных для карточек ─────────────────────────────────────────────────

interface HeroCard {
  name: string
  subject: string
  initial: string
  avatarFrom: string
  avatarTo: string
  workType: string
  workTitle: string
  progress: number
}

const HERO_POOL: HeroCard[] = [
  { name: 'Дмитрий',    subject: 'Юриспруденция',  initial: 'Д', avatarFrom: '#3B82F6', avatarTo: '#6C3EF4', workType: 'Курсовая работа',       workTitle: 'Гражданское право',          progress: 70 },
  { name: 'Анастасия',  subject: 'Экономика',       initial: 'А', avatarFrom: '#EC4899', avatarTo: '#8B5CF6', workType: 'Дипломная работа (ВКР)', workTitle: 'Финансовый менеджмент',      progress: 85 },
  { name: 'Михаил',     subject: 'Информатика',     initial: 'М', avatarFrom: '#10B981', avatarTo: '#3B82F6', workType: 'Лабораторная работа',    workTitle: 'Программирование на C++',    progress: 55 },
  { name: 'Екатерина',  subject: 'Психология',      initial: 'Е', avatarFrom: '#F472B6', avatarTo: '#A855F7', workType: 'Курсовая работа',       workTitle: 'Психология личности',        progress: 90 },
  { name: 'Артём',      subject: 'Физика',          initial: 'А', avatarFrom: '#F59E0B', avatarTo: '#EF4444', workType: 'Лабораторная работа',    workTitle: 'Механика и термодинамика',   progress: 65 },
  { name: 'Мария',      subject: 'Маркетинг',       initial: 'М', avatarFrom: '#EC4899', avatarTo: '#F97316', workType: 'Курсовая работа',       workTitle: 'Маркетинговые исследования', progress: 75 },
  { name: 'Александр',  subject: 'История',         initial: 'А', avatarFrom: '#6366F1', avatarTo: '#3B82F6', workType: 'Реферат / Эссе',        workTitle: 'История Средних веков',      progress: 45 },
  { name: 'Виктория',   subject: 'Биология',        initial: 'В', avatarFrom: '#22C55E', avatarTo: '#16A34A', workType: 'Курсовая работа',       workTitle: 'Молекулярная биология',      progress: 80 },
  { name: 'Иван',       subject: 'Математика',      initial: 'И', avatarFrom: '#0EA5E9', avatarTo: '#7C3AED', workType: 'Лабораторная работа',    workTitle: 'Теория вероятностей',        progress: 60 },
  { name: 'Дарья',      subject: 'Менеджмент',      initial: 'Д', avatarFrom: '#A78BFA', avatarTo: '#EC4899', workType: 'Дипломная работа (ВКР)', workTitle: 'Управление персоналом',      progress: 35 },
  { name: 'Кирилл',     subject: 'Финансы',         initial: 'К', avatarFrom: '#34D399', avatarTo: '#0EA5E9', workType: 'Курсовая работа',       workTitle: 'Инвестиционный анализ',      progress: 50 },
  { name: 'Ольга',      subject: 'Социология',      initial: 'О', avatarFrom: '#FB923C', avatarTo: '#EF4444', workType: 'Реферат / Эссе',        workTitle: 'Социальные институты',       progress: 88 },
  { name: 'Сергей',     subject: 'Архитектура',     initial: 'С', avatarFrom: '#818CF8', avatarTo: '#6C3EF4', workType: 'Дипломная работа (ВКР)', workTitle: 'Градостроительное проектирование', progress: 72 },
  { name: 'Наталья',    subject: 'Педагогика',      initial: 'Н', avatarFrom: '#F472B6', avatarTo: '#EF4444', workType: 'Курсовая работа',       workTitle: 'Методика обучения',          progress: 93 },
  { name: 'Алексей',    subject: 'Химия',           initial: 'А', avatarFrom: '#2DD4BF', avatarTo: '#3B82F6', workType: 'Лабораторная работа',    workTitle: 'Органическая химия',         progress: 42 },
]

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

export function HeroSection() {
  // SSR-безопасная рандомизация: начальное значение детерминировано,
  // после гидрации useEffect подставляет случайные данные
  const [card, setCard] = useState<HeroCard>(HERO_POOL[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const idx = Math.floor(Math.random() * HERO_POOL.length)
    setCard(HERO_POOL[idx])
    setMounted(true)
  }, [])

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

          {/* Right: Dynamic cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-sm flex flex-col gap-4">

              {/* Card 1: имя + статус "в процессе" */}
              <motion.div
                key={`card1-${card.name}`}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${card.avatarFrom}, ${card.avatarTo})` }}
                  >
                    {card.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">
                      {card.name}, {card.subject}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 text-xs">Работа в процессе</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: прогресс-бар */}
              <motion.div
                key={`card2-${card.workTitle}`}
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-4 shadow-xl"
              >
                <p className="text-white/50 text-xs mb-1">Тип работы</p>
                <p className="text-white text-sm font-semibold mb-3">
                  {card.workType}. {card.workTitle}
                </p>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <motion.div
                    key={`bar-${card.progress}`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${card.progress}%` }}
                    transition={{ duration: 1.5, delay: mounted ? 0.3 : 1, ease: 'easeOut' }}
                    className="h-1.5 rounded-full bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6]"
                  />
                </div>
                <p className="text-white/30 text-xs mt-1.5">{card.progress}% готово</p>
              </motion.div>

              {/* Card 3: сдано на отлично + штамп ЗАЧЁТ */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="relative bg-[#1A1A2E] border border-emerald-500/30 rounded-2xl p-4 shadow-xl overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Сдано на отлично</p>
                    <p className="text-emerald-400 text-xs mt-0.5">Результат получен</p>
                  </div>
                </div>

                {/* Штамп ЗАЧЁТ */}
                <motion.div
                  initial={{ scale: 0, rotate: -8, opacity: 0 }}
                  animate={{ scale: 1, rotate: -12, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 12,
                    delay: 1.8,
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <motion.div
                    animate={{ opacity: [1, 0.75, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative"
                  >
                    {/* Внешняя рамка штампа */}
                    <div
                      className="px-2.5 py-1 rounded"
                      style={{
                        border: '2.5px solid #34D399',
                        boxShadow: '0 0 8px rgba(52, 211, 153, 0.5), inset 0 0 6px rgba(52, 211, 153, 0.08)',
                      }}
                    >
                      {/* Линии-декор сверху и снизу */}
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="h-px w-full" style={{ background: '#34D399', opacity: 0.6 }} />
                        <span
                          className="font-black tracking-[0.2em] text-xs uppercase leading-none py-0.5"
                          style={{
                            color: '#34D399',
                            fontFamily: '"Courier New", Courier, monospace',
                            textShadow: '0 0 6px rgba(52, 211, 153, 0.7)',
                          }}
                        >
                          ЗАЧЁТ
                        </span>
                        <div className="h-px w-full" style={{ background: '#34D399', opacity: 0.6 }} />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
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
