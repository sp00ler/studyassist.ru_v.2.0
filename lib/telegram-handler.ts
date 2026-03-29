import TelegramBot from 'node-telegram-bot-api'
import { prisma } from '@/lib/prisma'
import { formatOrderId, getStatusLabel, getOrderTypeLabel } from '@/lib/utils'
import { format, parse, isValid, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { sendNewOrderEmail } from '@/lib/email'
import { sendNewOrderNotification } from '@/lib/telegram'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'

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

const ORDER_TYPES = [
  { value: 'coursework',      label: 'Курсовая работа' },
  { value: 'diploma',         label: 'Дипломная (ВКР)' },
  { value: 'essay',           label: 'Реферат / Эссе' },
  { value: 'lab',             label: 'Лабораторная / Задача' },
  { value: 'presentation',    label: 'Презентация / Отчёт' },
  { value: 'practice-report', label: 'Отчёт по практике' },
  { value: 'uir',             label: 'УИР' },
  { value: 'other',           label: 'Другое' },
]

// ─── Сессии (состояние формы заявки) ────────────────────────────────────────

interface OrderSession {
  step: 'type' | 'subject' | 'pages' | 'deadline' | 'description' | 'files' | 'confirm'
  type?: string
  subject?: string
  pages?: string
  deadline?: string
  description?: string
  files: Array<{ path: string; name: string }>
  createdAt: number
}

const sessions = new Map<string, OrderSession>()

// Очищаем устаревшие сессии (> 30 мин)
function cleanSessions() {
  const now = Date.now()
  Array.from(sessions.entries()).forEach(([key, s]) => {
    if (now - s.createdAt > 30 * 60 * 1000) sessions.delete(key)
  })
}

// ─── Главный обработчик апдейтов ────────────────────────────────────────────

export async function handleUpdate(update: TelegramBot.Update): Promise<void> {
  const bot = makeBot()
  if (!bot) return
  cleanSessions()

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

// ─── Сообщения ───────────────────────────────────────────────────────────────

async function handleMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id.toString()
  const text = (msg.text || '').trim()

  // Если есть активная сессия заявки — обрабатываем как шаг формы
  const session = sessions.get(chatId)
  if (session) {
    // Документы — всегда обрабатываем отдельно
    if (msg.document || (msg.photo && msg.photo.length > 0)) {
      await handleFileUpload(bot, chatId, msg)
      return
    }
    if (text !== '/cancel' && text !== '/start') {
      await handleOrderFormStep(bot, chatId, text, session)
      return
    }
  }

  if (text.startsWith('/start')) {
    const token = text.split(' ')[1]?.trim()
    if (token) await handleLinkToken(bot, chatId, msg.from?.first_name || 'друг', token)
    else await handleStart(bot, chatId, msg.from?.first_name || 'друг')
    return
  }

  if (text === '/orders') { await handleOrdersList(bot, chatId); return }
  if (text === '/new' || text === '/заявка') { await startOrderForm(bot, chatId); return }
  if (text === '/profile') { await handleProfile(bot, chatId); return }
  if (text === '/cancel') { sessions.delete(chatId); await bot.sendMessage(chatId, '❌ Отменено.'); return }
  if (text === '/help') { await handleHelp(bot, chatId); return }

  // Незалогиненный пользователь
  const user = await prisma.user.findFirst({ where: { telegramId: chatId } })
  if (!user) {
    await bot.sendMessage(chatId,
      `Привяжите аккаунт StudyAssist, чтобы использовать бот.\n\n` +
      `👉 [Привязать аккаунт](${BASE_URL}/dashboard?tg=link)`,
      { parse_mode: 'Markdown' }
    )
  } else {
    await handleStart(bot, chatId, msg.from?.first_name || user.name || 'друг')
  }
}

// ─── /start ─────────────────────────────────────────────────────────────────

async function handleStart(bot: TelegramBot, chatId: string, firstName: string) {
  const user = await prisma.user.findFirst({ where: { telegramId: chatId } })

  if (user) {
    const ordersCount = await prisma.order.count({ where: { userId: user.id } })
    await bot.sendMessage(chatId,
      `👋 Привет, ${user.name || firstName}!\n\n` +
      `У вас ${ordersCount} заявок. Выберите действие:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📂 Мои заявки', callback_data: 'cmd:orders' }],
            [{ text: '📝 Оставить заявку', callback_data: 'cmd:new_order' }],
            [{ text: '👤 Профиль', callback_data: 'cmd:profile' }],
          ],
        },
      }
    )
  } else {
    await bot.sendMessage(chatId,
      `🎓 *StudyAssist — помощь с учёбой*\n\n` +
      `*Как привязать аккаунт:*\n` +
      `1️⃣ Нажмите кнопку ниже\n` +
      `2️⃣ Войдите на сайт\n` +
      `3️⃣ Нажмите *«Открыть в Telegram»*\n` +
      `4️⃣ Нажмите Start в боте`,
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🔗 Привязать аккаунт', url: `${BASE_URL}/dashboard?tg=link` }]] },
      }
    )
  }
}

// ─── Привязка по токену ──────────────────────────────────────────────────────

async function handleLinkToken(bot: TelegramBot, chatId: string, firstName: string, token: string) {
  const user = await prisma.user.findFirst({
    where: { telegramLinkToken: token, telegramLinkExpiry: { gt: new Date() } },
  })

  if (!user) {
    await bot.sendMessage(chatId,
      `❌ Ссылка устарела.\n\nСгенерируйте новую в [личном кабинете](${BASE_URL}/dashboard).`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { telegramId: chatId, telegramLinkToken: null, telegramLinkExpiry: null },
  })

  await bot.sendMessage(chatId,
    `✅ *Аккаунт привязан!*\n\nДобро пожаловать, ${user.name || firstName}!\nТеперь уведомления о заявках приходят сюда.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📂 Мои заявки', callback_data: 'cmd:orders' }],
          [{ text: '📝 Оставить заявку', callback_data: 'cmd:new_order' }],
          [{ text: '🌐 Личный кабинет', url: `${BASE_URL}/dashboard` }],
        ],
      },
    }
  )
}

