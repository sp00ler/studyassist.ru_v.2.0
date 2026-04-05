import TelegramBot from 'node-telegram-bot-api'
import { prisma } from '@/lib/prisma'
import { formatOrderId, getStatusLabel, getOrderTypeLabel } from '@/lib/utils'
import { format, parse, isValid, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { sendNewOrderEmail, sendStatusUpdateEmail, sendPaymentLinkEmail, sendWorkCompletedEmail } from '@/lib/email'
import { sendNewOrderNotification, sendStatusUpdateNotification, sendPaymentLinkNotification, sendWorkCompletedNotification } from '@/lib/telegram'
import { createPayment } from '@/lib/yukassa'
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

// ─── Admin Sessions (состояние админских действий) ───────────────────────────

interface AdminSession {
  action: 'set_price' | 'upload_result'
  orderId: string
  createdAt: number
  files: Array<{ path: string; name: string }>
}

const adminSessions = new Map<string, AdminSession>()

// Очищаем устаревшие сессии (> 30 мин)
function cleanSessions() {
  const now = Date.now()
  Array.from(sessions.entries()).forEach(([key, s]) => {
    if (now - s.createdAt > 30 * 60 * 1000) sessions.delete(key)
  })
  Array.from(adminSessions.entries()).forEach(([key, s]) => {
    if (now - s.createdAt > 30 * 60 * 1000) adminSessions.delete(key)
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

  // ─── Admin session check (higher priority than user session) ─────────────────
  const adminSession = adminSessions.get(chatId)
  if (adminSession) {
    if (msg.document || (msg.photo && msg.photo.length > 0)) {
      if (adminSession.action === 'upload_result') {
        await handleAdminFileReceived(bot, chatId, msg)
        return
      }
    }
    if (text === '/cancel') {
      adminSessions.delete(chatId)
      await bot.sendMessage(chatId, '❌ Отменено.')
      return
    }
    if (text !== '/start' && text !== '/admin') {
      if (adminSession.action === 'set_price') {
        await handleAdminPriceInput(bot, chatId, text)
        return
      }
    }
  }

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
  if (text === '/admin') { await handleAdminMenu(bot, chatId); return }

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
    const startKeyboard: TelegramBot.InlineKeyboardButton[][] = [
      [{ text: '📂 Мои заявки', callback_data: 'cmd:orders' }],
      [{ text: '📝 Оставить заявку', callback_data: 'cmd:new_order' }],
      [{ text: '👤 Профиль', callback_data: 'cmd:profile' }],
    ]
    if (user.isAdmin) startKeyboard.push([{ text: '🛡 Панель администратора', callback_data: 'admin:menu' }])
    await bot.sendMessage(chatId,
      `👋 Привет, ${user.name || firstName}!\n\nУ вас ${ordersCount} заявок. Выберите действие:`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: startKeyboard } }
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
  const adminUser = await prisma.user.findFirst({ where: { telegramId: chatId, isAdmin: true } })
  const adminCommands = adminUser
    ? `\n\n🛡 *Для администраторов:*\n/admin — панель управления заявками`
    : ''
  await bot.sendMessage(chatId,
    `*StudyAssist — команды бота*\n\n` +
    `📂 /orders — мои заявки\n` +
    `📝 /new — оставить заявку\n` +
    `👤 /profile — мой профиль\n` +
    `❌ /cancel — отменить текущее действие\n` +
    `🌐 /start — главное меню` +
    adminCommands,
    { parse_mode: 'Markdown' }
  )
}

// ─── Панель администратора ────────────────────────────────────────────────────

async function isAdminChat(chatId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({ where: { telegramId: chatId, isAdmin: true } })
  return !!user
}

async function saveAdminResultFile(
  bot: TelegramBot,
  fileId: string,
  fileName: string,
  orderId: string
): Promise<string | null> {
  try {
    const fileLink = await bot.getFileLink(fileId)
    const response = await fetch(fileLink)
    const buffer = Buffer.from(await response.arrayBuffer())
    const timestamp = Date.now()
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const savedName = `${timestamp}_${safeName}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'results', orderId)
    try {
      await mkdir(uploadsDir, { recursive: true })
      await writeFile(path.join(uploadsDir, savedName), buffer)
    } catch {
      const tmpDir = path.join(os.tmpdir(), 'studyassist-results', orderId)
      await mkdir(tmpDir, { recursive: true })
      await writeFile(path.join(tmpDir, savedName), buffer)
    }
    return `/api/files/results/${orderId}/${savedName}`
  } catch (err) {
    console.error('Admin result file save error:', err)
    return null
  }
}

async function handleAdminMenu(bot: TelegramBot, chatId: string) {
  if (!(await isAdminChat(chatId))) {
    await bot.sendMessage(chatId, '⛔ Только для администраторов.')
    return
  }

  const [total, newCount, inProgressCount, revisionCount] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'new' } }),
    prisma.order.count({ where: { status: 'in_progress' } }),
    prisma.order.count({ where: { status: 'revision' } }),
  ])

  await bot.sendMessage(chatId,
    `🛡 *Панель администратора*\n\n` +
    `📊 Всего заявок: ${total}\n` +
    `🆕 Новых: ${newCount}\n` +
    `🔧 В работе: ${inProgressCount}\n` +
    `🔄 На доработке: ${revisionCount}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Все заявки', callback_data: 'admin:orders:0' }],
          [
            { text: `🆕 Новые (${newCount})`, callback_data: 'admin:filter:new:0' },
            { text: `🔧 В работе (${inProgressCount})`, callback_data: 'admin:filter:in_progress:0' },
          ],
          [
            { text: `🔄 Доработка (${revisionCount})`, callback_data: 'admin:filter:revision:0' },
            { text: '💳 Ожид. оплаты', callback_data: 'admin:filter:awaiting_payment:0' },
          ],
        ],
      },
    }
  )
}

