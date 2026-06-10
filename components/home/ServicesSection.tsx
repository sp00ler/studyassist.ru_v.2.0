'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const services = [
  {
    icon: '📄',
    title: 'Рефераты и эссе',
    desc: 'Грамотно, по требованиям вашего вуза, без воды',
    price: 'от 1 000₽',
    unit: 'за работу',
  },
  {
    icon: '📚',
    title: 'Курсовые работы',
    desc: 'Структура, расчёты, оформление по ГОСТ',
    price: 'от 3 500₽',
    unit: 'за работу',
  },
  {
    icon: '🎓',
    title: 'ВКР и дипломы',
    desc: 'Полный цикл: план → текст → презентация',
    price: 'от 15 000₽',
    unit: 'за работу',
  },
  {
    icon: '🔬',
    title: 'Лабораторные',
    desc: 'Расчёты, графики, оформление отчёта',
    price: 'от 1 000₽',
    unit: 'за задание',
  },
  {
    icon: '📊',
    title: 'Презентации',
    desc: 'Содержание + дизайн под тему и аудиторию',
    price: 'от 1 200₽',
    unit: 'за работу',
  },
  {
    icon: '🏢',
    title: 'Отчёты по практике',
    desc: 'Производственная и учебная практика',
    price: 'от 5 000₽',
    unit: 'за работу',
  },
  {
    icon: '🔭',
    title: 'УИР',
    desc: 'Учебно-исследовательские работы по кафедральным требованиям',
    price: 'от 7 000₽',
    unit: 'за работу',
  },
  {
    icon: '✨',
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
        <span className="section-tag">// Услуги</span>
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
            className={`group relative overflow-hidden rounded-3xl p-8 border transition-all duration-280 cursor-default ${
              svc.ghost
                ? 'bg-[#0E0E1C]/60 border-white/[.06] hover:border-white/[.12]'
                : 'bg-[#0E0E1C] border-white/[.06] hover:border-[#C5FF45]/[.18] hover:shadow-[0_24px_64px_rgba(0,0,0,.45)]'
            }`}
          >
            {/* Lime gradient overlay on hover */}
            {!svc.ghost && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#C5FF45]/[.07] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-280 pointer-events-none" />
            )}

            <div className="relative">
              <span className="text-[30px] mb-3.5 block">{svc.icon}</span>
              <h3 className="font-unbounded text-[15px] font-bold tracking-[-0.4px] mb-2 text-[#F0F0EC]">
                {svc.title}
              </h3>
              <p className="text-[13px] text-[#6A6A88] leading-[1.6] mb-5">{svc.desc}</p>
              <div className="flex items-center justify-between">
                <div className="font-mono text-[20px] font-bold text-[#C5FF45]">
                  {svc.price}
                  {svc.unit && (
                    <span className="text-[12px] text-[#6A6A88] font-sans font-normal ml-1">
                      {svc.unit}
                    </span>
                  )}
                </div>
                <Link
                  href="#order"
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-[#C5FF45]/10 border border-[#C5FF45]/[.18] text-[#C5FF45] hover:bg-[#C5FF45]/20 transition-all"
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
