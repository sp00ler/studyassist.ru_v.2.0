import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { name, email, phone, telegramId, isAdmin } = await req.json()

    // Не позволяем снять с себя права администратора
    if (params.id === session.user.id && isAdmin === false) {
      return NextResponse.json({ error: 'Нельзя снять права администратора у себя' }, { status: 400 })
    }

    // Проверка уникальности email
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: params.id } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Email уже используется другим пользователем' }, { status: 400 })
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: name ?? undefined,
        email: email ?? undefined,
        phone: phone || null,
        telegramId: telegramId || null,
        isAdmin: isAdmin ?? undefined,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
  }
}
