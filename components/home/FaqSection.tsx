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
    question: 'Как быстро можно получить консультацию?',
    answer:
      'Консультация по большинству предметов доступна в течение 30–60 минут после согласования. Точные сроки уточняются индивидуально после получения вашего запроса.',
  },
  {
    question: 'Какие предметы вы охватываете?',
    answer:
      'Мы работаем с широким кругом дисциплин: математика, физика, химия, экономика, право, история, иностранные языки, IT и программирование, гуманитарные науки. Если вашего предмета нет в списке — уточните, скорее всего мы сможем помочь.',
  },
  {
    question: 'Когда нужно платить?',
    answer:
      'Стоимость согласовывается заранее, до начала работы. Мы обсуждаем детали запроса, называем цену — и только после вашего согласия переходим к работе. Это наш принцип.',
  },
  {
    question: 'Можно ли задать уточняющие вопросы после консультации?',
    answer:
      'Да, наши специалисты готовы ответить на дополнительные вопросы в рамках темы консультации. Если потребуется более глубокое погружение — согласуем дополнительную сессию.',
  },
  {
    question: 'Конфиденциально ли это?',
    answer:
      'Абсолютно. Все ваши данные и данные о заказе надёжно защищены. Мы никогда не передаём информацию третьим лицам. Файлы хранятся на защищённых серверах и недоступны посторонним.',
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
            Часто задаваемые{' '}
            <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              вопросы
            </span>
          </h2>
          <p className="text-white/50 text-lg">
            Отвечаем на самые популярные вопросы студентов
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
