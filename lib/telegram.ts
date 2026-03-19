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

export async function setWebhook(webhookUrl: string): Promise<void> {
  const tgBot = getBot()
  if (!tgBot) return
  await tgBot.setWebHook(webhookUrl)
}
