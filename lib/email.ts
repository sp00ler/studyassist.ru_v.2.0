import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import path from 'path'
import { resolveStoredFileAbsolutePath } from '@/lib/file-storage'

function e(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.beget.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'support@studyassist.ru',
    pass: process.env.SMTP_PASS || '',
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1',
  },
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
})

export interface OrderEmailData {
  orderId: string
  orderType: string
  subject: string
  deadline: string
  description: string
  name: string
  email: string
  phone?: string | null
  files?: string[]
}

interface OrderReceivedEmailData {
  orderId: string
  orderType: string
  subject: string
  deadline: string
  name: string
  email: string
}

function getOrderTypeLabel(type: string): string {
  const types: Record<string, string> = {
    coursework: 'Курсовая работа',
    diploma: 'Дипломная работа (ВКР)',
    essay: 'Реферат / Эссе',
    lab: 'Лабораторная работа / Задача',
    presentation: 'Презентация / Отчёт',
    'practice-report': 'Отчёт по практике',
    uir: 'УИР',
    other: 'Другое',
  }
  return types[type] || type
}

function formatOrderId(id: string): string {
  // Берём последние 5 символов ID или числовой хеш
  const hash = id.replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')
  return `#${hash}`
}

// ---------------------------------------------------------------------------
// "Vintage OS" (Win95/98) email design system
// Table-based, all styles inline, email-client-safe. No flex/grid/CSS vars/JS.
// ---------------------------------------------------------------------------

const FONT_DISPLAY = "'Press Start 2P','Courier New',Courier,monospace"
const FONT_BODY = "'Tiny5','Lucida Console','Courier New',monospace"

/** Raised (outward) Win95 bevel border via border colors — no box-shadow needed in email. */
const BEVEL_OUT = 'border-top:2px solid #FFFFFF;border-left:2px solid #FFFFFF;border-right:2px solid #000000;border-bottom:2px solid #000000;'
/** Sunken (inward) Win95 bevel border, used for panels/badges. */
const BEVEL_IN = 'border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #FFFFFF;border-bottom:1px solid #FFFFFF;'

/** One key/value row inside a sunken details panel. */
function renderRow(label: string, value: string, opts?: { valueColor?: string; bold?: boolean }): string {
  const color = opts?.valueColor || '#000000'
  const weight = opts?.bold ? 'bold' : 'normal'
  return `<tr>
  <td style="padding:10px 12px;border-bottom:1px solid #C0C0C0;font-family:${FONT_BODY};font-size:12px;color:#3A3A3A;vertical-align:top;white-space:nowrap;">${label}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #C0C0C0;font-family:${FONT_BODY};font-size:14px;color:${color};font-weight:${weight};">${value}</td>
</tr>`
}

/** Sunken panel (inset border) wrapping a table of rows — used for order detail tables. */
function renderPanel(rowsHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF;${BEVEL_IN}margin:16px 0;">
  <tr><td style="padding:2px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF;">
      ${rowsHtml}
    </table>
  </td></tr>
</table>`
}

/** Centered, bulletproof (table-based) Win95 button — primary CTA, min 44px tall. */
function renderCta(label: string, href: string, opts?: { bg?: string; color?: string }): string {
  const bg = opts?.bg || '#000080'
  const color = opts?.color || (bg === '#C0C0C0' ? '#000000' : '#FFFFFF')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background-color:${bg};${BEVEL_OUT}border-radius:0;">
          <a href="${href}" style="display:inline-block;min-height:44px;line-height:44px;padding:0 28px;font-family:${FONT_DISPLAY};font-size:12px;color:${color};text-decoration:none;border-radius:0;">${label}</a>
        </td>
      </tr>
    </table>
  </td></tr>
</table>`
}

