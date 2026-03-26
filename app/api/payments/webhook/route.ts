import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentStatus } from '@/lib/yukassa'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const event = JSON.parse(body)

    if (event.type === 'payment.succeeded') {
      const paymentId = event.object.id
      const orderId = event.object.metadata?.orderId

      if (!orderId) {
        return NextResponse.json({ error: 'No orderId in metadata' }, { status: 400 })
      }

      // Верифицируем через API ЮКассы — не доверяем телу запроса слепо
      const realStatus = await getPaymentStatus(paymentId)
      if (realStatus !== 'succeeded') {
        console.warn(`Webhook: payment ${paymentId} status=${realStatus}, not updating order`)
        return NextResponse.json({ status: 'ok' })
      }

      await Promise.all([
        prisma.payment.updateMany({
          where: { yukassaId: paymentId },
          data: { status: 'succeeded' },
        }),
        prisma.order.update({
          where: { id: orderId },
          data: { status: 'paid' },
        }),
      ])

      console.log(`Webhook: order ${orderId} marked as paid (payment ${paymentId})`)

    } else if (event.type === 'payment.canceled') {
      const paymentId = event.object.id
      await prisma.payment.updateMany({
        where: { yukassaId: paymentId },
        data: { status: 'cancelled' },
      })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Payment webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
