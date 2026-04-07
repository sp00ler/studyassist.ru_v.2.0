import TelegramBot from 'node-telegram-bot-api'
import path from 'path'
import { resolveStoredFileAbsolutePath } from '@/lib/file-storage'

// ─── Бот для заявок и admin-уведомлений (@ask_studyassistBot) ────────────────
let bot: TelegramBot | null = null
let botUsername: string | null = null  // кэшируем username для логов

function getBot(): TelegramBot | null {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null
  if (!bot) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
    botUsername = null // сбрасываем при создании нового инстанса
  }
  return bot
}

// ─── Бот онлайн-чата поддержки (@beseda_studysupport_bot) ────────────────────
// Использует SUPPORT_BOT_TOKEN; НЕ используется для заявок и admin-уведомлений.
let supportBot: TelegramBot | null = null

function getSupportBot(): TelegramBot | null {
  const token = process.env.SUPPORT_BOT_TOKEN
  if (!token) {
    // Если SUPPORT_BOT_TOKEN не задан — НЕ делаем fallback на TELEGRAM_BOT_TOKEN,
    // чтобы не перепутать боты. Просто скипаем support-уведомление.
    console.warn('[telegram:support] SUPPORT_BOT_TOKEN не задан, сообщение чата не отправлено')
    return null
  }
  if (!supportBot) {
    supportBot = new TelegramBot(token, { polling: false })
  }
  return supportBot
}

function getOrderTypeLabel(type: string): string {
  const types: Record<string, string> = {
    coursework: 'Курсовая работа',
    diploma: 'Дипломная работа (ВКР)',
    essay: 'Реферат / Эссе',
    lab: 'Лабораторная работа / Задача',
    presentation: 'Презентация / Отчёт',
    other: 'Другое',
  }
  return types[type] || type
}

function formatOrderId(id: string): string {
  const hash = id.replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')
  return `#${hash}`
}

export async function sendNewOrderNotification(data: {
  orderId: string
  orderType: string
  subject: string
  deadline: string
  description: string
  name: string
  email: string
  phone?: string | null
  filesCount: number
  files?: string[]
}): Promise<void> {
  const tgBot = getBot()
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!tgBot || !chatId) {
    console.warn('[telegram:orders] TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы, уведомление пропущено')
    return
  }

  // При первом вызове логируем имя бота — для диагностики в pm2 logs
  if (!botUsername) {
    tgBot.getMe().then(me => {
      botUsername = me.username || me.first_name
      console.info(`[telegram:orders] Уведомления о заявках отправляет: @${botUsername} → chatId=${chatId}`)
    }).catch(() => {
      console.warn('[telegram:orders] Не удалось получить getMe()')
    })
  }

  const orderLabel = formatOrderId(data.orderId)
  const typeLabel = getOrderTypeLabel(data.orderType)
  const adminUrl = `${process.env.NEXTAUTH_URL}/admin/orders`

  // Персональные данные клиента не передаются в Telegram (трансграничная передача).
  // Полные данные доступны только в защищённой admin-панели.
  const message = `
📋 *Новая заявка ${orderLabel}*

📚 *Тип:* ${typeLabel}
📖 *Предмет:* ${data.subject}
⏰ *Дедлайн:* ${data.deadline}
📎 *Файлов:* ${data.filesCount} шт.
  `.trim()

  await tgBot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Взять в работу', callback_data: `set_status:${data.orderId}:in_progress` },
        ],
        [
          { text: '📋 Открыть в панели', url: adminUrl },
        ],
      ],
    },
  })

  // Отправляем файлы если есть
  if (data.files && data.files.length > 0) {
    for (const filePath of data.files) {
      const fullPath = resolveStoredFileAbsolutePath(filePath)
      if (fullPath) {
        await tgBot.sendDocument(chatId, fullPath, {}, {
          filename: path.basename(filePath),
          contentType: 'application/octet-stream',
        })
      }
    }
  }
}

