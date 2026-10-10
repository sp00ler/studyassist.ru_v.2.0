/// <reference types="vitest/globals" />
import { chatPollingCursor, mergeChatMessages } from './chat-messages'

test('a visitor send confirmation does not skip an earlier unseen operator reply', () => {
  const first = { id: 'first', createdAt: '2026-10-10T00:00:00.000Z', fromAdmin: false }
  const reply = { id: 'reply', createdAt: '2026-10-10T00:00:01.000Z', fromAdmin: true }
  const sent = { id: 'sent', createdAt: '2026-10-10T00:00:02.000Z', fromAdmin: false }
  const cursor = chatPollingCursor(first.createdAt, [sent], 'send')
  const displayed = mergeChatMessages([first], [sent])
  // Emulate GET's createdAt > since condition after the POST confirmation.
  const polled = [reply, sent].filter(message => Date.parse(message.createdAt) > Date.parse(cursor))
  expect(polled).toContain(reply)
  expect(mergeChatMessages(displayed, polled)).toEqual([first, reply, sent])
  expect(chatPollingCursor(cursor, polled, 'poll')).toBe(sent.createdAt)
})

test('repeated polling deduplicates and delayed responses cannot rewind the cursor', () => {
  const message = { id: 'reply', createdAt: '2026-10-10T00:00:01.000Z' }
  expect(mergeChatMessages([message], [message, message])).toEqual([message])
  const current = '2026-10-10T00:00:02.000Z'
  expect(chatPollingCursor(current, [message], 'poll')).toBe(current)
})
