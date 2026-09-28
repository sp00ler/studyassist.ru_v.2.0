'use client'

import { useEffect, useState } from 'react'
import { Loader2, Check, Star, Trash2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, cn } from '@/lib/utils'

interface Review {
  id: string
  name: string
  city: string | null
  university: string | null
  rating: number
  text: string
  approved: boolean
  createdAt: string
  user?: { email: string } | null
}

const EMPTY_FORM = { name: '', city: '', university: '', rating: 5, text: '' }

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === 'pending') params.set('approved', 'false')
      if (filter === 'approved') params.set('approved', 'true')
      const res = await fetch(`/api/admin/reviews?${params}`)
      const data = await res.json()
      setReviews(data.reviews || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [filter])

  const handleApprove = async (id: string) => {
    const res = await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved: true }),
    })
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  const handleReject = async (id: string) => {
    const res = await fetch('/api/admin/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Ошибка')
      setForm(EMPTY_FORM)
      setShowForm(false)
      fetchReviews()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="window pixel-shadow">
      <div className="titlebar">
        <h1 className="truncate">Отзывы</h1>
      </div>
      <div className="bg-paper p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-ink-soft text-sm">Модерация и добавление отзывов</p>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Отмена' : 'Добавить отзыв'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bevel-out bg-chrome/20 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Имя *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Александр К." required />
            </div>
            <div>
              <Label className="mb-2 block">Город</Label>
              <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="г. Москва" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Университет</Label>
              <Input value={form.university} onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))} placeholder="МГУ" />
            </div>
            <div>
              <Label className="mb-2 block">Рейтинг</Label>
              <div className="flex items-center gap-2 pt-2">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, rating: n }))}>
                    <Star className="w-6 h-6" fill={n <= form.rating ? 'rgb(var(--accent))' : 'none'} stroke={n <= form.rating ? 'rgb(var(--accent))' : 'rgb(var(--chrome-dark))'} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Текст отзыва *</Label>
            <Textarea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} rows={3} required />
          </div>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Добавить
          </Button>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-chrome p-1 w-fit border border-chrome-shadow">
        {([['pending', 'На модерации'], ['approved', 'Одобренные'], ['all', 'Все']] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={cn(
              'px-4 py-2 text-[11px] font-display transition-all',
              filter === v ? 'btn-95-primary' : 'text-ink-soft hover:text-ink'
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-title animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 border border-chrome-dark bg-chrome/20">
          <Star className="w-12 h-12 text-ink-soft mx-auto mb-3" />
          <p className="text-ink-soft">Отзывов нет</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bevel-out bg-chrome/20 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-ink font-semibold">{review.name}</p>
                  <p className="text-ink-soft text-xs">
                    {[review.university, review.city].filter(Boolean).join(', ')}
                    {review.user && <span className="ml-2">· {review.user.email}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4" fill={i < review.rating ? 'rgb(var(--accent))' : 'none'} stroke={i < review.rating ? 'rgb(var(--accent))' : 'rgb(var(--chrome-dark))'} />
                  ))}
                </div>
              </div>

              <p className="text-ink-soft text-sm leading-relaxed mb-3">&quot;{review.text}&quot;</p>

              <div className="flex items-center justify-between">
                <p className="text-ink-soft text-xs">{formatDate(review.createdAt)}</p>
                <div className="flex gap-2">
                  {!review.approved && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(review.id)}
                      variant="outline"
                      className="gap-1 hover:bg-success/15"
                    >
                      <Check className="w-4 h-4 text-success" />
                      Одобрить
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleReject(review.id)}
                    variant="destructive"
                    className="gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
