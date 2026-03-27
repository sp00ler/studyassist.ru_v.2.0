import TelegramBot from 'node-telegram-bot-api'
import { prisma } from '@/lib/prisma'
import { formatOrderId, getStatusLabel } from '@/lib/utils'

function makeBot(): TelegramBot | null {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null
  return new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
}

const BASE_URL = process.env.NEXTAUTH_URL || 'https://studyassist.ru'

// ─── Главный обработчик апдейтов ────────────────────────────────────────────

export async function handleUpdate(update: TelegramBot.Update): Promise<void> {
  const bot = makeBot()
  if (!bot) return

  try {
    if (update.message) {
      await handleMessage(bot, update.message)
    } else if (update.callback_query) {
      await handleCallbackQuery(bot, update.callback_query)
    }
  } catch (err) {
    console.error('Telegram handler error:', err)
  }
}

// ─── Сообщения / команды ────────────────────────────────────────────────────

async function handleMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id.toString()
  const text = (msg.text || '').trim()

  if (text.startsWith('/start')) {
    const token = text.split(' ')[1]?.trim()
    if (token) {
      await handleLinkToken(bot, chatId, msg.from?.first_name || 'друг', token)
    } else {
      await handleStart(bot, chatId, msg.from?.first_name || 'друг')
    }
    return
  }

  if (text === '/orders' || text === '/мои') {
    await handleOrdersList(bot, chatId)
    return
  }

  if (text === '/help' || text === '/помощь') {
    await handleHelp(bot, chatId)
    return
  }

  // Неизвестная команда
  const user = await prisma.user.findFirst({ where: { telegramId: chatId } })
  if (!user) {
    await bot.sendMessage(chatId,
      `Привяжите аккаунт StudyAssist, чтобы получать уведомления.\n\n👉 [Привязать в личном кабинете](${BASE_URL}/dashboard)`,
      { parse_mode: 'Markdown' }
    )
  }
}

// ─── /start ─────────────────────────────────────────────────────────────────

async function handleStart(bot: TelegramBot, chatId: string, firstName: string) {
  const user = await prisma.user.findFirst({ where: { telegramId: chatId } })

  if (user) {
    await bot.sendMessage(chatId,
      `👋 Привет, ${user.name || firstName}! Ваш аккаунт StudyAssist уже привязан.\n\n` +
      `📋 /orders — список заявок\n` +
      `❓ /help — помощь`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📂 Мои заявки', callback_data: 'cmd:orders' }],
            [{ text: '🌐 Перейти в ЛК', url: `${BASE_URL}/dashboard` }],
          ],
        },
      }
    )
  } else {
    await bot.sendMessage(chatId,
      `🎓 *StudyAssist — помощь с учёбой*\n\n` +
      `Я буду присылать уведомления о ваших заявках.\n\n` +
      `Чтобы начать — привяжите ваш аккаунт:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Привязать аккаунт', url: `${BASE_URL}/dashboard` }],
          ],
        },
      }
    )
  }
}

// ─── Привязка по токену (/start TOKEN) ──────────────────────────────────────

async function handleLinkToken(bot: TelegramBot, chatId: string, firstName: string, token: string) {
  const user = await prisma.user.findFirst({
    where: {
      telegramLinkToken: token,
      telegramLinkExpiry: { gt: new Date() },
    },
  })

  if (!user) {
    await bot.sendMessage(chatId,
      `❌ Ссылка устарела или недействительна.\n\nСгенерируйте новую в [личном кабинете](${BASE_URL}/dashboard).`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Привязываем
  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramId: chatId,
      telegramLinkToken: null,
      telegramLinkExpiry: null,
    },
  })

  await bot.sendMessage(chatId,
    `✅ *Аккаунт привязан!*\n\n` +
    `Добро пожаловать, ${user.name || firstName}!\n\n` +
    `Теперь вы будете получать уведомления о статусе заявок прямо здесь.\n\n` +
    `📋 /orders — ваши заявки`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📂 Мои заявки', callback_data: 'cmd:orders' }],
          [{ text: '🌐 Личный кабинет', url: `${BASE_URL}/dashboard` }],
        ],
      },
    }
  )
}

// ─── /orders ─────────────────────────────────────────────────────────────────

async function handleOrdersList(bot: TelegramBot, chatId: string) {
  const user = await prisma.user.findFirst({ where: { telegramId: chatId } })

  if (!user) {
    await bot.sendMessage(chatId,
      `Сначала привяжите аккаунт в [личном кабинете](${BASE_URL}/dashboard).`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  if (orders.length === 0) {
    await bot.sendMessage(chatId,
      `У вас пока нет заявок.\n\n[Оставить заявку](${BASE_URL}/#order)`,
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '📝 Оставить заявку', url: `${BASE_URL}/#order` }]] },
      }
    )
    return
  }

  const STATUS_EMOJI: Record<string, string> = {
    new: '🆕', in_progress: '🔧', ready_for_review: '✅',
    awaiting_payment: '💳', paid: '✅', completed: '🎉',
    revision: '🔄', cancelled: '❌',
  }

  let text = `📋 *Ваши заявки (последние 5):*\n\n`
  for (const o of orders) {
    const emoji = STATUS_EMOJI[o.status] || '❓'
    const label = getStatusLabel(o.status)
    text += `${emoji} *${formatOrderId(o.id)}* — ${o.subject}\n`
    text += `   Статус: ${label}\n\n`
  }

  await bot.sendMessage(chatId, text.trim(), {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[{ text: '🌐 Открыть в ЛК', url: `${BASE_URL}/dashboard` }]],
    },
  })
}

