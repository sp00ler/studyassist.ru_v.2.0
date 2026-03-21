'use client'

import { motion } from 'framer-motion'
import { FileText, Calculator, Download } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Оставьте заявку',
    description: 'Опишите ваш запрос: тип консультации, предмет, что именно вызывает затруднение. Приложите материалы, если нужно.',
    color: '#6C3EF4',
  },
  {
    number: '02',
    icon: Calculator,
    title: 'Согласуем детали и стоимость',
    description: 'В течение 30 минут мы свяжемся с вами, уточним детали и согласуем стоимость. Никаких скрытых платежей.',
    color: '#3B82F6',
  },
  {
    number: '03',
    icon: Download,
    title: 'Получите консультацию',
    description: 'После согласования проводим консультацию или занятие. Если что-то осталось неясным — задайте дополнительные вопросы.',
    color: '#F59E0B',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F0F1A] via-[#1A1A2E]/50 to-[#0F0F1A]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Как это{' '}
            <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              работает
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Три простых шага — и вы получаете нужную помощь
          </p>
        </motion.div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 relative list-none">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px bg-gradient-to-r from-[#6C3EF4] via-[#3B82F6] to-[#F59E0B] opacity-30" aria-hidden="true" />

          {steps.map((step, index) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative group"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300 hover:bg-white/8 group-hover:shadow-[0_0_40px_rgba(108,62,244,0.1)]">
                {/* Number */}
                <div className="absolute -top-4 left-8 text-6xl font-black opacity-10 select-none"
                  style={{ color: step.color }}>
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 relative"
                  style={{ backgroundColor: `${step.color}20`, border: `1px solid ${step.color}40` }}
                >
                  <step.icon className="w-7 h-7" style={{ color: step.color }} />
                  <div
                    className="absolute inset-0 rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                    style={{ backgroundColor: step.color }}
                  />
                </div>

                {/* Step number badge */}
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-md"
                    style={{ backgroundColor: `${step.color}20`, color: step.color }}
                  >
                    Шаг {index + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">{step.description}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
