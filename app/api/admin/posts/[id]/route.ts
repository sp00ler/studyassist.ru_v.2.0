import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }
  return null
}

const updateSchema = z.object({
  type: z.enum(['blog', 'news']).optional(),
  title: z.string().min(3).optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(10).optional(),
  coverImage: z.string().optional().nullable(),
  published: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const post = await prisma.post.findUnique({ where: { id: params.id } })
  if (!post) return NextResponse.json({ error: 'Не найдено' }, { status: 404 })

  return NextResponse.json({ post })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const existing = await prisma.post.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Не найдено' }, { status: 404 })

  const data = parsed.data
  const wasPublished = existing.published
  const nowPublished = data.published ?? existing.published

  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...data,
      publishedAt: !wasPublished && nowPublished ? new Date() : existing.publishedAt,
    },
  })

  return NextResponse.json({ post })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  await prisma.post.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
