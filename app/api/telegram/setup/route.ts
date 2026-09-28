import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/roles'
import TelegramBot from 'node-telegram-bot-api'

// GET /api/telegram/setup — регистрирует webhook у Telegram (только для админов)
export async function GET(_req: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN не задан' }, { status: 500 })
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://studyassist.ru'
  const webhookUrl = `${baseUrl}/api/telegram/webhook`

  const bot = new TelegramBot(token, { polling: false })
  await bot.setWebHook(webhookUrl)

  await bot.setMyCommands([
    { command: 'start', description: 'Главное меню / привязка аккаунта' },
    { command: 'orders', description: 'Мои заявки' },
    { command: 'help', description: 'Помощь' },
  ])

  const info = await bot.getWebHookInfo()

  // Support bot uses getUpdates polling (scripts/support-poll.js) — webhook not set.

  return NextResponse.json({ ok: true, webhook: info })
}

// DELETE /api/telegram/setup — удаляет webhook (переключение в polling для отладки)
export async function DELETE(_req: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return NextResponse.json({ error: 'Нет токена' }, { status: 500 })

  const bot = new TelegramBot(token, { polling: false })
  await bot.deleteWebHook()

  const supportToken = process.env.SUPPORT_BOT_TOKEN
  if (supportToken && supportToken !== token) {
    const supportBot = new TelegramBot(supportToken, { polling: false })
    await supportBot.deleteWebHook()
  }

  return NextResponse.json({ ok: true })
}
