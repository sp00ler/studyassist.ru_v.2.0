import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { CheckCircle2, Clock, ShieldCheck, Star, ChevronRight, MessageCircle } from 'lucide-react'

export interface ServiceFAQ { q: string; a: string }

export interface ServicePageProps {
  slug: string
  h1: string
  tagline: string
  price: string
  volume: string
  uniqueness: string
  deadline: string
  included: string[]
  faq: ServiceFAQ[]
  jsonLd: object
}

export function ServicePage({
  h1, tagline, price, volume, uniqueness, deadline,
  included, faq, jsonLd,
}: ServicePageProps) {
  const guarantees = [
    { icon: Star,          title: 'Уникальность',      text: `Антиплагиат ${uniqueness} — проверяем перед сдачей` },
    { icon: Clock,         title: 'Срок',               text: `Срочные работы от ${deadline}, плановые — по договорённости` },
    { icon: ShieldCheck,   title: 'Бесплатные правки',  text: 'Дорабатываем до принятия преподавателем' },
    { icon: MessageCircle, title: 'Поддержка',          text: 'Ответ за 30 минут, работаем 09:00–23:00' },
  ]

  const steps = [
    { n: '01', title: 'Опишите задачу', text: 'Заполните форму: тема, объём, дедлайн, требования кафедры. Прикрепите методичку или образец.' },
    { n: '02', title: 'Согласуем детали', text: 'Свяжемся за 30 минут, уточним детали и назовём итоговую стоимость. Без скрытых доплат.' },
    { n: '03', title: 'Получите работу', text: 'Профильный специалист подготовит работу в срок. Бесплатные правки до полного соответствия требованиям.' },
  ]

  const shortTitle = h1.split('—')[0].trim()

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-desk dither">
        <Navbar />

        <main id="main-content" className="pt-6 pb-16 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[1100px] mx-auto">

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-white">
                <li><Link href="/" className="hover:text-accent transition-colors">Главная</Link></li>
                <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                <li><Link href="/#services" className="hover:text-accent transition-colors">Услуги</Link></li>
                <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                <li className="text-white/90" aria-current="page">{shortTitle}</li>
              </ol>
            </nav>

            {/* Document window */}
            <div className="window">
              <div className="titlebar">
                <span className="truncate">{shortTitle.toUpperCase()}.EXE — StudyAssist</span>
                <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                  <span className="titlebar-btn">_</span>
                  <span className="titlebar-btn">□</span>
                  <span className="titlebar-btn">×</span>
                </div>
              </div>

              <div className="bg-paper">
                {/* Hero */}
                <section className="px-5 sm:px-10 pt-10 pb-8 border-b border-chrome-shadow/30">
                  <div className="max-w-[720px]">
                    <h1 className="font-display leading-[1.4] text-[clamp(20px,4.5vw,40px)] break-words text-ink mb-5">
                      {h1}
                    </h1>
                    <p className="text-[17px] text-ink-soft leading-[1.7] mb-8">{tagline}</p>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild size="lg">
                        <Link href="/?go=order">
                          Оставить заявку
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg">
                        <Link href="/contacts">Задать вопрос</Link>
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Key stats — mono, price block legible */}
                <section className="px-5 sm:px-10 py-8 bg-chrome/25 border-b border-chrome-shadow/30">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {[
                      { value: price,      label: 'Начальная цена' },
                      { value: volume,     label: 'Объём работы' },
                      { value: uniqueness, label: 'Уникальность' },
                      { value: '≤ 30 мин', label: 'Время ответа' },
                    ].map((s) => (
                      <div key={s.label} className="text-center sm:text-left">
                        <div className="font-mono font-bold text-title text-[clamp(20px,3vw,28px)] leading-none mb-1.5">
                          {s.value}
                        </div>
                        <div className="text-xs text-ink-soft">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* What's included */}
                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Что входит в работу</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {included.map((item) => (
                      <div key={item} className="flex items-start gap-3 bg-chrome/20 border border-chrome-shadow/30 p-3">
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-ink leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Guarantees */}
                <section className="px-5 sm:px-10 py-10 bg-chrome/25 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Наши обязательства</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {guarantees.map(({ icon: Icon, title, text }) => (
                      <div key={title} className="window">
                        <div className="bg-paper p-4">
                          <div className="w-9 h-9 bg-title/10 border border-chrome-shadow/30 flex items-center justify-center mb-3">
                            <Icon className="w-4 h-4 text-title" />
                          </div>
                          <div className="font-bold text-sm text-ink mb-1.5">{title}</div>
                          <div className="text-xs text-ink-soft leading-[1.6]">{text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Process */}
                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Как мы работаем</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((s) => (
                      <div key={s.n}>
                        <div className="font-mono font-bold text-title/25 text-[56px] leading-none mb-2 select-none">
                          {s.n}
                        </div>
                        <h3 className="font-bold text-base text-ink mb-2">{s.title}</h3>
                        <p className="text-sm text-ink-soft leading-[1.7]">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Price CTA */}
                <section className="px-5 sm:px-10 py-12 bg-title text-center border-b border-chrome-shadow/30">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-[1.5px] mb-3">Стоимость</p>
                  <div className="font-mono font-bold text-accent text-[clamp(32px,6vw,56px)] leading-none mb-3">
                    от {price}
                  </div>
                  <p className="text-white/80 text-sm mb-7">
                    Точную цену называем после изучения задачи — до копейки, без скрытых доплат
                  </p>
                  <Button asChild variant="amber" size="lg" className="h-auto min-h-[44px] py-3 whitespace-normal text-center leading-snug">
                    <Link href="/?go=order">Оставить заявку — бесплатно</Link>
                  </Button>
                </section>

                {/* FAQ */}
                <section className="px-5 sm:px-10 py-10">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Частые вопросы</h2>
                  <Accordion type="single" collapsible className="max-w-[760px]">
                    {faq.map(({ q, a }) => (
                      <AccordionItem key={q} value={q}>
                        <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                        <AccordionContent>{a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>

                {/* Bottom CTA */}
                <section className="px-5 sm:px-10 py-10 bg-chrome/25">
                  <div className="window">
                    <div className="bg-paper p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div>
                        <h2 className="font-display text-xl text-ink mb-2">Готовы начать?</h2>
                        <p className="text-ink-soft text-sm">Опишите задачу — ответим за 30 минут и согласуем детали</p>
                      </div>
                      <Button asChild size="lg" className="flex-shrink-0">
                        <Link href="/?go=order">Оставить заявку →</Link>
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
