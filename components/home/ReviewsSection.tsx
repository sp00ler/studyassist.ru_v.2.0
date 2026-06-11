'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { X, Send, Loader2 } from 'lucide-react'
import { Star } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
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
  {
    id: 's1',
    name: 'Анна К.',
    subtitle: 'Экономика, 3 курс · Курсовая работа',
    rating: 5,
    text: 'Дедлайн был через 2 дня, курсовая — 40 страниц. Думала, всё пропало. Написали за ночь, преподаватель поставила «отлично». Единственные, кто не кинул и сделал реально хорошо.',
    avatar: '/avatars/anna.png',
  },
  {
    id: 's2',
    name: 'Дмитрий Р.',
    subtitle: 'IT, 4 курс · ВКР',
    rating: 5,
    text: 'Диплом по IT — тема сложная, специфика серьёзная. Всё сделали на уровне, защитился на пять.',
    avatar: '/avatars/dmitriy.png',
  },
  {
    id: 's3',
    name: 'Елена С.',
    subtitle: 'Юриспруденция · Реферат',
    rating: 5,
    text: 'Ответили за 20 минут, цену назвали честно, без накруток. Реферат по праву — чисто, по теме.',
    avatar: '/avatars/elena.png',
  },
  {
    id: 's4',
    name: 'Михаил В.',
    subtitle: 'Психология · Отчёт по практике',
    rating: 5,
    text: 'Отчёт по практике — сложная тема, не знал с чего начать. Оформили грамотно, правки сделали быстро.',
    avatar: '/avatars/mikhail.png',
  },
  {
    id: 's5',
    name: 'Ольга Т.',
    subtitle: 'Медицина, 5 курс · Курсовая',
    rating: 5,
    text: 'Медицина — специфика серьёзная. Справились. Поставили пять.',
    avatar: '/avatars/olga.png',
  },
  {
    id: 's6',
    name: 'Артём Л.',
    subtitle: 'МГТУ · Лабораторная',
    rating: 5,
    text: 'Лабораторная по физике — всё с нуля, с правилами оформления. Сделали чисто, защитил без вопросов.',
    avatar: null,
  },
  {
    id: 's7',
    name: 'Полина М.',
    subtitle: 'НИУ ВШЭ · Контрольная',
    rating: 5,
    text: 'Срочно нужна была контрольная по статистике. Написали за 4 часа. Всё правильно, сдала.',
    avatar: null,
  },
]

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          aria-label={onChange ? `Оценка ${star} из 5` : undefined}
          aria-pressed={onChange ? star === rating : undefined}
          className={`transition-all duration-150 ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <Star
            className="w-5 h-5"
            aria-hidden="true"
            fill={star <= (hovered || rating) ? '#C5FF45' : 'none'}
            stroke={star <= (hovered || rating) ? '#C5FF45' : 'rgba(255,255,255,.2)'}
          />
        </button>
      ))}
    </div>
  )
}

function ReviewChip({ review, onClick }: { review: Review; onClick: () => void }) {
  const initial = review.name.charAt(0)
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#141428] border border-white/[.06] hover:border-[#C5FF45]/30 hover:bg-[#1a1a32] transition-all duration-200 flex-shrink-0 cursor-pointer"
    >
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#7C3AED] to-[#C5FF45]">
        {review.avatar ? (
          <Image
            src={review.avatar}
            alt={review.name}
            width={28}
            height={28}
            className="w-full h-full object-cover"
            unoptimized={review.avatar.startsWith('https://randomuser.me')}
          />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-[11px] font-bold text-[#07070E]">
            {initial}
          </span>
        )}
      </div>
      <span className="text-[13px] font-medium text-[#F0F0EC] whitespace-nowrap">{review.name}</span>
      <span className="text-[#C5FF45] text-[11px] leading-none tracking-tight">
        {'★'.repeat(review.rating)}
      </span>
    </button>
  )
}

function MarqueeRow({
  reviews,
  direction,
  onChipClick,
}: {
  reviews: Review[]
  direction: 'left' | 'right'
  onChipClick: (r: Review) => void
}) {
  const doubled = [...reviews, ...reviews]
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className={`flex gap-3 ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'} hover:[animation-play-state:paused]`}
      >
        {doubled.map((rev, i) => (
          <ReviewChip key={`${rev.id}-${i}`} review={rev} onClick={() => onChipClick(rev)} />
        ))}
      </div>
    </div>
  )
}

