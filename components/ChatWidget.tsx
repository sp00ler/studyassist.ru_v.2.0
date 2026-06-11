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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#C5FF45] shadow-lg shadow-[#C5FF45]/30 flex items-center justify-center hover:bg-[#D4FF60] hover:scale-105 active:scale-95 transition-all animate-pulse-ring"
        aria-label="Открыть чат поддержки"
      >
        <MessageCircle className="w-6 h-6 text-[#07070E]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    )
  }

  // ── Окно чата ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
      style={{ width: 'min(360px, calc(100vw - 1.5rem))', maxHeight: '85dvh' }}
    >
      {/* Шапка */}
      <div className="bg-[#0E0E1C] border-b border-white/[.06] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#C5FF45]/10 border border-[#C5FF45]/[.18] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#C5FF45]" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#C5FF45] rounded-full border-2 border-[#0E0E1C]" />
          </div>
          <div>
            <p className="text-[#F0F0EC] font-semibold text-sm leading-tight">Онлайн-поддержка</p>
            <p className="text-[#6A6A88] text-xs">Обычно отвечаем за 5–15 минут</p>
          </div>
        </div>
        <button
          onClick={() => setView('bubble')}
          className="text-[#6A6A88] hover:text-[#F0F0EC] transition-colors p-1"
          aria-label="Свернуть"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Форма первого обращения */}
      {view === 'form' && (
        <form
          onSubmit={handleStartChat}
          className="bg-[#0E0E1C] flex flex-col gap-3 p-4 overflow-y-auto flex-1"
        >
          <p className="text-[#6A6A88] text-xs leading-relaxed">
            Заполните форму — мы ответим здесь и свяжемся с вами удобным способом.
          </p>

          <div className="space-y-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ваше имя (необязательно)"
              className="w-full bg-white/5 border border-white/[.08] rounded-xl px-3 py-2.5 text-[#F0F0EC] text-sm placeholder-[#6A6A88] focus:outline-none focus:border-[#C5FF45]/70 transition-colors"
            />
            <input
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder="Email, телефон, Telegram, ВКонтакте..."
              className="w-full bg-white/5 border border-white/[.08] rounded-xl px-3 py-2.5 text-[#F0F0EC] text-sm placeholder-[#6A6A88] focus:outline-none focus:border-[#C5FF45]/70 transition-colors"
            />
            <textarea
              value={firstMsg}
              onChange={e => setFirstMsg(e.target.value)}
              placeholder="Ваш вопрос..."
              required
              rows={4}
              className="w-full bg-white/5 border border-white/[.08] rounded-xl px-3 py-2.5 text-[#F0F0EC] text-sm placeholder-[#6A6A88] focus:outline-none focus:border-[#C5FF45]/70 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !firstMsg.trim()}
            className="bg-[#C5FF45] hover:bg-[#D4FF60] disabled:opacity-50 disabled:cursor-not-allowed text-[#07070E] font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Начать чат
          </button>

          <p className="text-[#6A6A88]/60 text-xs text-center">
            Нажимая «Начать чат», вы соглашаетесь с политикой конфиденциальности
          </p>
        </form>
      )}

      {/* Чат */}
      {view === 'chat' && (
        <>
          {/* Сообщения */}
          <div
            className="bg-[#0E0E1C] flex-1 overflow-y-auto p-4 space-y-2.5"
            style={{ minHeight: 0, maxHeight: 380 }}
          >
            {/* Приветственное сообщение */}
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-white/8 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-white/90 border border-white/5">
                Здравствуйте! Мы готовы ответить на ваши вопросы. Чем можем помочь? 😊
              </div>
            </div>

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.fromAdmin ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm break-words ${
                    msg.fromAdmin
                      ? 'bg-white/8 text-white/90 rounded-tl-sm border border-white/5'
                      : 'bg-[#C5FF45] text-[#07070E] rounded-tr-sm font-medium'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Индикатор ожидания ответа */}
            {messages.length > 0 && messages[messages.length - 1].fromAdmin === false && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2.5 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <form
            onSubmit={handleSend}
            className="bg-[#0E0E1C] border-t border-white/[.06] flex gap-2 p-3 flex-shrink-0"
          >
            <input
              ref={inputRef}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Написать сообщение..."
              className="flex-1 bg-white/5 border border-white/[.08] rounded-xl px-3 py-2 text-[#F0F0EC] text-sm placeholder-[#6A6A88] focus:outline-none focus:border-[#C5FF45]/70 transition-colors"
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
              className="bg-[#C5FF45] hover:bg-[#D4FF60] disabled:opacity-40 disabled:cursor-not-allowed text-[#07070E] rounded-xl w-10 flex items-center justify-center flex-shrink-0 transition-colors"
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
