/// <reference types="vitest/globals" />
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    verificationToken: { deleteMany: vi.fn().mockResolvedValue({}), create: vi.fn().mockResolvedValue({}) },
  },
}))

vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/rate-limit', () => ({
  getIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 4, resetAt: Date.now() + 1000 }),
}))

import { POST } from './route'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

function makeRequest(email: string) {
  return new NextRequest('http://localhost/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('404 for unknown email', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue(null)

    const res = await POST(makeRequest('unknown@example.com'))
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.code).toBe('NOT_FOUND')
  })

  test('409 for OAuth-only user', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      email: 'oauth@example.com',
      passwordHash: null,
      provider: 'vk',
      name: 'Test',
    })

    const res = await POST(makeRequest('oauth@example.com'))
    const data = await res.json()

    expect(res.status).toBe(409)
    expect(data.code).toBe('OAUTH_ONLY')
    expect(data.provider).toBe('vk')
  })

  test('200 and sends email for credentials user', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      email: 'user@example.com',
      passwordHash: 'hashed',
      provider: 'credentials',
      name: 'Test User',
    })

    const res = await POST(makeRequest('user@example.com'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1)
  })
})
