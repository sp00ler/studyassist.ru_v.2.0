import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

const registerSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  consentMarketing: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, consentMarketing } = parsed.data

    // Проверяем существующего пользователя
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже зарегистрирован' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const now = new Date()
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        provider: 'credentials',
        emailVerified: false,
        consentPdAt: now,
        consentMarketing: consentMarketing ?? false,
        consentMarketingAt: consentMarketing ? now : null,
      },
    })

    // Генерируем токен подтверждения email
    const verifyToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа

    // Удаляем старые токены для этого email (если есть)
    await prisma.verificationToken.deleteMany({
      where: { identifier: `verify:${email}` },
    }).catch(() => {})

    await prisma.verificationToken.create({
      data: {
        identifier: `verify:${email}`,
        token: verifyToken,
        expires,
      },
    })

    // Отправляем письмо с подтверждением (не блокируем ответ при ошибке)
    sendVerificationEmail(email, name, verifyToken).catch((err) => {
      console.error('Failed to send verification email:', err)
    })

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
