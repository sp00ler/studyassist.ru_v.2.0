/// <reference types="vitest/globals" />
const mailMock = vi.hoisted(() => ({ sendMail: vi.fn() }))
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail: mailMock.sendMail }) } }))
vi.mock('@/lib/file-storage', () => ({ resolveStoredFileAbsolutePath: vi.fn() }))

import { sendNewOrderEmail, sendOrderReceivedEmail, sendPaymentLinkEmail } from './email'

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

test('new order has valid sender and internal recipient when SMTP_USER is absent', async () => {
  vi.stubEnv('SMTP_USER', '')
  await sendNewOrderEmail({ orderId: 'o1', orderType: 'essay', subject: 'Test', deadline: '2099',
    description: 'test', name: 'Client', email: 'client@example.com' })
  expect(mailMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({
    from: '"StudyAssist" <support@studyassist.ru>', to: 'support@studyassist.ru',
  }))
})

test('client receipt escapes subject markup and uses client address', async () => {
  await sendOrderReceivedEmail({ orderId: 'o1', orderType: 'essay', subject: '<a> & test', deadline: '2099',
    name: 'Client', email: 'client@example.com' })
  expect(mailMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({
    to: 'client@example.com', html: expect.stringContaining('&lt;a&gt; &amp; test'),
  }))
})

test('invoice only succeeds after SMTP accepts recipient', async () => {
  mailMock.sendMail.mockResolvedValueOnce({ accepted: [] })
  await expect(sendPaymentLinkEmail('client@example.com', 'o1', 'https://pay.example/1', 100)).rejects.toThrow('SMTP did not accept')
  mailMock.sendMail.mockResolvedValueOnce({ accepted: ['client@example.com'] })
  await expect(sendPaymentLinkEmail('client@example.com', 'o1', 'https://pay.example/1', 100)).resolves.toBeUndefined()
})
