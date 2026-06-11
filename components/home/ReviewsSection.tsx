'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { X, Send, Loader2, Star } from 'lucide-react'
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

// ── Force layout (seeded, runs once) ────────────────────────────────────────
const W = 900, H = 500
const CX = 450, CY = 250

function seededRand(seed: number) {
  let s = seed >>> 0
  return () => {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0
    return s / 0x100000000
  }
}

function computeLayout(count: number): { x: number; y: number }[] {
  if (!count) return []
  const rand = seededRand(count * 17 + 31)
  // Scatter nodes in an ellipse with noise
  const nodes = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI + rand() * 0.8
    const r = 110 + rand() * 200
    return {
      x: CX + r * Math.cos(angle),
      y: CY + r * Math.sin(angle) * 0.72,
    }
  })
  // Repulsion iterations for organic spread
  for (let iter = 0; iter < 320; iter++) {
    const alpha = Math.pow(1 - iter / 320, 1.5)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const d2 = dx * dx + dy * dy
        const minD = 82
        if (d2 < minD * minD) {
          const d = Math.sqrt(d2) || 0.01
          const f = ((minD - d) / d) * 0.45 * alpha
          nodes[i].x -= dx * f; nodes[i].y -= dy * f
          nodes[j].x += dx * f; nodes[j].y += dy * f
        }
      }
      // Pull toward target orbit
      const dx = nodes[i].x - CX, dy = nodes[i].y - CY
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      const target = 130 + (i / count) * 150
      const f = (d - target) / d * 0.025 * alpha
      nodes[i].x -= dx * f; nodes[i].y -= dy * f
      // Clamp to viewport
      nodes[i].x = Math.max(50, Math.min(W - 50, nodes[i].x))
      nodes[i].y = Math.max(50, Math.min(H - 50, nodes[i].y))
    }
  }
  return nodes.map(n => ({ x: Math.round(n.x), y: Math.round(n.y) }))
}

interface Edge { a: number; b: number; cross: boolean }

function computeEdges(positions: { x: number; y: number }[], count: number): Edge[] {
  const rand = seededRand(count * 5 + 11)
  const edges: Edge[] = positions.map((_, i) => ({ a: i, b: -1, cross: false }))
  // Cross-connect each node to its nearest neighbour (~55% chance)
  for (let i = 0; i < positions.length; i++) {
    let best = -1, bestD = Infinity
    for (let j = 0; j < positions.length; j++) {
      if (i === j) continue
      const dx = positions[j].x - positions[i].x
      const dy = positions[j].y - positions[i].y
      const d = dx * dx + dy * dy
      if (d < bestD) { bestD = d; best = j }
    }
    if (best !== -1 && rand() < 0.55 && Math.sqrt(bestD) < 210) {
      const dup = edges.some(e => e.cross && ((e.a === i && e.b === best) || (e.a === best && e.b === i)))
      if (!dup) edges.push({ a: i, b: best, cross: true })
    }
  }
  return edges
}

// ── Node size varies slightly ─────────────────────────────────────────────
function nodeR(i: number): number {
  const sizes = [26, 28, 24, 30, 26, 28, 24, 26, 30, 26, 28, 24]
  return sizes[i % sizes.length]
}

