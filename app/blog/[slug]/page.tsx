import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Calendar, ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
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
  return {
    title: `${post.title} — StudyAssist`,
    description: post.excerpt ?? undefined,
    openGraph: post.coverImage ? { images: [post.coverImage] } : undefined,
    alternates: { canonical: `/blog/${params.slug}` },
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

  return (
    <div className="min-h-screen bg-[#07070E] text-[#F0F0EC]">
      <Navbar />
      <main id="main-content">

        {/* Breadcrumb */}
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-12 pt-6">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-[12px] text-[#6A6A88]">
              <li><Link href="/" className="hover:text-[#C5FF45] transition-colors">Главная</Link></li>
              <li><ChevronRight className="w-3 h-3" /></li>
              <li><Link href="/blog" className="hover:text-[#C5FF45] transition-colors">Блог</Link></li>
              <li><ChevronRight className="w-3 h-3" /></li>
              <li className="text-[#F0F0EC] truncate max-w-[200px]" aria-current="page">{post.title}</li>
            </ol>
          </nav>
        </div>

        {/* Article */}
        <article className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-12 py-12 pb-24">

          {/* Meta */}
          <div className="flex items-center gap-3 mb-6">
            <span className="px-2.5 py-1 rounded-full bg-[#C5FF45]/10 text-[#C5FF45] text-[11px] font-bold uppercase tracking-[.6px]">
              {TYPE_LABELS[post.type] ?? post.type}
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-[#6A6A88]">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.publishedAt ?? post.createdAt)}
            </span>
          </div>

          <h1 className="font-unbounded font-black text-[clamp(24px,4vw,42px)] tracking-[-1.5px] leading-[1.15] mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-[17px] text-[#6A6A88] leading-[1.75] mb-10 pb-10 border-b border-white/[.06]">
              {post.excerpt}
            </p>
          )}

          {post.coverImage && (
            <div className="rounded-2xl overflow-hidden mb-10">
              <img src={post.coverImage} alt={post.title} className="w-full object-cover" />
            </div>
          )}

          {/* Content */}
          <div
            className="prose-sa"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Back */}
          <div className="mt-16 pt-8 border-t border-white/[.06]">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[13px] text-[#6A6A88] hover:text-[#C5FF45] transition-colors font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              Все статьи
            </Link>
          </div>

        </article>

        {/* CTA */}
        <div className="bg-[#0E0E1C] border-t border-white/[.06]">
          <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-12 py-14 text-center">
            <h2 className="font-unbounded font-black text-[20px] tracking-[-0.5px] mb-3">
              Нужна помощь с учёбой?
            </h2>
            <p className="text-[14px] text-[#6A6A88] mb-6">Оставь заявку — ответим за 30 минут</p>
            <Link
              href="/#order"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C5FF45] text-[#07070E] font-black font-unbounded text-[13px] hover:bg-[#D4FF60] hover:shadow-[0_14px_36px_rgba(197,255,69,.28)] hover:-translate-y-0.5 transition-all"
            >
              Оставить заявку →
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  )
}
