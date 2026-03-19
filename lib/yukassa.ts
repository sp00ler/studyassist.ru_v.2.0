import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout'
import crypto from 'crypto'

function getYooCheckout(): YooCheckout {
  const shopId = process.env.YUKASSA_SHOP_ID
  const secretKey = process.env.YUKASSA_SECRET_KEY
  if (!shopId || !secretKey) {
    throw new Error('YuKassa credentials not configured')
  }
  return new YooCheckout({ shopId, secretKey })
}

export async function createPayment(
  orderId: string,
  amount: number,
  description: string,
  userEmail?: string | null
): Promise<{ id: string; confirmationUrl: string }> {
  const checkout = getYooCheckout()

  const idempotenceKey = `${orderId}-${Date.now()}`

  const payload: ICreatePayment = {
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB',
    },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: process.env.YUKASSA_RETURN_URL || 'https://studyassist.ru/dashboard',
    },
    description: description.slice(0, 128),
    metadata: {
      orderId,
    },
    ...(userEmail && {
      receipt: {
        customer: {
          email: userEmail,
        },
        items: [
          {
            description: description.slice(0, 128),
            quantity: '1.00',
            amount: {
              value: amount.toFixed(2),
              currency: 'RUB',
            },
            vat_code: 1,
            payment_mode: 'full_prepayment',
            payment_subject: 'service',
          },
        ],
      },
    }),
  }

  const payment = await checkout.createPayment(payload, idempotenceKey)

  const confirmationUrl = (payment.confirmation as { confirmation_url?: string })?.confirmation_url || ''

  return {
    id: payment.id,
    confirmationUrl,
  }
}

export async function getPaymentStatus(paymentId: string): Promise<string> {
  const checkout = getYooCheckout()
  const payment = await checkout.getPayment(paymentId)
  return payment.status
}

export function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature) return false
  const secretKey = process.env.YUKASSA_SECRET_KEY
  if (!secretKey) return false

  // YuKassa использует HMAC-SHA256 для webhook подписи
  const hmac = crypto.createHmac('sha256', secretKey)
  hmac.update(body)
  const expectedSignature = hmac.digest('hex')

  // Безопасное сравнение
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    return false
  }
}
