import TelegramBot from 'node-telegram-bot-api'
import { prisma } from '@/lib/prisma'
import { formatOrderId, getStatusLabel, getOrderTypeLabel } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

function makeBot(): TelegramBot | null {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null
  return new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
}

const BASE_URL = process.env.NEXTAUTH_URL || 'https://studyassist.ru'

const STATUS_EMOJI: Record<string, string> = {
  new: '🆕', in_progress: '🔧', ready_for_review: '✅',
  awaiting_payment: '💳', paid: '✅', completed: '🎉',
  revision: '🔄', cancelled: '❌',
}

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
      `👋 Привет, ${user.name || firstName}!\n\n` +
      `Выберите, что хотите сделать:`,
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
  } else {
    await bot.sendMessage(chatId,
      `🎓 *StudyAssist — помощь с учёбой*\n\n` +
      `Я буду присылать уведомления о ваших заявках.\n\n` +
      `*Как привязать аккаунт:*\n` +
      `1️⃣ Нажмите кнопку ниже\n` +
      `2️⃣ Войдите на сайт (если ещё не вошли)\n` +
      `3️⃣ Нажмите *«Открыть в Telegram»*\n` +
      `4️⃣ Нажмите Start в боте\n\n` +
      `Готово! Уведомления будут приходить сюда 👇`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Привязать аккаунт', url: `${BASE_URL}/dashboard?tg=link` }],
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
    `Теперь вы будете получать уведомления о статусе заявок прямо здесь.`,
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

// ─── Список заявок ───────────────────────────────────────────────────────────

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
    take: 8,
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

  const keyboard: TelegramBot.InlineKeyboardButton[][] = orders.map(o => {
    const emoji = STATUS_EMOJI[o.status] || '❓'
    const label = o.subject.length > 25 ? o.subject.slice(0, 25) + '…' : o.subject
    return [{ text: `${emoji} ${formatOrderId(o.id)} — ${label}`, callback_data: `order:${o.id}` }]
  })

  keyboard.push([{ text: '🔄 Обновить список', callback_data: 'cmd:orders' }])

  await bot.sendMessage(chatId,
    `📋 *Ваши заявки* (${orders.length}):\n\nНажмите на заявку для подробной информации:`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
    }
  )
}

// ─── Детали заявки ───────────────────────────────────────────────────────────

async function handleOrderDetail(bot: TelegramBot, chatId: string, orderId: string) {
  const user = await prisma.user.findFirst({ where: { telegramId: chatId } })
  if (!user) return

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order || order.userId !== user.id) {
    await bot.sendMessage(chatId, '❌ Заявка не найдена.')
    return
  }

  const emoji = STATUS_EMOJI[order.status] || '❓'
  const statusLabel = getStatusLabel(order.status)
  const typeLabel = getOrderTypeLabel(order.type)
  const deadlineStr = format(new Date(order.deadline), 'dd.MM.yyyy', { locale: ru })
  const resultFiles: string[] = (() => { try { return order.resultFiles ? JSON.parse(order.resultFiles) : [] } catch { return [] } })()

  let text = `📋 *Заявка ${formatOrderId(order.id)}*\n\n`
  text += `📚 *Тип:* ${typeLabel}\n`
  text += `📖 *Предмет:* ${order.subject}\n`
  text += `📅 *Дедлайн:* ${deadlineStr}\n`
  text += `${emoji} *Статус:* ${statusLabel}\n`

  if (order.price) {
    const priceNum = parseFloat(String(order.price))
    text += `💰 *Стоимость:* ${priceNum.toLocaleString('ru-RU')} ₽\n`
  }

  if (order.adminNote) {
    text += `\n💬 *Сообщение от администратора:*\n${order.adminNote}`
  }

  if (resultFiles.length > 0) {
    text += `\n\n📥 *Готовая работа:* ${resultFiles.length} файл${resultFiles.length === 1 ? '' : 'а'} доступн${resultFiles.length === 1 ? '' : 'ы'} для скачивания`
  }

  if (order.revisionNote) {
    text += `\n\n🔄 *Ваш запрос на доработку отправлен*`
  }

  // Кнопки действий
  const buttons: TelegramBot.InlineKeyboardButton[][] = []

  if (order.status === 'awaiting_payment' && order.paymentLink) {
    const priceNum = order.price ? parseFloat(String(order.price)).toLocaleString('ru-RU') : ''
    buttons.push([{ text: `💳 Оплатить${priceNum ? ` ${priceNum} ₽` : ''}`, url: order.paymentLink }])
  }

  if (resultFiles.length > 0) {
    buttons.push([{ text: '📥 Скачать работу', url: `${BASE_URL}/dashboard` }])
  }

  if (order.status === 'completed' && resultFiles.length > 0) {
    buttons.push([{ text: '🔄 Запросить доработку', url: `${BASE_URL}/dashboard` }])
  }

  buttons.push([{ text: '🌐 Открыть в личном кабинете', url: `${BASE_URL}/dashboard` }])
  buttons.push([{ text: '‹ Назад к заявкам', callback_data: 'cmd:orders' }])

  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: buttons },
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

  await bot.answerCallbackQuery(query.id).catch(() => {})

  if (!chatId) return

  if (data === 'cmd:orders') {
    await handleOrdersList(bot, chatId)
    return
  }

  // order:ORDER_ID — детали заявки
  if (data.startsWith('order:')) {
    const orderId = data.slice(6)
    await handleOrderDetail(bot, chatId, orderId)
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
  const updated = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  })
  if (updated?.user?.telegramId) {
    await bot.sendMessage(updated.user.telegramId,
      `📋 *Заявка ${formatOrderId(orderId)}*\n\nСтатус изменён: *${label}*`,
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '📂 Мои заявки', callback_data: 'cmd:orders' }]] },
      }
    ).catch(() => {})
  }
}
