import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Всегда возвращаем 200 (не раскрываем наличие аккаунта)
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: true })
    }

    // Удаляем старый токен сброса
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${email}` },
    }).catch(() => {})

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 час

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token: resetToken,
        expires,
      },
    })

    await sendPasswordResetEmail(email, user.name || 'пользователь', resetToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Ошибка отправки письма' }, { status: 500 })
  }
}
