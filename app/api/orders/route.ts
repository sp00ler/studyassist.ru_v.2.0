import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendNewOrderEmail, sendOrderReceivedEmail } from '@/lib/email'
import { sendNewOrderNotification } from '@/lib/telegram'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getIP, rateLimit, rateLimitResponse } from '@/lib/rate-limit'

const estimatedPriceSchema = z.object({
  label: z.string(),
  kind: z.enum(['from', 'range', 'manual']),
  min: z.number(),
  max: z.number().optional(),
  confidence: z.enum(['low', 'medium', 'high']),
  snapshot: z.object({
    basePrice: z.number(),
    deadlineCoef: z.number(),
    subjectCoef: z.number(),
    complexityCoef: z.number(),
    daysLeft: z.number(),
  }),
}).optional().nullable()

const orderSchema = z.object({
  type: z.enum(['essay', 'coursework', 'diploma', 'lab', 'presentation', 'practice-report', 'uir', 'other']),
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
  estimatedPrice: estimatedPriceSchema,
})

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 orders per hour per IP
    const ip = getIP(req)
    const rl = rateLimit(`orders:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) return rateLimitResponse(rl.resetAt)

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
        // Для гостей сохраняем контакты прямо в заявке
        clientName: session?.user?.id ? null : data.name,
        clientEmail: session?.user?.id ? null : data.email,
        clientPhone: session?.user?.id ? null : (data.phone || null),
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
      sendOrderReceivedEmail(notificationData),
      sendNewOrderNotification({ ...notificationData, files: data.files }),
    ]).then((results) => {
      const labels = ['admin-email', 'client-email', 'telegram']
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`Notification ${labels[i]} failed:`, r.reason)
        }
      })
    })

    // Log pricing estimate for analytics / admin review (not stored in DB, no migration needed)
    if (data.estimatedPrice) {
      console.info(
        `[pricing] order=${order.id} type=${data.type} subject="${data.subject}" ` +
        `estimate="${data.estimatedPrice.label}" kind=${data.estimatedPrice.kind} ` +
        `confidence=${data.estimatedPrice.confidence} ` +
        `snapshot=${JSON.stringify(data.estimatedPrice.snapshot)}`,
      )
    }

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
