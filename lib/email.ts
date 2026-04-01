import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import path from 'path'
import { resolveStoredFileAbsolutePath } from '@/lib/file-storage'

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

  const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Новая заявка StudyAssist</title>
</head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid rgba(108,62,244,0.3);">
          <tr>
            <td style="background:linear-gradient(135deg,#6C3EF4,#3B82F6);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">📋 Новая заявка ${orderLabel}</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">StudyAssist.ru</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Тип работы</span><br>
                    <span style="color:#F1F5F9;font-size:16px;font-weight:600;">${typeLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Предмет / Дисциплина</span><br>
                    <span style="color:#F1F5F9;font-size:16px;">${data.subject}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Дедлайн</span><br>
                    <span style="color:#F59E0B;font-size:16px;font-weight:600;">${data.deadline}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Описание задания</span><br>
                    <span style="color:#F1F5F9;font-size:15px;line-height:1.6;">${data.description.replace(/\n/g, '<br>')}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Имя клиента</span><br>
                    <span style="color:#F1F5F9;font-size:16px;">${data.name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Email</span><br>
                    <a href="mailto:${data.email}" style="color:#6C3EF4;font-size:16px;">${data.email}</a>
                  </td>
                </tr>
                ${data.phone ? `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Телефон</span><br>
                    <a href="tel:${data.phone}" style="color:#6C3EF4;font-size:16px;">${data.phone}</a>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#94A3B8;font-size:14px;">Прикреплённые файлы</span><br>
                    <span style="color:#F1F5F9;font-size:16px;">${data.files?.length || 0} шт.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${process.env.NEXTAUTH_URL}/admin/orders"
                 style="display:inline-block;background:linear-gradient(135deg,#6C3EF4,#3B82F6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
                Открыть в панели администратора
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  await transporter.sendMail({
    from: `"StudyAssist" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER,
    subject: `📋 Новая заявка ${orderLabel} — ${typeLabel} (${data.subject})`,
    html: htmlContent,
    attachments,
  })
}

export async function sendOrderReceivedEmail(data: OrderEmailData): Promise<void> {
  const orderLabel = formatOrderId(data.orderId)
  const typeLabel = getOrderTypeLabel(data.orderType)
  const baseUrl = process.env.NEXTAUTH_URL || 'https://studyassist.ru'

  const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Заявка принята — StudyAssist</title>
</head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid rgba(108,62,244,0.3);">
          <tr>
            <td style="background:linear-gradient(135deg,#6C3EF4,#3B82F6);padding:32px;text-align:center;">
              <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;line-height:48px;font-size:24px;margin-bottom:16px;">✅</div>
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Заявка ${orderLabel} принята</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">StudyAssist.ru</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <p style="color:#F1F5F9;font-size:18px;font-weight:600;margin:0 0 12px;">${data.name}, спасибо за обращение! 👋</p>
              <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Мы получили вашу заявку и уже передали её менеджеру.
                Обычно связываемся в течение 30 минут в рабочее время.
              </p>
              <div style="display:inline-block;background:rgba(108,62,244,0.2);border:1px solid rgba(108,62,244,0.45);border-radius:10px;padding:14px 22px;margin-bottom:24px;">
                <p style="margin:0;color:#A78BFA;font-size:13px;">Номер заявки</p>
                <p style="margin:4px 0 0;color:#E2E8F0;font-size:26px;font-weight:700;">${orderLabel}</p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="text-align:left;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                <tr><td style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08);color:#94A3B8;font-size:13px;">Тип работы</td><td style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08);color:#F1F5F9;font-size:14px;">${typeLabel}</td></tr>
                <tr><td style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08);color:#94A3B8;font-size:13px;">Предмет</td><td style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08);color:#F1F5F9;font-size:14px;">${data.subject}</td></tr>
                <tr><td style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08);color:#94A3B8;font-size:13px;">Дедлайн</td><td style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08);color:#FCD34D;font-size:14px;font-weight:700;">${data.deadline}</td></tr>
                <tr><td style="padding:12px 14px;color:#94A3B8;font-size:13px;">Файлов прикреплено</td><td style="padding:12px 14px;color:#F1F5F9;font-size:14px;">${data.files?.length || 0}</td></tr>
              </table>
              <a href="${baseUrl}/dashboard"
                 style="display:inline-block;background:linear-gradient(135deg,#6C3EF4,#3B82F6);color:#fff;padding:14px 30px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-top:26px;">
                Открыть личный кабинет
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#0F0F1A;padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="color:#374151;font-size:12px;margin:0;">© 2026 StudyAssist.ru — Все права защищены</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  await transporter.sendMail({
    from: `"StudyAssist" <${process.env.SMTP_USER}>`,
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
  const isPayment = newStatus === 'awaiting_payment' && paymentLink

  const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>Обновление заявки</title></head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid rgba(108,62,244,0.3);">
          <tr>
            <td style="background:linear-gradient(135deg,#6C3EF4,#3B82F6);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">Обновление заявки ${orderLabel}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;text-align:center;">
              <p style="color:#94A3B8;font-size:16px;">Статус вашей заявки изменён:</p>
              <div style="display:inline-block;background:rgba(108,62,244,0.2);border:1px solid #6C3EF4;color:#F1F5F9;padding:12px 24px;border-radius:8px;font-size:18px;font-weight:600;margin:16px 0;">
                ${statusLabel}
              </div>
              ${isPayment ? `
              <p style="color:#F1F5F9;font-size:16px;margin:24px 0 8px;">Ваша работа готова! Для получения файлов перейдите к оплате:</p>
              <a href="${paymentLink}"
                 style="display:inline-block;background:linear-gradient(135deg,#F59E0B,#EF4444);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin:8px 0;">
                Оплатить работу
              </a>
              ` : ''}
              <p style="color:#94A3B8;font-size:14px;margin-top:24px;">
                Вы можете отслеживать статус в <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color:#6C3EF4;">личном кабинете</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

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

  const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подтверждение email — StudyAssist</title>
