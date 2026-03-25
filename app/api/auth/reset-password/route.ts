import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data

    const record = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: { startsWith: 'reset:' },
      },
    })

    if (!record) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или уже использована' },
        { status: 400 }
      )
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: record.identifier, token: record.token } },
      }).catch(() => {})
      return NextResponse.json(
        { error: 'Ссылка устарела. Запросите сброс пароля снова.' },
        { status: 400 }
      )
    }

    const email = record.identifier.replace('reset:', '')
    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email },
      data: { passwordHash, emailVerified: true },
    })

    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token: record.token } },
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
