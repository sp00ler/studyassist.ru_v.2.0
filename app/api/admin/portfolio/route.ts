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

const itemSchema = z.object({
  title: z.string().min(2),
  workType: z.enum(['essay', 'coursework', 'diploma', 'lab', 'presentation', 'practice-report', 'uir', 'other']),
  subject: z.string().optional(),
  description: z.string().optional(),
  previewText: z.string().optional(),
  fileUrl: z.string().url().optional().or(z.literal('')),
  published: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const workType = searchParams.get('workType')

  const where: Record<string, unknown> = {}
  if (workType) where.workType = workType

  const items = await prisma.portfolioItem.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const body = await req.json()
  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const data = parsed.data
  const item = await prisma.portfolioItem.create({
    data: {
      title: data.title,
      workType: data.workType,
      subject: data.subject || null,
      description: data.description || null,
      previewText: data.previewText || null,
      fileUrl: data.fileUrl || null,
      published: data.published,
      sortOrder: data.sortOrder,
    },
  })

  return NextResponse.json({ item }, { status: 201 })
}