// ─── Профиль ─────────────────────────────────────────────────────────────────

async function handleProfile(bot: TelegramBot, chatId: string) {
  const user = await prisma.user.findFirst({ where: { telegramId: chatId } })
  if (!user) { await sendNotLinked(bot, chatId); return }

  const [total, active, completed] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.count({ where: { userId: user.id, status: { in: ['new', 'in_progress', 'awaiting_payment', 'paid', 'revision'] } } }),
    prisma.order.count({ where: { userId: user.id, status: 'completed' } }),
  ])

  let text = `👤 *Профиль*\n\n`
  text += `*Имя:* ${user.name || 'не указано'}\n`
  text += `*Email:* ${user.email}\n`
  if (user.phone) text += `*Телефон:* ${user.phone}\n`
  text += `\n📊 *Статистика заявок:*\n`
  text += `• Всего: ${total}\n`
  text += `• Активных: ${active}\n`
  text += `• Завершённых: ${completed}\n`

  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📂 Мои заявки', callback_data: 'cmd:orders' }],
        [{ text: '📝 Оставить заявку', callback_data: 'cmd:new_order' }],
        [{ text: '⚙️ Редактировать профиль', url: `${BASE_URL}/dashboard` }],
      ],
    },
  })
}

// ─── Список заявок ───────────────────────────────────────────────────────────

async function handleOrdersList(bot: TelegramBot, chatId: string) {
  const user = await prisma.user.findFirst({ where: { telegramId: chatId } })
  if (!user) { await sendNotLinked(bot, chatId); return }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  if (orders.length === 0) {
    await bot.sendMessage(chatId, `У вас пока нет заявок.`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📝 Оставить первую заявку', callback_data: 'cmd:new_order' }],
        ],
      },
    })
    return
  }

  const keyboard: TelegramBot.InlineKeyboardButton[][] = orders.map(o => {
    const emoji = STATUS_EMOJI[o.status] || '❓'
    const label = o.subject.length > 28 ? o.subject.slice(0, 28) + '…' : o.subject
    return [{ text: `${emoji} ${formatOrderId(o.id)} — ${label}`, callback_data: `order:${o.id}` }]
  })
  keyboard.push([
    { text: '📝 Новая заявка', callback_data: 'cmd:new_order' },
    { text: '🔄 Обновить', callback_data: 'cmd:orders' },
  ])

  await bot.sendMessage(chatId,
    `📋 *Ваши заявки* (${orders.length}):\n\nНажмите для подробностей:`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
  )
}

