import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { getIP, rateLimit } from '@/lib/rate-limit'

const PROVIDER_NAMES: Record<string, string> = {
  vk: 'VK',
  yandex: 'Яндекс',
  mailru: 'Mail.ru',
}

function providerName(provider: string | null): string {
  if (!provider) return 'соцсеть'
  return PROVIDER_NAMES[provider] || 'соцсеть'
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 запросов / 15 минут на IP
    const ip = getIP(req)
    const rl = rateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Слишком много попыток. Попробуйте через 15 минут.' },
        { status: 429 }
      )
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь с такой почтой не найден', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error: `Этот аккаунт входит через ${providerName(user.provider)}. Пароля у него нет — войдите через эту кнопку на странице входа.`,
          code: 'OAUTH_ONLY',
          provider: user.provider,
        },
        { status: 409 }
      )
    }

    // Удаляем старый токен сброса
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${normalizedEmail}` },
    }).catch(() => {})

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 час

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${normalizedEmail}`,
        token: resetToken,
        expires,
      },
    })

    await sendPasswordResetEmail(user.email, user.name || 'пользователь', resetToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Ошибка отправки письма' }, { status: 500 })
  }
}