async function handleAdminOrdersList(bot: TelegramBot, chatId: string, page: number, statusFilter?: string) {
  const pageSize = 8
  const where = statusFilter ? { status: statusFilter } : {}

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: page * pageSize,
      take: pageSize,
      include: { user: { select: { name: true } } },
    }),
    prisma.order.count({ where }),
  ])

  const filterLabel = statusFilter ? ` [${getStatusLabel(statusFilter)}]` : ''

  if (orders.length === 0 && page === 0) {
    await bot.sendMessage(chatId, `📋 Заявок нет${filterLabel}.`, {
      reply_markup: { inline_keyboard: [[{ text: '‹ Меню', callback_data: 'admin:menu' }]] },
    })
    return
  }

  const totalPages = Math.ceil(total / pageSize)
  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)

  const keyboard: TelegramBot.InlineKeyboardButton[][] = orders.map(o => {
    const emoji = STATUS_EMOJI[o.status] || '❓'
    const clientName = o.user?.name || o.clientName || 'Гость'
    const nameShort = clientName.length > 10 ? clientName.slice(0, 10) + '…' : clientName
    const subjectShort = o.subject.length > 18 ? o.subject.slice(0, 18) + '…' : o.subject
    return [{ text: `${emoji} ${formatOrderId(o.id)} ${nameShort} — ${subjectShort}`, callback_data: `admin:order:${o.id}` }]
  })

  const navRow: TelegramBot.InlineKeyboardButton[] = []
  if (page > 0) {
    const cb = statusFilter ? `admin:filter:${statusFilter}:${page - 1}` : `admin:orders:${page - 1}`
    navRow.push({ text: '‹ Назад', callback_data: cb })
  }
  if (page < totalPages - 1) {
    const cb = statusFilter ? `admin:filter:${statusFilter}:${page + 1}` : `admin:orders:${page + 1}`
    navRow.push({ text: 'Вперёд ›', callback_data: cb })
  }
  if (navRow.length > 0) keyboard.push(navRow)
  keyboard.push([{ text: '‹ Меню', callback_data: 'admin:menu' }])

  await bot.sendMessage(chatId,
    `🛡 *Заявки${filterLabel}* (${from}–${to} из ${total}):`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
  )
}

