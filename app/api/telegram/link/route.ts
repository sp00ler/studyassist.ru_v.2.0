import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// POST — генерирует токен привязки для текущего пользователя
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const token = crypto.randomBytes(20).toString('hex')
  const expiry = new Date(Date.now() + 30 * 60 * 1000) // 30 минут

  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramLinkToken: token, telegramLinkExpiry: expiry },
  })

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || ''
  const deepLink = `https://t.me/${botUsername}?start=${token}`

  return NextResponse.json({ token, deepLink, expiresAt: expiry.toISOString() })
}

// DELETE — отвязать Telegram от аккаунта
export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramId: null, telegramLinkToken: null, telegramLinkExpiry: null },
  })

  return NextResponse.json({ ok: true })
}