</head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid rgba(108,62,244,0.3);">
          <tr>
            <td style="background:linear-gradient(135deg,#6C3EF4,#3B82F6);padding:32px;text-align:center;">
              <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;line-height:48px;font-size:24px;margin-bottom:16px;">🎓</div>
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">StudyAssist</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Подтверждение email-адреса</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <p style="color:#F1F5F9;font-size:18px;font-weight:600;margin:0 0 12px;">Привет, ${name}! 👋</p>
              <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Вы зарегистрировались на StudyAssist.ru. Для завершения регистрации подтвердите ваш email-адрес, нажав на кнопку ниже.
              </p>
              <a href="${verifyUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#6C3EF4,#3B82F6);color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin-bottom:32px;">
                ✅ Подтвердить email
              </a>
              <p style="color:#64748B;font-size:13px;margin:0 0 8px;">Ссылка действует 24 часа.</p>
              <p style="color:#64748B;font-size:12px;margin:0;">
                Если вы не регистрировались на StudyAssist.ru — просто проигнорируйте это письмо.
              </p>
              <div style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
                <p style="color:#475569;font-size:11px;margin:0;">
                  Не открывается кнопка? Скопируйте ссылку:<br>
                  <a href="${verifyUrl}" style="color:#6C3EF4;word-break:break-all;">${verifyUrl}</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#0F0F1A;padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="color:#374151;font-size:12px;margin:0;">© 2025 StudyAssist.ru — Все права защищены</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

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

  const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Восстановление пароля — StudyAssist</title>
