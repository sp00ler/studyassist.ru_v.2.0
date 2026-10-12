import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type PersistOrderPaymentInput = {
  orderId: string
  userId?: string | null
  amount: Prisma.PaymentCreateInput['amount']
  yukassaId: string
  orderData: {
    paymentLink: string
    paymentId: string
    status?: string
  }
}

export async function persistOrderPayment({
  orderId,
  userId,
  amount,
  yukassaId,
  orderData,
}: PersistOrderPaymentInput) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        orderId,
        userId: userId ?? null,
        amount,
        status: 'pending',
        yukassaId,
      },
    })
    const order = await tx.order.update({ where: { id: orderId }, data: orderData })
    return { payment, order }
  })
}
