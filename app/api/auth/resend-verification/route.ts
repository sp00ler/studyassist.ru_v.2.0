import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Всегда возвращаем 200 (не раскрываем, есть ли пользователь)
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true })
    }

    // Удаляем старый токен
    await prisma.verificationToken.deleteMany({
      where: { identifier: `verify:${email}` },
    }).catch(() => {})

    const verifyToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.verificationToken.create({
      data: {
        identifier: `verify:${email}`,
        token: verifyToken,
        expires,
      },
    })

    await sendVerificationEmail(email, user.name || 'пользователь', verifyToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Ошибка отправки письма' }, { status: 500 })
  }
}
