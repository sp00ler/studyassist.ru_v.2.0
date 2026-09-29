import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { isSuperAdminEmail, requireSuperAdmin } from '@/lib/roles'

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

    const actingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, isAdmin: true },
    })
    if (!actingUser?.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }
    const actingIsSuperAdmin = isSuperAdminEmail(actingUser.email)

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, isAdmin: true },
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }
    const targetIsSuperAdmin = targetUser.isAdmin && isSuperAdminEmail(targetUser.email)

    // Изменение прав администратора — только для главного администратора,
    // и нельзя менять права себе или другому главному администратору.
    if (typeof isAdmin === 'boolean' && isAdmin !== targetUser.isAdmin) {
      if (!actingIsSuperAdmin) {
        return NextResponse.json({ error: 'Изменять права администратора может только главный администратор' }, { status: 403 })
      }
      if (params.id === session.user.id) {
        return NextResponse.json({ error: 'Нельзя менять права администратора у себя' }, { status: 403 })
      }
      if (targetIsSuperAdmin) {
        return NextResponse.json({ error: 'Нельзя менять права главного администратора' }, { status: 403 })
      }
    }

    // Изменение email админа/главного админа
    if (email && email !== targetUser.email) {
      if (targetIsSuperAdmin) {
        return NextResponse.json({ error: 'Нельзя менять email главного администратора' }, { status: 403 })
      }
      if (targetUser.isAdmin && !actingIsSuperAdmin) {
        return NextResponse.json({ error: 'Менять email администратора может только главный администратор' }, { status: 403 })
      }

      // Проверка уникальности email
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
      select: { id: true, name: true, email: true, phone: true, telegramId: true, isAdmin: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user: actingUser, error } = await requireSuperAdmin()
    if (error) return error

    if (params.id === actingUser.id) {
      return NextResponse.json({ error: 'Нельзя удалить собственный аккаунт' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, isAdmin: true },
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }
    if (targetUser.isAdmin && isSuperAdminEmail(targetUser.email)) {
      return NextResponse.json({ error: 'Нельзя удалить главного администратора' }, { status: 403 })
    }

    const paymentsCount = await prisma.payment.count({ where: { userId: params.id } })
    if (paymentsCount > 0) {
      return NextResponse.json(
        { error: 'У пользователя есть платежи — удалить нельзя (записи нужны для бухгалтерии).' },
        { status: 409 }
      )
    }

    // Каскадное удаление (без платежей — они блокируют удаление выше)
    await prisma.$transaction([
      prisma.order.deleteMany({ where: { userId: params.id } }),
      prisma.review.deleteMany({ where: { userId: params.id } }),
      prisma.session.deleteMany({ where: { userId: params.id } }),
      prisma.account.deleteMany({ where: { userId: params.id } }),
      prisma.user.delete({ where: { id: params.id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 })
  }
}