async function handleAdminOrderDetail(bot: TelegramBot, chatId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { name: true, email: true, phone: true, telegramId: true } } },
  })

  if (!order) {
    await bot.sendMessage(chatId, '❌ Заявка не найдена.', {
      reply_markup: { inline_keyboard: [[{ text: '‹ К списку', callback_data: 'admin:orders:0' }]] },
    })
    return
  }

  const emoji = STATUS_EMOJI[order.status] || '❓'
  const deadlineStr = format(new Date(order.deadline), 'dd.MM.yyyy', { locale: ru })
  const createdStr = format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })
  const clientName = order.user?.name || order.clientName || 'Без имени'
  const clientEmail = order.user?.email || order.clientEmail || '—'
  const clientPhone = order.user?.phone || order.clientPhone
  const resultFiles: string[] = (() => { try { return order.resultFiles ? JSON.parse(order.resultFiles) : [] } catch { return [] } })()
  const clientFiles: string[] = (() => { try { return order.files ? JSON.parse(order.files) : [] } catch { return [] } })()

  let text = `🛡 *Заявка ${formatOrderId(order.id)}*\n\n`
  text += `📚 *Тип:* ${getOrderTypeLabel(order.type)}\n`
  text += `📖 *Предмет:* ${order.subject}\n`
  text += `📅 *Дедлайн:* ${deadlineStr}\n`
  text += `${emoji} *Статус:* ${getStatusLabel(order.status)}\n`
  if (order.price) text += `💰 *Цена:* ${parseFloat(String(order.price)).toLocaleString('ru-RU')} ₽\n`
  text += `\n👤 *Клиент:* ${clientName}\n📧 ${clientEmail}`
  if (clientPhone) text += `\n📱 ${clientPhone}`
  if (order.adminNote) text += `\n\n📝 *Заметка:*\n${order.adminNote.slice(0, 200)}`
  if (order.revisionNote) text += `\n\n🔄 *Замечания клиента:*\n${order.revisionNote.slice(0, 200)}`
  if (clientFiles.length > 0) text += `\n\n📎 Файлов от клиента: ${clientFiles.length}`
  if (resultFiles.length > 0) text += `\n📁 Готовых файлов: ${resultFiles.length}`
  text += `\n\n🕐 ${createdStr}`

  // Кнопки статуса (текущий помечен ▶)
  const s = order.status
  const keyboard: TelegramBot.InlineKeyboardButton[][] = [
    [
      { text: `${s === 'new' ? '▶ ' : ''}🆕 Новая`, callback_data: `admin:status:${orderId}:new` },
      { text: `${s === 'in_progress' ? '▶ ' : ''}🔧 В работе`, callback_data: `admin:status:${orderId}:in_progress` },
    ],
    [
      { text: `${s === 'ready_for_review' ? '▶ ' : ''}✅ К проверке`, callback_data: `admin:status:${orderId}:ready_for_review` },
      { text: `${s === 'awaiting_payment' ? '▶ ' : ''}💳 Ожид. оплаты`, callback_data: `admin:status:${orderId}:awaiting_payment` },
    ],
    [
      { text: `${s === 'paid' ? '▶ ' : ''}✅ Оплачена`, callback_data: `admin:status:${orderId}:paid` },
      { text: `${s === 'completed' ? '▶ ' : ''}🎉 Завершена`, callback_data: `admin:status:${orderId}:completed` },
    ],
    [
      { text: `${s === 'revision' ? '▶ ' : ''}🔄 Доработка`, callback_data: `admin:status:${orderId}:revision` },
      { text: `${s === 'cancelled' ? '▶ ' : ''}❌ Отменена`, callback_data: `admin:status:${orderId}:cancelled` },
    ],
  ]

  // Цена и выставление счёта
  const priceLabel = order.price ? `💰 ${parseFloat(String(order.price)).toLocaleString('ru-RU')} ₽` : '💰 Указать цену'
  keyboard.push([{ text: priceLabel, callback_data: `admin:price:${orderId}` }])

  if (order.price && !order.paymentLink) {
    keyboard.push([{ text: '💳 Выставить счёт клиенту', callback_data: `admin:payment:${orderId}` }])
  } else if (order.paymentLink) {
    keyboard.push([{ text: '🔗 Показать ссылку оплаты', callback_data: `admin:copy_link:${orderId}` }])
  }

  keyboard.push([{ text: '📤 Загрузить готовую работу', callback_data: `admin:upload:${orderId}` }])
  keyboard.push([
    { text: '🌐 Открыть панель', url: `${BASE_URL}/admin/orders` },
    { text: '‹ К списку', callback_data: 'admin:orders:0' },
  ])

  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard },
  })
}

async function handleAdminChangeStatus(
  bot: TelegramBot,
  chatId: string,
  callbackId: string,
  orderId: string,
  newStatus: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true, telegramId: true } } },
  })

  if (!order) {
    await bot.answerCallbackQuery(callbackId, { text: '❌ Заявка не найдена', show_alert: true })
    return
  }

  if (order.status === newStatus) {
    await bot.answerCallbackQuery(callbackId, { text: `Уже: ${getStatusLabel(newStatus)}` })
    return
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } })
  await bot.answerCallbackQuery(callbackId, { text: `✅ ${getStatusLabel(newStatus)}` })

  // Уведомляем клиента
  const clientEmail = order.user?.email || order.clientEmail
  const clientTelegramId = order.user?.telegramId
  if (clientEmail) {
    Promise.allSettled([
      sendStatusUpdateEmail(clientEmail, orderId, newStatus, order.paymentLink || undefined),
      clientTelegramId
        ? sendStatusUpdateNotification(clientTelegramId, orderId, newStatus, order.paymentLink)
        : Promise.resolve(),
    ]).catch(console.error)
  }

  // Показываем обновлённую карточку заявки
  await handleAdminOrderDetail(bot, chatId, orderId)
}

