import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendStatusUpdateEmail, sendPaymentLinkEmail } from '@/lib/email'
import { sendStatusUpdateNotification, sendPaymentLinkNotification } from '@/lib/telegram'
import { createPayment } from '@/lib/yukassa'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        payments: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    // Студент может видеть только свои заявки
    if (!session.user.isAdmin && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки заявки' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const body = await req.json()
    const { status, price, adminNote, generatePaymentLink } = body

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (price !== undefined) updateData.price = price
    if (adminNote !== undefined) updateData.adminNote = adminNote

    // Генерируем ссылку оплаты через YuKassa
    if (generatePaymentLink && price && order.user?.email) {
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
        parseFloat(price),
        description,
        order.user.email
      )

      updateData.paymentLink = payment.confirmationUrl
      updateData.paymentId = payment.id
      updateData.status = 'awaiting_payment'

      // Уведомления об оплате
      if (order.user.email) {
        Promise.allSettled([
          sendPaymentLinkEmail(order.user.email, order.id, payment.confirmationUrl, parseFloat(price)),
          order.user.telegramId
            ? sendPaymentLinkNotification(order.user.telegramId, order.id, payment.confirmationUrl, parseFloat(price))
            : Promise.resolve(),
        ]).catch(console.error)
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    })

    // Уведомление об изменении статуса
    if (status && order.user?.email && status !== order.status) {
      Promise.allSettled([
        sendStatusUpdateEmail(order.user.email, order.id, status, order.paymentLink),
        order.user.telegramId
          ? sendStatusUpdateNotification(order.user.telegramId, order.id, status, order.paymentLink)
          : Promise.resolve(),
      ]).catch(console.error)
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: 'Ошибка обновления заявки' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }
    await prisma.payment.deleteMany({ where: { orderId: params.id } })
    await prisma.order.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete order error:', error)
    return NextResponse.json({ error: 'Ошибка удаления заявки' }, { status: 500 })
  }
}
