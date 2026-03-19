import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10, 'Отзыв должен содержать минимум 10 символов').max(1000),
})

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки отзывов' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация для отправки отзыва' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = reviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        name: user.name || 'Аноним',
        rating: parsed.data.rating,
        text: parsed.data.text,
        avatar: user.avatar,
        approved: false, // Требует модерации
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Отзыв отправлен на модерацию',
      reviewId: review.id,
    })
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json({ error: 'Ошибка отправки отзыва' }, { status: 500 })
  }
}