// ─── Детали заявки ───────────────────────────────────────────────────────────

async function handleOrderDetail(bot: TelegramBot, chatId: string, orderId: string) {
  const user = await prisma.user.findFirst({ where: { telegramId: chatId } })
  if (!user) return

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.userId !== user.id) {
    await bot.sendMessage(chatId, '❌ Заявка не найдена.')
    return
  }

  const emoji = STATUS_EMOJI[order.status] || '❓'
  const deadlineStr = format(new Date(order.deadline), 'dd MMMM yyyy', { locale: ru })
  const resultFiles: string[] = (() => { try { return order.resultFiles ? JSON.parse(order.resultFiles) : [] } catch { return [] } })()

  let text = `📋 *Заявка ${formatOrderId(order.id)}*\n\n`
  text += `📚 *Тип:* ${getOrderTypeLabel(order.type)}\n`
  text += `📖 *Предмет:* ${order.subject}\n`
  text += `📅 *Дедлайн:* ${deadlineStr}\n`
  text += `${emoji} *Статус:* ${getStatusLabel(order.status)}\n`
  if (order.price) text += `💰 *Стоимость:* ${parseFloat(String(order.price)).toLocaleString('ru-RU')} ₽\n`
  if (order.adminNote) text += `\n💬 *От администратора:*\n${order.adminNote}\n`
  if (resultFiles.length > 0) text += `\n📥 *Готовых файлов:* ${resultFiles.length} шт. (скачать в ЛК)\n`
  if (order.revisionNote) text += `\n🔄 *Запрос на доработку отправлен*\n`

  const buttons: TelegramBot.InlineKeyboardButton[][] = []
  if (order.status === 'awaiting_payment' && order.paymentLink) {
    const price = order.price ? `${parseFloat(String(order.price)).toLocaleString('ru-RU')} ₽` : ''
    buttons.push([{ text: `💳 Оплатить${price ? ' ' + price : ''}`, url: order.paymentLink }])
  }
  if (resultFiles.length > 0) {
    buttons.push([{ text: '📥 Скачать в личном кабинете', url: `${BASE_URL}/dashboard` }])
  }
  buttons.push([{ text: '🌐 Открыть на сайте', url: `${BASE_URL}/dashboard` }])
  buttons.push([{ text: '‹ К списку заявок', callback_data: 'cmd:orders' }])

  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: buttons },
  })
}

// ─── Форма новой заявки ──────────────────────────────────────────────────────

async function startOrderForm(bot: TelegramBot, chatId: string) {
  const user = await prisma.user.findFirst({ where: { telegramId: chatId } })
  if (!user) { await sendNotLinked(bot, chatId); return }

  sessions.set(chatId, { step: 'type', files: [], createdAt: Date.now() })

  const typeButtons = ORDER_TYPES.map(t => [{ text: t.label, callback_data: `form_type:${t.value}` }])
  typeButtons.push([{ text: '❌ Отмена', callback_data: 'cmd:cancel_form' }])

  await bot.sendMessage(chatId,
    `📝 *Новая заявка*\n\nШаг 1/6 — Выберите тип работы:`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: typeButtons } }
  )
}

