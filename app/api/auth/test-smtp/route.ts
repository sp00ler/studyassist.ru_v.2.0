import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/roles'
import nodemailer from 'nodemailer'

export async function GET(_req: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const config = {
    host: process.env.SMTP_HOST || 'smtp.beget.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
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

    return NextResponse.json({ ok: true, message: 'SMTP соединение успешно' })
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, config: { host: config.host, port: config.port, passSet: config.passSet }, error: 'Не удалось проверить SMTP соединение' }, { status: 200 })
  }
}