async function handleAdminPricePrompt(bot: TelegramBot, chatId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) { await bot.sendMessage(chatId, '❌ Заявка не найдена.'); return }

  adminSessions.set(chatId, { action: 'set_price', orderId, createdAt: Date.now(), files: [] })

  const currentPrice = order.price
    ? `Текущая цена: *${parseFloat(String(order.price)).toLocaleString('ru-RU')} ₽*\n\n`
    : ''

  await bot.sendMessage(chatId,
    `💰 *Укажите стоимость работы*\n\n${currentPrice}` +
    `Заявка: ${formatOrderId(orderId)} — ${order.subject}\n\n` +
    `Введите сумму в рублях (только цифры):`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: `admin:order:${orderId}` }]] },
    }
  )
}

async function handleAdminPriceInput(bot: TelegramBot, chatId: string, priceText: string) {
  const adminSession = adminSessions.get(chatId)
  if (!adminSession || adminSession.action !== 'set_price') return

  const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'))
  if (isNaN(price) || price <= 0) {
    await bot.sendMessage(chatId, '⚠️ Введите корректную сумму (например: *5000* или *4500.50*):',
      { parse_mode: 'Markdown' }
    )
    return
  }

  const orderId = adminSession.orderId
  await prisma.order.update({ where: { id: orderId }, data: { price } })
  adminSessions.delete(chatId)

  await bot.sendMessage(chatId,
    `✅ Цена *${price.toLocaleString('ru-RU')} ₽* установлена.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💳 Выставить счёт клиенту', callback_data: `admin:payment:${orderId}` }],
          [{ text: '📋 К заявке', callback_data: `admin:order:${orderId}` }],
        ],
      },
    }
  )
}

async function handleAdminGeneratePayment(bot: TelegramBot, chatId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  })

  if (!order) { await bot.sendMessage(chatId, '❌ Заявка не найдена.'); return }
  if (!order.price) {
    await bot.sendMessage(chatId, '⚠️ Сначала укажите цену заявки.',
      { reply_markup: { inline_keyboard: [[{ text: '💰 Указать цену', callback_data: `admin:price:${orderId}` }]] } }
    )
    return
  }

  const receiptEmail = order.user?.email || order.clientEmail
  if (!receiptEmail) {
    await bot.sendMessage(chatId, '⚠️ У клиента нет email — невозможно выставить счёт.')
    return
  }

  if (order.paymentLink) {
    await bot.sendMessage(chatId,
      `ℹ️ Ссылка уже создана:\n${order.paymentLink}`,
      { reply_markup: { inline_keyboard: [[{ text: '📋 К заявке', callback_data: `admin:order:${orderId}` }]] } }
    )
    return
  }

  const statusMsg = await bot.sendMessage(chatId, '⏳ Создаём ссылку оплаты...')
  try {
    const amount = parseFloat(String(order.price))
    const typeLabels: Record<string, string> = {
      coursework: 'Курсовая', diploma: 'Диплом (ВКР)', essay: 'Реферат/Эссе',
      lab: 'Лабораторная', presentation: 'Презентация',
      'practice-report': 'Отчёт по практике', uir: 'УИР', other: 'Задание',
    }
    const description = `${typeLabels[order.type] || order.type}: ${order.subject}`
    const payment = await createPayment(orderId, amount, description, receiptEmail)

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentLink: payment.confirmationUrl, paymentId: payment.id, status: 'awaiting_payment' },
    })

    const clientTelegramId = order.user?.telegramId
    Promise.allSettled([
      sendPaymentLinkEmail(receiptEmail, orderId, payment.confirmationUrl, amount),
      clientTelegramId
        ? sendPaymentLinkNotification(clientTelegramId, orderId, payment.confirmationUrl, amount)
        : Promise.resolve(),
    ]).catch(console.error)

    await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {})
    await bot.sendMessage(chatId,
      `✅ *Счёт выставлен!*\n\n` +
      `💰 Сумма: *${amount.toLocaleString('ru-RU')} ₽*\n` +
      `📧 Уведомление → ${receiptEmail}\n\n` +
      `🔗 Ссылка оплаты:\n${payment.confirmationUrl}`,
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '📋 К заявке', callback_data: `admin:order:${orderId}` }]] },
      }
    )
  } catch (err) {
    console.error('Admin payment error:', err)
    await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {})
    await bot.sendMessage(chatId,
      '❌ Ошибка при создании платежа. Проверьте настройки ЮKassa.',
      { reply_markup: { inline_keyboard: [[{ text: '📋 К заявке', callback_data: `admin:order:${orderId}` }]] } }
    )
  }
}

async function handleAdminUploadStart(bot: TelegramBot, chatId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) { await bot.sendMessage(chatId, '❌ Заявка не найдена.'); return }

  // Если уже есть файлы — сообщаем
  const existingFiles: string[] = (() => { try { return order.resultFiles ? JSON.parse(order.resultFiles) : [] } catch { return [] } })()
  const existingNote = existingFiles.length > 0 ? `\nУже загружено: ${existingFiles.length} файл(ов). Новые файлы будут добавлены.\n` : ''

  adminSessions.set(chatId, { action: 'upload_result', orderId, createdAt: Date.now(), files: [] })

  await bot.sendMessage(chatId,
    `📤 *Загрузка готовой работы*\n\n` +
    `Заявка: *${formatOrderId(orderId)}* — ${order.subject}\n` +
    existingNote +
    `\nОтправьте файлы по одному. Когда все файлы добавлены — нажмите «Готово».`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'admin:upload_cancel' }]],
      },
    }
  )
}

async function handleAdminFileReceived(bot: TelegramBot, chatId: string, msg: TelegramBot.Message) {
  const adminSession = adminSessions.get(chatId)
  if (!adminSession || adminSession.action !== 'upload_result') return

  const fileId = msg.document?.file_id || msg.photo?.[msg.photo.length - 1]?.file_id
  const fileName = msg.document?.file_name || `photo_${Date.now()}.jpg`
  if (!fileId) return

  const filePath = await saveAdminResultFile(bot, fileId, fileName, adminSession.orderId)
  if (!filePath) {
    await bot.sendMessage(chatId, '⚠️ Не удалось сохранить файл. Попробуйте ещё раз.')
    return
  }

  adminSession.files.push({ path: filePath, name: fileName })
  adminSessions.set(chatId, adminSession)

  const count = adminSession.files.length
  const suffix = count === 1 ? 'файл' : count < 5 ? 'файла' : 'файлов'

  await bot.sendMessage(chatId,
    `📎 *${fileName}* добавлен (${count} ${suffix})\n\nПришлите ещё файлы или нажмите «Готово»:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `✅ Готово (${count} ${suffix})`, callback_data: `admin:upload_done:${adminSession.orderId}` }],
          [{ text: '❌ Отмена', callback_data: 'admin:upload_cancel' }],
        ],
      },
    }
  )
}

