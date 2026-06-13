import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const slug = searchParams.get('slug')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')

  if (slug) {
    const post = await prisma.post.findUnique({
      where: { slug },
      select: {
        id: true, type: true, title: true, slug: true,
        excerpt: true, content: true, coverImage: true,
        published: true, publishedAt: true, createdAt: true,
      },
    })
    if (!post || !post.published) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }
    return NextResponse.json({ post })
  }

  const where: Record<string, unknown> = { published: true }
  if (type) where.type = type

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, type: true, title: true, slug: true,
        excerpt: true, coverImage: true, publishedAt: true, createdAt: true,
      },
    }),
    prisma.post.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, limit })
}
