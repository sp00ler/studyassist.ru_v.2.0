'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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

// ── Layout ────────────────────────────────────────────────────────────────
const W = 900, H = 500, CX = 450, CY = 250

function seededRand(seed: number) {
  let s = seed >>> 0
  return () => { s = Math.imul(s, 1664525) + 1013904223 >>> 0; return s / 0x100000000 }
}

function computeLayout(count: number) {
  if (!count) return []
  const rand = seededRand(count * 17 + 31)
  const nodes = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * 2 * Math.PI + rand() * 0.8
    const r = 110 + rand() * 200
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) * 0.72 }
  })
  for (let it = 0; it < 320; it++) {
    const alpha = Math.pow(1 - it / 320, 1.5)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y
        const d2 = dx * dx + dy * dy, minD = 82
        if (d2 < minD * minD) {
          const d = Math.sqrt(d2) || 0.01, f = ((minD - d) / d) * 0.45 * alpha
          nodes[i].x -= dx * f; nodes[i].y -= dy * f
          nodes[j].x += dx * f; nodes[j].y += dy * f
        }
      }
      const dx = nodes[i].x - CX, dy = nodes[i].y - CY
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      const f = (d - (130 + (i / count) * 150)) / d * 0.025 * alpha
      nodes[i].x -= dx * f; nodes[i].y -= dy * f
      nodes[i].x = Math.max(52, Math.min(W - 52, nodes[i].x))
      nodes[i].y = Math.max(52, Math.min(H - 52, nodes[i].y))
    }
  }
  return nodes.map(n => ({ x: Math.round(n.x), y: Math.round(n.y) }))
}

interface Edge { a: number; b: number; cross: boolean }

function computeEdges(positions: {x:number;y:number}[], count: number): Edge[] {
  const rand = seededRand(count * 5 + 11)
  const edges: Edge[] = positions.map((_, i) => ({ a: i, b: -1, cross: false }))
  for (let i = 0; i < positions.length; i++) {
    let best = -1, bestD = Infinity
    for (let j = 0; j < positions.length; j++) {
      if (i === j) continue
      const dx = positions[j].x - positions[i].x, dy = positions[j].y - positions[i].y
      const d = dx * dx + dy * dy
      if (d < bestD) { bestD = d; best = j }
    }
    if (best !== -1 && rand() < 0.55 && Math.sqrt(bestD) < 210)
      if (!edges.some(e => e.cross && ((e.a === i && e.b === best) || (e.a === best && e.b === i))))
        edges.push({ a: i, b: best, cross: true })
  }
  return edges
}

const NODE_SIZES = [26, 28, 24, 30, 26, 28, 24, 26, 30, 26, 28, 24]
const nodeR = (i: number) => NODE_SIZES[i % NODE_SIZES.length]

