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
  openGraph: {
    title: 'Блог и новости — StudyAssist',
    description: 'Полезные статьи для студентов: как писать курсовые, дипломные, рефераты. Советы, лайфхаки, новости сервиса.',
    url: 'https://studyassist.ru/blog',
  },
}

const TYPE_LABELS: Record<string, string> = {
  blog: 'Блог',
  news: 'Новости',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Blog',
      '@id': 'https://studyassist.ru/blog/#blog',
      name: 'Блог и новости StudyAssist',
      description: 'Полезные статьи для студентов: как писать курсовые, дипломные, рефераты. Советы, лайфхаки, новости сервиса.',
      url: 'https://studyassist.ru/blog',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://studyassist.ru' },
        { '@type': 'ListItem', position: 2, name: 'Блог', item: 'https://studyassist.ru/blog' },
      ],
    },
  ],
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
  }).catch(() => []) // ponytail: DB down → empty state instead of 500

  const tabs = [
    { key: undefined, label: 'Все' },
    { key: 'blog',    label: 'Блог' },
    { key: 'news',    label: 'Новости' },
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
                <li className="text-white/90" aria-current="page">Блог</li>
              </ol>
            </nav>

            {/* Notepad window */}
            <div className="window">
              <div className="titlebar">
                <span className="truncate">БЛОКНОТ — Блог и новости</span>
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
                    Блог и новости
                  </h1>
                  <p className="text-base text-ink-soft max-w-[560px] leading-[1.7]">
                    Полезные статьи, советы для студентов и обновления сервиса
                  </p>

                  {/* Tabs */}
                  <div className="flex gap-2 mt-7 flex-wrap" role="tablist" aria-label="Тип публикации">
                    {tabs.map(tab => {
                      const active = tab.key === type
                      const href = tab.key ? `/blog?type=${tab.key}` : '/blog'
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
                  {posts.length === 0 ? (
                    <div className="text-center py-16 text-ink-soft">
                      <p className="text-lg font-bold text-ink mb-2">Статей пока нет</p>
                      <p className="text-sm">Скоро появятся — заходите позже</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {posts.map(post => (
                        <Link
                          key={post.id}
                          href={`/blog/${post.slug}`}
                          className="group window hover:-translate-y-0.5 transition-transform"
                        >
                          <div className="bg-paper">
                            {post.coverImage ? (
                              <div className="aspect-[16/9] overflow-hidden border-b border-chrome-shadow/30">
                                <img
                                  src={post.coverImage}
                                  alt={post.title}
                                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            ) : (
                              <div className="aspect-[16/9] bg-chrome/30 border-b border-chrome-shadow/30 flex items-center justify-center">
                                <span className="font-display text-title/20 text-4xl">SA</span>
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="px-2.5 py-1 bg-title/10 text-title text-[11px] font-bold uppercase tracking-[.6px]">
                                  {TYPE_LABELS[post.type] ?? post.type}
                                </span>
                                <span className="text-xs text-ink-soft font-mono">
                                  {formatDate(post.publishedAt ?? post.createdAt)}
                                </span>
                              </div>
                              <h2 className="font-bold text-sm text-ink leading-snug mb-2 group-hover:text-title transition-colors line-clamp-2">
                                {post.title}
                              </h2>
                              {post.excerpt && (
                                <p className="text-xs text-ink-soft leading-[1.65] line-clamp-3">
                                  {post.excerpt}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
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