/** Small raised badge (status pill / order-number chip). */
function renderBadge(label: string, opts?: { bg?: string; color?: string; size?: number }): string {
  // Status reads as a sunken Win95 status field with a coloured indicator — not as a button.
  const dot = opts?.bg || '#000080'
  const size = opts?.size || 12
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr><td style="background-color:#FFFFFF;${BEVEL_IN}padding:8px 14px;">
    <span style="font-family:${FONT_DISPLAY};font-size:${size}px;color:${dot};">&#9632;</span>
    <span style="font-family:${FONT_DISPLAY};font-size:${size}px;color:#000000;">&nbsp;${label}</span>
  </td></tr>
</table>`
}

function getStatusBadgeColor(status: string): { bg: string; color: string } {
  const map: Record<string, { bg: string; color: string }> = {
    new: { bg: '#000080', color: '#FFFFFF' },
    in_progress: { bg: '#1084D0', color: '#FFFFFF' },
    ready_for_review: { bg: '#1084D0', color: '#FFFFFF' },
    awaiting_payment: { bg: '#D97706', color: '#FFFFFF' },
    paid: { bg: '#16A34A', color: '#FFFFFF' },
    completed: { bg: '#16A34A', color: '#FFFFFF' },
    cancelled: { bg: '#DC2626', color: '#FFFFFF' },
  }
  return map[status] || { bg: '#000080', color: '#FFFFFF' }
}

/**
 * Shared "Explorer window" layout every StudyAssist email renders through:
 * teal desktop, silver bevel frame, navy title bar (folder glyph + window
 * controls), menu bar, address bar, sunken content pane, sunken status bar.
 */
function renderLayout(opts: {
  title: string
  preheader: string
  bodyHtml: string
  footerHtml?: string
  addressPath?: string
}): string {
  const { title, preheader, bodyHtml, footerHtml, addressPath } = opts
  const address = addressPath ? `studyassist.ru/${addressPath}` : 'studyassist.ru'
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Tiny5&display=swap" rel="stylesheet">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Tiny5&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background-color:#008080;font-family:${FONT_BODY};">
<span style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#008080;">
<tr><td align="center" style="padding:32px 12px;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#C0C0C0;${BEVEL_OUT}">
<tr><td style="border-top:1px solid #DFDFDF;border-left:1px solid #DFDFDF;border-right:1px solid #808080;border-bottom:1px solid #000000;">

  <!-- Title bar -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000080;">
    <tr>
      <td style="width:20px;padding:7px 4px 7px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="width:13px;height:10px;background-color:#FFCC33;border-top:1px solid #FFE8A3;border-left:1px solid #FFE8A3;border-right:1px solid #8A6D1F;border-bottom:1px solid #8A6D1F;font-size:1px;line-height:1px;">&nbsp;</td>
        </tr></table>
      </td>
      <td style="padding:7px 4px;font-family:${FONT_DISPLAY};font-size:10px;line-height:1.5;color:#FFFFFF;word-break:break-word;">${title}</td>
      <td align="right" style="padding:6px 8px;white-space:nowrap;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="width:16px;height:14px;background-color:#C0C0C0;${BEVEL_OUT}font-family:${FONT_BODY};font-size:10px;line-height:14px;text-align:center;color:#000000;">_</td>
          <td style="width:3px;font-size:1px;line-height:1px;">&nbsp;</td>
          <td style="width:16px;height:14px;background-color:#C0C0C0;${BEVEL_OUT}font-family:${FONT_BODY};font-size:10px;line-height:14px;text-align:center;color:#000000;">&#9633;</td>
          <td style="width:3px;font-size:1px;line-height:1px;">&nbsp;</td>
          <td style="width:16px;height:14px;background-color:#C0C0C0;${BEVEL_OUT}font-family:${FONT_BODY};font-size:10px;line-height:14px;text-align:center;color:#000000;">&#215;</td>
        </tr></table>
      </td>
    </tr>
  </table>

  <!-- Menu bar -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#C0C0C0;border-bottom:1px solid #808080;">
    <tr><td style="padding:5px 10px;font-family:${FONT_BODY};font-size:12px;line-height:1.4;color:#000000;white-space:nowrap;">Файл&nbsp;&nbsp;Правка&nbsp;&nbsp;Вид&nbsp;&nbsp;Справка</td></tr>
  </table>

  <!-- Address bar -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#C0C0C0;border-bottom:1px solid #808080;">
    <tr><td style="padding:6px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding:0 6px 0 0;font-family:${FONT_BODY};font-size:12px;color:#000000;white-space:nowrap;">Адрес:</td>
        <td width="100%" style="background-color:#FFFFFF;${BEVEL_IN}padding:4px 8px;">
          <span style="font-family:${FONT_BODY};font-size:13px;color:#000000;">${address}</span>
        </td>
      </tr></table>
    </td></tr>
  </table>

  <!-- Content pane (sunken) -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#C0C0C0;">
    <tr><td style="padding:6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFF6;${BEVEL_IN}">
        <tr><td style="padding:22px 20px;font-family:${FONT_BODY};font-size:17px;line-height:1.5;color:#000000;">
          ${bodyHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>

  ${footerHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#C0C0C0;">
    <tr><td style="padding:8px 24px 4px;font-family:${FONT_BODY};font-size:12px;line-height:1.6;color:#3A3A3A;text-align:center;">
      ${footerHtml}
    </td></tr>
  </table>` : ''}

  <!-- Status bar (sunken cells) -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#C0C0C0;border-top:1px solid #808080;">
    <tr>
      <td style="padding:6px 8px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="background-color:#C0C0C0;${BEVEL_IN}padding:3px 10px;font-family:${FONT_BODY};font-size:12px;color:#000000;">Готово</td>
        </tr></table>
      </td>
      <td align="right" style="padding:6px 8px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="background-color:#C0C0C0;${BEVEL_IN}padding:3px 10px;font-family:${FONT_BODY};font-size:12px;color:#000000;white-space:nowrap;">${address}</td>
        </tr></table>
      </td>
    </tr>
  </table>

