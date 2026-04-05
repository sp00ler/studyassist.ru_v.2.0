import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSupportSessionToTelegram } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const { name, contact, message } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Сообщение обязательно' }, { status: 400 })
    }

    // Создаём сессию и первое сообщение
    const session = await prisma.chatSession.create({
      data: {
        name: name?.trim() || null,
        contact: contact?.trim() || null,
        messages: {
          create: {
            text: message.trim(),
            fromAdmin: false,
          },
        },
      },
      include: { messages: true },
    })

    // Отправляем в Telegram (fire & forget), сохраняем message_id
    sendSupportSessionToTelegram({
      sessionId: session.id,
      name: session.name,
      contact: session.contact,
      text: message.trim(),
    })
      .then(tgMsgId => {
        if (tgMsgId) {
          prisma.chatSession
            .update({ where: { id: session.id }, data: { tgGroupMsgId: tgMsgId } })
            .catch(console.error)
        }
      })
      .catch(console.error)

    return NextResponse.json({
      sessionId: session.id,
      message: session.messages[0],
    })
  } catch (err) {
    console.error('Chat session create error:', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
