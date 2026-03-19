'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

const plans = [
  {
    name: 'Реферат / Эссе',
    price: 'от 500 ₽',
    features: [
      '10-25 страниц',
      'Уникальность от 80%',
      'Список литературы',
      'Правки в течение 3 дней',
    ],
    color: '#8B5CF6',
    popular: false,
  },
  {
    name: 'Курсовая работа',
    price: 'от 1 500 ₽',
    features: [
      '25-50 страниц',
      'Теория + практика',
      'Уникальность от 80%',
      'Оформление по ГОСТ',
      'Правки в течение 3 дней',
      'Бесплатные консультации',
    ],
    color: '#6C3EF4',
    popular: true,
  },
  {
    name: 'Дипломная работа',
    price: 'от 7 000 ₽',
    features: [
      '60-100 страниц',
      'Нормоконтроль',
      'Уникальность от 80%',
      'Презентация в подарок',
      'Защитная речь',
      'Сопровождение до защиты',
    ],
    color: '#3B82F6',
    popular: false,
  },
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
            Стоимость{' '}
            <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              услуг
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Цены формируются индивидуально. Здесь — ориентировочные стартовые цены.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`relative bg-white/5 border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? 'border-[#6C3EF4]/50 shadow-[0_0_40px_rgba(108,62,244,0.15)]'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    Популярный выбор
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-3xl font-extrabold" style={{ color: plan.color }}>
                  {plan.price}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white/70 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: plan.color }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="#order">
                <Button
                  variant={plan.popular ? 'default' : 'outline'}
                  className="w-full"
                  style={plan.popular ? {} : { borderColor: `${plan.color}40`, color: plan.color }}
                >
                  Заказать
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-white/30 text-sm mt-8"
        >
          Точная стоимость рассчитывается после изучения вашего задания. Оплата только после проверки.
        </motion.p>
      </div>
    </section>
  )
}
