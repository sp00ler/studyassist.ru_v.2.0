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
import { revealFrom } from '@/components/home/reveal'

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

// All services render as identical Explorer "Details view" rows (including
// the former "featured" tile — it is just the first row now). Items with a
// dedicated route keep that href; the rest fall back to the order form.
const services: Service[] = [
  {
    icon: GraduationCap,
    title: 'ВКР и дипломы',
    desc: 'Полный цикл: план → текст → презентация',
    price: 'от 15 000₽',
    unit: 'за работу',
    href: '/diplom',
    cta: 'Заявка',
  },
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
          initial={revealFrom({ opacity: 0, y: 20 })}
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
          initial={revealFrom({ opacity: 0, y: 24 })}
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
            {/* Explorer "Details" list — every service is an identical row.
                Idle: name only. Hover/focus: a Win95 segmented bar fills the
                row (steps() timing = chunky), then the full row content
                (icon, name, price, description, Заявка) appears in white on
                top of the filled navy bar. Row height is reserved so nothing
                jumps between states; leaving/blurring resets via CSS. */}
            <ul className="bevel-in bg-white divide-y divide-chrome-dark/40">
              {services.map(svc => (
                <li key={svc.title}>
                  <div
                    tabIndex={0}
                    className={`group relative min-h-[64px] sm:min-h-[72px] outline-none focus-visible:z-10 ${
                      svc.ghost ? 'border-l-2 border-dashed border-chrome-dark' : ''
                    }`}
                  >
                    {/* Segmented fill bar — steps() timing makes the width
                        transition jump in chunks, Win95-progress-bar style.
                        Stripe texture uses hard color stops (same technique
                        as .dither), not a decorative blend gradient. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 z-0 w-0 transition-[width] duration-[620ms] ease-[steps(14,end)] group-hover:w-full group-focus-within:w-full motion-reduce:duration-0 motion-reduce:transition-none"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, rgb(var(--title)) 0 12px, rgb(var(--chrome-shadow)) 12px 14px)',
                      }}
                    />

                    {/* Idle layer: name only */}
                    <span className="absolute inset-0 z-10 flex items-center px-3 sm:px-4 font-display text-[10px] sm:text-[11px] leading-[1.4] text-ink transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0 motion-reduce:transition-none">
                      <span className="truncate">{svc.title}</span>
                    </span>

                    {/* Revealed layer: icon, name, price, desc, Заявка —
                        appears once the bar has finished filling. */}
                    <span className="pointer-events-none absolute inset-0 z-10 flex items-center gap-3 px-3 sm:px-4 opacity-0 transition-opacity delay-[560ms] duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 motion-reduce:delay-0 motion-reduce:transition-none">
                      <svc.icon
                        className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-white"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate font-display text-[10px] sm:text-[11px] text-white">
                            {svc.title}
                          </span>
                          <span className="flex-shrink-0 font-mono text-[11px] sm:text-[13px] text-white">
                            {svc.price}
                          </span>
                        </span>
                        <span className="mt-1 hidden truncate text-[12.5px] text-white/85 sm:block">
                          {svc.desc}
                        </span>
                      </span>
                      <Link
                        href={svc.href}
                        className="btn-95 relative z-20 flex-shrink-0 whitespace-nowrap px-2 py-1 text-[10px] sm:px-2.5 sm:py-1.5 sm:text-[11px]"
                      >
                        {svc.cta}
                      </Link>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