</td></tr>
</table>

</td></tr>
</table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Pure HTML builders (one per email type) — no side effects, used both by the
// send functions below and by offline preview tooling.
// ---------------------------------------------------------------------------

function buildNewOrderEmailHtml(data: OrderEmailData): string {
  const orderLabel = formatOrderId(data.orderId)
  const typeLabel = getOrderTypeLabel(data.orderType)

  const rows =
    renderRow('Тип работы', e(typeLabel)) +
    renderRow('Предмет / Дисциплина', e(data.subject)) +
    renderRow('Дедлайн', e(data.deadline), { valueColor: '#D97706', bold: true }) +
    renderRow('Описание задания', e(data.description).replace(/\n/g, '<br>')) +
    renderRow('Имя клиента', e(data.name)) +
    renderRow('Email', `<a href="mailto:${e(data.email)}" style="color:#000080;">${e(data.email)}</a>`) +
    (data.phone
      ? renderRow('Телефон', `<a href="tel:${e(data.phone)}" style="color:#000080;">${e(data.phone)}</a>`)
      : '') +
    renderRow('Прикреплённые файлы', `${data.files?.length || 0} шт.`)

  const bodyHtml = `
    <p style="margin:0 0 16px;font-family:${FONT_DISPLAY};font-size:14px;line-height:1.5;color:#000080;">Новая заявка ${orderLabel}</p>
    <p style="margin:0 0 4px;">Поступила новая заявка на сайте StudyAssist.ru.</p>
    ${renderPanel(rows)}
    ${renderCta('Открыть в панели', `${process.env.NEXTAUTH_URL}/admin/orders`)}
  `

  return renderLayout({
    title: `StudyAssist — Новая заявка ${orderLabel}`,
    preheader: `${typeLabel}: ${data.subject} — от ${data.name}`,
    bodyHtml,
    addressPath: `заказы/№${orderLabel.replace('#', '')}`,
  })
}

