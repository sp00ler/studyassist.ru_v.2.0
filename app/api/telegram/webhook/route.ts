import { NextRequest, NextResponse } from 'next/server'
import { handleUpdate } from '@/lib/telegram-handler'

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    // Fire and forget — Telegram expects quick 200 response
    handleUpdate(update).catch(err => console.error('Telegram update error:', err))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 }) // Always 200 for Telegram
  }
}
