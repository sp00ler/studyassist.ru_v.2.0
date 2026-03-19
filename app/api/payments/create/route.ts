import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { createPayment } from '@/lib/yukassa'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { orderId } = await req.json()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    if (order.status !== 'awaiting_payment') {
      return NextResponse.json({ error: 'Заявка не готова к оплате' }, { status: 400 })
    }

    if (!order.price) {
      return NextResponse.json({ error: 'Стоимость не установлена' }, { status: 400 })
    }

    // Если ссылка уже есть — возвращаем её
    if (order.paymentLink) {
      return NextResponse.json({ paymentUrl: order.paymentLink })
    }

    const typeLabels: Record<string, string> = {
      coursework: 'Курсовая работа',
      diploma: 'Дипломная (ВКР)',
      essay: 'Реферат/Эссе',
      lab: 'Лабораторная',
      presentation: 'Презентация',
      other: 'Задание',
    }
    const description = `${typeLabels[order.type] || order.type}: ${order.subject}`

    const payment = await createPayment(
      order.id,
      parseFloat(order.price.toString()),
      description,
      session.user.email
    )

    // Сохраняем платёж в БД
    await Promise.all([
      prisma.payment.create({
        data: {
          orderId: order.id,
          userId: session.user.id,
          amount: order.price,
          status: 'pending',
          yukassaId: payment.id,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          paymentLink: payment.confirmationUrl,
          paymentId: payment.id,
        },
      }),
    ])

    return NextResponse.json({ paymentUrl: payment.confirmationUrl })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 })
  }
}
