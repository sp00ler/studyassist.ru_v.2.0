import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendNewOrderEmail, sendOrderReceivedEmail } from '@/lib/email'
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
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Переданы некорректные данные заявки' }, { status: 400 })
    }
    const { type, subject, deadline, description, clientName, clientEmail, clientPhone, price, source } = body

    if (!type || !subject || !deadline) {
      return NextResponse.json({ error: 'Тип работы, предмет и дедлайн обязательны' }, { status: 400 })
    }

    const normalizedName = typeof clientName === 'string' ? clientName.trim() : ''
    const normalizedEmail = typeof clientEmail === 'string' ? clientEmail.trim().toLowerCase() : ''
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email клиента обязателен для уведомлений и счёта' }, { status: 400 })
    }
    if (typeof clientEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Укажите корректный email клиента' }, { status: 400 })
    }
    if (typeof deadline !== 'string' || Number.isNaN(new Date(deadline).getTime())) {
      return NextResponse.json({ error: 'Укажите корректный дедлайн' }, { status: 400 })
    }
    const deadlineDate = new Date(deadline)
    const deadlineFormatted = format(deadlineDate, 'dd.MM.yyyy', { locale: ru })

    // Найти пользователя по email если указан
    let userId: string | null = null
    let recipientName = normalizedName || 'Клиент'
    let recipientEmail = normalizedEmail
    if (normalizedEmail) {
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
      if (user) userId = user.id
      if (user?.email) recipientEmail = user.email
      if (!normalizedName && user?.name) recipientName = user.name
    }

    const adminNote = [
      source ? `Источник: ${source}` : null,
      normalizedName && !userId ? `Клиент: ${normalizedName}` : null,
      clientPhone && !userId ? `Телефон: ${clientPhone}` : null,
      normalizedEmail && !userId ? `Email: ${normalizedEmail}` : null,
    ].filter(Boolean).join('\n') || null

    const order = await prisma.order.create({
      data: {
        userId,
        clientName: normalizedName || null,
        clientEmail: recipientEmail || null,
        clientPhone: typeof clientPhone === 'string' && clientPhone.trim() ? clientPhone.trim() : null,
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
    const notificationData = {
      orderId: order.id,
      orderType: type,
      subject,
      deadline: deadlineFormatted,
      description: description || '',
      name: recipientName,
      email: recipientEmail,
      phone: typeof clientPhone === 'string' && clientPhone.trim() ? clientPhone.trim() : null,
    }
    const [adminEmailResult, clientEmailResult, telegramResult] = await Promise.allSettled([
      sendNewOrderEmail({ ...notificationData, files: [] }),
      sendOrderReceivedEmail(notificationData),
      sendNewOrderNotification({ ...notificationData, filesCount: 0 }),
    ])
    const notifications = {
      adminEmail: adminEmailResult.status === 'fulfilled' ? 'sent' : 'failed',
      clientEmail: clientEmailResult.status === 'fulfilled' ? 'sent' : 'failed',
      telegram: telegramResult.status === 'rejected'
        ? 'failed'
        : telegramResult.value ? 'sent' : 'skipped',
    } as const
    if (adminEmailResult.status === 'rejected') console.error('Admin order admin email notification failed:', adminEmailResult.reason)
    if (clientEmailResult.status === 'rejected') console.error('Admin order client email notification failed:', clientEmailResult.reason)
    if (telegramResult.status === 'rejected') console.error('Admin order Telegram notification failed:', telegramResult.reason)

    return NextResponse.json({ success: true, order, notifications })
  } catch (error) {
    console.error('Admin create order error:', error)
    return NextResponse.json({ error: 'Ошибка создания заявки' }, { status: 500 })
  }
}
