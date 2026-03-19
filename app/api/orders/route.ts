import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendNewOrderEmail } from '@/lib/email'
import { sendNewOrderNotification } from '@/lib/telegram'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const orderSchema = z.object({
  type: z.enum(['coursework', 'diploma', 'essay', 'lab', 'presentation', 'other']),
  subject: z.string().min(2, 'Укажите предмет'),
  deadline: z.string().refine((d) => {
    const date = new Date(d)
    return date > new Date()
  }, 'Дедлайн должен быть в будущем'),
  description: z.string().min(50, 'Описание должно содержать минимум 50 символов'),
  name: z.string().min(2, 'Укажите ваше имя'),
  email: z.string().email('Некорректный email'),
  phone: z.string().optional().nullable(),
  files: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()

    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const data = parsed.data

    const order = await prisma.order.create({
      data: {
        userId: session?.user?.id || null,
        type: data.type,
        subject: data.subject,
        deadline: new Date(data.deadline),
        description: data.description,
        files: data.files ? JSON.stringify(data.files) : null,
        status: 'new',
      },
    })

    const deadlineFormatted = format(new Date(data.deadline), 'dd.MM.yyyy', { locale: ru })

    // Отправляем уведомления асинхронно, не блокируем ответ
    const notificationData = {
      orderId: order.id,
      orderType: data.type,
      subject: data.subject,
      deadline: deadlineFormatted,
      description: data.description,
      name: data.name,
      email: data.email,
      phone: data.phone,
      filesCount: data.files?.length || 0,
    }

    Promise.allSettled([
      sendNewOrderEmail({ ...notificationData, files: data.files }),
      sendNewOrderNotification(notificationData),
    ]).catch(console.error)

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании заявки' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const isAdmin = session.user.isAdmin

    if (isAdmin) {
      // Администратор видит все заявки
      const status = searchParams.get('status')
      const type = searchParams.get('type')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const where: Record<string, unknown> = {}
      if (status) where.status = status
      if (type) where.type = type

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { user: { select: { name: true, email: true, phone: true, telegramId: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.order.count({ where }),
      ])

      return NextResponse.json({ orders, total, page, limit })
    } else {
      // Студент видит только свои заявки
      const orders = await prisma.order.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ orders })
    }
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки заявок' }, { status: 500 })
  }
}
