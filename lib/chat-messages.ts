interface ChatMessageRef {
  id: string
  createdAt: string
}

export function mergeChatMessages<T extends ChatMessageRef>(existing: T[], incoming: T[]): T[] {
  const messages = new Map(existing.map(message => [message.id, message]))
  for (const message of incoming) messages.set(message.id, message)
  return Array.from(messages.values()).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
}

export function chatPollingCursor(current: string, incoming: ChatMessageRef[], source: 'poll' | 'send'): string {
  // A send confirmation does not contain operator replies preceding it.
  if (source === 'send') return current
  return incoming.reduce((latest, message) =>
    Date.parse(message.createdAt) > Date.parse(latest) ? message.createdAt : latest, current)
}
