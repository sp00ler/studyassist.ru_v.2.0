'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Star, Send, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

// Аватарки студентов должны быть размещены в папке /public/avatars/
// Файлы: anna.png, dmitriy.png, elena.png, mikhail.png, olga.png

const STATIC_REVIEWS = [
  {
    id: '1',
    name: 'Анна М.',
    role: 'Экономика',
    rating: 5,
    text: 'Попросила помочь разобраться с темой по микроэкономике — объяснили всё максимально понятно, с примерами. Теперь сдаю экзамены намного увереннее. Спасибо!',
    date: '12.11.2024',
    avatar: '/avatars/anna.png',
    color: '#6C3EF4',
  },
  {
    id: '2',
    name: 'Дмитрий К.',
    role: 'Студент, Юриспруденция',
    rating: 5,
    text: 'Брал консультации по гражданскому праву перед сессией. Специалист объяснил сложные моменты простым языком, подобрал нужные нормативные акты. Очень доволен.',
    date: '03.10.2024',
    avatar: '/avatars/dmitriy.png',
    color: '#3B82F6',
  },
  {
    id: '3',
    name: 'Елена С.',
    role: 'Магистрант, Психология',
    rating: 5,
    text: 'Помогли подобрать актуальную литературу и источники для исследования по психологии. Сэкономила массу времени. Структурировали список и дали рекомендации. Отлично!',
    date: '28.06.2024',
    avatar: '/avatars/elena.png',
    color: '#8B5CF6',
  },
  {
    id: '4',
    name: 'Михаил П.',
    role: 'Студент, IT',
    rating: 5,
    text: 'Брал консультации по алгоритмам и структурам данных. Разобрали несколько сложных задач пошагово. Цена адекватная, отвечают быстро. Рекомендую всем айтишникам.',
    date: '19.09.2024',
    avatar: '/avatars/mikhail.png',
    color: '#06B6D4',
  },
  {
    id: '5',
    name: 'Ольга В.',
    role: 'Студентка, Медицина',
    rating: 5,
    text: 'Готовилась к экзамену по фармакологии — помогли систематизировать весь материал, разобрали сложные препараты по группам. Сдала на отлично, спасибо!',
    date: '07.11.2024',
    avatar: '/avatars/olga.png',
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
            Более 1000 студентов уже получили наши консультации и улучшили свои результаты
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
                    className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ border: `1px solid ${review.color}40` }}
                  >
                    <Image
                      src={review.avatar}
                      alt={review.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{review.name}</p>
                    <p className="text-white/40 text-xs">{review.role}</p>
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