async function handleAdminUploadDone(bot: TelegramBot, chatId: string, orderId: string) {
  const adminSession = adminSessions.get(chatId)
  if (!adminSession || adminSession.orderId !== orderId) {
    await bot.sendMessage(chatId, '❌ Сессия устарела. Начните загрузку заново.', {
      reply_markup: { inline_keyboard: [[{ text: '📋 К заявке', callback_data: `admin:order:${orderId}` }]] },
    })
    return
  }

  if (adminSession.files.length === 0) {
    await bot.sendMessage(chatId, '⚠️ Нет файлов. Отправьте файлы или нажмите «Отмена».')
    return
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true, telegramId: true } } },
  })
  if (!order) {
    adminSessions.delete(chatId)
    await bot.sendMessage(chatId, '❌ Заявка не найдена.')
    return
  }

  const existingFiles: string[] = (() => { try { return order.resultFiles ? JSON.parse(order.resultFiles) : [] } catch { return [] } })()
  const allFiles = [...existingFiles, ...adminSession.files.map(f => f.path)]

  await prisma.order.update({
    where: { id: orderId },
    data: { resultFiles: JSON.stringify(allFiles), status: 'completed' },
  })

  adminSessions.delete(chatId)

  const clientEmail = order.user?.email || order.clientEmail
  const clientTelegramId = order.user?.telegramId
  if (clientEmail) {
    Promise.allSettled([
      sendWorkCompletedEmail(clientEmail, orderId, allFiles.length),
      clientTelegramId
        ? sendWorkCompletedNotification(clientTelegramId, orderId, allFiles.length)
        : Promise.resolve(),
    ]).catch(console.error)
  }

  const count = adminSession.files.length
  const suffix = count === 1 ? 'файл' : count < 5 ? 'файла' : 'файлов'

  await bot.sendMessage(chatId,
    `🎉 *Работа завершена!*\n\n` +
    `📁 Загружено: ${count} ${suffix}\n` +
    `Статус изменён на *Завершена* 🎉\n` +
    (clientEmail ? `📧 Клиент уведомлён` : '⚠️ Email клиента не указан'),
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 К заявке', callback_data: `admin:order:${orderId}` }],
          [{ text: '📋 Все заявки', callback_data: 'admin:orders:0' }],
        ],
      },
    }
  )
}

