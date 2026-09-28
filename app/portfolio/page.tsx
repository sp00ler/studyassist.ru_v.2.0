import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Примеры курсовых, дипломов и рефератов — StudyAssist',
  description: 'Примеры выполненных курсовых, дипломных, рефератов и других студенческих работ. Убедитесь в качестве до заказа.',
  alternates: { canonical: '/portfolio' },
  openGraph: {
    title: 'Примеры курсовых, дипломов и рефератов — StudyAssist',
    description: 'Примеры выполненных курсовых, дипломных, рефератов и других студенческих работ. Убедитесь в качестве до заказа.',
    url: 'https://studyassist.ru/portfolio',
  },
}

const WORK_TYPE_LABELS: Record<string, string> = {
  essay:        'Реферат',
  coursework:   'Курсовая',
  diploma:      'Дипломная',
  lab:          'Лабораторная',
  presentation: 'Презентация',
  other:        'Другое',
}

const WORK_TYPE_ORDER = ['coursework', 'diploma', 'essay', 'lab', 'presentation', 'other']

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': 'https://studyassist.ru/portfolio/#collection',
      name: 'Примеры работ',
      description: 'Примеры выполненных курсовых, дипломных, рефератов и других студенческих работ.',
      url: 'https://studyassist.ru/portfolio',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://studyassist.ru' },
        { '@type': 'ListItem', position: 2, name: 'Примеры работ', item: 'https://studyassist.ru/portfolio' },
      ],
    },
  ],
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: { workType?: string }
}) {
  const workType = searchParams.workType && WORK_TYPE_ORDER.includes(searchParams.workType)
    ? searchParams.workType
    : undefined

  const items = await prisma.portfolioItem.findMany({
    where: { published: true, ...(workType ? { workType } : {}) },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, title: true, workType: true, subject: true,
      description: true, previewText: true, fileUrl: true,
    },
  }).catch(() => []) // ponytail: DB down → empty state instead of 500

  const tabs = [
    { key: undefined, label: 'Все' },
    ...WORK_TYPE_ORDER.map(k => ({ key: k, label: WORK_TYPE_LABELS[k] })),
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-desk dither">
        <Navbar />
        <main id="main-content" className="pt-6 pb-16 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[1100px] mx-auto">

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex items-center gap-1.5 text-xs font-mono text-white">
                <li><Link href="/" className="hover:text-accent transition-colors">Главная</Link></li>
                <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                <li className="text-white/90" aria-current="page">Примеры работ</li>
              </ol>
            </nav>

            {/* Explorer window */}
            <div className="window">
              <div className="titlebar">
                <span className="truncate">ПРОВОДНИК — Примеры работ</span>
                <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                  <span className="titlebar-btn">_</span>
                  <span className="titlebar-btn">□</span>
                  <span className="titlebar-btn">×</span>
                </div>
              </div>

              <div className="bg-paper">
                {/* Header */}
                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h1 className="font-display text-[clamp(22px,4.5vw,40px)] leading-[1.4] text-ink mb-4">
                    Примеры работ
                  </h1>
                  <p className="text-base text-ink-soft max-w-[560px] leading-[1.7]">
                    Фрагменты выполненных работ — убедитесь в качестве до заказа
                  </p>

                  {/* Tabs */}
                  <div className="flex gap-2 mt-7 flex-wrap" role="tablist" aria-label="Тип работы">
                    {tabs.map(tab => {
                      const active = tab.key === workType
                      const href = tab.key ? `/portfolio?workType=${tab.key}` : '/portfolio'
                      return (
                        <Link
                          key={tab.label}
                          href={href}
                          aria-current={active ? 'true' : undefined}
                          className={`px-4 py-2 text-[11px] font-display transition-colors border border-chrome-shadow ${
                            active
                              ? 'bg-title text-white'
                              : 'bg-chrome text-ink hover:bg-chrome-light/60'
                          }`}
                        >
                          {tab.label}
                        </Link>
                      )
                    })}
                  </div>
                </section>

                {/* Grid */}
                <section className="px-5 sm:px-10 py-10">
                  {items.length === 0 ? (
                    <div className="text-center py-16 text-ink-soft">
                      <p className="text-lg font-bold text-ink mb-2">Примеров пока нет</p>
                      <p className="text-sm">Скоро добавим — заходите позже</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map(item => (
                        <div key={item.id} className="window">
                          <div className="bg-paper p-5 flex flex-col gap-3 h-full">
                            {/* Type badge */}
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-title/10 border border-chrome-shadow/30 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-title" />
                              </div>
                              <span className="px-2.5 py-1 bg-title/10 text-title text-[11px] font-bold uppercase tracking-[.6px]">
                                {WORK_TYPE_LABELS[item.workType] ?? item.workType}
                              </span>
                            </div>

                            {/* Title */}
                            <div>
                              <h2 className="font-bold text-sm text-ink leading-snug mb-1">
                                {item.title}
                              </h2>
                              {item.subject && (
                                <p className="text-xs text-ink-soft">{item.subject}</p>
                              )}
                            </div>

                            {/* Preview text */}
                            {item.previewText && (
                              <div className="bg-chrome/25 border border-chrome-shadow/20 p-3 flex-1">
                                <p className="text-xs text-ink-soft leading-[1.7] line-clamp-5 font-sans">
                                  {item.previewText}
                                </p>
                              </div>
                            )}

                            {/* Description */}
                            {item.description && !item.previewText && (
                              <p className="text-xs text-ink-soft leading-[1.65] flex-1">
                                {item.description}
                              </p>
                            )}

                            {/* File link */}
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-title font-bold hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Открыть PDF
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* CTA */}
                <section className="px-5 sm:px-10 py-12 bg-title text-center">
                  <h2 className="font-display text-xl sm:text-2xl text-white mb-3">
                    Нужна похожая работа?
                  </h2>
                  <p className="text-sm text-white/80 mb-7">
                    Опишите задачу — подберём специалиста и назовём цену за 30 минут
                  </p>
                  <Button asChild variant="amber" size="lg" className="h-auto min-h-[44px] py-3 whitespace-normal text-center leading-snug">
                    <Link href="/#order">Оставить заявку — бесплатно</Link>
                  </Button>
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