// ── ReviewGraph component ─────────────────────────────────────────────────
function ReviewGraph({ reviews, onNodeClick }: { reviews: Review[]; onNodeClick: (r: Review) => void }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const positions = useMemo(() => computeLayout(reviews.length), [reviews.length])
  const edges = useMemo(() => computeEdges(positions, reviews.length), [positions, reviews.length])

  // Which node indices are connected to the hovered node?
  const hovIdx = hoveredId ? reviews.findIndex(r => r.id === hoveredId) : -1
  const activeEdgeSet = useMemo(() => {
    if (hovIdx < 0) return new Set<string>()
    return new Set(
      edges
        .filter(e => e.a === hovIdx || e.b === hovIdx)
        .map(e => `${e.a}-${e.b}`)
    )
  }, [hovIdx, edges])

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 380, maxHeight: 520 }} className="select-none">
        <defs>
          <filter id="ng-glow" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="ng-glow-lg" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Avatar clip paths */}
          {reviews.map((rev, i) => {
            const pos = positions[i]
            if (!pos || !rev.avatar) return null
            const r = nodeR(i)
            return (
              <clipPath key={`clip-${rev.id}`} id={`clip-rv-${rev.id}`}>
                <circle cx={pos.x} cy={pos.y} r={r - 1.5} />
              </clipPath>
            )
          })}
          <radialGradient id="ng-center-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C5FF45" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#C5FF45" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient glow behind center */}
        <circle cx={CX} cy={CY} r={200} fill="url(#ng-center-bg)" />

        {/* ── Edges ── */}
        {edges.map((e, i) => {
          const ax = e.b === -1 ? CX : positions[e.b]?.x ?? CX
          const ay = e.b === -1 ? CY : positions[e.b]?.y ?? CY
          const bx = positions[e.a]?.x ?? CX
          const by = positions[e.a]?.y ?? CY
          const key = `${e.a}-${e.b}`
          const isLit = activeEdgeSet.has(key) || (hovIdx >= 0 && e.b === hovIdx)
          const dimmed = hoveredId !== null && !isLit
          const opacity = dimmed ? 0.07 : isLit ? 1 : e.cross ? 0.18 : 0.35

          return (
            <motion.line
              key={`e-${i}`}
              x1={ax} y1={ay} x2={bx} y2={by}
              stroke={isLit ? '#C5FF45' : e.cross ? 'rgba(197,255,69,0.55)' : 'rgba(197,255,69,0.7)'}
              strokeWidth={isLit ? 1.8 : e.cross ? 0.8 : 1.1}
              filter={isLit ? 'url(#ng-glow)' : undefined}
              animate={{ opacity }}
              transition={{ duration: 0.2 }}
            />
          )
        })}

        {/* ── Signal particles (center connections only) ── */}
        {positions.map((pos, i) => {
          const dur = 1.6 + (i % 6) * 0.38
          const begin = `${(i * 0.55) % 2.8}s`
          return (
            <circle key={`p-${i}`} r={2.2} fill="#C5FF45" filter="url(#ng-glow)">
              <animateMotion
                dur={`${dur}s`} begin={begin} repeatCount="indefinite"
                path={`M${pos.x},${pos.y} L${CX},${CY}`}
              />
              <animate
                attributeName="opacity" values="0;0.9;0.9;0"
                keyTimes="0;0.07;0.88;1"
                dur={`${dur}s`} begin={begin} repeatCount="indefinite"
              />
            </circle>
          )
        })}

        {/* ── Center node ── */}
        <motion.g
          style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: 'fill-box' }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx={CX} cy={CY} r={88} fill="rgba(197,255,69,0.04)" />
          <motion.circle cx={CX} cy={CY} r={60}
            fill="rgba(197,255,69,0.06)" stroke="rgba(197,255,69,0.14)" strokeWidth="1"
            style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: 'fill-box' }}
            animate={{ scale: [1, 1.14, 1] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
          />
          <circle cx={CX} cy={CY} r={40}
            fill="#0E0E1C" stroke="#C5FF45" strokeWidth="2.5"
            filter="url(#ng-glow)"
          />
          <text x={CX} y={CY - 4} textAnchor="middle" fill="#C5FF45"
            fontSize="20" fontWeight="700" filter="url(#ng-glow)">★</text>
          <text x={CX} y={CY + 14} textAnchor="middle" fill="#E8E8E0" fontSize="11" fontWeight="600">Отзывы</text>
        </motion.g>

        {/* ── Review nodes ── */}
        {reviews.map((rev, i) => {
          const pos = positions[i]
          if (!pos) return null
          const r = nodeR(i)
          const isHov = hoveredId === rev.id
          const isDim = hoveredId !== null && !isHov
          const initial = rev.name.charAt(0)
          const label = rev.name.length > 9 ? rev.name.slice(0, 8) + '…' : rev.name

          return (
            <motion.g
              key={rev.id}
              style={{ transformOrigin: `${pos.x}px ${pos.y}px`, transformBox: 'fill-box', cursor: 'pointer' }}
              animate={{
                scale: isHov ? 1.32 : 1,
                opacity: isDim ? 0.22 : 1,
                y: isHov ? 0 : [0, -(3 + i % 4 * 1.5), 0],
              }}
              transition={{
                scale: { duration: 0.15, ease: 'easeOut' },
                opacity: { duration: 0.18 },
                y: { duration: 3.0 + i * 0.44, repeat: Infinity, ease: 'easeInOut', delay: (i * 0.39) % 3.1 },
              }}
              onHoverStart={() => setHoveredId(rev.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => onNodeClick(rev)}
            >
              {/* Hover rings */}
              <AnimatePresence>
                {isHov && (
                  <>
                    <motion.circle cx={pos.x} cy={pos.y} r={r + 22}
                      fill="rgba(197,255,69,0.05)"
                      style={{ transformOrigin: `${pos.x}px ${pos.y}px`, transformBox: 'fill-box' }}
                      initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.16 }}
                    />
                    <motion.circle cx={pos.x} cy={pos.y} r={r + 12}
                      fill="rgba(197,255,69,0.10)"
                      style={{ transformOrigin: `${pos.x}px ${pos.y}px`, transformBox: 'fill-box' }}
                      initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.16 }}
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Body */}
              <circle
                cx={pos.x} cy={pos.y} r={r}
                fill={isHov ? 'rgba(197,255,69,0.18)' : '#0E0E1C'}
                stroke={isHov ? '#C5FF45' : 'rgba(197,255,69,0.45)'}
                strokeWidth={isHov ? 2.5 : 1.5}
                filter={isHov ? 'url(#ng-glow)' : undefined}
              />

              {/* Avatar or initial */}
              {rev.avatar ? (
                <image
                  href={rev.avatar}
                  x={pos.x - r + 1.5} y={pos.y - r + 1.5}
                  width={(r - 1.5) * 2} height={(r - 1.5) * 2}
                  clipPath={`url(#clip-rv-${rev.id})`}
                  preserveAspectRatio="xMidYMid slice"
                  style={{ opacity: isDim ? 0.4 : 1 }}
                />
              ) : (
                <text x={pos.x} y={pos.y + 5} textAnchor="middle"
                  fill={isHov ? '#0E0E1C' : '#C5FF45'}
                  fontSize={r > 27 ? '14' : '12'} fontWeight="700">
                  {initial}
                </text>
              )}

              {/* Label */}
              <text x={pos.x} y={pos.y + r + 14} textAnchor="middle"
                fill={isHov ? '#C5FF45' : '#6A6A88'} fontSize="10">
                {label}
              </text>

              {/* Stars */}
              <text x={pos.x} y={pos.y + r + 25} textAnchor="middle"
                fill="#C5FF45" fontSize="8.5" opacity={isHov ? 1 : 0.5}>
                {'★'.repeat(rev.rating)}
              </text>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}

// ── StarRating ────────────────────────────────────────────────────────────
function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`transition-all duration-150 ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <Star className="w-5 h-5"
            fill={star <= (hovered || rating) ? '#C5FF45' : 'none'}
            stroke={star <= (hovered || rating) ? '#C5FF45' : 'rgba(255,255,255,.2)'}
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
  const [reviews, setReviews] = useState<Review[]>(STATIC_REVIEWS)
  const [activeReview, setActiveReview] = useState<Review | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(data => {
        if (!data.reviews?.length) return
        const db: Review[] = data.reviews.map((r: {
          id: string; name: string; city?: string | null
          university?: string | null; rating: number; text: string; avatar?: string | null
        }) => ({
          id: r.id, name: r.name,
          subtitle: [r.university, r.city].filter(Boolean).join(' · ') || 'Студент',
          rating: r.rating, text: r.text, avatar: r.avatar,
        }))
        const ids = new Set(STATIC_REVIEWS.map(r => r.id))
        setReviews([...STATIC_REVIEWS, ...db.filter(r => !ids.has(r.id))])
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (reviewText.trim().length < 10) {
      toast({ title: 'Ошибка', description: 'Минимум 10 символов', variant: 'destructive' })
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
        toast({ title: 'Спасибо!', description: 'Отзыв отправлен на модерацию' })
      } else {
        throw new Error((await res.json()).error)
      }
    } catch (err: unknown) {
      toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div id="reviews" className="bg-[#0E0E1C] border-t border-b border-white/[.06]">
      <section className="py-[120px]">

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <span className="section-tag">// Отзывы</span>
            <h2 className="section-heading">Говорят студенты</h2>
            <p className="text-[#6A6A88] text-sm mt-2">Наведите на узел — прочитайте отзыв</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.1 }}
          className="max-w-[1200px] mx-auto px-2 mb-16"
        >
          <ReviewGraph reviews={reviews} onNodeClick={setActiveReview} />
        </motion.div>

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5 }} className="max-w-xl mx-auto">
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
                <p role="status" className="text-[#C5FF45] text-sm text-center">
                  ✓ Отзыв отправлен на модерацию. Спасибо!
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p id="rl" className="text-[#6A6A88] text-sm mb-2">Ваша оценка</p>
                    <div role="group" aria-labelledby="rl"><StarRating rating={reviewRating} onChange={setReviewRating} /></div>
                  </div>
                  <div>
                    <label htmlFor="rv-text" className="text-[#6A6A88] text-sm block mb-2">Текст отзыва</label>
                    <Textarea id="rv-text" value={reviewText} onChange={e => setReviewText(e.target.value)}
                      placeholder="Расскажите о своём опыте..." rows={4} />
                  </div>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#C5FF45] text-[#07070E] font-bold font-unbounded text-[13px] hover:bg-[#D4FF60] hover:shadow-[0_8px_28px_rgba(197,255,69,.28)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Отправить отзыв
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {activeReview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setActiveReview(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }} transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="relative bg-[#141428] border border-[#C5FF45]/20 rounded-3xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(197,255,69,0.1),0_32px_80px_rgba(0,0,0,.65)]">
              <button onClick={() => setActiveReview(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/[.06] hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-[#6A6A88]" />
              </button>
              <div className="text-[#C5FF45] text-[20px] tracking-[4px] mb-4"
                style={{ filter: 'drop-shadow(0 0 6px rgba(197,255,69,.6))' }}>
                {'★'.repeat(activeReview.rating)}{'☆'.repeat(5 - activeReview.rating)}
              </div>
              <p className="text-[15px] leading-[1.78] text-[#F0F0EC] italic mb-6">
                &quot;{activeReview.text}&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#7C3AED] to-[#C5FF45]">
                  {activeReview.avatar ? (
                    <Image src={activeReview.avatar} alt={activeReview.name} width={40} height={40}
                      className="w-full h-full object-cover"
                      unoptimized={activeReview.avatar.startsWith('https://randomuser.me')} />
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
