import Link from 'next/link'
import { FileText, Folder } from 'lucide-react'
import { prisma } from '@/lib/prisma'

async function getPortfolioPreview() {
  return prisma.portfolioItem.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: 6,
    select: {
      id: true, title: true, workType: true, subject: true,
      previewText: true, description: true,
    },
  }).catch(() => []) // ponytail: DB down → empty section instead of crashing the page
}

const WORK_TYPE_LABELS: Record<string, string> = {
  essay:        'Реферат',
  coursework:   'Курсовая',
  diploma:      'Дипломная',
  lab:          'Лабораторная',
  presentation: 'Презентация',
  other:        'Другое',
}

export async function PortfolioPreviewSection() {
  const items = await getPortfolioPreview()

  if (items.length === 0) return null

  return (
    <section id="portfolio" className="bg-desk dither py-16 lg:py-24">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="window pixel-shadow">
          <div className="titlebar">
            <span className="flex items-center gap-2 truncate">
              <Folder className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              Проводник — Примеры работ
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="titlebar-btn" aria-hidden="true">_</span>
              <span className="titlebar-btn" aria-hidden="true">□</span>
              <span className="titlebar-btn" aria-hidden="true">×</span>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-black text-ink mb-2">Примеры работ</h2>
                <p className="text-ink-soft text-sm md:text-base">Фрагменты реальных работ — убедитесь в качестве до заказа</p>
              </div>
              <Link
                href="/portfolio"
                className="btn-95 flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold"
              >
                Все примеры →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bevel-out bg-paper p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="bevel-out bg-chrome w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-title" aria-hidden="true" />
                    </div>
                    <span className="bg-title text-white text-[11px] font-bold uppercase tracking-[.6px] px-2 py-1">
                      {WORK_TYPE_LABELS[item.workType] ?? item.workType}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-[15px] text-ink leading-snug mb-1">
                      {item.title}
                    </h3>
                    {item.subject && (
                      <p className="text-[12px] text-ink-soft">{item.subject}</p>
                    )}
                  </div>

                  {item.previewText && (
                    <div className="bevel-in bg-chrome/30 p-3 flex-1">
                      <p className="text-[12.5px] text-ink-soft leading-[1.7] line-clamp-4 font-mono">
                        {item.previewText}
                      </p>
                    </div>
                  )}

                  {!item.previewText && item.description && (
                    <p className="text-[13px] text-ink-soft leading-[1.65] flex-1 line-clamp-3">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/portfolio"
                className="btn-95-primary inline-flex items-center gap-2 px-8 py-3.5 font-display text-[13px]"
              >
                Смотреть все примеры →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
