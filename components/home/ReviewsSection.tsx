'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Send, Loader2, Star } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface Review {
  id: string
  name: string
  subtitle: string
  rating: number
  text: string
  avatar?: string | null
}

const STATIC_REVIEWS: Review[] = [
  { id: 's1', name: 'Анна К.', subtitle: 'Экономика · Курсовая', rating: 5, text: 'Дедлайн был через 2 дня, курсовая — 40 страниц. Думала, всё пропало. Написали за ночь, преподаватель поставила «отлично». Единственные, кто не кинул и сделал реально хорошо.', avatar: '/avatars/anna.png' },
  { id: 's2', name: 'Дмитрий Р.', subtitle: 'IT, 4 курс · ВКР', rating: 5, text: 'Диплом по IT — тема сложная, специфика серьёзная. Всё сделали на уровне, защитился на пять.', avatar: '/avatars/dmitriy.png' },
  { id: 's3', name: 'Елена С.', subtitle: 'Юриспруденция · Реферат', rating: 5, text: 'Ответили за 20 минут, цену назвали честно, без накруток. Реферат по праву — чисто, по теме.', avatar: '/avatars/elena.png' },
  { id: 's4', name: 'Михаил В.', subtitle: 'Психология · Отчёт', rating: 5, text: 'Отчёт по практике — сложная тема, не знал с чего начать. Оформили грамотно, правки сделали быстро.', avatar: '/avatars/mikhail.png' },
  { id: 's5', name: 'Ольга Т.', subtitle: 'Медицина, 5 курс', rating: 5, text: 'Медицина — специфика серьёзная. Справились. Поставили пять.', avatar: '/avatars/olga.png' },
  { id: 's6', name: 'Артём Л.', subtitle: 'МГТУ · Лабораторная', rating: 5, text: 'Лабораторная по физике — всё с нуля. Сделали чисто, защитил без вопросов.', avatar: null },
  { id: 's7', name: 'Полина М.', subtitle: 'НИУ ВШЭ · Контрольная', rating: 5, text: 'Срочно нужна была контрольная по статистике. Написали за 4 часа. Всё правильно, сдала.', avatar: null },
  { id: 's8', name: 'Сергей К.', subtitle: 'УрФУ · Курсовая', rating: 5, text: 'Второй раз обращаюсь. Всегда в срок, всегда аккуратно. Больше не ищу других.', avatar: null },
  { id: 's9', name: 'Виктория Н.', subtitle: 'СПбГУ · Диплом', rating: 5, text: 'Дипломную по педагогике написали с учётом всех требований кафедры. Комиссия почти не задавала вопросов.', avatar: null },
  { id: 's10', name: 'Иван П.', subtitle: 'КФУ · Реферат', rating: 5, text: 'Быстро, грамотно, в срок. Реферат по истории написан хорошо, преподаватель не нашёл замечаний.', avatar: null },
  { id: 's11', name: 'Алина Д.', subtitle: 'РУДН · Курсовая', rating: 5, text: 'Курсовая по маркетингу — объём большой, структура сложная. Всё сделали аккуратно и по методичке.', avatar: null },
  { id: 's12', name: 'Никита Ш.', subtitle: 'ВГУ · Лабораторная', rating: 4, text: 'Лабораторная по химии. Немного затянули срок, но качество хорошее. В целом доволен.', avatar: null },
]

