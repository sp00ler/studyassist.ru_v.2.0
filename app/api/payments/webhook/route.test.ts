/// <reference types="vitest/globals" />
import { NextRequest } from 'next/server'

vi.mock('@/lib/yukassa', () => ({ getPaymentStatus: vi.fn() }))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    payment: { findFirst: vi.fn(), update: vi.fn((a) => a) },
    order: { update: vi.fn((a) => a) },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}))

import { POST } from './route'
import { getPaymentStatus } from '@/lib/yukassa'
import { prisma } from '@/lib/prisma'
import { getIP } from '@/lib/rate-limit'

function notify(event: string, object: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/payments/webhook', {
    method: 'POST',
    body: JSON.stringify({ type: 'notification', event, object }),
  })
}

describe('payments webhook', () => {
  beforeEach(() => vi.clearAllMocks())

  test('succeeded: marks the order from OUR payment record, ignoring metadata.orderId', async () => {
    ;(prisma.payment.findFirst as any).mockResolvedValue({ id: 'p1', orderId: 'own-order', status: 'pending' })
    ;(getPaymentStatus as any).mockResolvedValue('succeeded')

    const res = await POST(notify('payment.succeeded', { id: 'yk1', metadata: { orderId: 'victim-order' } }))

    expect(res.status).toBe(200)
    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'own-order' }, data: { status: 'paid' } })
  })

  test('forged event: provider says pending -> nothing updated', async () => {
    ;(prisma.payment.findFirst as any).mockResolvedValue({ id: 'p1', orderId: 'o1', status: 'pending' })
    ;(getPaymentStatus as any).mockResolvedValue('pending')

    await POST(notify('payment.succeeded', { id: 'yk1' }))
    await POST(notify('payment.canceled', { id: 'yk1' }))

    expect(prisma.payment.update).not.toHaveBeenCalled()
    expect(prisma.order.update).not.toHaveBeenCalled()
  })

  test('canceled is applied only after provider confirms', async () => {
    ;(prisma.payment.findFirst as any).mockResolvedValue({ id: 'p1', orderId: 'o1', status: 'pending' })
    ;(getPaymentStatus as any).mockResolvedValue('canceled')

    await POST(notify('payment.canceled', { id: 'yk1' }))

    expect(prisma.payment.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { status: 'cancelled' } })
  })

  test('unknown payment id and already-succeeded payment are no-ops', async () => {
    ;(prisma.payment.findFirst as any).mockResolvedValueOnce(null)
    await POST(notify('payment.succeeded', { id: 'nope' }))
    ;(prisma.payment.findFirst as any).mockResolvedValueOnce({ id: 'p1', orderId: 'o1', status: 'succeeded' })
    await POST(notify('payment.succeeded', { id: 'yk1' }))

    expect(getPaymentStatus).not.toHaveBeenCalled()
    expect(prisma.order.update).not.toHaveBeenCalled()
  })
})

describe('getIP', () => {
  test('client-supplied X-Forwarded-For head is ignored', () => {
    const viaNginx = (xff: string) =>
      getIP(new NextRequest('http://localhost/', { headers: { 'x-forwarded-for': xff } }))
    expect(viaNginx('1.1.1.1, 203.0.113.9')).toBe('203.0.113.9')
    expect(viaNginx('2.2.2.2, 203.0.113.9')).toBe('203.0.113.9')
  })

  test('X-Real-IP (set by nginx) wins', () => {
    const req = new NextRequest('http://localhost/', { headers: { 'x-real-ip': '203.0.113.9', 'x-forwarded-for': '1.1.1.1' } })
    expect(getIP(req)).toBe('203.0.113.9')
  })
})
