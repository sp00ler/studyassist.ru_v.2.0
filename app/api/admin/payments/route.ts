import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/roles'

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireSuperAdmin()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = 50

    const [payments, total, totalsByStatus] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, email: true, name: true } },
          order: { select: { id: true } },
        },
      }),
      prisma.payment.count(),
      prisma.payment.groupBy({
        by: ['status'],
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ])

    const totals = totalsByStatus.map((t) => ({
      status: t.status,
      count: t._count._all,
      sum: t._sum.amount,
    }))

    return NextResponse.json({ payments, total, page, limit, totals })
  } catch (err) {
    console.error('Admin payments error:', err)
    return NextResponse.json({ error: 'Ошибка загрузки платежей' }, { status: 500 })
  }
}