async function handleAdminCallback(
  bot: TelegramBot,
  chatId: string,
  callbackId: string,
  data: string
) {
  const admin = await prisma.user.findFirst({ where: { telegramId: chatId, isAdmin: true } })
  if (!admin) {
    await bot.answerCallbackQuery(callbackId, { text: '⛔ Только для администраторов', show_alert: true })
    return
  }

  // Смена статуса обрабатывает ответ сама (показывает тост с новым статусом)
  if (!data.startsWith('admin:status:')) {
    await bot.answerCallbackQuery(callbackId).catch(() => {})
  }

  if (data === 'admin:menu') {
    await handleAdminMenu(bot, chatId)
    return
  }

  if (data.startsWith('admin:orders:')) {
    const page = parseInt(data.slice('admin:orders:'.length)) || 0
    await handleAdminOrdersList(bot, chatId, page)
    return
  }

  if (data.startsWith('admin:filter:')) {
    // 'admin:filter:STATUS:PAGE' — статус может содержать '_', но не ':'
    const parts = data.split(':') // ['admin','filter','STATUS','PAGE']
    const status = parts[2]
    const page = parseInt(parts[3]) || 0
    await handleAdminOrdersList(bot, chatId, page, status)
    return
  }

  if (data.startsWith('admin:order:')) {
    adminSessions.delete(chatId)
    const orderId = data.slice('admin:order:'.length)
    await handleAdminOrderDetail(bot, chatId, orderId)
    return
  }

  if (data.startsWith('admin:status:')) {
    // 'admin:status:ORDERID:STATUS'
    const parts = data.split(':')
    const orderId = parts[2]
    const newStatus = parts[3]
    await handleAdminChangeStatus(bot, chatId, callbackId, orderId, newStatus)
    return
  }

  if (data.startsWith('admin:price:')) {
    const orderId = data.slice('admin:price:'.length)
    await handleAdminPricePrompt(bot, chatId, orderId)
    return
  }

  if (data.startsWith('admin:payment:')) {
    const orderId = data.slice('admin:payment:'.length)
    await handleAdminGeneratePayment(bot, chatId, orderId)
    return
  }

  if (data.startsWith('admin:upload_done:')) {
    const orderId = data.slice('admin:upload_done:'.length)
    await handleAdminUploadDone(bot, chatId, orderId)
    return
  }

  if (data === 'admin:upload_cancel') {
    const session = adminSessions.get(chatId)
    const orderId = session?.orderId
    adminSessions.delete(chatId)
    await bot.sendMessage(chatId, '❌ Загрузка отменена.', {
      reply_markup: {
        inline_keyboard: [
          ...(orderId ? [[{ text: '📋 К заявке', callback_data: `admin:order:${orderId}` }]] : []),
          [{ text: '‹ К заявкам', callback_data: 'admin:orders:0' }],
        ],
      },
    })
    return
  }

  if (data.startsWith('admin:upload:')) {
    const orderId = data.slice('admin:upload:'.length)
    await handleAdminUploadStart(bot, chatId, orderId)
    return
  }

  if (data.startsWith('admin:copy_link:')) {
    const orderId = data.slice('admin:copy_link:'.length)
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (order?.paymentLink) {
      await bot.sendMessage(chatId,
        `🔗 *Ссылка оплаты для ${formatOrderId(orderId)}:*\n\n${order.paymentLink}`,
        { parse_mode: 'Markdown' }
      )
    } else {
      await bot.sendMessage(chatId, '⚠️ Ссылка оплаты ещё не создана.')
    }
    return
  }
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

  // admin:* — панель администратора (ответ на callback обрабатывается внутри)
  if (data.startsWith('admin:')) {
    await handleAdminCallback(bot, chatId, query.id, data)
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
