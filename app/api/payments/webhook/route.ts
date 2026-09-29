import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentStatus } from '@/lib/yukassa'

// ЮKassa не подписывает уведомления. Тело — только подсказка «проверь платёж X»:
// заказ берём из нашей записи платежа, статус — из API ЮKassa.
// Формат уведомления: { type: 'notification', event: 'payment.succeeded', object: { id, ... } }
export async function POST(req: NextRequest) {
  try {
    const notification = await req.json()
    const event = notification?.event
    const paymentId = notification?.object?.id

    if ((event !== 'payment.succeeded' && event !== 'payment.canceled') || typeof paymentId !== 'string') {
      return NextResponse.json({ status: 'ok' })
    }

    const payment = await prisma.payment.findFirst({ where: { yukassaId: paymentId } })
    if (!payment) {
      console.warn(`Webhook: unknown payment ${paymentId}`)
      return NextResponse.json({ status: 'ok' })
    }
    // Повтор уведомления не должен откатывать заказ, который уже ушёл дальше «paid»
    if (payment.status === 'succeeded') {
      return NextResponse.json({ status: 'ok' })
    }

    const realStatus = await getPaymentStatus(paymentId)

    if (realStatus === 'succeeded') {
      await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: 'succeeded' } }),
        prisma.order.update({ where: { id: payment.orderId }, data: { status: 'paid' } }),
      ])
      console.log(`Webhook: order ${payment.orderId} marked as paid (payment ${paymentId})`)
    } else if (realStatus === 'canceled') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'cancelled' } })
    } else {
      console.warn(`Webhook: payment ${paymentId} event=${event} but status=${realStatus}, not updating`)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    // 500 → ЮKassa повторит уведомление позже
    console.error('Payment webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
