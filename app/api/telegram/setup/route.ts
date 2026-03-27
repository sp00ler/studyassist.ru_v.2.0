import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import TelegramBot from 'node-telegram-bot-api'

// GET /api/telegram/setup — регистрирует webhook у Telegram (только для админов)
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN не задан' }, { status: 500 })
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://studyassist.ru'
  const webhookUrl = `${baseUrl}/api/telegram/webhook`

  const bot = new TelegramBot(token, { polling: false })

  await bot.setWebHook(webhookUrl)

  // Устанавливаем список команд
  await bot.setMyCommands([
    { command: 'start', description: 'Главное меню / привязка аккаунта' },
    { command: 'orders', description: 'Мои заявки' },
    { command: 'help', description: 'Помощь' },
  ])

  const info = await bot.getWebHookInfo()
  return NextResponse.json({ ok: true, webhook: info })
}

// DELETE /api/telegram/setup — удаляет webhook (переключение в polling для отладки)
export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return NextResponse.json({ error: 'Нет токена' }, { status: 500 })

  const bot = new TelegramBot(token, { polling: false })
  await bot.deleteWebHook()

  return NextResponse.json({ ok: true })
}
