/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
  events: [] as string[],
  bot: {
    sendMessage: vi.fn(async (_chatId: string, text: string) => {
      mocks.events.push(`message:${text}`)
      return { message_id: 7 }
    }),
    deleteMessage: vi.fn(async () => undefined),
    answerCallbackQuery: vi.fn(async () => undefined),
  },
  prisma: {
    user: { findFirst: vi.fn() },
    order: { findUnique: vi.fn(), update: vi.fn() },
    payment: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('node-telegram-bot-api', () => ({ default: vi.fn(function TelegramBotMock() { return mocks.bot }) }))
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/email', () => ({
  sendNewOrderEmail: vi.fn(), sendStatusUpdateEmail: vi.fn(),
  sendPaymentLinkEmail: vi.fn(), sendWorkCompletedEmail: vi.fn(),
}))
vi.mock('@/lib/telegram', () => ({
  sendNewOrderNotification: vi.fn(), sendStatusUpdateNotification: vi.fn(),
  sendPaymentLinkNotification: vi.fn(), sendWorkCompletedNotification: vi.fn(),
}))
vi.mock('@/lib/yukassa', () => ({ createPayment: vi.fn() }))

import { handleUpdate } from './telegram-handler'
import { prisma } from '@/lib/prisma'
import { sendPaymentLinkEmail } from '@/lib/email'
import { sendPaymentLinkNotification } from '@/lib/telegram'
import { createPayment } from '@/lib/yukassa'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.events.length = 0
  process.env.TELEGRAM_BOT_TOKEN = 'test-token'
  vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'admin-user', isAdmin: true } as never)
  vi.mocked(prisma.order.findUnique).mockResolvedValue({
    id: 'o1', userId: 'client-user', type: 'essay', subject: 'Test', price: 2500,
    clientEmail: 'guest@example.com', paymentLink: null,
    user: { email: 'account@example.com', telegramId: 'client-chat' },
  } as never)
  vi.mocked(prisma.payment.create).mockImplementation(async () => {
    mocks.events.push('payment.create')
    return { id: 'payment-row' } as never
  })
  vi.mocked(prisma.order.update).mockImplementation(async () => {
    mocks.events.push('order.update')
    return { id: 'o1' } as never
  })
  vi.mocked(prisma.$transaction).mockImplementation(async (operation: any) => operation(prisma as any))
  vi.mocked(createPayment).mockResolvedValue({ id: 'yk-payment', confirmationUrl: 'https://pay.example/1' } as never)
  vi.mocked(sendPaymentLinkEmail).mockImplementation(async () => { mocks.events.push('email'); throw new Error('SMTP 535') })
  vi.mocked(sendPaymentLinkNotification).mockImplementation(async () => { mocks.events.push('telegram'); return true })
})

test('admin payment callback persists payment before notifications and reports SMTP failure', async () => {
  await handleUpdate({
    callback_query: {
      id: 'callback-1',
      data: 'admin:payment:o1',
      message: { message_id: 3, chat: { id: 42, type: 'private' } },
    },
  } as never)

  expect(prisma.payment.create).toHaveBeenCalledWith({
    data: { orderId: 'o1', userId: 'client-user', amount: 2500, status: 'pending', yukassaId: 'yk-payment' },
  })
  expect(sendPaymentLinkEmail).toHaveBeenCalledWith('guest@example.com', 'o1', 'https://pay.example/1', 2500)
  expect(mocks.events.indexOf('payment.create')).toBeLessThan(mocks.events.indexOf('order.update'))
  expect(mocks.events.indexOf('order.update')).toBeLessThan(mocks.events.indexOf('email'))
  expect(mocks.events.indexOf('order.update')).toBeLessThan(mocks.events.indexOf('telegram'))
  const confirmation = mocks.events.find((event) => event.startsWith('message:✅ Счёт выставлен!'))
  expect(confirmation).toContain('Email (guest@example.com) → ошибка')
  expect(confirmation).toContain('Telegram → принято Telegram')
})
