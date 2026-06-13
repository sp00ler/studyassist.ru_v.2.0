import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Блог и новости — StudyAssist',
  description: 'Полезные статьи для студентов: как писать курсовые, дипломные, рефераты. Советы, лайфхаки, новости сервиса.',
  alternates: { canonical: '/blog' },
}

const TYPE_LABELS: Record<string, string> = {
  blog: 'Блог',
  news: 'Новости',
}

function formatDate(d: Date | null) {
  if (!d) return ''
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { type?: string }
}) {
  const type = searchParams.type && ['blog', 'news'].includes(searchParams.type)
    ? searchParams.type
    : undefined

  const posts = await prisma.post.findMany({
    where: { published: true, ...(type ? { type } : {}) },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, type: true, title: true, slug: true,
      excerpt: true, coverImage: true, publishedAt: true, createdAt: true,
    },
  })

  const tabs = [
    { key: undefined, label: 'Все' },
    { key: 'blog',    label: 'Блог' },
    { key: 'news',    label: 'Новости' },
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
              <li className="text-[#F0F0EC]" aria-current="page">Блог</li>
            </ol>
          </nav>
        </div>

        {/* Header */}
        <section className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-14">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5FF45]/10 border border-[#C5FF45]/[.18] text-[#C5FF45] text-[11px] font-bold uppercase tracking-[.8px] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF45] animate-pulse" />
            Материалы
          </span>
          <h1 className="font-unbounded font-black text-[clamp(28px,5vw,48px)] tracking-[-2px] leading-[1.1] mb-4">
            Блог и новости
          </h1>
          <p className="text-[16px] text-[#6A6A88] max-w-[560px] leading-[1.75]">
            Полезные статьи, советы для студентов и обновления сервиса
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mt-8 flex-wrap">
            {tabs.map(tab => {
              const active = tab.key === type
              const href = tab.key ? `/blog?type=${tab.key}` : '/blog'
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
          {posts.length === 0 ? (
            <div className="text-center py-20 text-[#6A6A88]">
              <p className="text-[18px] font-bold mb-2">Статей пока нет</p>
              <p className="text-[14px]">Скоро появятся — заходите позже</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-[#0E0E1C] border border-white/[.06] rounded-2xl overflow-hidden hover:border-[#C5FF45]/[.22] transition-all hover:-translate-y-0.5"
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
                    <div className="aspect-[16/9] bg-[#141428] flex items-center justify-center">
                      <span className="font-unbounded font-black text-[#C5FF45]/10 text-[48px]">SA</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-[#C5FF45]/10 text-[#C5FF45] text-[11px] font-bold uppercase tracking-[.6px]">
                        {TYPE_LABELS[post.type] ?? post.type}
                      </span>
                      <span className="text-[12px] text-[#6A6A88]">
                        {formatDate(post.publishedAt ?? post.createdAt)}
                      </span>
                    </div>
                    <h2 className="font-bold text-[15px] text-[#F0F0EC] leading-snug mb-2 group-hover:text-[#C5FF45] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-[13px] text-[#6A6A88] leading-[1.65] line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>
      <Footer />
    </div>
  )
}
