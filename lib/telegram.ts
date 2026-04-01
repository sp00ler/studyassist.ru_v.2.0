import TelegramBot from 'node-telegram-bot-api'
import path from 'path'
import { resolveStoredFileAbsolutePath } from '@/lib/file-storage'

let bot: TelegramBot | null = null

function getBot(): TelegramBot | null {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null
  if (!bot) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  }
  return bot
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
    console.warn('Telegram bot not configured, skipping notification')
    return
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
