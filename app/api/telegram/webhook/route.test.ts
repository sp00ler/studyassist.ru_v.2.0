/// <reference types="vitest/globals" />
import { NextRequest } from 'next/server'

vi.mock('@/lib/telegram-handler', () => ({ handleUpdate: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/telegram', async () => {
  const crypto = await import('crypto')
  return {
    telegramWebhookSecret: () => crypto.createHmac('sha256', 'test-token').update('telegram-webhook').digest('hex'),
  }
})

import { POST } from './route'
import { handleUpdate } from '@/lib/telegram-handler'
import { telegramWebhookSecret } from '@/lib/telegram'

const update = { update_id: 1, message: { chat: { id: 1, type: 'private' }, text: 'hi' } }
const req = (headers: Record<string, string>) =>
  new NextRequest('http://localhost/api/telegram/webhook', { method: 'POST', body: JSON.stringify(update), headers })

describe('telegram webhook', () => {
  beforeEach(() => vi.clearAllMocks())

  test('rejects updates without or with a wrong secret header', async () => {
    expect((await POST(req({}))).status).toBe(403)
    expect((await POST(req({ 'x-telegram-bot-api-secret-token': 'guess' }))).status).toBe(403)
    expect(handleUpdate).not.toHaveBeenCalled()
  })

  test('accepts updates carrying the registered secret', async () => {
    const res = await POST(req({ 'x-telegram-bot-api-secret-token': telegramWebhookSecret()! }))
    expect(res.status).toBe(200)
    expect(handleUpdate).toHaveBeenCalledOnce()
  })
})
