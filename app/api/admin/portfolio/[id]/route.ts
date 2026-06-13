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
  title: z.string().min(2).optional(),
  workType: z.enum(['essay', 'coursework', 'diploma', 'lab', 'presentation', 'practice-report', 'uir', 'other']).optional(),
  subject: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  previewText: z.string().optional().nullable(),
  fileUrl: z.string().url().optional().nullable().or(z.literal('')),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const item = await prisma.portfolioItem.update({
    where: { id: params.id },
    data: parsed.data,
  })

  return NextResponse.json({ item })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  await prisma.portfolioItem.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
