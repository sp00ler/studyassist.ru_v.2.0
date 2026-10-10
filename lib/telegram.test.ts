/// <reference types="vitest/globals" />
const telegramMock = vi.hoisted(() => ({ sendMessage: vi.fn(), getMe: vi.fn() }))
vi.mock('node-telegram-bot-api', () => ({ default: class {
  sendMessage = telegramMock.sendMessage
  getMe = telegramMock.getMe
} }))
vi.mock('@/lib/file-storage', () => ({ resolveStoredFileAbsolutePath: vi.fn() }))

import { sendNewOrderNotification, sendPaymentLinkNotification } from './telegram'

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

test('new order escapes user subject and uses HTML so Markdown punctuation is harmless', async () => {
  vi.stubEnv('TELEGRAM_BOT_TOKEN', 'mock-token')
  vi.stubEnv('TELEGRAM_CHAT_ID', 'mock-chat')
  vi.stubEnv('NEXTAUTH_URL', 'https://example.com')
  telegramMock.getMe.mockResolvedValue({ username: 'mock' })
  telegramMock.sendMessage.mockResolvedValue({ message_id: 1 })
  expect(await sendNewOrderNotification({ orderId: 'o123', orderType: 'essay',
    subject: 'A_[unclosed <x> & y', deadline: '01.01.2099', description: 'test', name: 'Client',
    email: 'client@example.com', filesCount: 0,
  })).toBe(true)
  expect(telegramMock.sendMessage).toHaveBeenCalledWith('mock-chat',
    expect.stringContaining('A_[unclosed &lt;x&gt; &amp; y'),
    expect.objectContaining({ parse_mode: 'HTML' }),
  )
})

test('missing main token is skipped even when support token exists', async () => {
  vi.stubEnv('TELEGRAM_BOT_TOKEN', '')
  vi.stubEnv('SUPPORT_BOT_TOKEN', 'support-mock-token')
  expect(await sendPaymentLinkNotification('123', 'o1', 'https://pay.example/1', 100)).toBe(false)
  expect(telegramMock.sendMessage).not.toHaveBeenCalled()
})

test('Telegram failure rejects so API can report failed delivery', async () => {
  vi.stubEnv('TELEGRAM_BOT_TOKEN', 'mock-token')
  telegramMock.sendMessage.mockRejectedValue(new Error('Telegram unavailable'))
  await expect(sendPaymentLinkNotification('123', 'o1', 'https://pay.example/1', 100)).rejects.toThrow('Telegram unavailable')
})
