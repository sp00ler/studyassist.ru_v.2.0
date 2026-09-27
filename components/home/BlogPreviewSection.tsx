import Link from 'next/link'
import { FileText } from 'lucide-react'
import { prisma } from '@/lib/prisma'

async function getLatestPosts() {
  return prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: {
      id: true, type: true, title: true, slug: true,
      excerpt: true, coverImage: true, publishedAt: true, createdAt: true,
    },
  }).catch(() => []) // ponytail: DB down → empty section instead of crashing the page
}

function formatDate(d: Date | null) {
  if (!d) return ''
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d)
}

const TYPE_LABELS: Record<string, string> = { blog: 'Блог', news: 'Новости' }

export async function BlogPreviewSection() {
  const posts = await getLatestPosts()

  if (posts.length === 0) return null

  return (
    <section id="blog" className="bg-desk dither py-16 lg:py-24">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="window pixel-shadow">
          <div className="titlebar">
            <span className="flex items-center gap-2 truncate">
              <FileText className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              Блокнот — Полезные материалы
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
                <h2 className="font-display text-2xl md:text-3xl font-black text-ink mb-2">Полезные материалы</h2>
                <p className="text-ink-soft text-sm md:text-base">Советы для студентов, разбор тем, новости сервиса</p>
              </div>
              <Link
                href="/blog"
                className="btn-95 flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold"
              >
                Все статьи →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bevel-out bg-paper overflow-hidden flex flex-col hover:shadow-[3px_3px_0_0_rgb(var(--ink))] transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {post.coverImage ? (
                    <div className="aspect-[16/9] overflow-hidden border-b border-chrome-shadow">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-chrome border-b border-chrome-shadow flex items-center justify-center">
                      <span className="font-display font-black text-title/20 text-[40px]">SA</span>
                    </div>
                  )}
                  <div className="p-5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-title text-white text-[11px] font-bold uppercase tracking-[.6px] px-2 py-1">
                        {TYPE_LABELS[post.type] ?? post.type}
                      </span>
                      <span className="text-[12px] text-ink-soft font-mono">
                        {formatDate(post.publishedAt ?? post.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-bold text-[15px] text-ink leading-snug group-hover:text-title transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-[13px] text-ink-soft leading-[1.65] line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