function buildOrderReceivedEmailHtml(data: OrderReceivedEmailData): string {
  const orderLabel = formatOrderId(data.orderId)
  const typeLabel = getOrderTypeLabel(data.orderType)

  const rows =
    renderRow('Тип работы', e(typeLabel)) +
    renderRow('Предмет', e(data.subject)) +
    renderRow('Дедлайн', e(data.deadline), { valueColor: '#D97706', bold: true })

  const bodyHtml = `
    <p style="margin:0 0 12px;font-family:${FONT_DISPLAY};font-size:14px;line-height:1.5;color:#000080;">${e(data.name)}, спасибо за обращение!</p>
    <p style="margin:0 0 20px;">Мы получили вашу заявку и уже передали её менеджеру. Обычно связываемся в течение 30 минут в рабочее время.</p>
    <p style="margin:0 0 6px;text-align:center;font-size:12px;color:#3A3A3A;">Номер заявки</p>
    <div style="text-align:center;margin:0 0 20px;">${renderBadge(orderLabel, { size: 16 })}</div>
    ${renderPanel(rows)}
    ${renderCta('Открыть личный кабинет', `${process.env.NEXTAUTH_URL || 'https://studyassist.ru'}/dashboard`)}
  `

  return renderLayout({
    title: `StudyAssist — Заявка ${orderLabel} принята`,
    preheader: `Заявка ${orderLabel} принята, свяжемся в течение 30 минут`,
    bodyHtml,
    footerHtml: `© ${new Date().getFullYear()} StudyAssist.ru — Все права защищены`,
    addressPath: `заказы/№${orderLabel.replace('#', '')}`,
  })
}

function buildStatusUpdateEmailHtml(newStatus: string, orderLabel: string, paymentLink?: string | null): string {
  const statusLabels: Record<string, string> = {
    new: 'Новая',
    in_progress: 'В работе',
    ready_for_review: 'Готова к проверке',
    awaiting_payment: 'Ожидает оплаты',
    paid: 'Оплачена',
    completed: 'Завершена',
    cancelled: 'Отменена',
  }

  const statusLabel = statusLabels[newStatus] || newStatus
  const isPayment = newStatus === 'awaiting_payment' && paymentLink
  const badge = getStatusBadgeColor(newStatus)

  const bodyHtml = `
    <p style="margin:0 0 8px;font-family:${FONT_DISPLAY};font-size:14px;line-height:1.5;color:#000080;">Обновление заявки ${orderLabel}</p>
    <p style="margin:0 0 16px;">Статус вашей заявки изменён:</p>
    <div style="text-align:center;margin:0 0 8px;">${renderBadge(statusLabel, { bg: badge.bg, color: badge.color })}</div>
    ${isPayment ? `
    <p style="margin:24px 0 4px;">Ваша работа готова! Для получения файлов перейдите к оплате:</p>
    ${renderCta('Оплатить работу', paymentLink!)}
    ` : ''}
    <p style="margin:24px 0 0;font-size:13px;color:#3A3A3A;text-align:center;">
      Вы можете отслеживать статус в <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color:#000080;">личном кабинете</a>
    </p>
  `

  return renderLayout({
    title: `StudyAssist — Заявка ${orderLabel}`,
    preheader: `Статус заявки ${orderLabel} изменён на «${statusLabel}»`,
    bodyHtml,
    addressPath: `заказы/№${orderLabel.replace('#', '')}`,
  })
}

function buildVerificationEmailHtml(name: string, verifyUrl: string): string {
  const bodyHtml = `
    <p style="margin:0 0 4px;font-family:${FONT_DISPLAY};font-size:14px;line-height:1.5;color:#000080;">StudyAssist</p>
    <p style="margin:0 0 20px;font-size:13px;color:#3A3A3A;">Подтверждение email-адреса</p>
    <p style="margin:0 0 12px;font-weight:bold;">Привет, ${e(name)}!</p>
    <p style="margin:0 0 8px;">Вы зарегистрировались на StudyAssist.ru. Для завершения регистрации подтвердите ваш email-адрес, нажав на кнопку ниже.</p>
    ${renderCta('Подтвердить email', verifyUrl)}
    <p style="margin:0 0 4px;font-size:13px;color:#3A3A3A;text-align:center;">Ссылка действует 24 часа.</p>
    <p style="margin:0;font-size:12px;color:#3A3A3A;text-align:center;">Если вы не регистрировались на StudyAssist.ru — просто проигнорируйте это письмо.</p>
    ${renderPanel(`<tr><td style="padding:10px 12px;font-family:${FONT_BODY};font-size:11px;color:#3A3A3A;">Не открывается кнопка? Скопируйте ссылку:<br><a href="${verifyUrl}" style="color:#000080;word-break:break-all;">${verifyUrl}</a></td></tr>`)}
  `

  return renderLayout({
    title: 'StudyAssist — Подтверждение email',
    preheader: 'Подтвердите ваш email-адрес, чтобы завершить регистрацию',
    bodyHtml,
    footerHtml: `© ${new Date().getFullYear()} StudyAssist.ru — Все права защищены`,
  })
}

