'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Star, Send, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

const STATIC_REVIEWS = [
  {
    id: '1',
    name: 'Алина К.',
    role: 'Экономика, 3 курс · Курсовая работа',
    rating: 5,
    text: 'Дедлайн был через 2 дня, курсовая — 40 страниц. Думала, всё пропало. Написали за ночь, преподаватель поставила «отлично». Единственные, кто не кинул и сделал реально хорошо.',
    initial: 'А',
    wide: true,
  },
  {
    id: '2',
    name: 'Максим Р.',
    role: 'IT, 4 курс · ВКР',
    rating: 5,
    text: 'Диплом по IT — тема сложная, специфика серьёзная. Всё сделали на уровне, защитился на пять.',
    initial: 'М',
    wide: false,
  },
  {
    id: '3',
    name: 'Дарья С.',
    role: 'Юриспруденция · Реферат',
    rating: 5,
    text: 'Ответили за 20 минут, цену назвали честно, без накруток. Реферат по праву — чисто, по теме.',
    initial: 'Д',
    wide: false,
  },
  {
    id: '4',
    name: 'Светлана В.',
    role: 'Психология · Отчёт по практике',
    rating: 5,
    text: 'Отчёт по практике — сложная тема, не знала с чего начать. Оформили грамотно, правки сделали быстро.',
    initial: 'С',
    wide: false,
  },
  {
    id: '5',
    name: 'Игорь Т.',
    role: 'Медицина, 5 курс · Курсовая',
    rating: 5,
    text: 'Медицина — специфика серьёзная. Справились. Поставили пять.',
    initial: 'И',
    wide: false,
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

export function ReviewsSection() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
      <section className="py-[120px] max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-tag">// Отзывы</span>
          <h2 className="section-heading">Говорят студенты</h2>
        </motion.div>

        {/* Masonry grid */}
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16 list-none">
          {STATIC_REVIEWS.map((rev, i) => (
            <motion.li
              key={rev.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={rev.wide ? 'md:col-span-2' : ''}
            >
              <article className="bg-[#141428] border border-white/[.06] rounded-3xl p-8 hover:border-[#C5FF45]/[.18] hover:-translate-y-[3px] transition-all duration-250 h-full">
                <div className="text-[#C5FF45] text-[16px] tracking-[3px] mb-3.5">★★★★★</div>
                <p className="text-[14px] leading-[1.75] text-[#F0F0EC] italic mb-5">&quot;{rev.text}&quot;</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#7C3AED] to-[#C5FF45] flex items-center justify-center font-bold text-[15px] text-[#07070E] flex-shrink-0">
                    {rev.initial}
                  </div>
                  <div>
                    <div className="font-bold text-[13px] text-[#F0F0EC]">{rev.name}</div>
                    <div className="text-[11px] text-[#6A6A88]">{rev.role}</div>
                  </div>
                </div>
              </article>
            </motion.li>
          ))}
        </ul>

        {/* Review submission form */}
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
      </section>
    </div>
  )
}
