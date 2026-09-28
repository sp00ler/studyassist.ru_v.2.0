'use client'

import { motion } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { faqs } from '@/components/home/faq-data'

// Re-exported for convenience; app/page.tsx imports straight from
// '@/components/home/faq-data' instead (a 'use client' module's value
// exports can't be read from a Server Component — see that file's comment).
export { faqs }

export function FaqSection() {
  return (
    <section id="faq" className="bg-desk dither py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-lg sm:text-2xl leading-snug text-ink mb-3">
            Частые вопросы
          </h2>
          <p className="text-ink/80 text-base md:text-lg">
            Отвечаем честно и по делу
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="window pixel-shadow"
        >
          <div className="titlebar">
            <span className="flex items-center gap-2 truncate">
              <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              Справка — Частые вопросы
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="titlebar-btn" aria-hidden="true">_</span>
              <span className="titlebar-btn" aria-hidden="true">□</span>
              <span className="titlebar-btn" aria-hidden="true">×</span>
            </div>
          </div>
          <div className="bg-paper px-4 sm:px-8 py-2">
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
          </div>
        </motion.div>
      </div>
    </section>
  )
}
