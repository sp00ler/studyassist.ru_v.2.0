import TelegramBot from 'node-telegram-bot-api'

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

  const message = `
📋 *Новая заявка ${orderLabel}*

📚 *Тип:* ${typeLabel}
📖 *Предмет:* ${data.subject}
⏰ *Дедлайн:* ${data.deadline}

📝 *Описание:*
${data.description.slice(0, 500)}${data.description.length > 500 ? '...' : ''}

👤 *Клиент:* ${data.name}
📧 *Email:* ${data.email}
${data.phone ? `📱 *Телефон:* ${data.phone}` : ''}
📎 *Файлы:* ${data.filesCount} шт.

[Открыть в панели администратора](${adminUrl})
  `.trim()

  await tgBot.sendMessage(chatId, message, { parse_mode: 'Markdown' })

  // Отправляем файлы если есть
  if (data.files && data.files.length > 0) {
    const path = await import('path')
    const fs = await import('fs')
    for (const filePath of data.files) {
      const fullPath = path.join(process.cwd(), 'public', filePath)
      if (fs.existsSync(fullPath)) {
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
    cancelled: '❌ Отменена',
  }

  const statusLabel = statusLabels[newStatus] || newStatus
  let message = `📋 *Заявка ${orderLabel}*\n\nСтатус изменён: *${statusLabel}*`

  if (newStatus === 'awaiting_payment' && paymentLink) {
    message += `\n\nВаша работа готова! Перейдите по ссылке для оплаты:\n[Оплатить работу](${paymentLink})`
  } else if (newStatus === 'completed') {
    message += `\n\nРабота передана. Спасибо за доверие! 🎓`
  }

  message += `\n\n[Перейти в личный кабинет](${process.env.NEXTAUTH_URL}/dashboard)`

  await tgBot.sendMessage(telegramId, message, { parse_mode: 'Markdown' })
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
  const message = `
💳 *Ссылка на оплату — ${orderLabel}*

Стоимость работы: *${amount.toLocaleString('ru-RU')} ₽*

[Оплатить работу](${paymentLink})

После оплаты работа будет доступна в [личном кабинете](${process.env.NEXTAUTH_URL}/dashboard)
  `.trim()

  await tgBot.sendMessage(telegramId, message, { parse_mode: 'Markdown' })
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

  const message = `🎉 *Работа по заявке ${orderLabel} готова!*\n\nФайлы готовой работы (${fileCount} шт.) доступны для скачивания.\n\nЕсли есть замечания, вы можете запросить доработку прямо из личного кабинета.\n\n[Скачать работу](${dashboardUrl})`

  await tgBot.sendMessage(telegramId, message, { parse_mode: 'Markdown' })
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

  const message = `🔄 *Запрос на доработку — ${orderLabel}*\n\n👤 *Клиент:* ${clientName} (${clientEmail})\n\n📝 *Замечания:*\n${note.slice(0, 500)}${note.length > 500 ? '...' : ''}\n\n[Открыть заявку](${adminUrl})`

  await tgBot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
}

export async function setWebhook(webhookUrl: string): Promise<void> {
  const tgBot = getBot()
  if (!tgBot) return
  await tgBot.setWebHook(webhookUrl)
}
