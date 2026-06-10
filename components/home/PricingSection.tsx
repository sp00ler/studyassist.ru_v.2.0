'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const plans = [
  {
    label: 'Реферат / Эссе',
    price: '1 000₽',
    features: ['До 15 страниц', 'Оформление по ГОСТ', 'Уникальность от 70%', 'Список литературы'],
    hot: false,
    cta: 'Заказать',
    ghost: true,
  },
  {
    label: 'Курсовая работа',
    price: '3 500₽',
    features: ['25–50 страниц', 'Расчёты и графики', 'Уникальность от 80%', 'Правки бесплатно'],
    hot: true,
    cta: 'Заказать',
    ghost: false,
  },
  {
    label: 'ВКР / Диплом',
    price: '15 000₽',
    features: ['60–100+ страниц', 'Полный пакет документов', 'Презентация для защиты', 'Сопровождение до сдачи'],
    hot: false,
    cta: 'Заказать',
    ghost: true,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-[120px] max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <span className="section-tag">// Цены</span>
        <h2 className="section-heading">
          Прозрачные цены.<br />Никаких скрытых доплат.
        </h2>
        <p className="section-sub">
          Точную стоимость называем после изучения задачи — до копейки.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className={`relative overflow-hidden rounded-3xl p-10 border transition-all duration-280 ${
              plan.hot
                ? 'bg-gradient-to-br from-[#C5FF45]/[.08] to-[#7C3AED]/[.1] border-[#C5FF45]/[.18]'
                : 'bg-[#0E0E1C] border-white/[.06] hover:border-[#C5FF45]/[.18] hover:shadow-[0_24px_64px_rgba(0,0,0,.4)]'
            }`}
          >
            {/* HOT ribbon */}
            {plan.hot && (
              <div
                className="absolute top-[18px] right-[-28px] bg-[#C5FF45] text-[#07070E] font-unbounded text-[9px] font-black tracking-[1px] py-1 px-10 rotate-45 pointer-events-none"
              >
                ХИТ
              </div>
            )}

            <div className="font-unbounded text-[11px] font-bold uppercase tracking-[1.2px] text-[#6A6A88] mb-3.5">
              {plan.label}
            </div>

            <div className="font-unbounded font-black tracking-[-2px] leading-none mb-1 text-[#F0F0EC]"
              style={{ fontSize: 52 }}>
              {plan.price}
            </div>
            <div className="text-[12px] text-[#6A6A88] mb-8">начальная цена</div>

            <ul className="space-y-0 mb-8">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-[13px] text-[#6A6A88] py-2.5 border-b border-white/[.06] last:border-0"
                >
                  <span className="text-[#C5FF45] font-bold flex-shrink-0 mt-px">→</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link href="#order">
              <button
                className={`w-full py-3.5 rounded-full font-unbounded text-[13px] font-bold tracking-[-0.2px] transition-all duration-200 ${
                  plan.hot
                    ? 'bg-[#C5FF45] text-[#07070E] hover:bg-[#D4FF60] hover:shadow-[0_8px_28px_rgba(197,255,69,.28)]'
                    : 'bg-transparent text-[#F0F0EC] border border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                {plan.cta}
              </button>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="text-center text-[13px] text-[#6A6A88] mt-8"
      >
        Также: лабораторные от 1 000₽, отчёты по практике от 5 000₽, УИР от 7 000₽, презентации от 1 200₽.{' '}
        <Link href="#order" className="text-[#C5FF45] hover:underline">Узнать точную стоимость →</Link>
      </motion.p>
    </section>
  )
}
