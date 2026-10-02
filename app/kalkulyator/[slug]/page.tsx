import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { ChevronRight } from 'lucide-react'
import { MatrixTool } from '@/components/tools/MatrixTool'
import { getMatrixPage, matrixPages } from '@/lib/matrix-pages'

const SITE = 'https://studyassist.ru'

export const dynamicParams = false

export function generateStaticParams() {
  return matrixPages.map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getMatrixPage(params.slug)
  if (!page) return {}
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/kalkulyator/${page.slug}` },
    openGraph: { title: page.title, description: page.description, url: `${SITE}/kalkulyator/${page.slug}`, type: 'website' },
  }
}

const h2 = 'font-display text-xl sm:text-2xl text-ink mb-4 leading-[1.4]'
const p = 'text-base text-ink leading-[1.75] max-w-[72ch]'
const link = 'text-title hover:text-accent transition-colors underline'

export default function MatrixCalculatorPage({ params }: { params: { slug: string } }) {
  const page = getMatrixPage(params.slug)
  if (!page) notFound()
  const url = `${SITE}/kalkulyator/${page.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: page.h1,
        url,
        description: page.description,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        inLanguage: 'ru',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE },
          { '@type': 'ListItem', position: 2, name: page.short, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ],
  }
  const others = matrixPages.filter((o) => o.slug !== page.slug)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-desk dither">
        <Navbar />
        <main id="main-content" className="pt-6 pb-16 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[1100px] mx-auto">
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-white">
                <li><Link href="/" className="hover:text-accent transition-colors">Главная</Link></li>
                <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                <li className="text-white/90" aria-current="page">{page.short}</li>
              </ol>
            </nav>

            <div className="mb-6 max-w-[760px]">
              <h1 className="font-display leading-[1.4] text-[clamp(20px,4.5vw,36px)] break-words text-white mb-3">{page.h1}</h1>
              <p className="text-[17px] text-white/90 leading-[1.7]">{page.lead}</p>
            </div>

            <MatrixTool op={page.op} />

            <article className="window mt-8">
              <div className="titlebar">
                <span className="truncate">ТЕОРИЯ.EXE — StudyAssist</span>
                <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                  <span className="titlebar-btn">_</span>
                  <span className="titlebar-btn">□</span>
                  <span className="titlebar-btn">×</span>
                </div>
              </div>

              <div className="bg-paper px-5 sm:px-10 py-10 space-y-10">
                {page.theory.map((t) => (
                  <section key={t.h2}>
                    <h2 className={h2}>{t.h2}</h2>
                    <div className="space-y-4">{t.paragraphs.map((x) => <p key={x} className={p}>{x}</p>)}</div>
                  </section>
                ))}

                <section aria-labelledby="others">
                  <h2 id="others" className={h2}>Другие калькуляторы матриц</h2>
                  <ul className="flex flex-wrap gap-3">
                    {others.map((o) => (
                      <li key={o.slug}><Link href={`/kalkulyator/${o.slug}`} className={link}>{o.short}</Link></li>
                    ))}
                  </ul>
                </section>

                <section aria-labelledby="faq">
                  <h2 id="faq" className={h2}>Частые вопросы</h2>
                  <Accordion type="single" collapsible className="max-w-[760px]">
                    {page.faq.map(({ q, a }) => (
                      <AccordionItem key={q} value={q}>
                        <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                        <AccordionContent>{a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>

                <section aria-label="Помощь с решением задач">
                  <div className="window max-w-[760px]">
                    <div className="bg-paper p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                      <div>
                        <h2 className="font-display text-lg text-ink mb-2 leading-[1.4]">Нужно разобраться с задачей целиком?</h2>
                        <p className="text-sm text-ink-soft leading-[1.7]">
                          Калькулятор считает, но не объясняет, почему задача решается именно так. Поможем разобрать задачи по линейной алгебре с оформлением по требованиям преподавателя.
                        </p>
                      </div>
                      <Button asChild size="lg" className="flex-shrink-0">
                        <Link href="/reshenie-zadach/lineynaya-algebra">
                          Подробнее
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            </article>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
