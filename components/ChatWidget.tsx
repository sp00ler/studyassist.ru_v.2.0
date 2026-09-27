'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, ChevronDown } from 'lucide-react'

interface ChatMsg {
  id: string
  text: string
  fromAdmin: boolean
  createdAt: string
}

type View = 'bubble' | 'form' | 'chat'

const SESSION_KEY = 'sa_chat_session'

export function ChatWidget() {
  const [view, setView] = useState<View>('bubble')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [firstMsg, setFirstMsg] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [unread, setUnread] = useState(0)
  const sinceRef = useRef<string>(new Date(0).toISOString())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Восстанавливаем сессию из localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return
      const { id } = JSON.parse(raw)
      if (!id) return
      setSessionId(id)
      // Подгружаем все сообщения сессии
      fetch(`/api/chat/${id}/messages`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.messages?.length > 0) {
            setMessages(data.messages)
            sinceRef.current = data.messages[data.messages.length - 1].createdAt
          }
        })
        .catch(() => {})
    } catch {}
  }, [])

  // Скролл в конец при новых сообщениях
  useEffect(() => {
    if (view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, view])

  // Фокус на поле ввода при открытии чата
  useEffect(() => {
    if (view === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [view])

  // Поллинг новых сообщений
  const poll = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(
        `/api/chat/${sessionId}/messages?since=${encodeURIComponent(sinceRef.current)}`
      )
      const data = await res.json()
      if (data.messages?.length > 0) {
        sinceRef.current = data.messages[data.messages.length - 1].createdAt
        setMessages(prev => [...prev, ...data.messages])
        // Если чат свёрнут — показываем счётчик непрочитанных
        if (view !== 'chat') {
          setUnread(u => u + data.messages.filter((m: ChatMsg) => m.fromAdmin).length)
        }
      }
    } catch {}
  }, [sessionId, view])

  useEffect(() => {
    if (!sessionId) return
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [sessionId, poll])

  const openChat = () => {
    setUnread(0)
    setView(sessionId ? 'chat' : 'form')
  }

  // Отправка первого сообщения — создаём сессию
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstMsg.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim(), message: firstMsg.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Ошибка'); return }
      const { sessionId: id, message } = data
      setSessionId(id)
      setMessages([message])
      sinceRef.current = message.createdAt
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id }))
      setView('chat')
    } catch {
      setError('Ошибка подключения. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  // Отправка последующих сообщений
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text || !sessionId) return
    setChatInput('')
    setSending(true)
    try {
      const res = await fetch(`/api/chat/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (res.ok && data.message) {
        setMessages(prev => [...prev, data.message])
        sinceRef.current = data.message.createdAt
      }
    } catch {}
    setSending(false)
    inputRef.current?.focus()
  }

  // ── Пузырь ───────────────────────────────────────────────────────────────────
  if (view === 'bubble') {
    return (
      <button
        onClick={openChat}
        className="btn-95-primary pixel-shadow fixed bottom-6 right-6 z-40 h-14 pl-4 pr-5 inline-flex items-center gap-2 whitespace-nowrap"
        aria-label="Открыть чат поддержки"
      >
        <MessageCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
        <span className="font-sans text-[13px] font-bold">Поддержка</span>
        {unread > 0 && (
          <span className="bevel-out absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-danger text-white text-xs flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    )
  }

  // ── Окно чата ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="window pixel-shadow fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col overflow-hidden"
      style={{ width: 'min(360px, calc(100vw - 1.5rem))', maxHeight: '85dvh' }}
    >
      {/* Шапка */}
      <div className="titlebar flex-shrink-0">
        <span className="flex items-center gap-2 truncate">
          <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Онлайн-поддержка</span>
        </span>
        <button
          onClick={() => setView('bubble')}
          className="titlebar-btn"
          aria-label="Свернуть"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
      <p className="bg-chrome text-ink-soft text-[11px] px-3 py-1 border-b border-chrome-shadow flex-shrink-0">
        Обычно отвечаем за 5–15 минут
      </p>

      {/* Форма первого обращения */}
      {view === 'form' && (
        <form
          onSubmit={handleStartChat}
          className="bg-paper flex flex-col gap-3 p-4 overflow-y-auto flex-1"
        >
          <p className="text-ink-soft text-xs leading-relaxed">
            Заполните форму — мы ответим здесь и свяжемся с вами удобным способом.
          </p>

          <div className="space-y-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ваше имя (необязательно)"
              className="field-95 w-full px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
            <input
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder="Email, телефон, Telegram, ВКонтакте..."
              className="field-95 w-full px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
            <textarea
              value={firstMsg}
              onChange={e => setFirstMsg(e.target.value)}
              placeholder="Ваш вопрос..."
              required
              rows={4}
              className="field-95 w-full px-3 py-2.5 text-sm resize-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </div>

          {error && (
            <p className="text-danger text-xs bg-danger/10 border border-danger px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !firstMsg.trim()}
            className="btn-95-primary py-2.5 text-sm flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Начать чат
          </button>

          <p className="text-ink-soft/70 text-xs text-center">
            Нажимая «Начать чат», вы соглашаетесь с политикой конфиденциальности
          </p>
        </form>
      )}

      {/* Чат */}
      {view === 'chat' && (
        <>
          {/* Сообщения */}
          <div
            className="bg-paper flex-1 overflow-y-auto p-4 space-y-2.5"
            style={{ minHeight: 0, maxHeight: 380 }}
          >
            {/* Приветственное сообщение */}
            <div className="flex justify-start">
              <div className="bevel-out max-w-[85%] bg-chrome px-3.5 py-2.5 text-sm text-ink">
                Здравствуйте! Мы готовы ответить на ваши вопросы. Чем можем помочь?
              </div>
            </div>

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.fromAdmin ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`bevel-out max-w-[85%] px-3.5 py-2.5 text-sm break-words ${
                    msg.fromAdmin
                      ? 'bg-chrome text-ink'
                      : 'bg-title text-white font-medium'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Индикатор ожидания ответа */}
            {messages.length > 0 && messages[messages.length - 1].fromAdmin === false && (
              <div className="flex justify-start">
                <div className="bevel-out bg-chrome px-4 py-2.5 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-ink-soft animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-ink-soft animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-ink-soft animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <form
            onSubmit={handleSend}
            className="bg-chrome border-t border-chrome-shadow flex gap-2 p-3 flex-shrink-0"
          >
            <input
              ref={inputRef}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Написать сообщение..."
              className="field-95 flex-1 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e as unknown as React.FormEvent)
                }
              }}
            />
            <button
              type="submit"
              disabled={sending || !chatInput.trim()}
              className="btn-95-primary w-10 flex items-center justify-center flex-shrink-0"
              aria-label="Отправить"
            >
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </form>
        </>
      )}
    </div>
  )
}
