'use client'

import { motion } from 'framer-motion'

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
    <div id="how-it-works" className="bg-[#0E0E1C] border-t border-b border-white/[.06]">
      <section className="py-[120px] max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-tag">// Как это работает</span>
          <h2 className="section-heading">
            Три шага до<br />готовой работы
          </h2>
        </motion.div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-14 relative list-none">
          {/* Connecting line */}
          <div
            className="hidden md:block absolute top-8 pointer-events-none h-px"
            style={{
              left: 'calc(16.6% + 16px)',
              right: 'calc(16.6% + 16px)',
              background: 'linear-gradient(90deg, transparent, rgba(197,255,69,.18), #C5FF45, rgba(197,255,69,.18), transparent)',
            }}
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#07070E] border-2 border-[#C5FF45]/[.18] flex items-center justify-center mx-auto mb-6 relative z-10">
                <span className="font-unbounded text-[18px] font-black text-[#C5FF45]">
                  {step.number}
                </span>
              </div>
              <h3 className="font-unbounded text-[16px] font-bold tracking-[-0.4px] mb-2.5 text-[#F0F0EC]">
                {step.title}
              </h3>
              <p className="text-[13px] text-[#6A6A88] leading-[1.7]">{step.desc}</p>
            </motion.li>
          ))}
        </ol>
      </section>
    </div>
  )
}
