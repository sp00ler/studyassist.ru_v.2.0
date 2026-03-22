'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Как быстро можно получить помощь?',
    answer:
      'В течение 30 минут после заявки мы выходим на связь и согласовываем детали. В большинстве случаев приступаем к работе в тот же день.',
  },
  {
    question: 'Какие предметы вы охватываете?',
    answer:
      'Практически любые: математика, физика, химия, право, экономика, программирование, психология, медицина, история и другие. Если есть сомнения — просто напишите.',
  },
  {
    question: 'Когда нужно платить?',
    answer:
      'Только после того, как мы согласовали объём работы и стоимость. Никакой предоплаты "на удачу".',
  },
  {
    question: 'Можно ли задать вопросы после консультации?',
    answer:
      'Да. Если что-то осталось непонятным — пишите, разберёмся. Не бросаем после оплаты.',
  },
  {
    question: 'Это конфиденциально?',
    answer:
      'Полностью. Мы не передаём никаких данных о заявках и работах третьим лицам. Твоя информация остаётся только у нас.',
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Частые{' '}
            <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              вопросы
            </span>
          </h2>
          <p className="text-white/50 text-lg">
            Отвечаем честно и по делу
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
