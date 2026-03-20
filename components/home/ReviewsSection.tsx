'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Star, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

const STATIC_REVIEWS = [
  {
    id: '1',
    name: 'Анна К.',
    university: 'МГУ',
    city: 'Москва',
    rating: 5,
    text: 'Сдала курсовую по экономике на отлично! Всё чётко по методичке, никаких правок не потребовалось. Спасибо огромное, буду обращаться ещё.',
    date: '12.11.2024',
    initials: 'АК',
    color: '#6C3EF4',
  },
  {
    id: '2',
    name: 'Дмитрий Р.',
    university: 'СПбГУ',
    city: 'Санкт-Петербург',
    rating: 5,
    text: 'Заказывал лабораторные по программированию несколько раз. Каждый раз всё сдаётся с первого раза. Удобно что можно оплатить после того как убедился в качестве.',
    date: '03.10.2024',
    initials: 'ДР',
    color: '#3B82F6',
  },
  {
    id: '3',
    name: 'Мария Т.',
    university: 'ТГУ',
    city: 'Тольятти',
    rating: 5,
    text: 'Диплом помогли доработать в последний момент, буквально за 3 дня. Думала уже паника, но ребята взялись и всё сделали как надо. Защитилась на 4.',
    date: '28.06.2024',
    initials: 'МТ',
    color: '#8B5CF6',
  },
  {
    id: '4',
    name: 'Алексей М.',
    university: 'УрФУ',
    city: 'Екатеринбург',
    rating: 5,
    text: 'Реферат за ночь, да ещё и уникальность 85%. Цена адекватная, связь быстрая. Всё нормально.',
    date: '19.09.2024',
    initials: 'АМ',
    color: '#06B6D4',
  },
  {
    id: '5',
    name: 'Екатерина Н.',
    university: 'КФУ',
    city: 'Казань',
    rating: 5,
    text: 'Заказывала презентацию с докладом. Слайды сделали красиво, доклад логичный. Преподаватель похвалил оформление.',
    date: '07.11.2024',
    initials: 'ЕН',
    color: '#F59E0B',
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
            fill={star <= (hovered || rating) ? '#F59E0B' : 'none'}
            stroke={star <= (hovered || rating) ? '#F59E0B' : '#ffffff30'}
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
    <section id="reviews" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F0F1A] via-[#1A1A2E]/30 to-[#0F0F1A]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Отзывы{' '}
            <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              студентов
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Более 1000 студентов уже воспользовались нашей помощью
          </p>
        </motion.div>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 list-none">
          {STATIC_REVIEWS.map((review, index) => (
            <motion.li
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: `${review.color}30`, border: `1px solid ${review.color}40` }}
                    aria-hidden="true"
                  >
                    {review.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{review.name}</p>
                    <p className="text-white/40 text-xs">{review.university}, {review.city}</p>
                  </div>
                </div>

                <div aria-label={`Оценка ${review.rating} из 5`}>
                  <StarRating rating={review.rating} />
                </div>

                <p className="text-white/70 text-sm leading-relaxed mt-3 mb-4">
                  &quot;{review.text}&quot;
                </p>

                <p className="text-white/30 text-xs">{review.date}</p>
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
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Оставить отзыв</h3>

            {!session ? (
              <p className="text-white/50 text-sm text-center">
                Чтобы оставить отзыв, необходимо{' '}
                <a href="/auth/login" className="text-[#6C3EF4] hover:underline">войти</a>
              </p>
            ) : submitted ? (
              <p role="status" aria-live="polite" className="text-emerald-400 text-sm text-center">
                ✓ Отзыв отправлен на модерацию. Спасибо!
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p id="rating-label" className="text-white/70 text-sm block mb-2">Ваша оценка</p>
                  <div role="group" aria-labelledby="rating-label">
                    <StarRating rating={reviewRating} onChange={setReviewRating} />
                  </div>
                </div>
                <div>
                  <label htmlFor="review-text" className="text-white/70 text-sm block mb-2">Текст отзыва</label>
                  <Textarea
                    id="review-text"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Расскажите о своём опыте..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="w-full gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Отправить отзыв
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
