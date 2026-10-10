import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { handleSupportUpdate } from '@/lib/telegram-handler'

export async function POST(req: NextRequest) {
  const token = process.env.SUPPORT_BOT_TOKEN
  const expected = token ? crypto.createHmac('sha256', token).update('telegram-webhook').digest('hex') : null
  const got = req.headers.get('x-telegram-bot-api-secret-token')
  if (!expected || !got || Buffer.byteLength(got) !== Buffer.byteLength(expected) ||
      !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected))) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }
  try {
    await handleSupportUpdate(await req.json())
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Support update error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
