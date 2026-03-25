import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_token', req.url)
      )
    }

    const record = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: { startsWith: 'verify:' },
      },
    })

    if (!record) {
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_token', req.url)
      )
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: record.identifier, token: record.token } },
      }).catch(() => {})
      return NextResponse.redirect(
        new URL('/auth/login?error=token_expired', req.url)
      )
    }

    const email = record.identifier.replace('verify:', '')

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    })

    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token: record.token } },
    }).catch(() => {})

    return NextResponse.redirect(
      new URL('/auth/login?verified=1', req.url)
    )
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=server_error', req.url)
    )
  }
}
