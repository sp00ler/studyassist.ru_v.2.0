/// <reference types="vitest/globals" />
import { NextRequest } from 'next/server'
import crypto from 'crypto'

vi.mock('@/lib/prisma', () => ({ prisma: {
  chatMessage: { upsert: vi.fn() }, chatSession: { findUnique: vi.fn() },
} }))
vi.mock('@/lib/email', () => ({}))
vi.mock('@/lib/telegram', () => ({}))
vi.mock('@/lib/yukassa', () => ({}))
vi.mock('@/lib/utils', () => ({}))
vi.mock('node-telegram-bot-api', () => ({ default: vi.fn() }))

import { POST } from './route'
import { prisma } from '@/lib/prisma'
import TelegramBot from 'node-telegram-bot-api'

const secret = (token: string) => crypto.createHmac('sha256', token).update('telegram-webhook').digest('hex')
const reply = () => ({
  update_id: 20,
  message: {
    message_id: 30,
    from: { id: 7, is_bot: false },
    chat: { id: -100123, type: 'supergroup' },
    text: '  Ответ оператора  ',
    reply_to_message: {
      message_id: 10,
      from: { id: 8, is_bot: true },
      text: 'Вопрос с сайта\n\n▫️ [session:session-123]',
    },
  },
})
const req = (update: unknown, auth = secret('support-test')) => new NextRequest(
  'http://localhost/api/telegram/support', {
    method: 'POST', body: JSON.stringify(update),
    headers: auth ? { 'x-telegram-bot-api-secret-token': auth } : {},
  },
)

describe('support reply delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('SUPPORT_BOT_TOKEN', 'support-test')
    vi.stubEnv('SUPPORT_CHAT_ID', '-100123')
    vi.stubEnv('TELEGRAM_BOT_TOKEN', '')
    vi.mocked(prisma.chatMessage.upsert).mockResolvedValue({} as never)
    vi.mocked(prisma.chatSession.findUnique).mockResolvedValue({ id: 'session-123' } as never)
  })
  afterEach(() => vi.unstubAllEnvs())

  test('saves Telegram Reply for website polling without the order bot token', async () => {
    expect((await POST(req(reply()))).status).toBe(200)
    expect(prisma.chatMessage.upsert).toHaveBeenCalledWith({
      where: { id: 'telegram-support:-100123:30' },
      create: { id: 'telegram-support:-100123:30', sessionId: 'session-123', text: 'Ответ оператора', fromAdmin: true },
      update: {},
    })
    expect(TelegramBot).not.toHaveBeenCalled()
  })

  test('rejects missing, wrong and order bot credentials', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'order-test')
    for (const auth of ['', 'wrong', secret('order-test')]) {
      expect((await POST(req(reply(), auth))).status).toBe(403)
    }
    vi.stubEnv('SUPPORT_BOT_TOKEN', '')
    expect((await POST(req(reply(), secret('order-test')))).status).toBe(403)
    expect(prisma.chatMessage.upsert).not.toHaveBeenCalled()
  })

  test('accepts a marked Reply in the configured operator private chat', async () => {
    const update = reply()
    update.message.chat.type = 'private'
    update.message.chat.id = 123
    vi.stubEnv('SUPPORT_CHAT_ID', '123')
    expect((await POST(req(update))).status).toBe(200)
    expect(prisma.chatMessage.upsert).toHaveBeenCalledOnce()
    expect(TelegramBot).not.toHaveBeenCalled()
  })

  test('acknowledges a reply to a deleted session without blocking later updates', async () => {
    vi.mocked(prisma.chatSession.findUnique).mockResolvedValueOnce(null)
    expect((await POST(req(reply()))).status).toBe(200)
    expect(prisma.chatMessage.upsert).not.toHaveBeenCalled()
  })

  test('does not dispatch order commands, other groups or replies to human messages', async () => {
    const command = reply()
    command.message.chat.type = 'private'
    command.message.text = '/start'
    command.message.reply_to_message.text = ''
    const otherGroup = reply()
    otherGroup.message.chat.id = -999
    const human = reply()
    human.message.reply_to_message.from.is_bot = false
    const unmarked = reply()
    unmarked.message.reply_to_message.text = 'Вопрос без session marker'
    for (const update of [command, otherGroup, human, unmarked]) {
      expect((await POST(req(update))).status).toBe(200)
    }
    expect(prisma.chatMessage.upsert).not.toHaveBeenCalled()
    expect(TelegramBot).not.toHaveBeenCalled()
  })

  test('acknowledges only after persistence; returns 500 on save failure for retry', async () => {
    let finish!: (value: never) => void
    vi.mocked(prisma.chatMessage.upsert).mockImplementationOnce(() =>
      new Promise(resolve => { finish = resolve }) as never,
    )
    let acknowledged = false
    const response = POST(req(reply())).then(res => { acknowledged = true; return res })
    await vi.waitFor(() => expect(prisma.chatMessage.upsert).toHaveBeenCalledOnce())
    expect(acknowledged).toBe(false)
    finish({} as never)
    expect((await response).status).toBe(200)

    vi.mocked(prisma.chatMessage.upsert).mockRejectedValueOnce(new Error('mock save failure'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await POST(req(reply()))).status).toBe(500)
    expect((await POST(req(reply()))).status).toBe(200)
    const retryCalls = vi.mocked(prisma.chatMessage.upsert).mock.calls.slice(-2)
    expect(retryCalls[0][0]).toEqual(retryCalls[1][0])
    log.mockRestore()
  })

  test('redelivery upserts the same stable message id without creating a duplicate', async () => {
    const messages = new Map<string, unknown>()
    vi.mocked(prisma.chatMessage.upsert).mockImplementation(async (args: any) => {
      if (!messages.has(args.where.id)) messages.set(args.where.id, args.create)
      return messages.get(args.where.id) as never
    })
    expect((await POST(req(reply()))).status).toBe(200)
    expect((await POST(req(reply()))).status).toBe(200)
    expect(messages.size).toBe(1)
    expect(prisma.chatMessage.upsert).toHaveBeenCalledTimes(2)
    expect(vi.mocked(prisma.chatMessage.upsert).mock.calls[0][0].update).toEqual({})
  })
})
