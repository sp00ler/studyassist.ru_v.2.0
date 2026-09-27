import Link from 'next/link'
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
  })
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
    <section id="blog" className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-20 lg:py-28">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <h2 className="section-heading">Полезные материалы</h2>
          <p className="section-sub">Советы для студентов, разбор тем, новости сервиса</p>
        </div>
        <Link
          href="/blog"
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-[#F5F0E3] text-[13px] font-bold hover:border-[#2FAE5B]/30 hover:text-[#2FAE5B] transition-all"
        >
          Все статьи →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map(post => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group bg-[#211C15] border border-white/[.06] rounded-2xl overflow-hidden hover:border-[#2FAE5B]/[.22] transition-all hover:-translate-y-0.5"
          >
            {post.coverImage ? (
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] bg-[#2A2118] flex items-center justify-center">
                <span className="font-unbounded font-black text-[#2FAE5B]/10 text-[48px]">SA</span>
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-[#2FAE5B]/10 text-[#2FAE5B] text-[11px] font-bold uppercase tracking-[.6px]">
                  {TYPE_LABELS[post.type] ?? post.type}
                </span>
                <span className="text-[12px] text-[#6B6255]">
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </span>
              </div>
              <h3 className="font-bold text-[15px] text-[#F5F0E3] leading-snug mb-2 group-hover:text-[#2FAE5B] transition-colors line-clamp-2">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-[13px] text-[#6B6255] leading-[1.65] line-clamp-2">
                  {post.excerpt}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