function buildPasswordResetEmailHtml(name: string, resetUrl: string): string {
  const bodyHtml = `
    <p style="margin:0 0 4px;font-family:${FONT_DISPLAY};font-size:14px;line-height:1.5;color:#000080;">StudyAssist</p>
    <p style="margin:0 0 20px;font-size:13px;color:#3A3A3A;">Восстановление пароля</p>
    <p style="margin:0 0 12px;font-weight:bold;">Привет, ${name}!</p>
    <p style="margin:0 0 8px;">Мы получили запрос на сброс пароля для вашего аккаунта на StudyAssist.ru. Нажмите на кнопку ниже, чтобы создать новый пароль.</p>
    ${renderCta('Сбросить пароль', resetUrl)}
    <p style="margin:0 0 4px;font-size:13px;color:#3A3A3A;text-align:center;">Ссылка действует 1 час.</p>
    <p style="margin:0;font-size:12px;color:#3A3A3A;text-align:center;">Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо. Ваш пароль останется прежним.</p>
    ${renderPanel(`<tr><td style="padding:10px 12px;font-family:${FONT_BODY};font-size:11px;color:#3A3A3A;">Не открывается кнопка? Скопируйте ссылку:<br><a href="${resetUrl}" style="color:#000080;word-break:break-all;">${resetUrl}</a></td></tr>`)}
  `

  return renderLayout({
    title: 'StudyAssist — Сброс пароля',
    preheader: 'Нажмите, чтобы задать новый пароль. Ссылка действует 1 час',
    bodyHtml,
    footerHtml: `© ${new Date().getFullYear()} StudyAssist.ru — Все права защищены`,
  })
}

function buildWorkCompletedEmailHtml(orderLabel: string, fileCount: number, dashboardUrl: string): string {
  const bodyHtml = `
    <p style="margin:0 0 4px;font-family:${FONT_DISPLAY};font-size:15px;line-height:1.5;color:#000080;text-align:center;">Ваша работа готова!</p>
    <p style="margin:0 0 20px;font-size:13px;color:#3A3A3A;text-align:center;">Заявка ${orderLabel}</p>
    <p style="margin:0 0 8px;text-align:center;">Мы завершили работу над вашим заданием.</p>
    <p style="margin:0 0 8px;text-align:center;color:#3A3A3A;">Файлы готовой работы (${fileCount} шт.) доступны для скачивания в личном кабинете.</p>
    ${renderCta('Скачать работу', dashboardUrl)}
    <p style="margin:16px 0 0;font-size:13px;color:#3A3A3A;text-align:center;">Если у вас есть замечания, вы можете запросить доработку прямо из личного кабинета.</p>
  `

  return renderLayout({
    title: `StudyAssist — Заявка ${orderLabel} готова`,
    preheader: `Файлы готовой работы (${fileCount} шт.) доступны в личном кабинете`,
    bodyHtml,
    addressPath: `заказы/№${orderLabel.replace('#', '')}`,
  })
}

function buildRevisionRequestEmailHtml(
  orderLabel: string,
  clientName: string,
  clientEmail: string,
  note: string,
  fileCount: number,
  adminUrl: string
): string {
  const rows =
    renderRow('Клиент', `${clientName} (${clientEmail})`) +
    renderRow('Замечания', note.replace(/\n/g, '<br>')) +
    renderRow('Прикреплено файлов', `${fileCount} шт.`)

  const bodyHtml = `
    <p style="margin:0 0 4px;font-family:${FONT_DISPLAY};font-size:14px;line-height:1.5;color:#000080;">Запрос на доработку</p>
    <p style="margin:0 0 16px;font-size:13px;color:#3A3A3A;">Заявка ${orderLabel}</p>
    ${renderPanel(rows)}
    ${renderCta('Открыть заявку в панели', adminUrl)}
  `

  return renderLayout({
    title: `StudyAssist — Доработка ${orderLabel}`,
    preheader: `${clientName} запросил(а) доработку по заявке ${orderLabel}`,
    bodyHtml,
    addressPath: `заказы/№${orderLabel.replace('#', '')}`,
  })
}

