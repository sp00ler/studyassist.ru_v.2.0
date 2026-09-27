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
  type LucideIcon,
} from 'lucide-react'

const services: {
  icon: LucideIcon
  title: string
  desc: string
  price: string
  unit: string
  ghost?: boolean
}[] = [
  {
    icon: FileText,
    title: 'Рефераты и эссе',
    desc: 'Грамотно, по требованиям вашего вуза, без воды',
    price: 'от 1 000₽',
    unit: 'за работу',
  },
  {
    icon: BookOpen,
    title: 'Курсовые работы',
    desc: 'Структура, расчёты, оформление по ГОСТ',
    price: 'от 3 500₽',
    unit: 'за работу',
  },
  {
    icon: GraduationCap,
    title: 'ВКР и дипломы',
    desc: 'Полный цикл: план → текст → презентация',
    price: 'от 15 000₽',
    unit: 'за работу',
  },
  {
    icon: FlaskConical,
    title: 'Лабораторные',
    desc: 'Расчёты, графики, оформление отчёта',
    price: 'от 1 000₽',
    unit: 'за задание',
  },
  {
    icon: BarChart3,
    title: 'Презентации',
    desc: 'Содержание + дизайн под тему и аудиторию',
    price: 'от 1 200₽',
    unit: 'за работу',
  },
  {
    icon: Building2,
    title: 'Отчёты по практике',
    desc: 'Производственная и учебная практика',
    price: 'от 5 000₽',
    unit: 'за работу',
  },
  {
    icon: Compass,
    title: 'УИР',
    desc: 'Учебно-исследовательские работы по кафедральным требованиям',
    price: 'от 7 000₽',
    unit: 'за работу',
  },
  {
    icon: Sparkles,
    title: 'Другой тип работы',
    desc: 'Не нашёл своё? Напишите — уточним детали и стоимость',
    price: 'по запросу',
    unit: '',
    ghost: true,
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="py-[120px] max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="section-heading">
          Любая учебная<br />работа — наша
        </h2>
        <p className="section-sub">
          Каждую работу выполняет профильный специалист. Без шаблонов.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc, i) => (
          <motion.div
            key={svc.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            whileHover={{ y: -5 }}
            className={`group relative overflow-hidden rounded-[2px] p-8 border-2 transition-all duration-200 cursor-default ${
              svc.ghost
                ? 'bg-[#211C15]/60 border-white/[.12] border-dashed hover:border-[#E8A33D]/50'
                : 'bg-[#211C15] border-white/15 hover:border-[#2FAE5B] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(0,0,0,.4)]'
            }`}
          >
            {!svc.ghost && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#2FAE5B] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200" />
            )}

            <div className="relative">
              <svc.icon className="w-7 h-7 mb-3.5 text-[#2FAE5B]" strokeWidth={1.75} />
              <h3 className="font-unbounded text-[15px] font-bold tracking-[-0.4px] mb-2 text-[#F5F0E3]">
                {svc.title}
              </h3>
              <p className="text-[13px] text-[#6B6255] leading-[1.6] mb-5">{svc.desc}</p>
              <div className="flex items-center justify-between">
                <div className="font-mono text-[20px] font-bold text-[#2FAE5B]">
                  {svc.price}
                  {svc.unit && (
                    <span className="text-[12px] text-[#6B6255] font-sans font-normal ml-1">
                      {svc.unit}
                    </span>
                  )}
                </div>
                <Link
                  href="#order"
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-[2px] border-2 border-[#2FAE5B]/60 text-[#2FAE5B] hover:bg-[#2FAE5B] hover:text-[#17130F] transition-all"
                >
                  {svc.ghost ? 'Написать' : 'Заявка'}
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
