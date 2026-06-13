import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const workType = searchParams.get('workType')

  const where: Record<string, unknown> = { published: true }
  if (workType) where.workType = workType

  const items = await prisma.portfolioItem.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, title: true, workType: true, subject: true,
      description: true, previewText: true, fileUrl: true, createdAt: true,
    },
  })

  return NextResponse.json({ items })
}
