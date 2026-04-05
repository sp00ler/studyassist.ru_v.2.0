import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSupportMessageToTelegram } from '@/lib/telegram'

// GET /api/chat/[sessionId]/messages?since=ISO_TIMESTAMP
// Возвращает сообщения после указанной даты (для поллинга)
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const since = req.nextUrl.searchParams.get('since')

    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId: params.sessionId,
        ...(since
          ? { createdAt: { gt: new Date(since) } }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages })
  } catch {
    return NextResponse.json({ messages: [] })
  }
}

// POST /api/chat/[sessionId]/messages — посетитель отправляет сообщение
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { text } = await req.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Текст обязателен' }, { status: 400 })
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: params.sessionId },
    })
    if (!session || session.status === 'closed') {
      return NextResponse.json({ error: 'Сессия не найдена или закрыта' }, { status: 404 })
    }

    const message = await prisma.chatMessage.create({
      data: { sessionId: params.sessionId, text: text.trim(), fromAdmin: false },
    })

    // Отправляем в Telegram как реплай на первое сообщение сессии (fire & forget)
    sendSupportMessageToTelegram({
      sessionId: params.sessionId,
      name: session.name,
      tgGroupMsgId: session.tgGroupMsgId,
      text: text.trim(),
    }).catch(console.error)

    return NextResponse.json({ message })
  } catch (err) {
    console.error('Chat message send error:', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
