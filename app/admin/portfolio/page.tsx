'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Портфолио</h1>
          <p className="text-white/50 text-sm mt-1">Примеры выполненных работ</p>
        </div>
        <Link href="/admin/portfolio/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Добавить пример
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-[#6C3EF4] animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
          <FolderOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">Примеры работ не добавлены</p>
          <Link href="/admin/portfolio/new">
            <Button variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Добавить первый
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4"
            >
              {/* Type badge */}
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-[#C5FF45]/10 text-[#C5FF45] border border-[#C5FF45]/20 flex-shrink-0">
                {WORK_TYPE_LABELS[item.workType] || item.workType}
              </span>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{item.title}</p>
                {item.subject && (
                  <p className="text-white/40 text-xs mt-0.5">{item.subject}</p>
                )}
              </div>

              {/* Order */}
              <span className="text-white/30 text-xs flex-shrink-0">#{item.sortOrder}</span>

              {/* Published */}
              <span className={`text-xs px-2 py-1 rounded-lg border flex-shrink-0 ${
                item.published
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-white/30 border-white/10'
              }`}>
                {item.published ? 'Видно' : 'Скрыто'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePublish(item)}
                  title={item.published ? 'Скрыть' : 'Показать'}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  {item.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Link href={`/admin/portfolio/${item.id}`}>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <Pencil className="w-4 h-4" />
                  </button>
                </Link>
                <button
                  onClick={() => deleteItem(item.id)}
                  disabled={deleting === item.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  {deleting === item.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