export async function sendStatusUpdateNotification(
  telegramId: string,
  orderId: string,
  newStatus: string,
  paymentLink?: string | null
): Promise<void> {
  const tgBot = getBot()
  if (!tgBot || !telegramId) return

  const orderLabel = formatOrderId(orderId)
  const statusLabels: Record<string, string> = {
    new: 'Новая',
    in_progress: '🔧 В работе',
    ready_for_review: '✅ Готова к проверке',
    awaiting_payment: '💳 Ожидает оплаты',
    paid: '✅ Оплачена',
    completed: '🎉 Завершена',
    revision: '🔄 На доработке',
    cancelled: '❌ Отменена',
  }

  const statusLabel = statusLabels[newStatus] || newStatus
  let message = `📋 *Заявка ${orderLabel}*\n\nСтатус изменён: *${statusLabel}*`

  if (newStatus === 'awaiting_payment' && paymentLink) {
    message += `\n\nВаша работа готова! Перейдите по ссылке для оплаты.`
  } else if (newStatus === 'completed') {
    message += `\n\nРабота завершена. Спасибо за доверие! 🎓`
  } else if (newStatus === 'revision') {
    message += `\n\nВаш запрос на доработку принят. Мы свяжемся с вами.`
  }

  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard`

  const buttons: TelegramBot.InlineKeyboardButton[][] = []
  if (newStatus === 'awaiting_payment' && paymentLink) {
    buttons.push([{ text: '💳 Оплатить сейчас', url: paymentLink }])
  }
  buttons.push([{ text: '📂 Открыть в ЛК', url: dashboardUrl }])

  await tgBot.sendMessage(telegramId, message, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: buttons },
  })
}

export async function sendPaymentLinkNotification(
  telegramId: string,
  orderId: string,
  paymentLink: string,
  amount: number
): Promise<void> {
  const tgBot = getBot()
  if (!tgBot || !telegramId) return

  const orderLabel = formatOrderId(orderId)
  const message = `💳 *Ссылка на оплату — ${orderLabel}*\n\nСтоимость работы: *${amount.toLocaleString('ru-RU')} ₽*`

  await tgBot.sendMessage(telegramId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: `💳 Оплатить ${amount.toLocaleString('ru-RU')} ₽`, url: paymentLink }],
        [{ text: '📂 Личный кабинет', url: `${process.env.NEXTAUTH_URL}/dashboard` }],
      ],
    },
  })
}

export async function sendWorkCompletedNotification(
  telegramId: string,
  orderId: string,
  fileCount: number
): Promise<void> {
  const tgBot = getBot()
  if (!tgBot || !telegramId) return

  const orderLabel = formatOrderId(orderId)
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard`

  await tgBot.sendMessage(telegramId,
    `🎉 *Работа по заявке ${orderLabel} готова!*\n\nФайлов: ${fileCount} шт. — доступны для скачивания.\nЕсли есть замечания — запросите доработку в личном кабинете.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📥 Скачать работу', url: dashboardUrl }],
        ],
      },
    }
  )
}

export async function sendRevisionRequestNotification(
  orderId: string,
  clientName: string,
  clientEmail: string,
  note: string
): Promise<void> {
  const tgBot = getBot()
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!tgBot || !chatId) return

  const orderLabel = formatOrderId(orderId)
  const adminUrl = `${process.env.NEXTAUTH_URL}/admin/orders`

  // ПД клиента не передаются в Telegram
  const message = `🔄 *Запрос на доработку — ${orderLabel}*\n\n📝 *Замечания:*\n${note.slice(0, 400)}${note.length > 400 ? '...' : ''}`

  await tgBot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 Открыть заявку', url: adminUrl }],
      ],
    },
  })
}

export async function setWebhook(webhookUrl: string): Promise<void> {
  const tgBot = getBot()
  if (!tgBot) return
  await tgBot.setWebHook(webhookUrl)
}

// ─── Онлайн-чат поддержки ────────────────────────────────────────────────────
// SUPPORT_CHAT_ID — ID группы для чатов поддержки (по умолчанию = TELEGRAM_CHAT_ID)
// Важно: в боте должен быть отключён Group Privacy (BotFather → Bot Settings → Group Privacy → off)

/**
 * Отправляет первое сообщение новой чат-сессии в группу поддержки.
 * Возвращает message_id отправленного сообщения (для реплаев).
 */
export async function sendSupportSessionToTelegram(data: {
  sessionId: string
  name: string | null
  contact: string | null
  text: string
}): Promise<number | null> {
  const tgBot = getSupportBot()
  const chatId = process.env.SUPPORT_CHAT_ID || process.env.TELEGRAM_CHAT_ID
  if (!tgBot || !chatId) {
    console.warn('sendSupportSessionToTelegram skipped: missing SUPPORT_BOT_TOKEN/TELEGRAM_BOT_TOKEN or SUPPORT_CHAT_ID/TELEGRAM_CHAT_ID')
    return null
  }

  const who = data.name || 'Аноним'
  const contactLine = data.contact ? `📱 ${data.contact}` : ''
  const msgText = (
    `💬 Новый чат с поддержкой\n` +
    `👤 ${who}${contactLine ? ' | ' + contactLine : ''}\n\n` +
    `${data.text}\n\n` +
    `▫️ [session:${data.sessionId}]`
  )

  try {
    // Важно: без parse_mode, чтобы текст пользователя/контакт не ломал Markdown-парсер Telegram.
    const msg = await tgBot.sendMessage(chatId, msgText)
    return msg.message_id
  } catch (err) {
    console.error('sendSupportSessionToTelegram error:', { chatId, err })
    return null
  }
}

/**
 * Отправляет последующее сообщение посетителя в группу поддержки
 * как реплай на первое сообщение сессии.
 */
export async function sendSupportMessageToTelegram(data: {
  sessionId: string
  name: string | null
  tgGroupMsgId: number | null
  text: string
}): Promise<void> {
  const tgBot = getSupportBot()
  const chatId = process.env.SUPPORT_CHAT_ID || process.env.TELEGRAM_CHAT_ID
  if (!tgBot || !chatId) {
    console.warn('sendSupportMessageToTelegram skipped: missing SUPPORT_BOT_TOKEN/TELEGRAM_BOT_TOKEN or SUPPORT_CHAT_ID/TELEGRAM_CHAT_ID')
    return
  }

  const msgText = `💬 ${data.name || 'Посетитель'}: ${data.text}\n\n▫️ [session:${data.sessionId}]`

  await tgBot.sendMessage(chatId, msgText, {
    ...(data.tgGroupMsgId ? { reply_to_message_id: data.tgGroupMsgId } : {}),
  }).catch(err => {
    console.error('sendSupportMessageToTelegram error:', { chatId, err })
  })
}