export function ReviewsSection() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>(STATIC_REVIEWS)
  const [activeReview, setActiveReview] = useState<Review | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((data) => {
        if (!data.reviews?.length) return
        const dbReviews: Review[] = data.reviews.map((r: {
          id: string
          name: string
          city?: string | null
          university?: string | null
          rating: number
          text: string
          avatar?: string | null
        }) => ({
          id: r.id,
          name: r.name,
          subtitle: [r.university, r.city].filter(Boolean).join(' · ') || 'Студент',
          rating: r.rating,
          text: r.text,
          avatar: r.avatar,
        }))
        const staticIds = new Set(STATIC_REVIEWS.map((r) => r.id))
        const merged = [...STATIC_REVIEWS, ...dbReviews.filter((r) => !staticIds.has(r.id))]
        setReviews(merged)
      })
      .catch(() => {})
  }, [])

  const row1 = reviews.filter((_, i) => i % 2 === 0)
  const row2 = reviews.filter((_, i) => i % 2 === 1)

  const handleSubmitReview = async () => {
    if (!reviewText.trim() || reviewText.length < 10) {
      toast({ title: 'Ошибка', description: 'Отзыв должен содержать минимум 10 символов', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, text: reviewText }),
      })
      if (res.ok) {
        setSubmitted(true)
        toast({ title: 'Спасибо!', description: 'Отзыв отправлен на модерацию', variant: 'default' })
      } else {
        const d = await res.json()
        throw new Error(d.error)
      }
    } catch (err: unknown) {
      toast({ title: 'Ошибка', description: (err as Error).message || 'Не удалось отправить отзыв', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div id="reviews" className="bg-[#0E0E1C] border-t border-b border-white/[.06]">
      <section className="py-[120px]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-tag">// Отзывы</span>
            <h2 className="section-heading">Говорят студенты</h2>
            <p className="text-[#6A6A88] text-sm mt-2">Нажмите на любой отзыв, чтобы прочитать полностью</p>
          </motion.div>
        </div>

        {/* Marquee cloud */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col gap-3 mb-16"
        >
          <MarqueeRow reviews={row1} direction="left" onChipClick={setActiveReview} />
          {row2.length > 0 && (
            <MarqueeRow reviews={row2} direction="right" onChipClick={setActiveReview} />
          )}
        </motion.div>

        {/* Review form */}
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto"
          >
            <div className="bg-[#141428] border border-white/[.06] rounded-3xl p-8">
              <h3 className="font-unbounded text-[18px] font-bold text-[#F0F0EC] mb-6 text-center tracking-[-0.4px]">
                Оставить отзыв
              </h3>

              {!session ? (
                <p className="text-[#6A6A88] text-sm text-center">
                  Чтобы оставить отзыв, необходимо{' '}
                  <a href="/auth/login" className="text-[#C5FF45] hover:underline">войти</a>
                </p>
              ) : submitted ? (
                <p role="status" aria-live="polite" className="text-[#C5FF45] text-sm text-center">
                  ✓ Отзыв отправлен на модерацию. Спасибо!
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p id="rating-label" className="text-[#6A6A88] text-sm block mb-2">Ваша оценка</p>
                    <div role="group" aria-labelledby="rating-label">
                      <StarRating rating={reviewRating} onChange={setReviewRating} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="review-text" className="text-[#6A6A88] text-sm block mb-2">Текст отзыва</label>
                    <Textarea
                      id="review-text"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Расскажите о своём опыте..."
                      rows={4}
                    />
                  </div>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#C5FF45] text-[#07070E] font-bold font-unbounded text-[13px] hover:bg-[#D4FF60] hover:shadow-[0_8px_28px_rgba(197,255,69,.28)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />}
                    Отправить отзыв
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Review detail modal */}
      <AnimatePresence>
        {activeReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setActiveReview(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[#141428] border border-white/[.08] rounded-3xl p-8 max-w-md w-full shadow-[0_32px_80px_rgba(0,0,0,.6)]"
            >
              <button
                onClick={() => setActiveReview(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/[.06] hover:bg-white/[.10] transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4 text-[#6A6A88]" />
              </button>

              <div className="text-[#C5FF45] text-[18px] tracking-[3px] mb-4">
                {'★'.repeat(activeReview.rating)}{'☆'.repeat(5 - activeReview.rating)}
              </div>
              <p className="text-[15px] leading-[1.75] text-[#F0F0EC] italic mb-6">
                &quot;{activeReview.text}&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#7C3AED] to-[#C5FF45]">
                  {activeReview.avatar ? (
                    <Image
                      src={activeReview.avatar}
                      alt={activeReview.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized={activeReview.avatar.startsWith('https://randomuser.me')}
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-[14px] font-bold text-[#07070E]">
                      {activeReview.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-[14px] text-[#F0F0EC]">{activeReview.name}</div>
                  <div className="text-[12px] text-[#6A6A88]">{activeReview.subtitle}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