function buildPaymentLinkEmailHtml(orderLabel: string, paymentLink: string, amount: number): string {
  const bodyHtml = `
    <p style="margin:0 0 4px;font-family:${FONT_DISPLAY};font-size:14px;line-height:1.5;color:#000080;text-align:center;">Ссылка на оплату</p>
    <p style="margin:0 0 20px;font-size:13px;color:#3A3A3A;text-align:center;">Заявка ${orderLabel}</p>
    <p style="margin:0 0 4px;text-align:center;">Ваша работа проверена и готова к передаче.</p>
    <p style="margin:0 0 8px;text-align:center;color:#3A3A3A;">Стоимость работы:</p>
    <p style="margin:0 0 8px;text-align:center;font-family:${FONT_DISPLAY};font-size:24px;color:#000080;">${amount.toLocaleString('ru-RU')} ₽</p>
    ${renderCta('Оплатить сейчас', paymentLink)}
    <p style="margin:16px 0 0;font-size:12px;color:#3A3A3A;text-align:center;">
      После оплаты работа будет автоматически доступна в вашем <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color:#000080;">личном кабинете</a>
    </p>
  `

  return renderLayout({
    title: `StudyAssist — Оплата заявки ${orderLabel}`,
    preheader: `К оплате: ${amount.toLocaleString('ru-RU')} ₽ по заявке ${orderLabel}`,
    bodyHtml,
    addressPath: `заказы/№${orderLabel.replace('#', '')}`,
  })
}

/** Pure HTML builders, exported for offline preview tooling (never calls the transporter). */
export const emailTemplates = {
  newOrder: buildNewOrderEmailHtml,
  orderReceived: buildOrderReceivedEmailHtml,
  statusUpdate: buildStatusUpdateEmailHtml,
  verification: buildVerificationEmailHtml,
  passwordReset: buildPasswordResetEmailHtml,
  workCompleted: buildWorkCompletedEmailHtml,
  revisionRequest: buildRevisionRequestEmailHtml,
  paymentLink: buildPaymentLinkEmailHtml,
}

// ---------------------------------------------------------------------------
// Send functions — same exported names/signatures/subjects/recipients as before.
// ---------------------------------------------------------------------------

export async function sendNewOrderEmail(data: OrderEmailData): Promise<void> {
  const orderLabel = formatOrderId(data.orderId)
  const typeLabel = getOrderTypeLabel(data.orderType)

  // Подготавливаем аттачменты
  const attachments: Mail.Attachment[] = []
  if (data.files && data.files.length > 0) {
    for (const filePath of data.files) {
      const fullPath = resolveStoredFileAbsolutePath(filePath)
      if (fullPath) {
        attachments.push({
          filename: path.basename(filePath),
          path: fullPath,
        })
      }
    }
  }

  const htmlContent = buildNewOrderEmailHtml(data)

  await transporter.sendMail({
    from: `"StudyAssist" <${process.env.SMTP_USER || 'support@studyassist.ru'}>`,
    to: process.env.SMTP_USER || 'support@studyassist.ru',
    subject: `📋 Новая заявка ${orderLabel} — ${typeLabel} (${data.subject})`,
    html: htmlContent,
    attachments,
  })
}

export async function sendOrderReceivedEmail(data: OrderReceivedEmailData): Promise<void> {
  const orderLabel = formatOrderId(data.orderId)

  const htmlContent = buildOrderReceivedEmailHtml(data)

  await transporter.sendMail({
    from: `"StudyAssist" <${process.env.SMTP_USER || 'support@studyassist.ru'}>`,
    to: data.email,
    subject: `✅ Заявка ${orderLabel} принята — StudyAssist`,
    html: htmlContent,
  })
}

