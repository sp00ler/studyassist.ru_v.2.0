import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendNewOrderEmail } from '@/lib/email'
import { sendNewOrderNotification } from '@/lib/telegram'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const body = await req.json()
    const { type, subject, deadline, description, clientName, clientEmail, clientPhone, price, source } = body

    if (!type || !subject || !deadline) {
      return NextResponse.json({ error: 'Тип работы, предмет и дедлайн обязательны' }, { status: 400 })
    }

    // Найти пользователя по email если указан
    let userId: string | null = null
    if (clientEmail) {
      const user = await prisma.user.findUnique({ where: { email: clientEmail } })
      if (user) userId = user.id
    }

    const adminNote = [
      source ? `Источник: ${source}` : null,
      clientName && !userId ? `Клиент: ${clientName}` : null,
      clientPhone && !userId ? `Телефон: ${clientPhone}` : null,
      clientEmail && !userId ? `Email: ${clientEmail}` : null,
    ].filter(Boolean).join('\n') || null

    const order = await prisma.order.create({
      data: {
        userId,
        type,
        subject,
        deadline: new Date(deadline),
        description: description || `Заявка создана администратором`,
        status: 'new',
        price: price ? parseFloat(price) : null,
        adminNote,
      },
    })

    // Уведомления
    if (clientEmail || clientName) {
      const deadlineFormatted = format(new Date(deadline), 'dd.MM.yyyy', { locale: ru })
      Promise.allSettled([
        sendNewOrderEmail({
          orderId: order.id,
          orderType: type,
          subject,
          deadline: deadlineFormatted,
          description: description || '',
          name: clientName || 'Клиент',
          email: clientEmail || '',
          phone: clientPhone || null,
          files: [],
        }),
        sendNewOrderNotification({
          orderId: order.id,
          orderType: type,
          subject,
          deadline: deadlineFormatted,
          description: description || '',
          name: clientName || 'Клиент',
          email: clientEmail || '',
          phone: clientPhone || null,
          filesCount: 0,
        }),
      ]).catch(console.error)
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Admin create order error:', error)
    return NextResponse.json({ error: 'Ошибка создания заявки' }, { status: 500 })
  }
}
