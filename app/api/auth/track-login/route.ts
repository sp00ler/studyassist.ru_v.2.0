import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { getCountryByIp } from '@/lib/geo'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '—'
  )
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const ip = getClientIp(req)
    const ua = req.headers.get('user-agent') || null

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastIp: true, lastLoginAt: true },
    })

    const country = await getCountryByIp(ip)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        prevIp: user?.lastIp ?? null,
        prevLoginAt: user?.lastLoginAt ?? null,
        lastIp: ip,
        lastLoginAt: new Date(),
        lastUserAgent: ua,
        lastCountry: country,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Track login error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
