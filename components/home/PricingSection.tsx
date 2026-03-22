'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Lock, ChevronRight } from 'lucide-react'

const priceRows = [
  { label: 'Реферат / эссе', price: 'от 1 000 ₽', highlight: false },
  { label: 'Курсовая работа', price: 'от 3 500 ₽', highlight: false },
  { label: 'ВКР / Дипломная работа', price: 'от 15 000 ₽', highlight: true },
  { label: 'Лабораторные / контрольные / практические', price: 'от 1 000 ₽ / задание', highlight: false },
  { label: 'Презентация', price: 'от 1 200 ₽', highlight: false },
  { label: 'Отчёт по практике', price: 'от 5 000 ₽', highlight: false },
  { label: 'УИР', price: 'от 7 000 ₽', highlight: false },
  { label: 'Другой тип работы', price: 'по договорённости', highlight: false },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Стоимость —{' '}
            <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              честно и заранее
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Называем цену до начала работы. Никаких сюрпризов после.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: Price table */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
          >
            {priceRows.map((row, index) => (
              <div
                key={row.label}
                className={`group flex items-center justify-between px-6 py-4 transition-all duration-200 hover:bg-white/5 ${
                  index !== priceRows.length - 1 ? 'border-b border-white/5' : ''
                } ${row.highlight ? 'border-l-2 border-l-[#6C3EF4]' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {row.highlight && (
                    <span className="hidden sm:inline-block text-[#6C3EF4] text-xs font-bold px-2 py-0.5 rounded bg-[#6C3EF4]/10 border border-[#6C3EF4]/20 flex-shrink-0">
                      Крупная работа
                    </span>
                  )}
                  <span className="text-white/80 text-sm truncate">{row.label}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <span className={`text-sm font-bold ${row.highlight ? 'text-[#6C3EF4]' : 'text-white'}`}>
                    {row.price}
                  </span>
                  <Link href="#order">
                    <span className="text-xs text-white/30 group-hover:text-[#6C3EF4] transition-colors flex items-center gap-1">
                      Заказать <ChevronRight className="w-3 h-3" />
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Right: Accent blocks */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {/* Block 1: Fast response */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-white font-semibold text-sm leading-relaxed">
                Ответ и расчёт стоимости — в течение 30 минут после заявки
              </p>
            </div>

            {/* Block 2: Payment after */}
            <div className="bg-[#6C3EF4]/10 border border-[#6C3EF4]/20 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-[#6C3EF4]/20 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-[#A78BFA]" />
              </div>
              <p className="text-white font-semibold text-sm leading-relaxed">
                Оплата только после того, как согласовали объём и цену. Никакой предоплаты вслепую.
              </p>
            </div>

            {/* CTA */}
            <Link href="#order">
              <Button className="w-full">
                Оставить заявку
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-white/30 text-sm mt-8"
        >
          Точная стоимость зависит от сложности, объёма и срочности. Напиши — и мы сразу назовём цену конкретно для твоей задачи.
        </motion.p>
      </div>
    </section>
  )
}
