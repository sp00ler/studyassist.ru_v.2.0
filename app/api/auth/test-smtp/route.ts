import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Только для администраторов' }, { status: 403 })
  }

  const config = {
    host: process.env.SMTP_HOST || 'smtp.beget.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    user: process.env.SMTP_USER || '(не задан)',
    passSet: !!(process.env.SMTP_PASS),
  }

  try {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1' as const },
      connectionTimeout: 10000,
    })

    await transport.verify()

    return NextResponse.json({ ok: true, config, message: 'SMTP соединение успешно' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, config, error: msg }, { status: 200 })
  }
}
