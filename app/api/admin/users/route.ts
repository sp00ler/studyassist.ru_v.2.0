import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const where = search ? {
      OR: [
        { email: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
      ],
    } : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          telegramId: true,
          isAdmin: true,
          provider: true,
          createdAt: true,
          lastLoginAt: true,
          prevLoginAt: true,
          lastIp: true,
          prevIp: true,
          lastCountry: true,
          lastUserAgent: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ users, total, page, limit })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки пользователей' }, { status: 500 })
  }
}
