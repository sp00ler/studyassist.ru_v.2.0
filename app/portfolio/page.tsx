import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Примеры работ — StudyAssist',
  description: 'Примеры выполненных курсовых, дипломных, рефератов и других студенческих работ. Убедитесь в качестве до заказа.',
  alternates: { canonical: '/portfolio' },
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
  })

  const tabs = [
    { key: undefined, label: 'Все' },
    ...WORK_TYPE_ORDER.map(k => ({ key: k, label: WORK_TYPE_LABELS[k] })),
  ]

  return (
    <div className="min-h-screen bg-[#07070E] text-[#F0F0EC]">
      <Navbar />
      <main id="main-content">

        {/* Breadcrumb */}
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 pt-6">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-[12px] text-[#6A6A88]">
              <li><Link href="/" className="hover:text-[#C5FF45] transition-colors">Главная</Link></li>
              <li><ChevronRight className="w-3 h-3" /></li>
              <li className="text-[#F0F0EC]" aria-current="page">Примеры работ</li>
            </ol>
          </nav>
        </div>

        {/* Header */}
        <section className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-14">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5FF45]/10 border border-[#C5FF45]/[.18] text-[#C5FF45] text-[11px] font-bold uppercase tracking-[.8px] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF45] animate-pulse" />
            Портфолио
          </span>
          <h1 className="font-unbounded font-black text-[clamp(28px,5vw,48px)] tracking-[-2px] leading-[1.1] mb-4">
            Примеры работ
          </h1>
          <p className="text-[16px] text-[#6A6A88] max-w-[560px] leading-[1.75]">
            Фрагменты выполненных работ — убедитесь в качестве до заказа
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mt-8 flex-wrap">
            {tabs.map(tab => {
              const active = tab.key === workType
              const href = tab.key ? `/portfolio?workType=${tab.key}` : '/portfolio'
              return (
                <Link
                  key={tab.label}
                  href={href}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    active
                      ? 'bg-[#C5FF45] text-[#07070E]'
                      : 'bg-[#0E0E1C] border border-white/[.08] text-[#6A6A88] hover:border-[#C5FF45]/30 hover:text-[#F0F0EC]'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </section>

        {/* Grid */}
        <section className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 pb-24">
          {items.length === 0 ? (
            <div className="text-center py-20 text-[#6A6A88]">
              <p className="text-[18px] font-bold mb-2">Примеров пока нет</p>
              <p className="text-[14px]">Скоро добавим — заходите позже</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-[#0E0E1C] border border-white/[.06] rounded-2xl p-6 hover:border-[#C5FF45]/[.22] transition-all flex flex-col gap-4"
                >
                  {/* Type badge */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#C5FF45]/10 border border-[#C5FF45]/[.18] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-[#C5FF45]" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#C5FF45]/10 text-[#C5FF45] text-[11px] font-bold uppercase tracking-[.6px]">
                      {WORK_TYPE_LABELS[item.workType] ?? item.workType}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h2 className="font-bold text-[15px] text-[#F0F0EC] leading-snug mb-1">
                      {item.title}
                    </h2>
                    {item.subject && (
                      <p className="text-[12px] text-[#6A6A88]">{item.subject}</p>
                    )}
                  </div>

                  {/* Preview text */}
                  {item.previewText && (
                    <div className="bg-[#141428] border border-white/[.04] rounded-xl p-4 flex-1">
                      <p className="text-[13px] text-[#8A8A9A] leading-[1.7] line-clamp-5 font-mono">
                        {item.previewText}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {item.description && !item.previewText && (
                    <p className="text-[13px] text-[#6A6A88] leading-[1.65] flex-1">
                      {item.description}
                    </p>
                  )}

                  {/* File link */}
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] text-[#C5FF45] font-bold hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Открыть PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#C5FF45]/[.06] to-[#7C3AED]/[.06] border-t border-[#C5FF45]/[.12]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-16 text-center">
            <h2 className="font-unbounded font-black text-[20px] sm:text-[24px] tracking-[-0.5px] mb-3">
              Нужна похожая работа?
            </h2>
            <p className="text-[14px] text-[#6A6A88] mb-6">
              Опиши задачу — подберём специалиста и назовём цену за 30 минут
            </p>
            <Link
              href="/#order"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[#C5FF45] text-[#07070E] font-black font-unbounded text-[13px] hover:bg-[#D4FF60] hover:shadow-[0_14px_40px_rgba(197,255,69,.3)] hover:-translate-y-0.5 transition-all"
            >
              Оставить заявку — бесплатно
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  )
}
