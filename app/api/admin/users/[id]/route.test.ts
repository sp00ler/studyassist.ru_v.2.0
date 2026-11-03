/// <reference types="vitest/globals" />
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    payment: { count: vi.fn() },
    order: { deleteMany: vi.fn() },
    review: { deleteMany: vi.fn() },
    session: { deleteMany: vi.fn() },
    account: { deleteMany: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}))

import { PATCH, DELETE } from './route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

const SUPER_ADMIN_EMAIL = 'support@studyassist.ru'

function makePatchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/users/target-id', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeDeleteRequest() {
  return new NextRequest('http://localhost/api/admin/users/target-id', {
    method: 'DELETE',
  })
}

describe('app/api/admin/users/[id]/route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('PATCH: regular admin changing isAdmin -> 403', async () => {
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'admin-id', isAdmin: true },
    })
    ;(prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: 'admin-id', email: 'regular-admin@example.com', isAdmin: true }) // acting user
      .mockResolvedValueOnce({ id: 'target-id', email: 'target@example.com', isAdmin: false }) // target user

    const res = await PATCH(makePatchRequest({ isAdmin: true }), { params: { id: 'target-id' } })
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toMatch(/главный администратор/)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  test('PATCH: super-admin changing isAdmin on self -> 403', async () => {
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'super-id', isAdmin: true },
    })
    ;(prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: 'super-id', email: SUPER_ADMIN_EMAIL, isAdmin: true }) // acting user
      .mockResolvedValueOnce({ id: 'super-id', email: SUPER_ADMIN_EMAIL, isAdmin: true }) // target user (self)

    const res = await PATCH(makePatchRequest({ isAdmin: false }), { params: { id: 'super-id' } })
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toMatch(/себя/)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  test('DELETE: regular admin -> 403', async () => {
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'admin-id', isAdmin: true },
    })
    ;(prisma.user.findUnique as any).mockResolvedValueOnce({
      id: 'admin-id',
      email: 'regular-admin@example.com',
      isAdmin: true,
    })

    const res = await DELETE(makeDeleteRequest(), { params: { id: 'target-id' } })
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toBeDefined()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  test('DELETE: super-admin deleting user with payments -> 409, nothing deleted', async () => {
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'super-id', isAdmin: true },
    })
    ;(prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: 'super-id', email: SUPER_ADMIN_EMAIL, isAdmin: true }) // acting user (requireSuperAdmin)
      .mockResolvedValueOnce({ id: 'target-id', email: 'target@example.com', isAdmin: false }) // target user
    ;(prisma.payment.count as any).mockResolvedValue(3)

    const res = await DELETE(makeDeleteRequest(), { params: { id: 'target-id' } })
    const data = await res.json()

    expect(res.status).toBe(409)
    expect(data.error).toMatch(/платежи/)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  test('DELETE: super-admin deleting user without payments -> 200, $transaction called', async () => {
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'super-id', isAdmin: true },
    })
    ;(prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: 'super-id', email: SUPER_ADMIN_EMAIL, isAdmin: true }) // acting user (requireSuperAdmin)
      .mockResolvedValueOnce({ id: 'target-id', email: 'target@example.com', isAdmin: false }) // target user
    ;(prisma.payment.count as any).mockResolvedValue(0)

    const res = await DELETE(makeDeleteRequest(), { params: { id: 'target-id' } })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })
})
