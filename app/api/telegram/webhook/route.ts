import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { handleUpdate } from '@/lib/telegram-handler'
import { telegramWebhookSecret } from '@/lib/telegram'

function hasValidSecret(req: NextRequest): boolean {
  const expected = telegramWebhookSecret()
  const got = req.headers.get('x-telegram-bot-api-secret-token')
  if (!expected || !got || got.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected))
}

export async function POST(req: NextRequest) {
  // Без секрета любой мог слать поддельные апдейты от имени пользователей/админов.
  if (!hasValidSecret(req)) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }
  try {
    const update = await req.json()
    const msg = update.message
    console.log('[tg:webhook] update_id=%s type=%s chat_type=%s has_reply=%s text=%s',
      update.update_id,
      msg ? 'message' : update.callback_query ? 'callback' : 'other',
      msg?.chat?.type ?? '-',
      msg?.reply_to_message ? 'yes' : 'no',
      JSON.stringify(msg?.text?.slice(0, 80) ?? null),
    )
    if (msg?.reply_to_message) {
      console.log('[tg:webhook] reply_to text=%s', JSON.stringify(msg.reply_to_message.text?.slice(0, 120) ?? null))
    }
    // Fire and forget — Telegram expects quick 200 response
    handleUpdate(update).catch(err => console.error('Telegram update error:', err))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 }) // Always 200 for Telegram
  }
}
