/// <reference types="vitest/globals" />
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    order: { create: vi.fn() },
  },
}))
vi.mock('@/lib/email', () => ({
  sendNewOrderEmail: vi.fn().mockResolvedValue(undefined),
  sendOrderReceivedEmail: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/telegram', () => ({
  sendNewOrderNotification: vi.fn().mockResolvedValue(true),
}))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { sendNewOrderEmail, sendOrderReceivedEmail } from '@/lib/email'
import { sendNewOrderNotification } from '@/lib/telegram'

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/orders', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const validOrder = {
  type: 'coursework',
  subject: 'Экономика организации',
  deadline: '2026-12-01',
}

describe('admin create order recipient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({ user: { id: 'admin-id', isAdmin: true } })
    ;(prisma.user.findUnique as any).mockResolvedValue(null)
    ;(prisma.order.create as any).mockResolvedValue({ id: 'order-id' })
  })

  test('rejects non-admins without creating or notifying', async () => {
    ;(getServerSession as any).mockResolvedValue({ user: { id: 'user-id', isAdmin: false } })

    const response = await POST(request({ ...validOrder, clientEmail: 'client@example.com' }))

    expect(response.status).toBe(403)
    expect(prisma.order.create).not.toHaveBeenCalled()
    expect(sendNewOrderEmail).not.toHaveBeenCalled()
  })

  test('requires a client email even when a client name is provided', async () => {
    const response = await POST(request({ ...validOrder, clientName: 'Клиент' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email клиента обязателен для уведомлений и счёта')
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(prisma.order.create).not.toHaveBeenCalled()
  })

  test.each([
    ['malformed', 'not-an-email'],
    ['non-string', 42],
  ])('rejects %s recipient email before looking up a user', async (_label, clientEmail) => {
    const response = await POST(request({ ...validOrder, clientName: 'Клиент', clientEmail }))

    expect(response.status).toBe(400)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(prisma.order.create).not.toHaveBeenCalled()
  })

  test('rejects invalid deadlines before creating an order', async () => {
    const response = await POST(request({ ...validOrder, clientEmail: 'client@example.com', deadline: 'not-a-date' }))

    expect(response.status).toBe(400)
    expect(prisma.order.create).not.toHaveBeenCalled()
  })

  test('requires a client email even when no other recipient detail is present', async () => {
    const response = await POST(request(validOrder))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email клиента обязателен для уведомлений и счёта')
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(prisma.order.create).not.toHaveBeenCalled()
  })

  test('rejects malformed recipient email before looking up a user', async () => {
    const response = await POST(request({ ...validOrder, clientName: 'Клиент', clientEmail: 'not-an-email' }))

    expect(response.status).toBe(400)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(prisma.order.create).not.toHaveBeenCalled()
  })

  test('persists guest recipient contacts and sends a receipt to that email, without using admin as owner', async () => {
    const response = await POST(request({
      ...validOrder,
      clientName: '  Анна  ',
      clientEmail: '  Anna@example.com  ',
      clientPhone: '  +7 900 000-00-00  ',
    }))

    expect(response.status).toBe(200)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'anna@example.com' } })
    expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: null,
        clientName: 'Анна',
        clientEmail: 'anna@example.com',
        clientPhone: '+7 900 000-00-00',
      }),
    }))
    expect(sendOrderReceivedEmail).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Анна',
      email: 'anna@example.com',
    }))
    expect(sendNewOrderEmail).toHaveBeenCalledTimes(1)
    expect(sendNewOrderNotification).toHaveBeenCalledTimes(1)
  })

  test('links only the explicitly entered email to a matching account', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: 'client-id',
      name: 'Account Client',
      email: 'account@example.com',
    })

    const response = await POST(request({ ...validOrder, clientEmail: 'account@example.com' }))

    expect(response.status).toBe(200)
    expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'client-id', clientEmail: 'account@example.com' }),
    }))
    expect(sendOrderReceivedEmail).toHaveBeenCalledWith(expect.objectContaining({ name: 'Account Client' }))
  })

  test('returns delivery statuses and marks unavailable Telegram as skipped', async () => {
    ;(sendNewOrderNotification as any).mockResolvedValue(false)
    ;(sendNewOrderEmail as any).mockRejectedValueOnce(new Error('SMTP unavailable'))

    const response = await POST(request({ ...validOrder, clientEmail: 'client@example.com' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.notifications).toEqual({
      adminEmail: 'failed',
      clientEmail: 'sent',
      telegram: 'skipped',
    })
  })
})
