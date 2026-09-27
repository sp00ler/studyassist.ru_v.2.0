import Link from 'next/link'
import { FileText } from 'lucide-react'
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
    <section
      id="portfolio"
      className="bg-[#211C15] border-t border-b border-white/[.06]"
    >
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-20 lg:py-28">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <h2 className="section-heading">Примеры работ</h2>
            <p className="section-sub">Фрагменты реальных работ — убедитесь в качестве до заказа</p>
          </div>
          <Link
            href="/portfolio"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-[#F5F0E3] text-[13px] font-bold hover:border-[#2FAE5B]/30 hover:text-[#2FAE5B] transition-all"
          >
            Все примеры →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-[#2A2118] border border-white/[.06] rounded-2xl p-6 hover:border-[#2FAE5B]/[.22] transition-all flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2FAE5B]/10 border border-[#2FAE5B]/[.18] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-[#2FAE5B]" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#2FAE5B]/10 text-[#2FAE5B] text-[11px] font-bold uppercase tracking-[.6px]">
                  {WORK_TYPE_LABELS[item.workType] ?? item.workType}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-[15px] text-[#F5F0E3] leading-snug mb-1">
                  {item.title}
                </h3>
                {item.subject && (
                  <p className="text-[12px] text-[#6B6255]">{item.subject}</p>
                )}
              </div>

              {item.previewText && (
                <div className="bg-[#211C15] border border-white/[.04] rounded-xl p-4 flex-1">
                  <p className="text-[13px] text-[#8A7F6D] leading-[1.7] line-clamp-4 font-mono">
                    {item.previewText}
                  </p>
                </div>
              )}

              {!item.previewText && item.description && (
                <p className="text-[13px] text-[#6B6255] leading-[1.65] flex-1 line-clamp-3">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 text-[#F5F0E3] font-bold font-unbounded text-[13px] hover:border-[#2FAE5B]/30 hover:text-[#2FAE5B] transition-all"
          >
            Смотреть все примеры →
          </Link>
        </div>
      </div>
    </section>
  )
}
