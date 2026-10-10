/// <reference types="vitest/globals" />
import { NextRequest } from 'next/server'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({ prisma: { order: { create: vi.fn() } } }))
vi.mock('@/lib/rate-limit', () => ({ getIP: vi.fn(), rateLimit: () => ({ allowed: true }), rateLimitResponse: vi.fn() }))
vi.mock('@/lib/email', () => ({ sendNewOrderEmail: vi.fn(), sendOrderReceivedEmail: vi.fn() }))
vi.mock('@/lib/telegram', () => ({ sendNewOrderNotification: vi.fn() }))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { sendNewOrderEmail, sendOrderReceivedEmail } from '@/lib/email'
import { sendNewOrderNotification } from '@/lib/telegram'

test('order response waits for independent sends and retains chosen contacts for future invoices', async () => {
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as never)
  vi.mocked(prisma.order.create).mockResolvedValue({ id: 'o1' } as never)
  vi.mocked(sendNewOrderEmail).mockRejectedValue(new Error('SMTP unavailable'))
  let release!: () => void
  vi.mocked(sendNewOrderNotification).mockImplementation(() => new Promise<boolean>(resolve => { release = () => resolve(true) }))
  let finished = false
  const pending = POST(new NextRequest('http://localhost/api/orders', {
    method: 'POST', body: JSON.stringify({ type: 'essay', subject: 'Test', deadline: '2099-01-01',
      description: 'A sufficiently long description for order schema validation.',
      name: 'Client', email: 'chosen@example.com', phone: '123',
    }),
  })).then(res => { finished = true; return res })
  await vi.waitFor(() => expect(sendOrderReceivedEmail).toHaveBeenCalled())
  expect(finished).toBe(false)
  expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
    userId: 'u1', clientEmail: 'chosen@example.com', clientName: 'Client', clientPhone: '123',
  }) }))
  release()
  expect((await pending).status).toBe(200)
})
