import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const approved = searchParams.get('approved')

    const where: Record<string, unknown> = {}
    if (approved === 'true') where.approved = true
    if (approved === 'false') where.approved = false

    const reviews = await prisma.review.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Admin reviews error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки отзывов' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { id, approved } = await req.json()

    const review = await prisma.review.update({
      where: { id },
      data: { approved },
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Update review error:', error)
    return NextResponse.json({ error: 'Ошибка обновления отзыва' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { id } = await req.json()

    await prisma.review.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete review error:', error)
    return NextResponse.json({ error: 'Ошибка удаления отзыва' }, { status: 500 })
  }
}
