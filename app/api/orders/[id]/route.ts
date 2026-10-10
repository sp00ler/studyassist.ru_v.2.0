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
    let invoice: { url: string; amount: number; email: string } | null = null
    if (status) updateData.status = status
    if (price !== undefined) updateData.price = price
    if (adminNote !== undefined) updateData.adminNote = adminNote

    // Генерируем ссылку оплаты через YuKassa
    if (generatePaymentLink) {
      const amount = Number(price)
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: 'Укажите положительную стоимость работы' }, { status: 400 })
      }
      // Email: из аккаунта пользователя или из контактов гостя
      const receiptEmail = order.clientEmail || order.user?.email || null

      if (!receiptEmail) {
        return NextResponse.json({ error: 'Нет email для выставления счёта' }, { status: 400 })
      }

      const typeLabels: Record<string, string> = {
        coursework: 'Курсовая работа',
        diploma: 'Дипломная (ВКР)',
        essay: 'Реферат/Эссе',
        lab: 'Лабораторная',
        presentation: 'Презентация',
        'practice-report': 'Отчёт по практике',
        uir: 'УИР',
        other: 'Задание',
      }
      const description = `${typeLabels[order.type] || order.type}: ${order.subject}`

      const payment = await createPayment(
        order.id,
        amount,
        description,
        receiptEmail
      )

      updateData.paymentLink = payment.confirmationUrl
      updateData.paymentId = payment.id
      updateData.status = 'awaiting_payment'

      invoice = { url: payment.confirmationUrl, amount, email: receiptEmail }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    })

    // Сначала сохраняем счёт, затем ждём результата каждого независимого канала.
    let notifications: { email: string; telegram: string } | undefined
    if (invoice) {
      const results = await Promise.allSettled([
        sendPaymentLinkEmail(invoice.email, order.id, invoice.url, invoice.amount),
        order.user?.telegramId
          ? sendPaymentLinkNotification(order.user.telegramId, order.id, invoice.url, invoice.amount)
          : Promise.resolve(false),
      ])
      notifications = {
        email: results[0].status === 'fulfilled' ? 'sent' : 'failed',
        telegram: results[1].status === 'rejected' ? 'failed' : results[1].value ? 'sent' : 'skipped',
      }
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Payment notification ${index === 0 ? 'email' : 'telegram'} failed:`, result.reason)
        }
      })
    }

    // Уведомление об изменении статуса (и для пользователей, и для гостевых заявок)
    const notifyEmail = order.clientEmail || order.user?.email
    const effectivePaymentLink = (updateData.paymentLink as string | undefined) || order.paymentLink || undefined
    if (!invoice && status && notifyEmail && status !== order.status) {
      const results = await Promise.allSettled([
        sendStatusUpdateEmail(notifyEmail, order.id, status, effectivePaymentLink),
        order.user?.telegramId
          ? sendStatusUpdateNotification(order.user.telegramId, order.id, status, effectivePaymentLink)
          : Promise.resolve(),
      ])
      results.forEach((result) => {
        if (result.status === 'rejected') console.error('Status notification failed:', result.reason)
      })
    }

    return NextResponse.json({ order: updatedOrder, notifications })
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
