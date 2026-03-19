import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/yukassa'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-b3-traceid') || req.headers.get('authorization')

    // Верифицируем подпись YuKassa
    if (!verifyWebhookSignature(body, signature)) {
      // В dev режиме пропускаем проверку
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)

    if (event.type === 'payment.succeeded') {
      const paymentId = event.object.id
      const orderId = event.object.metadata?.orderId

      if (!orderId) {
        return NextResponse.json({ error: 'No orderId in metadata' }, { status: 400 })
      }

      // Обновляем статус платежа и заказа
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