export async function sendStatusUpdateEmail(
  to: string,
  orderId: string,
  newStatus: string,
  paymentLink?: string | null
): Promise<void> {
  const orderLabel = formatOrderId(orderId)

  const statusLabels: Record<string, string> = {
    new: 'Новая',
    in_progress: 'В работе',
    ready_for_review: 'Готова к проверке',
    awaiting_payment: 'Ожидает оплаты',
    paid: 'Оплачена',
    completed: 'Завершена',
    cancelled: 'Отменена',
  }

  const statusLabel = statusLabels[newStatus] || newStatus

  const htmlContent = buildStatusUpdateEmailHtml(newStatus, orderLabel, paymentLink)

  await transporter.sendMail({
    from: `"StudyAssist" <${process.env.SMTP_USER}>`,
    to,
    subject: `Заявка ${orderLabel}: статус изменён на "${statusLabel}"`,
    html: htmlContent,
  })
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://studyassist.ru'
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`

  const htmlContent = buildVerificationEmailHtml(name, verifyUrl)

  await transporter.sendMail({
    from: `"StudyAssist" <${process.env.SMTP_USER}>`,
    to,
    subject: '✅ Подтвердите ваш email — StudyAssist',
    html: htmlContent,
  })
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://studyassist.ru'
  const resetUrl = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(token)}`

  const htmlContent = buildPasswordResetEmailHtml(name, resetUrl)

  await transporter.sendMail({
    from: `"StudyAssist" <${process.env.SMTP_USER}>`,
    to,
    subject: '🔑 Восстановление пароля — StudyAssist',
    html: htmlContent,
  })
}

export async function sendWorkCompletedEmail(
  to: string,
  orderId: string,
  fileCount: number
): Promise<void> {
  const orderLabel = formatOrderId(orderId)
  const dashboardUrl = `${process.env.NEXTAUTH_URL || 'https://studyassist.ru'}/dashboard`

  const html = buildWorkCompletedEmailHtml(orderLabel, fileCount, dashboardUrl)

  await transporter.sendMail({
    from: `"StudyAssist" <${process.env.SMTP_USER}>`,
    to,
    subject: `🎉 Работа по заявке ${orderLabel} готова — скачайте файлы`,
    html,
  })
}

export async function sendRevisionRequestEmail(
  orderId: string,
  clientName: string,
  clientEmail: string,
  note: string,
  fileCount: number
): Promise<void> {
  const orderLabel = formatOrderId(orderId)
  const adminUrl = `${process.env.NEXTAUTH_URL || 'https://studyassist.ru'}/admin/orders`

  const html = buildRevisionRequestEmailHtml(orderLabel, clientName, clientEmail, note, fileCount, adminUrl)

  const recipients = ['support@studyassist.ru', 'admin@studyassist.ru'].filter(
    (e, i, arr) => arr.indexOf(e) === i && e !== process.env.SMTP_USER
  )
  recipients.unshift(process.env.SMTP_USER || 'support@studyassist.ru')

  await transporter.sendMail({
    from: `"StudyAssist" <${process.env.SMTP_USER}>`,
    to: Array.from(new Set(['support@studyassist.ru', 'admin@studyassist.ru'])).join(', '),
    subject: `🔄 Доработка по заявке ${orderLabel} от ${clientName}`,
    html,
  })
}

export async function sendPaymentLinkEmail(
  to: string,
  orderId: string,
  paymentLink: string,
  amount: number
): Promise<void> {
  const orderLabel = formatOrderId(orderId)

  const htmlContent = buildPaymentLinkEmailHtml(orderLabel, paymentLink, amount)

  const result = await transporter.sendMail({
    from: `"StudyAssist" <${process.env.SMTP_USER || 'support@studyassist.ru'}>`,
    to,
    subject: `Ссылка на оплату заявки ${orderLabel} — ${amount.toLocaleString('ru-RU')} ₽`,
    html: htmlContent,
  })
  if (!result.accepted?.length) {
    throw new Error('SMTP did not accept the payment notification recipient')
  }
}
