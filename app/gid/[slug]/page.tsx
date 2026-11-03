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
import { ChevronRight, Download } from 'lucide-react'
import { guides, getGuide, type GuideBlock, type GuideCta } from '@/lib/guides'

interface PageProps {
  params: { slug: string }
}

const SITE = 'https://studyassist.ru'

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const guide = getGuide(params.slug)
  if (!guide) return {}
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/gid/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${SITE}/gid/${guide.slug}`,
      type: 'article',
      modifiedTime: guide.updated,
    },
  }
}

function formatDate(iso: string) {
  return iso.split('-').reverse().join('.')
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'p':
      return <p className="text-base text-ink leading-[1.75] max-w-[72ch]">{block.text}</p>
    case 'ul':
      return (
        <ul className="list-disc pl-6 space-y-2 text-base text-ink leading-[1.7] max-w-[72ch] marker:text-title">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="list-decimal pl-6 space-y-2 text-base text-ink leading-[1.7] max-w-[72ch] marker:font-mono marker:font-bold marker:text-title">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )
    case 'table':
      return (
        <div className="overflow-x-auto border border-chrome-shadow/40">
          <table className="w-full min-w-[520px] border-collapse text-sm text-ink">
            <thead>
              <tr className="bg-chrome/40">
                {block.head.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="text-left font-bold p-3 border-b border-chrome-shadow/40 align-top"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className={i % 2 ? 'bg-chrome/15' : undefined}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={
                        'p-3 border-t border-chrome-shadow/25 align-top leading-[1.6]' +
                        (j === 0 ? ' font-bold' : '')
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'sample':
      return (
        <div className="window max-w-[760px]">
          <div className="titlebar">
            <span className="truncate">ОБРАЗЕЦ.EXE</span>
            <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
              <span className="titlebar-btn">_</span>
              <span className="titlebar-btn">□</span>
              <span className="titlebar-btn">×</span>
            </div>
          </div>
          <div className="bg-paper p-5 sm:p-6 border border-chrome-shadow/30">
            <div className="text-xs font-mono font-bold uppercase tracking-[1.5px] text-ink-soft mb-3">
              {block.title}
            </div>
            <div className="space-y-3 text-[15px] text-ink leading-[1.7]">
              {block.text.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      )
  }
}

function SoftCta({ cta }: { cta: GuideCta }) {
  return (
    <div className="window my-10 max-w-[760px]">
      <div className="bg-paper p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <h2 className="font-display text-lg text-ink mb-2 leading-[1.4]">{cta.title}</h2>
          <p className="text-sm text-ink-soft leading-[1.7]">{cta.text}</p>
        </div>
        <Button asChild size="lg" className="flex-shrink-0">
          <Link href={cta.href}>
            {cta.label}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function GuidePage({ params }: PageProps) {
  const guide = getGuide(params.slug)
  if (!guide) notFound()

  const related = guides.find((g) => g.slug === guide.relatedSlug)
  const url = `${SITE}/gid/${guide.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: guide.h1,
        description: guide.description,
        inLanguage: 'ru',
        datePublished: guide.updated,
        dateModified: guide.updated,
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'StudyAssist', url: SITE },
        publisher: { '@type': 'Organization', name: 'StudyAssist', url: SITE },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Гайды', item: `${SITE}/gid` },
          { '@type': 'ListItem', position: 3, name: guide.shortName, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: guide.faq.map(({ q, a }) => ({
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
                <li><Link href="/gid" className="hover:text-accent transition-colors">Гайды</Link></li>
                <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                <li className="text-white/90" aria-current="page">{guide.shortName}</li>
              </ol>
            </nav>

            {/* Document window */}
            <article className="window">
              <div className="titlebar">
                <span className="truncate">{guide.shortName.toUpperCase()}.EXE — StudyAssist</span>
                <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                  <span className="titlebar-btn">_</span>
                  <span className="titlebar-btn">□</span>
                  <span className="titlebar-btn">×</span>
                </div>
              </div>

              <div className="bg-paper">
                {/* Hero */}
                <header className="px-5 sm:px-10 pt-10 pb-8 border-b border-chrome-shadow/30">
                  <div className="max-w-[720px]">
                    <h1 className="font-display leading-[1.4] text-[clamp(20px,4.5vw,36px)] break-words text-ink mb-4">
                      {guide.h1}
                    </h1>
                    <p className="text-xs font-mono text-ink-soft mb-5">
                      Обновлено <time dateTime={guide.updated}>{formatDate(guide.updated)}</time>
                    </p>
                    <p className="text-[17px] text-ink-soft leading-[1.7] mb-6">{guide.lead}</p>
                    {guide.download && (
                      <Button asChild variant="outline" size="lg">
                        <a href={guide.download.href} download>
                          <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                          {guide.download.label}
                        </a>
                      </Button>
                    )}
                  </div>
                </header>

                {/* Table of contents */}
                <nav aria-label="Содержание" className="px-5 sm:px-10 py-8 bg-chrome/25 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-lg text-ink mb-4">Содержание</h2>
                  <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 max-w-[860px] list-decimal pl-6 marker:font-mono marker:text-ink-soft">
                    {guide.toc.map((t) => (
                      <li key={t.id} className="text-sm leading-snug">
                        <a href={`#${t.id}`} className="text-title hover:text-accent transition-colors">
                          {t.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>

                {/* Body */}
                <div className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  {guide.sections.map((section) => (
                    <div key={section.id}>
                      <section id={section.id} className="scroll-mt-6 mb-12 last:mb-0">
                        <h2 className="font-display text-xl sm:text-2xl text-ink leading-[1.4] mb-5 max-w-[720px]">
                          {section.h2}
                        </h2>
                        <div className="space-y-5">
                          {section.blocks.map((block, i) => (
                            <Block key={i} block={block} />
                          ))}
                        </div>
                      </section>
                      {guide.midCta.afterSection === section.id && <SoftCta cta={guide.midCta} />}
                    </div>
                  ))}

                  {guide.download && (
                    <div className="window max-w-[760px] mt-12">
                      <div className="bg-paper p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="text-sm text-ink leading-[1.7]">
                          Шаблон в формате Word: заполните поля в квадратных скобках и сверьте с методичкой своей кафедры.
                        </p>
                        <Button asChild size="lg" className="flex-shrink-0">
                          <a href={guide.download.href} download>
                            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                            {guide.download.label}
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ */}
                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Частые вопросы</h2>
                  <Accordion type="single" collapsible className="max-w-[760px]">
                    {guide.faq.map(({ q, a }) => (
                      <AccordionItem key={q} value={q}>
                        <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                        <AccordionContent>{a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>

                {/* Read also */}
                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Читайте также</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[860px]">
                    {related && (
                      <li>
                        <Link
                          href={`/gid/${related.slug}`}
                          className="flex items-center justify-between gap-2 bg-chrome/20 border border-chrome-shadow/30 p-3 text-sm font-bold text-title hover:text-accent transition-colors"
                        >
                          <span>{related.shortName}</span>
                          <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link
                        href="/otchet-po-praktike"
                        className="flex items-center justify-between gap-2 bg-chrome/20 border border-chrome-shadow/30 p-3 text-sm font-bold text-title hover:text-accent transition-colors"
                      >
                        <span>Помощь с отчётом по практике</span>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  </ul>
                </section>

                {/* Closing CTA */}
                <section className="px-5 sm:px-10 py-10 bg-chrome/25">
                  <div className="window">
                    <div className="bg-paper p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div>
                        <h2 className="font-display text-xl text-ink mb-2 leading-[1.4]">{guide.endCta.title}</h2>
                        <p className="text-ink-soft text-sm leading-[1.7] max-w-[560px]">{guide.endCta.text}</p>
                      </div>
                      <Button asChild size="lg" className="flex-shrink-0">
                        <Link href={guide.endCta.href}>{guide.endCta.label} →</Link>
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
