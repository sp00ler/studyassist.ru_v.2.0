import Link from 'next/link'
import { FileText } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

const getPortfolioPreview = unstable_cache(
  async () => prisma.portfolioItem.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: 6,
    select: {
      id: true, title: true, workType: true, subject: true,
      previewText: true, description: true,
    },
  }),
  ['portfolio-preview'],
  { revalidate: 3600 },
)

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
      className="bg-[#0E0E1C] border-t border-b border-white/[.06]"
    >
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-20 lg:py-28">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="section-tag">// Портфолио</span>
            <h2 className="section-heading">Примеры работ</h2>
            <p className="section-sub">Фрагменты реальных работ — убедитесь в качестве до заказа</p>
          </div>
          <Link
            href="/portfolio"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-[#F0F0EC] text-[13px] font-bold hover:border-[#C5FF45]/30 hover:text-[#C5FF45] transition-all"
          >
            Все примеры →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-[#141428] border border-white/[.06] rounded-2xl p-6 hover:border-[#C5FF45]/[.22] transition-all flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#C5FF45]/10 border border-[#C5FF45]/[.18] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-[#C5FF45]" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#C5FF45]/10 text-[#C5FF45] text-[11px] font-bold uppercase tracking-[.6px]">
                  {WORK_TYPE_LABELS[item.workType] ?? item.workType}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-[15px] text-[#F0F0EC] leading-snug mb-1">
                  {item.title}
                </h3>
                {item.subject && (
                  <p className="text-[12px] text-[#6A6A88]">{item.subject}</p>
                )}
              </div>

              {item.previewText && (
                <div className="bg-[#0E0E1C] border border-white/[.04] rounded-xl p-4 flex-1">
                  <p className="text-[13px] text-[#8A8A9A] leading-[1.7] line-clamp-4 font-mono">
                    {item.previewText}
                  </p>
                </div>
              )}

              {!item.previewText && item.description && (
                <p className="text-[13px] text-[#6A6A88] leading-[1.65] flex-1 line-clamp-3">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 text-[#F0F0EC] font-bold font-unbounded text-[13px] hover:border-[#C5FF45]/30 hover:text-[#C5FF45] transition-all"
          >
            Смотреть все примеры →
          </Link>
        </div>
      </div>
    </section>
  )
}