// ─── /help ───────────────────────────────────────────────────────────────────

async function handleHelp(bot: TelegramBot, chatId: string) {
  await bot.sendMessage(chatId,
    `*StudyAssist — команды бота*\n\n` +
    `📋 /orders — мои заявки\n` +
    `🌐 /start — главное меню\n` +
    `❓ /help — эта справка\n\n` +
    `По вопросам: [support@studyassist.ru](mailto:support@studyassist.ru)`,
    { parse_mode: 'Markdown' }
  )
}

// ─── Callback Query (inline-кнопки) ─────────────────────────────────────────

async function handleCallbackQuery(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  const chatId = query.message?.chat.id.toString()
  const msgId = query.message?.message_id
  const data = query.data || ''

  // Всегда отвечаем на callback
  await bot.answerCallbackQuery(query.id).catch(() => {})

  if (!chatId) return

  // cmd:orders
  if (data === 'cmd:orders') {
    await handleOrdersList(bot, chatId)
    return
  }

  // set_status:ORDER_ID:STATUS — только для администраторов
  if (data.startsWith('set_status:')) {
    const [, orderId, newStatus] = data.split(':')
    await handleAdminSetStatus(bot, chatId, msgId, query.id, orderId, newStatus)
    return
  }
}

// ─── Быстрое изменение статуса (для админов) ─────────────────────────────────

async function handleAdminSetStatus(
  bot: TelegramBot,
  chatId: string,
  msgId: number | undefined,
  callbackId: string,
  orderId: string,
  newStatus: string
) {
  // Проверяем, является ли пользователь администратором
  const admin = await prisma.user.findFirst({
    where: { telegramId: chatId, isAdmin: true },
  })

  if (!admin) {
    await bot.answerCallbackQuery(callbackId, { text: '⛔ Только для администраторов', show_alert: true })
    return
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) {
    await bot.answerCallbackQuery(callbackId, { text: '❌ Заявка не найдена', show_alert: true })
    return
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } })

  const label = getStatusLabel(newStatus)
  await bot.answerCallbackQuery(callbackId, { text: `✅ Статус изменён: ${label}` })

  // Обновляем сообщение — убираем кнопку "Взять в работу"
  if (msgId) {
    await bot.editMessageReplyMarkup(
      {
        inline_keyboard: [
          [{ text: `✅ Статус: ${label}`, callback_data: 'noop' }],
          [{ text: '📋 Открыть панель', url: `${BASE_URL}/admin/orders` }],
        ],
      },
      { chat_id: chatId, message_id: msgId }
    ).catch(() => {})
  }

  // Уведомляем клиента
  const clientTelegramId = (await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  }))?.user?.telegramId

  if (clientTelegramId) {
    const orderLabel = formatOrderId(orderId)
    await bot.sendMessage(clientTelegramId,
      `📋 *Заявка ${orderLabel}*\n\nСтатус изменён: *${label}*\n\n[Посмотреть в ЛК](${BASE_URL}/dashboard)`,
      { parse_mode: 'Markdown' }
    ).catch(() => {})
  }
}
