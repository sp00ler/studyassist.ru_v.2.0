import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { problemTopics, getProblemTopic } from '@/lib/problem-topics'

interface PageProps {
  params: { razdel: string }
}

export function generateStaticParams() {
  return problemTopics.map((t) => ({ razdel: t.slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const topic = getProblemTopic(params.razdel)
  if (!topic) return {}
  return {
    title: topic.title,
    description: topic.description,
    alternates: { canonical: `/reshenie-zadach/${topic.slug}` },
    openGraph: {
      title: topic.title,
      description: topic.description,
      url: `https://studyassist.ru/reshenie-zadach/${topic.slug}`,
      type: 'website',
    },
  }
}

export default function ProblemTopicPage({ params }: PageProps) {
  const topic = getProblemTopic(params.razdel)
  if (!topic) notFound()

  const others = problemTopics.filter((t) => t.slug !== topic.slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://studyassist.ru' },
          { '@type': 'ListItem', position: 2, name: 'Решение задач', item: 'https://studyassist.ru/reshenie-zadach' },
          { '@type': 'ListItem', position: 3, name: topic.name, item: `https://studyassist.ru/reshenie-zadach/${topic.slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: topic.faq.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  }

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
                <li><Link href="/reshenie-zadach" className="hover:text-accent transition-colors">Решение задач</Link></li>
                <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                <li className="text-white/90" aria-current="page">{topic.name}</li>
              </ol>
            </nav>

            {/* Document window */}
            <div className="window">
              <div className="titlebar">
                <span className="truncate">{topic.name.toUpperCase()}.EXE — StudyAssist</span>
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
                      {topic.h1}
                    </h1>
                    <p className="text-[17px] text-ink-soft leading-[1.7] mb-6">{topic.intro}</p>
                    <p className="text-sm text-ink-soft mb-8">
                      Стоимость: <span className="font-mono font-bold text-title">от 550 ₽ за задачу</span>.
                      Точную цену называем после изучения условия.
                    </p>
                    <Button asChild size="lg">
                      <Link href="/?go=order">
                        Оставить заявку
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </section>

                {/* Problem types */}
                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Какие задачи разбираем</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {topic.problemTypes.map((item) => (
                      <li key={item} className="flex items-start gap-3 bg-chrome/20 border border-chrome-shadow/30 p-3">
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-sm text-ink leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Worked examples */}
                <section className="px-5 sm:px-10 py-10 bg-chrome/25 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-2">Примеры решений</h2>
                  <p className="text-sm text-ink-soft leading-[1.7] mb-6 max-w-[720px]">
                    Так выглядит наш разбор: условие, ход решения по шагам и проверенный ответ.
                  </p>
                  <div className="grid grid-cols-1 gap-6">
                    {topic.examples.map((ex, i) => (
                      <article key={ex.title} className="window">
                        <div className="titlebar">
                          <span className="truncate">ПРИМЕР {i + 1}.EXE</span>
                          <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                            <span className="titlebar-btn">_</span>
                            <span className="titlebar-btn">□</span>
                            <span className="titlebar-btn">×</span>
                          </div>
                        </div>
                        <div className="bg-paper p-5 sm:p-6">
                          <h3 className="font-bold text-base text-ink mb-4">{ex.title}</h3>

                          <div className="mb-5">
                            <div className="text-xs font-mono font-bold uppercase tracking-[1.5px] text-ink-soft mb-1.5">Условие</div>
                            <p className="text-sm text-ink leading-[1.7]">{ex.statement}</p>
                          </div>

                          <div className="mb-5">
                            <div className="text-xs font-mono font-bold uppercase tracking-[1.5px] text-ink-soft mb-2">Решение</div>
                            <ol className="space-y-2">
                              {ex.steps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <span className="font-mono font-bold text-title text-sm flex-shrink-0 w-6">{idx + 1}.</span>
                                  <span className="text-sm text-ink leading-[1.7] break-words min-w-0">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div className="bg-chrome/30 border border-chrome-shadow/40 p-3">
                            <div className="text-xs font-mono font-bold uppercase tracking-[1.5px] text-ink-soft mb-1">Ответ</div>
                            <p className="font-mono font-bold text-title text-sm sm:text-base leading-snug break-words">{ex.answer}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                {/* Common mistakes */}
                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Типичные ошибки</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {topic.commonMistakes.map((m) => (
                      <li key={m} className="bg-chrome/20 border border-chrome-shadow/30 p-3 text-sm text-ink leading-[1.6]">
                        {m}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Price CTA */}
                <section className="px-5 sm:px-10 py-12 bg-title text-center border-b border-chrome-shadow/30">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-[1.5px] mb-3">Стоимость</p>
                  <div className="font-mono font-bold text-accent text-[clamp(32px,6vw,56px)] leading-none mb-3">
                    от 550 ₽ за задачу
                  </div>
                  <p className="text-white/80 text-sm mb-7">
                    Пришлите условие — оценим объём и назовём итоговую цену, включая работу на заказ по вашему варианту
                  </p>
                  <Button asChild variant="amber" size="lg" className="h-auto min-h-[44px] py-3 whitespace-normal text-center leading-snug">
                    <Link href="/?go=order">Оставить заявку — бесплатно</Link>
                  </Button>
                </section>

                {/* FAQ */}
                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Частые вопросы</h2>
                  <Accordion type="single" collapsible className="max-w-[760px]">
                    {topic.faq.map(({ q, a }) => (
                      <AccordionItem key={q} value={q}>
                        <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                        <AccordionContent>{a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>

                {/* Other topics */}
                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Другие разделы</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {others.map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/reshenie-zadach/${t.slug}`}
                          className="flex items-center justify-between gap-2 bg-chrome/20 border border-chrome-shadow/30 p-3 text-sm font-bold text-title hover:text-accent transition-colors"
                        >
                          <span>{t.name}</span>
                          <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-ink-soft mt-4">
                    <Link href="/reshenie-zadach" className="text-title hover:text-accent transition-colors">Все разделы решения задач</Link>
                  </p>
                </section>

                {/* Bottom CTA */}
                <section className="px-5 sm:px-10 py-10 bg-chrome/25">
                  <div className="window">
                    <div className="bg-paper p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div>
                        <h2 className="font-display text-xl text-ink mb-2">Нужна помощь с вашим вариантом?</h2>
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
