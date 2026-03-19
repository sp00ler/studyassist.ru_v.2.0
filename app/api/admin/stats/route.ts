import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { startOfMonth, startOfDay } from 'date-fns'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const now = new Date()
    const monthStart = startOfMonth(now)
    const dayStart = startOfDay(now)

    const [
      totalOrders,
      newOrdersToday,
      monthRevenue,
      totalUsers,
      pendingReviews,
      statusCounts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: { createdAt: { gte: dayStart } },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'succeeded',
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      prisma.user.count(),
      prisma.review.count({ where: { approved: false } }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ])

    const totalPaid = statusCounts.find((s) => s.status === 'paid' || s.status === 'completed')
    const conversionRate =
      totalOrders > 0
        ? Math.round(((totalPaid?._count.id || 0) / totalOrders) * 100)
        : 0

    return NextResponse.json({
      totalOrders,
      newOrdersToday,
      monthRevenue: parseFloat(monthRevenue._sum.amount?.toString() || '0'),
      totalUsers,
      pendingReviews,
      conversionRate,
      statusCounts: statusCounts.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки статистики' }, { status: 500 })
  }
}
