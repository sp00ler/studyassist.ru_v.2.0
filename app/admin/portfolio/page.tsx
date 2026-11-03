'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PortfolioItem {
  id: string
  title: string
  workType: string
  subject: string | null
  description: string | null
  published: boolean
  sortOrder: number
  createdAt: string
}

const WORK_TYPE_LABELS: Record<string, string> = {
  essay: 'Реферат',
  coursework: 'Курсовая',
  diploma: 'Диплом',
  lab: 'Лабораторная',
  presentation: 'Презентация',
  'practice-report': 'Отчёт',
  uir: 'УИР',
  other: 'Другое',
}

export default function AdminPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/portfolio')
    const data = await res.json()
    setItems(data.items || [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const togglePublish = async (item: PortfolioItem) => {
    await fetch(`/api/admin/portfolio/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !item.published }),
    })
    fetchItems()
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Удалить пример работы?')) return
    setDeleting(id)
    await fetch(`/api/admin/portfolio/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
    setDeleting(null)
  }

  return (
    <div className="window pixel-shadow">
      <div className="titlebar">
        <h1 className="truncate">Портфолио</h1>
      </div>
      <div className="bg-paper p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-ink-soft text-sm">Примеры выполненных работ</p>
        <Link href="/admin/portfolio/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Добавить пример
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-title animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-chrome-dark bg-chrome/20">
          <FolderOpen className="w-12 h-12 text-ink-soft mx-auto mb-3" />
          <p className="text-ink-soft">Примеры работ не добавлены</p>
          <Link href="/admin/portfolio/new">
            <Button variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Добавить первый
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bevel-out bg-chrome/20 px-5 py-4 flex items-center gap-4"
            >
              {/* Type badge */}
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-title/10 text-title border border-title flex-shrink-0">
                {WORK_TYPE_LABELS[item.workType] || item.workType}
              </span>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-ink font-medium truncate">{item.title}</p>
                {item.subject && (
                  <p className="text-ink-soft text-xs mt-0.5">{item.subject}</p>
                )}
              </div>

              {/* Order */}
              <span className="text-ink-soft text-xs font-mono flex-shrink-0">#{item.sortOrder}</span>

              {/* Published */}
              <span className={`text-xs px-2 py-1 border flex-shrink-0 ${
                item.published
                  ? 'bg-success/15 text-success border-success'
                  : 'bg-chrome text-ink-soft border-chrome-shadow'
              }`}>
                {item.published ? 'Видно' : 'Скрыто'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePublish(item)}
                  title={item.published ? 'Скрыть' : 'Показать'}
                  className="btn-95 w-9 h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 flex items-center justify-center"
                >
                  {item.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Link href={`/admin/portfolio/${item.id}`}>
                  <button className="btn-95 w-9 h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </button>
                </Link>
                <button
                  onClick={() => deleteItem(item.id)}
                  disabled={deleting === item.id}
                  className="btn-95 w-9 h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-danger hover:text-white"
                >
                  {deleting === item.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
