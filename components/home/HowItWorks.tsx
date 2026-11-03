'use client'

import { motion } from 'framer-motion'
import { revealFrom } from '@/components/home/reveal'

const steps = [
  {
    number: '01',
    title: 'Опиши задачу',
    desc: 'Заполни форму: тип работы, дисциплина, дедлайн и требования. Прикрепи файлы, если есть. Чем подробнее — тем точнее цена.',
  },
  {
    number: '02',
    title: 'Получи план и цену',
    desc: 'За 30 минут мы свяжемся, согласуем план и стоимость. Никаких скрытых доплат после.',
  },
  {
    number: '03',
    title: 'Получи результат',
    desc: 'Профильный специалист выполняет работу в срок. Правки до полного соответствия требованиям.',
  },
]

export function HowItWorks() {
  return (
    <div id="how-it-works" className="bg-desk dither py-16 sm:py-20 lg:py-24">
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial={revealFrom({ opacity: 0, y: 20 })}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-10"
        >
          <h2 className="font-display text-[18px] sm:text-[22px] lg:text-[28px] leading-[1.35] text-paper mb-3">
            Три шага — и работа готова
          </h2>
        </motion.div>

        <motion.div
          initial={revealFrom({ opacity: 0, y: 24 })}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="window pixel-shadow"
        >
          <div className="titlebar">
            <span className="truncate">УСТАНОВКА.EXE — Мастер настройки</span>
          </div>

          <div className="bg-paper p-4 sm:p-6 lg:p-8">
            {/* Chrome progress track — decorative, all three stages read as
                complete since the visible steps below carry the real state */}
            <div
              className="hidden md:flex h-3 bevel-in bg-chrome mb-10 overflow-hidden"
              aria-hidden="true"
            >
              {steps.map((step, i) => (
                <div
                  key={step.number}
                  className={`flex-1 h-full bg-title ${i > 0 ? 'border-l-2 border-chrome' : ''}`}
                />
              ))}
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-chrome-dark/40 bevel-in bg-white list-none">
              {steps.map((step, i) => (
                <motion.li
                  key={step.number}
                  initial={revealFrom({ opacity: 0, y: 24 })}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.12 }}
                  className="p-5 sm:p-6"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                    Шаг {i + 1} из {steps.length}
                  </span>
                  <div className="w-11 h-11 flex items-center justify-center bevel-out bg-chrome mt-3 mb-4">
                    <span className="font-display text-lg text-title">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-sans text-base sm:text-[18px] font-bold text-ink mb-2 leading-[1.15]">
                    {step.title}
                  </h3>
                  <p className="text-sm text-ink-soft leading-[1.6]">{step.desc}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
