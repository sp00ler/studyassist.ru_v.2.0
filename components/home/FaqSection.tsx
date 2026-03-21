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
    question: 'Как быстро вы выполняете работы?',
    answer:
      'Срок выполнения зависит от сложности и объёма работы. Небольшие рефераты и лабораторные мы выполняем за несколько часов. Курсовые работы — от 1 до 5 дней. Дипломные работы — от 5 до 14 дней. Точные сроки согласовываются индивидуально после получения вашего задания.',
  },
  {
    question: 'Гарантируете ли вы уникальность?',
    answer:
      'Да, мы гарантируем уникальность всех работ минимум 80% по системе Антиплагиат. Для большинства работ уникальность составляет 85-95%. Мы не используем рерайтинг — все работы пишутся авторами с нуля по вашему заданию.',
  },
  {
    question: 'Когда нужно платить?',
    answer:
      'Работа начинает выполняться только после оплаты. Мы согласовываем с вами стоимость, вы вносите оплату — и мы сразу приступаем к выполнению. Это наш принцип работы.',
  },
  {
    question: 'Можно ли вносить правки?',
    answer:
      'Да, правки вносить можно. Если результат не соответствует первоначально согласованному заданию, мы бесплатно доработаем его в рамках исходного задания.',
  },
  {
    question: 'Конфиденциально ли это?',
    answer:
      'Абсолютно. Все ваши данные и данные о заказе надёжно защищены. Мы никогда не передаём информацию третьим лицам. Файлы хранятся на защищённых серверах и недоступны посторонним. Каждый заказ полностью анонимен.',
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
