'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { revealFrom } from '@/components/home/reveal'

const plans = [
  {
    label: 'Реферат / Эссе',
    price: '1 000₽',
    features: ['До 15 страниц', 'Оформление по ГОСТ', 'Уникальность от 70%', 'Список литературы'],
    hot: false,
    cta: 'Заказать',
  },
  {
    label: 'Курсовая работа',
    price: '3 500₽',
    features: ['25–50 страниц', 'Расчёты и графики', 'Уникальность от 80%', 'Правки бесплатно'],
    hot: true,
    cta: 'Заказать',
  },
  {
    label: 'ВКР / Диплом',
    price: '15 000₽',
    features: ['60–100+ страниц', 'Полный пакет документов', 'Презентация для защиты', 'Сопровождение до сдачи'],
    hot: false,
    cta: 'Заказать',
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="bg-desk dither py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial={revealFrom({ opacity: 0, y: 20 })}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-10"
        >
          <h2 className="font-display text-[18px] sm:text-[22px] lg:text-[28px] leading-[1.35] text-paper mb-3">
            Прозрачные цены. Никаких скрытых доплат.
          </h2>
          <p className="text-paper text-base leading-[1.55] max-w-xl">
            Точную стоимость называем после изучения задачи — до копейки.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.label}
              initial={revealFrom({ opacity: 0, y: 30 })}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative window pixel-shadow flex flex-col ${
                plan.hot ? 'md:-translate-y-2' : ''
              }`}
            >
              {/* Accent price-tag sticker — the ONE highlighted plan */}
              {plan.hot && (
                <span
                  className="absolute -top-3 -right-3 z-10 bg-accent text-ink font-display text-xs px-3 py-1.5 border border-chrome-shadow rotate-[6deg] shadow-[2px_2px_0_0_rgb(var(--chrome-shadow))]"
                  aria-hidden="true"
                >
                  ХИТ
                </span>
              )}

              <div className="titlebar">
                <span className="truncate">{plan.label}.PRC</span>
              </div>

              <div className="bg-paper p-5 sm:p-6 flex flex-col flex-1">
                <div className="font-mono text-[32px] sm:text-[40px] lg:text-[48px] font-bold leading-none text-ink">
                  {plan.price}
                </div>
                <div className="text-xs text-ink-soft mt-2 mb-5">начальная цена</div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink leading-[1.4]">
                      <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={plan.hot ? 'default' : 'outline'}
                  size="lg"
                  className="w-full"
                >
                  <Link href="#order">{plan.cta}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={revealFrom({ opacity: 0 })}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-paper mt-10"
        >
          Также: лабораторные от 1 000₽, отчёты по практике от 5 000₽, УИР от 7 000₽, презентации от 1 200₽.{' '}
          <Link href="#order" className="underline underline-offset-2 hover:no-underline">
            Узнать точную стоимость →
          </Link>
        </motion.p>
      </div>
    </section>
  )
}