async function handleOrderFormStep(bot: TelegramBot, chatId: string, text: string, session: OrderSession) {
  switch (session.step) {
    case 'subject':
      if (text.length < 2) { await bot.sendMessage(chatId, '⚠️ Укажите предмет или тему (минимум 2 символа).'); return }
      session.subject = text
      session.step = 'pages'
      sessions.set(chatId, session)
      await bot.sendMessage(chatId,
        `📖 Предмет: *${text}*\n\nШаг 3/6 — Укажите количество страниц:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Пропустить', callback_data: 'form_pages:skip' }],
            ],
          },
        }
      )
      break

    case 'pages':
      session.pages = text
      session.step = 'deadline'
      sessions.set(chatId, session)
      await bot.sendMessage(chatId,
        `📄 Страниц: *${text}*\n\nШаг 4/6 — Укажите дедлайн.\nФормат: *ДД.ММ.ГГГГ* или например *через 2 недели*:`,
        { parse_mode: 'Markdown' }
      )
      break

    case 'deadline': {
      const deadline = parseDeadline(text)
      if (!deadline) {
        await bot.sendMessage(chatId,
          `⚠️ Не удалось распознать дату. Попробуйте формат *01.04.2026* или *через 3 дня*:`,
          { parse_mode: 'Markdown' }
        )
        return
      }
      if (deadline <= new Date()) {
        await bot.sendMessage(chatId, `⚠️ Дедлайн должен быть в будущем. Попробуйте ещё раз:`)
        return
      }
      session.deadline = deadline.toISOString()
      session.step = 'description'
      sessions.set(chatId, session)
      const deadlineStr = format(deadline, 'dd MMMM yyyy', { locale: ru })
      await bot.sendMessage(chatId,
        `📅 Дедлайн: *${deadlineStr}*\n\nШаг 5/6 — Опишите задание подробно:\n_(требования, методичка, особые условия и т.д.)_`,
        { parse_mode: 'Markdown' }
      )
      break
    }

    case 'description':
      if (text.length < 20) {
        await bot.sendMessage(chatId, `⚠️ Описание слишком короткое (минимум 20 символов). Опишите подробнее:`)
        return
      }
      session.description = text
      session.step = 'files'
      sessions.set(chatId, session)
      await bot.sendMessage(chatId,
        `📝 Описание принято.\n\nШаг 6/6 — Прикрепите файлы (методичку, задание и т.д.) или пропустите:`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '⏭ Пропустить файлы', callback_data: 'form_files:skip' }],
              [{ text: '❌ Отмена', callback_data: 'cmd:cancel_form' }],
            ],
          },
        }
      )
      break

    default:
      break
  }
}

// ─── Загрузка файлов в форме ─────────────────────────────────────────────────

async function handleFileUpload(bot: TelegramBot, chatId: string, msg: TelegramBot.Message) {
  const session = sessions.get(chatId)
  if (!session || session.step !== 'files') return

  const fileId = msg.document?.file_id || msg.photo?.[msg.photo.length - 1]?.file_id
  const fileName = msg.document?.file_name || `photo_${Date.now()}.jpg`
  if (!fileId) return

  try {
    const fileLink = await makeBot()!.getFileLink(fileId)
    const response = await fetch(fileLink)
    const buffer = Buffer.from(await response.arrayBuffer())

    const timestamp = Date.now()
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const savedName = `${timestamp}_${safeName}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tg-orders')
    try {
      await mkdir(uploadDir, { recursive: true })
      await writeFile(path.join(uploadDir, savedName), buffer)
    } catch {
      const tmpDir = path.join(os.tmpdir(), 'tg-orders')
      await mkdir(tmpDir, { recursive: true })
      await writeFile(path.join(tmpDir, savedName), buffer)
    }

    session.files.push({ path: `/uploads/tg-orders/${savedName}`, name: fileName })
    sessions.set(chatId, session)

    await bot.sendMessage(chatId,
      `📎 Файл *${fileName}* прикреплён (${session.files.length} шт.)\n\nПришлите ещё файлы или нажмите «Готово»:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: `✅ Готово (${session.files.length} файл${session.files.length !== 1 ? 'а' : ''})`, callback_data: 'form_files:done' }],
            [{ text: '⏭ Пропустить все', callback_data: 'form_files:skip' }],
          ],
        },
      }
    )
  } catch (err) {
    console.error('File upload error:', err)
    await bot.sendMessage(chatId, `⚠️ Не удалось загрузить файл. Попробуйте ещё раз или пропустите.`)
  }
}

// ─── Подтверждение и создание заявки ────────────────────────────────────────

async function showOrderConfirm(bot: TelegramBot, chatId: string, session: OrderSession) {
  const typeLabel = ORDER_TYPES.find(t => t.value === session.type)?.label || session.type || '—'
  const deadlineStr = session.deadline
    ? format(new Date(session.deadline), 'dd MMMM yyyy', { locale: ru })
    : '—'

  let text = `📋 *Проверьте заявку перед отправкой:*\n\n`
  text += `📚 *Тип:* ${typeLabel}\n`
  text += `📖 *Предмет/тема:* ${session.subject}\n`
  if (session.pages && session.pages !== 'skip') text += `📄 *Страниц:* ${session.pages}\n`
  text += `📅 *Дедлайн:* ${deadlineStr}\n`
  text += `📝 *Описание:*\n${session.description?.slice(0, 300)}${(session.description?.length || 0) > 300 ? '…' : ''}\n`
  if (session.files.length > 0) text += `📎 *Файлов:* ${session.files.length} шт.\n`

  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Отправить заявку', callback_data: 'form_submit' }],
        [{ text: '✏️ Начать заново', callback_data: 'cmd:new_order' }],
        [{ text: '❌ Отмена', callback_data: 'cmd:cancel_form' }],
      ],
    },
  })
}

async function submitOrder(bot: TelegramBot, chatId: string) {
  const session = sessions.get(chatId)
  if (!session) return

  const user = await prisma.user.findFirst({ where: { telegramId: chatId } })
  if (!user) return

  if (!session.type || !session.subject || !session.deadline || !session.description) {
    await bot.sendMessage(chatId, '⚠️ Заявка неполная. Начните заново /new')
    sessions.delete(chatId)
    return
  }

  await bot.sendMessage(chatId, '⏳ Отправляем заявку...')

  // Формируем описание с количеством страниц
  let fullDescription = session.description
  if (session.pages && session.pages !== 'skip') {
    fullDescription += `\n\nКоличество страниц: ${session.pages}`
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        type: session.type,
        subject: session.subject,
        deadline: new Date(session.deadline),
        description: fullDescription,
        files: session.files.length > 0 ? JSON.stringify(session.files.map(f => f.path)) : null,
        status: 'new',
      },
    })

    sessions.delete(chatId)

    const deadlineStr = format(new Date(session.deadline), 'dd.MM.yyyy', { locale: ru })

    // Уведомления администраторам
    Promise.allSettled([
      sendNewOrderEmail({
        orderId: order.id,
        orderType: session.type,
        subject: session.subject,
        deadline: deadlineStr,
        description: fullDescription,
        name: user.name || 'Клиент',
        email: user.email,
        files: session.files.map(f => f.path),
      }),
      sendNewOrderNotification({
        orderId: order.id,
        orderType: session.type,
        subject: session.subject,
        deadline: deadlineStr,
        description: fullDescription,
        name: user.name || 'Клиент',
        email: user.email,
        filesCount: session.files.length,
        files: session.files.map(f => f.path),
      }),
    ]).catch(console.error)

    await bot.sendMessage(chatId,
      `✅ *Заявка ${formatOrderId(order.id)} создана!*\n\n` +
      `Мы рассмотрим её и свяжемся с вами в ближайшее время.\n\n` +
      `Отслеживать статус можно здесь или в личном кабинете.`,
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
  } catch (err) {
    console.error('Submit order error:', err)
    await bot.sendMessage(chatId,
      `❌ Ошибка при создании заявки. Попробуйте ещё раз или оставьте заявку на сайте.`,
      { reply_markup: { inline_keyboard: [[{ text: '🌐 Оставить заявку на сайте', url: `${BASE_URL}/#order` }]] } }
    )
  }
}

// ─── Парсинг дедлайна ────────────────────────────────────────────────────────

function parseDeadline(text: string): Date | null {
  // ДД.ММ.ГГГГ
  const formats = ['dd.MM.yyyy', 'dd/MM/yyyy', 'd.M.yyyy', 'd.M.yy']
  for (const fmt of formats) {
    const d = parse(text, fmt, new Date(), { locale: ru })
    if (isValid(d)) return d
  }

  // "через N дней/недель/месяц"
  const m = text.toLowerCase().match(/через\s+(\d+)\s+(день|дня|дней|неделю|недели|недель|месяц|месяца|месяцев)/)
  if (m) {
    const n = parseInt(m[1])
    const unit = m[2]
    if (unit.startsWith('д')) return addDays(new Date(), n)
    if (unit.startsWith('нед')) return addDays(new Date(), n * 7)
    if (unit.startsWith('мес')) return addDays(new Date(), n * 30)
  }

  // "завтра", "послезавтра"
  if (text.toLowerCase() === 'завтра') return addDays(new Date(), 1)
  if (text.toLowerCase() === 'послезавтра') return addDays(new Date(), 2)

  return null
}

// ─── /help ───────────────────────────────────────────────────────────────────

async function handleHelp(bot: TelegramBot, chatId: string) {
  await bot.sendMessage(chatId,
    `*StudyAssist — команды бота*\n\n` +
    `📂 /orders — мои заявки\n` +
    `📝 /new — оставить заявку\n` +
    `👤 /profile — мой профиль\n` +
    `❌ /cancel — отменить текущее действие\n` +
    `🌐 /start — главное меню`,
    { parse_mode: 'Markdown' }
  )
}

// ─── Callback Query ───────────────────────────────────────────────────────────

async function handleCallbackQuery(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  const chatId = query.message?.chat.id.toString()
  const msgId = query.message?.message_id
  const data = query.data || ''

  if (!chatId) return

  // set_status — НЕ отвечаем заранее, handleAdminSetStatus сам ответит
  if (data.startsWith('set_status:')) {
    const [, orderId, newStatus] = data.split(':')
    await handleAdminSetStatus(bot, chatId, msgId, query.id, orderId, newStatus)
    return
  }

  // Для остальных кнопок — сразу сбрасываем индикатор загрузки
  await bot.answerCallbackQuery(query.id).catch(() => {})

  if (data === 'cmd:orders') { await handleOrdersList(bot, chatId); return }
  if (data === 'cmd:profile') { await handleProfile(bot, chatId); return }
  if (data === 'cmd:new_order') { await startOrderForm(bot, chatId); return }
  if (data === 'cmd:cancel_form') {
    sessions.delete(chatId)
    await bot.sendMessage(chatId, '❌ Заявка отменена.', {
      reply_markup: { inline_keyboard: [[{ text: '‹ Назад', callback_data: 'cmd:orders' }]] },
    })
    return
  }

  if (data.startsWith('order:')) {
    await handleOrderDetail(bot, chatId, data.slice(6))
    return
  }

  // Выбор типа работы
  if (data.startsWith('form_type:')) {
    const type = data.slice(10)
    const session = sessions.get(chatId)
    if (!session) { await startOrderForm(bot, chatId); return }
    session.type = type
    session.step = 'subject'
    sessions.set(chatId, session)
    const typeLabel = ORDER_TYPES.find(t => t.value === type)?.label || type
    await bot.sendMessage(chatId,
      `📚 Тип: *${typeLabel}*\n\nШаг 2/6 — Введите предмет или тему работы:`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Пропуск страниц
  if (data === 'form_pages:skip') {
    const session = sessions.get(chatId)
    if (!session) return
    session.pages = undefined
    session.step = 'deadline'
    sessions.set(chatId, session)
    await bot.sendMessage(chatId,
      `Шаг 4/6 — Укажите дедлайн.\nФормат: *01.04.2026* или *через 2 недели*:`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Файлы — пропустить или завершить
  if (data === 'form_files:skip' || data === 'form_files:done') {
    const session = sessions.get(chatId)
    if (!session) return
    session.step = 'confirm'
    sessions.set(chatId, session)
    await showOrderConfirm(bot, chatId, session)
    return
  }

  // Отправить заявку
  if (data === 'form_submit') {
    await submitOrder(bot, chatId)
    return
  }
}

// ─── Вспомогательные функции ─────────────────────────────────────────────────

async function sendNotLinked(bot: TelegramBot, chatId: string) {
  await bot.sendMessage(chatId,
    `Сначала привяжите аккаунт StudyAssist.`,
    { reply_markup: { inline_keyboard: [[{ text: '🔗 Привязать аккаунт', url: `${BASE_URL}/dashboard?tg=link` }]] } }
  )
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
  const admin = await prisma.user.findFirst({ where: { telegramId: chatId, isAdmin: true } })
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
  await bot.answerCallbackQuery(callbackId, { text: `✅ Статус: ${label}` })

  if (msgId) {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [[{ text: `✅ ${label}`, callback_data: 'noop' }], [{ text: '📋 Открыть панель', url: `${BASE_URL}/admin/orders` }]] },
      { chat_id: chatId, message_id: msgId }
    ).catch(() => {})
  }

  const updated = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } })
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
