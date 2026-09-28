import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Calendar, ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    select: { title: true, excerpt: true, coverImage: true, published: true },
  })
  if (!post || !post.published) return {}
  const title = `${post.title} — StudyAssist`
  return {
    title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${params.slug}` },
    openGraph: {
      title,
      description: post.excerpt ?? undefined,
      url: `https://studyassist.ru/blog/${params.slug}`,
      type: 'article',
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  }
}

function formatDate(d: Date | null) {
  if (!d) return ''
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

const TYPE_LABELS: Record<string, string> = {
  blog: 'Блог',
  news: 'Новости',
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
  })

  if (!post || !post.published) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt ?? undefined,
        image: post.coverImage ?? undefined,
        datePublished: (post.publishedAt ?? post.createdAt)?.toISOString(),
        author: { '@type': 'Organization', name: 'StudyAssist' },
        publisher: { '@type': 'Organization', name: 'StudyAssist', url: 'https://studyassist.ru' },
        mainEntityOfPage: `https://studyassist.ru/blog/${params.slug}`,
        url: `https://studyassist.ru/blog/${params.slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://studyassist.ru' },
          { '@type': 'ListItem', position: 2, name: 'Блог', item: 'https://studyassist.ru/blog' },
          { '@type': 'ListItem', position: 3, name: post.title, item: `https://studyassist.ru/blog/${params.slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-desk dither">
        <Navbar />
        <main id="main-content" className="pt-6 pb-16 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[840px] mx-auto">

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex items-center gap-1.5 text-xs font-mono text-white flex-wrap">
                <li><Link href="/" className="hover:text-accent transition-colors">Главная</Link></li>
                <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                <li><Link href="/blog" className="hover:text-accent transition-colors">Блог</Link></li>
                <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                <li className="text-white/90 truncate max-w-[220px]" aria-current="page">{post.title}</li>
              </ol>
            </nav>

            {/* Notepad window */}
            <div className="window">
              <div className="titlebar">
                <span className="truncate">БЛОКНОТ — {post.title}</span>
                <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                  <span className="titlebar-btn">_</span>
                  <span className="titlebar-btn">□</span>
                  <span className="titlebar-btn">×</span>
                </div>
              </div>

              <div className="bg-paper">
                <article className="px-5 sm:px-10 py-10">

                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-2.5 py-1 bg-title/10 text-title text-[11px] font-bold uppercase tracking-[.6px]">
                      {TYPE_LABELS[post.type] ?? post.type}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-ink-soft font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </span>
                  </div>

                  <h1 className="font-display text-[clamp(22px,4vw,40px)] leading-[1.4] text-ink mb-6 max-w-[70ch]">
                    {post.title}
                  </h1>

                  {post.excerpt && (
                    <p className="text-lg text-ink-soft leading-[1.7] mb-8 pb-8 border-b border-chrome-shadow/30 max-w-[70ch]">
                      {post.excerpt}
                    </p>
                  )}

                  {post.coverImage && (
                    <div className="mb-10 border border-chrome-shadow/30">
                      <img src={post.coverImage} alt={post.title} className="w-full object-cover" />
                    </div>
                  )}

                  {/* Content — 18px Tiny5 body, ~70ch measure for readability */}
                  <div
                    className="prose-sa max-w-[70ch]"
                    style={{ color: 'rgb(var(--ink))', fontSize: '18px', lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />

                  {/* Back */}
                  <div className="mt-16 pt-8 border-t border-chrome-shadow/30">
                    <Link
                      href="/blog"
                      className="inline-flex items-center gap-2 text-xs text-ink-soft hover:text-title transition-colors font-bold"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Все статьи
                    </Link>
                  </div>
                </article>

                {/* CTA */}
                <div className="px-5 sm:px-10 py-12 bg-title text-center">
                  <h2 className="font-display text-xl text-white mb-3">
                    Нужна помощь с учёбой?
                  </h2>
                  <p className="text-sm text-white/80 mb-7">Оставьте заявку — ответим за 30 минут</p>
                  <Button asChild variant="amber" size="lg">
                    <Link href="/?go=order">Оставить заявку →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
