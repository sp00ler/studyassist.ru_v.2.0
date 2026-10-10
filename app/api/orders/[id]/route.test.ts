/// <reference types="vitest/globals" />
import { NextRequest } from 'next/server'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({ prisma: { order: { findUnique: vi.fn(), update: vi.fn() }, payment: { create: vi.fn() }, $transaction: vi.fn() } }))
vi.mock('@/lib/email', () => ({ sendPaymentLinkEmail: vi.fn(), sendStatusUpdateEmail: vi.fn() }))
vi.mock('@/lib/telegram', () => ({ sendPaymentLinkNotification: vi.fn(), sendStatusUpdateNotification: vi.fn() }))
vi.mock('@/lib/yukassa', () => ({ createPayment: vi.fn() }))

import { PATCH } from './route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { sendPaymentLinkEmail } from '@/lib/email'
import { sendPaymentLinkNotification } from '@/lib/telegram'
import { createPayment } from '@/lib/yukassa'

const request = (price: number = 2500) => new NextRequest('http://localhost/api/orders/o1', {
  method: 'PATCH', body: JSON.stringify({ generatePaymentLink: true, price }),
})

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'admin', isAdmin: true } } as never)
  vi.mocked(prisma.order.findUnique).mockResolvedValue({
    id: 'o1', userId: null, type: 'essay', subject: 'Test', status: 'new',
    clientEmail: 'chosen@example.com', user: { email: 'account@example.com', telegramId: '123' },
  } as never)
  vi.mocked(prisma.order.update).mockResolvedValue({ id: 'o1', paymentLink: 'https://pay.example/1' } as never)
  vi.mocked(prisma.payment.create).mockResolvedValue({ id: 'payment-row' } as never)
  vi.mocked(prisma.$transaction).mockImplementation(async (operation: any) => operation(prisma as any))
  vi.mocked(createPayment).mockResolvedValue({ id: 'p1', confirmationUrl: 'https://pay.example/1' } as never)
  vi.mocked(sendPaymentLinkNotification).mockResolvedValue(true)
})

test('saves invoice before sends, waits for both channels and uses chosen client email', async () => {
  let release!: () => void
  vi.mocked(sendPaymentLinkEmail).mockImplementation(() => new Promise<void>(resolve => { release = resolve }))
  let finished = false
  const pending = PATCH(request(), { params: { id: 'o1' } }).then(res => { finished = true; return res })
  await vi.waitFor(() => expect(sendPaymentLinkNotification).toHaveBeenCalled())
  expect(finished).toBe(false)
  expect(prisma.order.update).toHaveBeenCalled()
  expect(prisma.payment.create).toHaveBeenCalledWith({
    data: { orderId: 'o1', userId: null, amount: 2500, status: 'pending', yukassaId: 'p1' },
  })
  expect(vi.mocked(prisma.order.update).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(sendPaymentLinkEmail).mock.invocationCallOrder[0])
  expect(sendPaymentLinkEmail).toHaveBeenCalledWith('chosen@example.com', 'o1', 'https://pay.example/1', 2500)
  expect(createPayment).toHaveBeenCalledWith('o1', 2500, 'Реферат/Эссе: Test', 'chosen@example.com')
  release()
  expect((await (await pending).json()).notifications).toEqual({ email: 'sent', telegram: 'sent' })
})

test('SMTP failure does not prevent Telegram and preserves saved invoice', async () => {
  vi.mocked(sendPaymentLinkEmail).mockRejectedValue(new Error('SMTP unavailable'))
  const response = await PATCH(request(), { params: { id: 'o1' } })
  expect(response.status).toBe(200)
  expect((await response.json()).notifications).toEqual({ email: 'failed', telegram: 'sent' })
  expect(sendPaymentLinkNotification).toHaveBeenCalled()
})

test('missing Telegram configuration is reported as skipped', async () => {
  vi.mocked(sendPaymentLinkNotification).mockResolvedValue(false)
  const response = await PATCH(request(), { params: { id: 'o1' } })
  expect((await response.json()).notifications).toEqual({ email: 'sent', telegram: 'skipped' })
})

test('does not send an invoice when creating the payment record fails', async () => {
  vi.mocked(prisma.payment.create).mockRejectedValue(new Error('DB unavailable'))
  const response = await PATCH(request(), { params: { id: 'o1' } })
  expect(response.status).toBe(500)
  expect(prisma.order.update).not.toHaveBeenCalled()
  expect(sendPaymentLinkEmail).not.toHaveBeenCalled()
  expect(sendPaymentLinkNotification).not.toHaveBeenCalled()
})

test('does not send an invoice when updating the order fails', async () => {
  vi.mocked(prisma.order.update).mockRejectedValue(new Error('DB unavailable'))
  const response = await PATCH(request(), { params: { id: 'o1' } })
  expect(response.status).toBe(500)
  expect(prisma.payment.create).toHaveBeenCalled()
  expect(sendPaymentLinkEmail).not.toHaveBeenCalled()
  expect(sendPaymentLinkNotification).not.toHaveBeenCalled()
})

test('rejects invalid invoice price before contacting provider', async () => {
  const response = await PATCH(request(-1), { params: { id: 'o1' } })
  expect(response.status).toBe(400)
  expect(createPayment).not.toHaveBeenCalled()
})
