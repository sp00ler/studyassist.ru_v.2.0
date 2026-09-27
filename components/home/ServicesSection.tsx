'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  FileText,
  BookOpen,
  GraduationCap,
  FlaskConical,
  BarChart3,
  Building2,
  Compass,
  Sparkles,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react'

interface Service {
  icon: LucideIcon
  title: string
  desc: string
  price: string
  unit: string
  href: string
  cta: string
  ghost?: boolean
}

// Featured item: highest-value service, rendered as the big "open folder"
// tile in the explorer layout below.
const FEATURED: Service = {
  icon: GraduationCap,
  title: 'ВКР и дипломы',
  desc: 'Полный цикл: план → текст → презентация',
  price: 'от 15 000₽',
  unit: 'за работу',
  href: '/diplom',
  cta: 'Заявка',
}

// Remaining services, rendered as Explorer "Details view" rows. Items with
// a dedicated route keep that href; the rest fall back to the order form.
const services: Service[] = [
  {
    icon: FileText,
    title: 'Рефераты и эссе',
    desc: 'Грамотно, по требованиям вашего вуза, без воды',
    price: 'от 1 000₽',
    unit: 'за работу',
    href: '/referat',
    cta: 'Заявка',
  },
  {
    icon: BookOpen,
    title: 'Курсовые работы',
    desc: 'Структура, расчёты, оформление по ГОСТ',
    price: 'от 3 500₽',
    unit: 'за работу',
    href: '/kursovaya',
    cta: 'Заявка',
  },
  {
    icon: FlaskConical,
    title: 'Лабораторные',
    desc: 'Расчёты, графики, оформление отчёта',
    price: 'от 1 000₽',
    unit: 'за задание',
    href: '#order',
    cta: 'Заявка',
  },
  {
    icon: BarChart3,
    title: 'Презентации',
    desc: 'Содержание + дизайн под тему и аудиторию',
    price: 'от 1 200₽',
    unit: 'за работу',
    href: '#order',
    cta: 'Заявка',
  },
  {
    icon: Building2,
    title: 'Отчёты по практике',
    desc: 'Производственная и учебная практика',
    price: 'от 5 000₽',
    unit: 'за работу',
    href: '#order',
    cta: 'Заявка',
  },
  {
    icon: Compass,
    title: 'УИР',
    desc: 'Учебно-исследовательские работы по кафедральным требованиям',
    price: 'от 7 000₽',
    unit: 'за работу',
    href: '#order',
    cta: 'Заявка',
  },
  {
    icon: Sparkles,
    title: 'Другой тип работы',
    desc: 'Не нашёл своё? Напишите — уточним детали и стоимость',
    price: 'по запросу',
    unit: '',
    href: '#order',
    cta: 'Написать',
    ghost: true,
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="bg-desk dither py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-10"
        >
          <h2 className="font-display text-[28px] sm:text-[32px] lg:text-[48px] font-bold leading-[1.1] tracking-[-0.01em] text-paper mb-3">
            Любая учебная работа — наш профиль
          </h2>
          <p className="text-paper text-base leading-[1.55] max-w-xl">
            Один специалист — одна тема. Без шаблонов и конвейера.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="window pixel-shadow"
        >
          <div className="titlebar">
            <span className="flex items-center gap-2 min-w-0">
              <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">МОИ_РАБОТЫ.EXE — Проводник</span>
            </span>
          </div>

          <div className="bg-paper p-3 sm:p-5 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 lg:gap-6">
              {/* Featured folder tile */}
              <Link
                href={FEATURED.href}
                className="group relative flex flex-col bevel-out bg-chrome p-6 transition-colors hover:bg-chrome-light/40"
              >
                <FEATURED.icon
                  className="w-10 h-10 text-title mb-4"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft mb-1">
                  Рекомендуем
                </span>
                <h3 className="font-display text-xl font-bold text-ink mb-2 leading-[1.15]">
                  {FEATURED.title}
                </h3>
                <p className="text-sm text-ink-soft leading-relaxed mb-6 flex-1">
                  {FEATURED.desc}
                </p>
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-mono text-2xl font-bold text-title leading-none">
                      {FEATURED.price}
                    </div>
                    <div className="text-xs text-ink-soft mt-1">{FEATURED.unit}</div>
                  </div>
                  <span className="btn-95-primary px-5 py-2 text-sm">{FEATURED.cta}</span>
                </div>
              </Link>

              {/* Explorer "Details" list of remaining services */}
              <ul className="bevel-in bg-white divide-y divide-chrome-dark/40">
                {services.map(svc => (
                  <li key={svc.title}>
                    <Link
                      href={svc.href}
                      className={`group flex items-center gap-3 px-3 sm:px-4 py-3 min-h-[44px] hover:bg-chrome/50 focus-visible:bg-chrome/50 transition-colors ${
                        svc.ghost ? 'border-l-2 border-dashed border-chrome-dark' : ''
                      }`}
                    >
                      <svc.icon
                        className="w-5 h-5 text-title flex-shrink-0"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-bold text-[14px] text-ink truncate">
                            {svc.title}
                          </span>
                          <span className="font-mono text-[13px] text-ink-soft flex-shrink-0">
                            {svc.price}
                          </span>
                        </span>
                        <span className="block text-[12.5px] text-ink-soft truncate">
                          {svc.desc}
                        </span>
                      </span>
                      <span className="btn-95 hidden sm:inline-flex text-[11px] px-2.5 py-1.5 flex-shrink-0">
                        {svc.cta}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