</head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid rgba(108,62,244,0.3);">
          <tr>
            <td style="background:linear-gradient(135deg,#6C3EF4,#3B82F6);padding:32px;text-align:center;">
              <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;line-height:48px;font-size:24px;margin-bottom:16px;">🎓</div>
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">StudyAssist</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Восстановление пароля</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <p style="color:#F1F5F9;font-size:18px;font-weight:600;margin:0 0 12px;">Привет, ${name}! 🔐</p>
              <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Мы получили запрос на сброс пароля для вашего аккаунта на StudyAssist.ru. Нажмите на кнопку ниже, чтобы создать новый пароль.
              </p>
              <a href="${resetUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#6C3EF4,#3B82F6);color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin-bottom:32px;">
                🔑 Сбросить пароль
              </a>
              <p style="color:#64748B;font-size:13px;margin:0 0 8px;">Ссылка действует 1 час.</p>
              <p style="color:#64748B;font-size:12px;margin:0;">
                Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо. Ваш пароль останется прежним.
              </p>
              <div style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
                <p style="color:#475569;font-size:11px;margin:0;">
                  Не открывается кнопка? Скопируйте ссылку:<br>
                  <a href="${resetUrl}" style="color:#6C3EF4;word-break:break-all;">${resetUrl}</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#0F0F1A;padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="color:#374151;font-size:12px;margin:0;">© 2025 StudyAssist.ru — Все права защищены</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

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

  const html = `
<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Работа готова</title></head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid rgba(16,185,129,0.3);">
        <tr><td style="background:linear-gradient(135deg,#059669,#10B981);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:26px;">🎉 Ваша работа готова!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Заявка ${orderLabel}</p>
        </td></tr>
        <tr><td style="padding:32px;text-align:center;">
          <p style="color:#F1F5F9;font-size:17px;margin:0 0 12px;">Мы завершили работу над вашим заданием.</p>
          <p style="color:#94A3B8;font-size:15px;">Файлы готовой работы (${fileCount} шт.) доступны для скачивания в личном кабинете.</p>
          <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10B981);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin:24px 0;">
            Скачать работу
          </a>
          <p style="color:#64748B;font-size:13px;margin-top:16px;">
            Если у вас есть замечания, вы можете запросить доработку прямо из личного кабинета.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

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

  const html = `
<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Запрос на доработку</title></head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid rgba(245,158,11,0.3);">
        <tr><td style="background:linear-gradient(135deg,#D97706,#F59E0B);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🔄 Запрос на доработку</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Заявка ${orderLabel}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
              <span style="color:#94A3B8;font-size:13px;">Клиент</span><br>
              <span style="color:#F1F5F9;font-size:15px;">${clientName} (${clientEmail})</span>
            </td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
              <span style="color:#94A3B8;font-size:13px;">Замечания</span><br>
              <span style="color:#F1F5F9;font-size:15px;line-height:1.6;">${note.replace(/\n/g, '<br>')}</span>
            </td></tr>
            <tr><td style="padding:10px 0;">
              <span style="color:#94A3B8;font-size:13px;">Прикреплено файлов</span><br>
              <span style="color:#F1F5F9;font-size:15px;">${fileCount} шт.</span>
            </td></tr>
          </table>
          <div style="text-align:center;margin-top:24px;">
            <a href="${adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#6C3EF4,#3B82F6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Открыть заявку в панели
            </a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

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

  const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>Ссылка на оплату</title></head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid rgba(108,62,244,0.3);">
          <tr>
            <td style="background:linear-gradient(135deg,#6C3EF4,#3B82F6);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">💳 Ссылка на оплату</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Заявка ${orderLabel}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;text-align:center;">
              <p style="color:#F1F5F9;font-size:16px;">Ваша работа проверена и готова к передаче.</p>
              <p style="color:#94A3B8;font-size:15px;">Стоимость работы:</p>
              <div style="font-size:32px;font-weight:700;color:#F59E0B;margin:16px 0;">${amount.toLocaleString('ru-RU')} ₽</div>
              <a href="${paymentLink}"
                 style="display:inline-block;background:linear-gradient(135deg,#F59E0B,#EF4444);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin:16px 0;">
                Оплатить сейчас
              </a>
              <p style="color:#94A3B8;font-size:13px;margin-top:24px;">
                После оплаты работа будет автоматически доступна в вашем
                <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color:#6C3EF4;">личном кабинете</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  await transporter.sendMail({
    from: `"StudyAssist" <${process.env.SMTP_USER}>`,
    to,
    subject: `Ссылка на оплату заявки ${orderLabel} — ${amount.toLocaleString('ru-RU')} ₽`,
    html: htmlContent,
  })
}