// ── ReviewGraph ───────────────────────────────────────────────────────────
// Pure-RAF animation: direct SVG setAttribute, zero React re-renders in hot path.
function ReviewGraph({ reviews, onNodeClick }: { reviews: Review[]; onNodeClick: (r: Review) => void }) {
  const svgRef     = useRef<SVGSVGElement>(null)
  const glowRef    = useRef<SVGCircleElement>(null)
  const nodeRefs   = useRef<(SVGGElement | null)[]>([])
  const ringRefs   = useRef<(SVGCircleElement | null)[]>([])
  const circRefs   = useRef<(SVGCircleElement | null)[]>([])
  const edgeRefs   = useRef<(SVGLineElement | null)[]>([])
  const rafRef     = useRef(0)
  const t0Ref      = useRef(0)
  const cursorRef  = useRef<{x:number;y:number}|null>(null)
  const hovRef     = useRef(-1)

  const basePos = useMemo(() => computeLayout(reviews.length), [reviews.length])
  const edges   = useMemo(() => computeEdges(basePos, reviews.length), [basePos, reviews.length])

  const dp = useMemo(() => reviews.map((_, i) => ({
    ax: 9  + (i % 5) * 2.5,   ay: 7 + (i % 4) * 2,
    fx: 0.17 + i * 0.028,     fy: 0.13 + i * 0.022,
    bf: 0.38 + (i % 7) * 0.06, ba: 0.055 + (i % 4) * 0.01,
    ph: i * 0.55,
  })), [reviews.length])

  // ── RAF: breathe + drift + proximity + edges ────────────────────────
  useEffect(() => {
    t0Ref.current = performance.now()

    const loop = () => {
      const t   = (performance.now() - t0Ref.current) / 1000
      const cur = cursorRef.current
      const hov = hovRef.current
      const cx: number[] = [], cy: number[] = []

      for (let i = 0; i < basePos.length; i++) {
        const g = nodeRefs.current[i]
        const p = basePos[i], d = dp[i]
        if (!p) { cx[i] = CX; cy[i] = CY; continue }

        const ox = d.ax * Math.sin(t * d.fx + d.ph)
        const oy = d.ay * Math.cos(t * d.fy + d.ph * 0.7)
        cx[i] = p.x + ox
        cy[i] = p.y + oy

        const breathe = 1 + d.ba * Math.sin(t * d.bf + d.ph)
        let   proxT   = 0
        if (cur) {
          const dist = Math.hypot(cur.x - cx[i], cur.y - cy[i])
          if (dist < 180) proxT = 1 - dist / 180
        }
        const isHov = hov === i
        const isDim = hov >= 0 && !isHov
        const scale = isHov ? 1.32 : breathe * (1 + proxT * 0.26)

        if (g) {
          g.setAttribute('transform', `translate(${cx[i].toFixed(1)},${cy[i].toFixed(1)}) scale(${scale.toFixed(4)})`)
          g.style.opacity = isDim ? '0.2' : '1'
        }

        const ring = ringRefs.current[i]
        if (ring) ring.setAttribute('opacity', (isHov ? 0.9 : proxT * 0.72).toFixed(3))

        const circ = circRefs.current[i]
        if (circ) {
          const sw = (isHov ? 2.5 : 1 + proxT * 1.6).toFixed(2)
          const so = Math.min(1, 0.42 + proxT * 0.5 + (isHov ? 0.08 : 0)).toFixed(3)
          circ.setAttribute('stroke-width', sw)
          circ.setAttribute('stroke', `rgba(197,255,69,${so})`)
          circ.setAttribute('fill',
            isHov    ? 'rgba(197,255,69,0.18)'
            : proxT > 0 ? `rgba(197,255,69,${(proxT * 0.12).toFixed(3)})`
            : '#0E0E1C')
          circ.style.filter = isHov || proxT > 0.55 ? 'url(#ng-glow)' : ''
        }
      }

      for (let ei = 0; ei < edges.length; ei++) {
        const line = edgeRefs.current[ei]
        if (!line) continue
        const e = edges[ei]
        const ax = e.b === -1 ? CX : (cx[e.b] ?? CX)
        const ay = e.b === -1 ? CY : (cy[e.b] ?? CY)
        const bx = cx[e.a] ?? CX, by = cy[e.a] ?? CY

        line.setAttribute('x1', ax.toFixed(1)); line.setAttribute('y1', ay.toFixed(1))
        line.setAttribute('x2', bx.toFixed(1)); line.setAttribute('y2', by.toFixed(1))

        const isLit  = hov === e.a || (e.b >= 0 && hov === e.b)
        const dimmed = hov >= 0 && !isLit
        const bProx  = cur ? Math.max(0, 1 - Math.hypot(cur.x - bx, cur.y - by) / 180) : 0
        const op     = dimmed ? 0.05 : isLit ? 0.95 : (e.cross ? 0.16 : 0.32) + bProx * 0.36

        line.style.opacity = op.toFixed(3)
        line.setAttribute('stroke-width', isLit ? '1.9' : e.cross ? '0.75' : '1.05')
        line.setAttribute('stroke', isLit ? '#C5FF45' : `rgba(197,255,69,${e.cross ? 0.5 : 0.65})`)
        line.style.filter  = isLit ? 'url(#ng-glow)' : ''
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [basePos, dp, edges])

  // ── Cursor ──────────────────────────────────────────────────────────
  const toSVG = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current; if (!svg) return null
    const r = svg.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const p = toSVG(e); if (!p) return
    cursorRef.current = p
    const g = glowRef.current
    if (g) { g.setAttribute('cx', String(p.x | 0)); g.setAttribute('cy', String(p.y | 0)); g.style.opacity = '1' }
  }, [toSVG])

  const onMouseLeave = useCallback(() => {
    cursorRef.current = null
    const g = glowRef.current; if (g) g.style.opacity = '0'
  }, [])

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%"
        style={{ minWidth: 0, maxHeight: 520 }}
        className="select-none"
        onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>

        <defs>
          <filter id="ng-glow" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="ng-glow-lg" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="ng-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#C5FF45" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#C5FF45" stopOpacity="0"    />
          </radialGradient>
          {/* Avatar patterns — move with node regardless of CSS/SVG transforms */}
          {reviews.map(rev => rev.avatar ? (
            <pattern key={`pat-${rev.id}`} id={`pat-${rev.id}`}
              x="0" y="0" width="1" height="1" patternContentUnits="objectBoundingBox">
              <image href={rev.avatar} x="0" y="0" width="1" height="1"
                preserveAspectRatio="xMidYMid slice" />
            </pattern>
          ) : null)}
        </defs>

        <circle cx={CX} cy={CY} r={200} fill="url(#ng-bg)" />

        {/* Cursor halo — direct setAttribute in onMouseMove, no React re-render */}
        <circle ref={glowRef} cx={-600} cy={-600} r={115}
          fill="rgba(197,255,69,0.07)" filter="url(#ng-glow-lg)"
          style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.3s ease' }}
        />

        {/* Edges — RAF updates x1/y1/x2/y2 each frame */}
        {edges.map((e, i) => {
          const ax = e.b === -1 ? CX : (basePos[e.b]?.x ?? CX)
          const ay = e.b === -1 ? CY : (basePos[e.b]?.y ?? CY)
          const bx = basePos[e.a]?.x ?? CX, by = basePos[e.a]?.y ?? CY
          return (
            <line key={`e-${i}`}
              ref={el => { edgeRefs.current[i] = el }}
              x1={ax} y1={ay} x2={bx} y2={by}
              stroke={`rgba(197,255,69,${e.cross ? 0.5 : 0.65})`}
              strokeWidth={e.cross ? 0.75 : 1.05}
              style={{ opacity: e.cross ? 0.16 : 0.32 }}
            />
          )
        })}

        {/* Signal particles along each edge to center */}
        {basePos.map((pos, i) => {
          const dur   = `${(1.6 + (i % 6) * 0.38).toFixed(2)}s`
          const begin = `${((i * 0.55) % 2.8).toFixed(2)}s`
          return (
            <circle key={`p-${i}`} r={2.2} fill="#C5FF45" filter="url(#ng-glow)">
              <animateMotion dur={dur} begin={begin} repeatCount="indefinite"
                path={`M${pos.x},${pos.y} L${CX},${CY}`} />
              <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.07;0.88;1"
                dur={dur} begin={begin} repeatCount="indefinite" />
            </circle>
          )
        })}

        {/* Center node — framer-motion breathing is fine here (not inside RAF loop) */}
        <motion.g style={{ transformOrigin: `${CX}px ${CY}px` }}
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}>
          <circle cx={CX} cy={CY} r={88} fill="rgba(197,255,69,0.04)" />
          <motion.circle cx={CX} cy={CY} r={60}
            fill="rgba(197,255,69,0.06)" stroke="rgba(197,255,69,0.14)" strokeWidth={1}
            style={{ transformOrigin: `${CX}px ${CY}px` }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
          />
          <circle cx={CX} cy={CY} r={40} fill="#0E0E1C" stroke="#C5FF45" strokeWidth={2.5} filter="url(#ng-glow)" />
          <text x={CX} y={CY - 4} textAnchor="middle" fill="#C5FF45" fontSize={20} fontWeight="700" filter="url(#ng-glow)">★</text>
          <text x={CX} y={CY + 14} textAnchor="middle" fill="#E8E8E0" fontSize={11} fontWeight="600">Отзывы</text>
        </motion.g>

        {/* Review nodes
            - Initial transform set as SVG attribute at basePos
            - RAF overwrites with translate(cx+drift, cy+drift) scale(breathe*prox)
            - All child elements use (0,0) as node center (parent translate handles position)
        */}
        {reviews.map((rev, i) => {
          const pos = basePos[i]; if (!pos) return null
          const r = nodeR(i)
          const label = rev.name.length > 9 ? rev.name.slice(0, 8) + '…' : rev.name
          return (
            <g key={rev.id}
              ref={el => { nodeRefs.current[i] = el }}
              transform={`translate(${pos.x},${pos.y})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => { hovRef.current = i }}
              onMouseLeave={() => { hovRef.current = -1 }}
              onClick={() => onNodeClick(rev)}
            >
              {/* Glow ring — opacity controlled by RAF */}
              <circle ref={el => { ringRefs.current[i] = el }}
                cx={0} cy={0} r={r + 20}
                fill="rgba(197,255,69,0.07)" filter="url(#ng-glow)"
                opacity={0}
              />
              {/* Node body — fill/stroke controlled by RAF */}
              <circle ref={el => { circRefs.current[i] = el }}
                cx={0} cy={0} r={r}
                fill="#0E0E1C" stroke="rgba(197,255,69,0.42)" strokeWidth={1}
              />
              {/* Avatar via SVG pattern, or initial letter */}
              {rev.avatar
                ? <circle cx={0} cy={0} r={r - 1.5} fill={`url(#pat-${rev.id})`} />
                : <text x={0} y={5} textAnchor="middle"
                    fill="rgba(197,255,69,0.85)"
                    fontSize={r > 27 ? 14 : 12} fontWeight="700">
                    {rev.name.charAt(0)}
                  </text>
              }
              <text x={0} y={r + 14} textAnchor="middle" fill="#606078" fontSize={10}>{label}</text>
              <text x={0} y={r + 25} textAnchor="middle" fill="#C5FF45" fontSize={8.5} opacity={0.3}>
                {'★'.repeat(rev.rating)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

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
            fill={s <= (hov || rating) ? '#C5FF45' : 'none'}
            stroke={s <= (hov || rating) ? '#C5FF45' : 'rgba(255,255,255,.2)'}
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
  const [reviews, setReviews]  = useState<Review[]>(STATIC_REVIEWS)
  const [active, setActive]    = useState<Review | null>(null)
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

  return (
    <div id="reviews" className="bg-[#0E0E1C] border-t border-b border-white/[.06]">
      <section className="py-[120px]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <span className="section-tag">// Отзывы</span>
            <h2 className="section-heading">Говорят студенты</h2>
            <p className="text-[#6A6A88] text-sm mt-2">Наведите на узел — прочитайте отзыв</p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 1, delay: 0.1 }}
          className="max-w-[1200px] mx-auto px-2 mb-16">
          <ReviewGraph reviews={reviews} onNodeClick={setActive} />
        </motion.div>

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }} className="max-w-xl mx-auto">
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
                    <div role="group" aria-labelledby="rl"><StarRating rating={rating} onChange={setRating} /></div>
                  </div>
                  <div>
                    <label htmlFor="rv-text" className="text-[#6A6A88] text-sm block mb-2">Текст отзыва</label>
                    <Textarea id="rv-text" value={text} onChange={e => setText(e.target.value)}
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

      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setActive(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="relative bg-[#141428] border border-[#C5FF45]/20 rounded-3xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(197,255,69,0.1),0_32px_80px_rgba(0,0,0,.65)]">
              <button onClick={() => setActive(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/[.06] hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-[#6A6A88]" />
              </button>
              <div className="text-[#C5FF45] text-[20px] tracking-[4px] mb-4"
                style={{ filter: 'drop-shadow(0 0 6px rgba(197,255,69,.6))' }}>
                {'★'.repeat(active.rating)}{'☆'.repeat(5 - active.rating)}
              </div>
              <p className="text-[15px] leading-[1.78] text-[#F0F0EC] italic mb-6">
                &quot;{active.text}&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#7C3AED] to-[#C5FF45]">
                  {active.avatar ? (
                    <Image src={active.avatar} alt={active.name} width={40} height={40}
                      className="w-full h-full object-cover"
                      unoptimized={active.avatar.startsWith('https://randomuser.me')} />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-[14px] font-bold text-[#07070E]">
                      {active.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-[14px] text-[#F0F0EC]">{active.name}</div>
                  <div className="text-[12px] text-[#6A6A88]">{active.subtitle}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