// ── StarRating ────────────────────────────────────────────────────────────
function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  const [hov, setHov] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHov(s)}
          onMouseLeave={() => onChange && setHov(0)}
          className={`transition-all duration-150 ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}>
          <Star className="w-5 h-5"
            fill={s <= (hov || rating) ? 'rgb(var(--title))' : 'none'}
            stroke={s <= (hov || rating) ? 'rgb(var(--title))' : 'rgb(var(--chrome-dark))'}
          />
        </button>
      ))}
    </div>
  )
}

// ── ReviewsSection ────────────────────────────────────────────────────────
export function ReviewsSection() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [reviews, setReviews]   = useState<Review[]>(STATIC_REVIEWS)
  const [selectedId, setSelectedId] = useState<string>(STATIC_REVIEWS[0].id)
  const [rating, setRating]    = useState(5)
  const [text, setText]        = useState('')
  const [submitting, setSubmit] = useState(false)
  const [submitted, setDone]   = useState(false)

  useEffect(() => {
    fetch('/api/reviews').then(r => r.json()).then(data => {
      if (!data.reviews?.length) return
      const db: Review[] = data.reviews.map((r: {
        id: string; name: string; city?: string|null
        university?: string|null; rating: number; text: string; avatar?: string|null
      }) => ({
        id: r.id, name: r.name,
        subtitle: [r.university, r.city].filter(Boolean).join(' · ') || 'Студент',
        rating: r.rating, text: r.text, avatar: r.avatar,
      }))
      const ids = new Set(STATIC_REVIEWS.map(r => r.id))
      setReviews([...STATIC_REVIEWS, ...db.filter(r => !ids.has(r.id))])
    }).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (text.trim().length < 10) {
      toast({ title: 'Ошибка', description: 'Минимум 10 символов', variant: 'destructive' }); return
    }
    setSubmit(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, text }),
      })
      if (res.ok) { setDone(true); toast({ title: 'Спасибо!', description: 'Отзыв отправлен на модерацию' }) }
      else throw new Error((await res.json()).error)
    } catch (err: unknown) {
      toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' })
    } finally { setSubmit(false) }
  }

  const selectedIndex = Math.max(0, reviews.findIndex(r => r.id === selectedId))
  const active = reviews[selectedIndex] ?? reviews[0]

  const stepContact = (dir: 1 | -1) => {
    if (!reviews.length) return
    const next = (selectedIndex + dir + reviews.length) % reviews.length
    setSelectedId(reviews[next].id)
  }

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); stepContact(1) }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); stepContact(-1) }
  }

  return (
    <div id="reviews" className="bg-desk dither py-16 sm:py-20 lg:py-24">
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-8 sm:mb-10">
          <h2 className="font-display text-[22px] sm:text-[26px] lg:text-[32px] leading-[1.35] tracking-[-0.01em] text-paper mb-3">
            Что говорят студенты
          </h2>
          <p className="text-paper text-base leading-[1.55]">Выберите контакт — прочитайте отзыв</p>
        </motion.div>

        {/* ICQ-style messenger window: contact list + conversation view */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
          className="window pixel-shadow mb-10 sm:mb-14">
          <div className="titlebar">
            <span className="truncate">ICQ — Отзывы студентов</span>
            <div className="flex gap-1 shrink-0" aria-hidden="true">
              <span className="titlebar-btn" tabIndex={-1}>_</span>
              <span className="titlebar-btn" tabIndex={-1}>□</span>
              <span className="titlebar-btn" tabIndex={-1}>×</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row bg-white">
            {/* Contact list */}
            <div className="sm:w-64 sm:shrink-0 sm:border-r sm:border-chrome-shadow bg-chrome/30 flex flex-col">
              <div className="hidden sm:block px-3 py-2 border-b border-chrome-shadow bg-chrome">
                <span className="font-display text-[10px] text-ink">Контакты</span>
              </div>
              <div role="listbox" aria-label="Контакты" onKeyDown={onListKeyDown}
                className="flex flex-row gap-1 overflow-x-auto p-2 sm:flex-col sm:gap-0.5 sm:overflow-visible sm:p-1.5">
                {reviews.map(r => {
                  const isSel = r.id === active.id
                  return (
                    <button key={r.id} type="button" role="option" aria-selected={isSel}
                      onClick={() => setSelectedId(r.id)}
                      className={`flex items-center gap-2 px-2.5 py-2 min-w-[136px] shrink-0 text-left sm:min-w-0 sm:w-full ${
                        isSel ? 'bg-title text-white' : 'text-ink hover:bg-chrome-light/60'
                      }`}>
                      <span className="w-2 h-2 bg-success shrink-0" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block font-display text-[10px] leading-tight truncate">{r.name}</span>
                        {r.subtitle && (
                          <span className={`block font-mono text-[10px] leading-tight truncate ${isSel ? 'text-white/80' : 'text-ink-soft'}`}>
                            {r.subtitle}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Conversation view */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-chrome-shadow bg-chrome/15">
                <div className="w-9 h-9 overflow-hidden shrink-0 bg-title bevel-out flex items-center justify-center">
                  {active.avatar ? (
                    <Image src={active.avatar} alt={active.name} width={36} height={36}
                      className="w-full h-full object-cover"
                      unoptimized={active.avatar.startsWith('https://randomuser.me')} />
                  ) : (
                    <span className="text-[13px] font-bold text-white">{active.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-[11px] text-ink truncate">{active.name}</div>
                  {active.subtitle && <div className="font-mono text-[11px] text-ink-soft truncate">{active.subtitle}</div>}
                </div>
              </div>

              <div className="flex-1 p-4 sm:p-6">
                <AnimatePresence mode="wait">
                  <motion.div key={active.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}>
                    <div className="text-title font-mono text-[16px] tracking-[3px] mb-3" aria-label={`Оценка: ${active.rating} из 5`}>
                      {'★'.repeat(active.rating)}{'☆'.repeat(5 - active.rating)}
                    </div>
                    <div className="bevel-in bg-paper p-4 sm:p-5 max-w-xl">
                      <p className="font-sans text-[15px] sm:text-[16px] leading-[1.6] text-ink">
                        {active.text}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-chrome-shadow bg-chrome/15">
                <button type="button" onClick={() => stepContact(-1)} className="btn-95 font-display text-[10px] px-3 py-2.5">
                  ← Пред.
                </button>
                <span className="font-mono text-[11px] text-ink-soft">{selectedIndex + 1} / {reviews.length}</span>
                <button type="button" onClick={() => stepContact(1)} className="btn-95 font-display text-[10px] px-3 py-2.5">
                  Следующий →
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notepad-style review submission window */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }} className="max-w-xl mx-auto">
          <div className="window pixel-shadow">
            <div className="titlebar">
              <span className="truncate">НОВЫЙ_ОТЗЫВ.TXT — Блокнот</span>
            </div>
            <div className="bg-paper p-6 sm:p-8">
              <h3 className="font-sans text-lg font-bold text-ink mb-6 text-center">
                Оставить отзыв
              </h3>
              {!session ? (
                <p className="text-ink-soft text-sm text-center">
                  Чтобы оставить отзыв, необходимо{' '}
                  <a href="/auth/login" className="text-title underline underline-offset-2 hover:no-underline">войти</a>
                </p>
              ) : submitted ? (
                <p role="status" className="text-success text-sm text-center font-semibold">
                  ✓ Отзыв отправлен на модерацию. Спасибо!
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p id="rl" className="text-ink-soft text-sm mb-2">Ваша оценка</p>
                    <div role="group" aria-labelledby="rl"><StarRating rating={rating} onChange={setRating} /></div>
                  </div>
                  <div>
                    <label htmlFor="rv-text" className="text-ink-soft text-sm block mb-2">Текст отзыва</label>
                    <Textarea id="rv-text" value={text} onChange={e => setText(e.target.value)}
                      placeholder="Расскажите о своём опыте..." rows={4} />
                  </div>
                  <Button type="button" onClick={handleSubmit} disabled={submitting} size="lg" className="w-full">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Отправить отзыв
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
