'use client'

import { useEffect, useState } from 'react'
import { Package, TrendingUp, DollarSign, Users, Loader2 } from 'lucide-react'
import { formatPrice, getStatusLabel } from '@/lib/utils'

// Win95 token classes for order status — see components/dashboard/OrdersTable.tsx
// for rationale (lib/utils.ts getStatusColor() is legacy, out of this migration's scope).
const STATUS_TOKEN_CLASSES: Record<string, string> = {
  new: 'bg-title/10 text-title border-title',
  in_progress: 'bg-title/10 text-title border-title',
  ready_for_review: 'bg-success/15 text-success border-success',
  awaiting_payment: 'bg-warning/15 text-warning border-warning',
  paid: 'bg-success/15 text-success border-success',
  completed: 'bg-success/15 text-success border-success',
  revision: 'bg-warning/15 text-warning border-warning',
  cancelled: 'bg-danger/15 text-danger border-danger',
}
const getStatusToken = (status: string) => STATUS_TOKEN_CLASSES[status] || 'bg-chrome text-ink-soft border-chrome-shadow'

interface Stats {
  totalOrders: number
  newOrdersToday: number
  monthRevenue: number
  totalUsers: number
  pendingReviews: number
  conversionRate: number
  statusCounts: { status: string; count: number }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-title animate-spin" />
      </div>
    )
  }

  const cards = [
    {
      title: 'Всего заявок',
      value: stats?.totalOrders ?? 0,
      sub: `+${stats?.newOrdersToday ?? 0} сегодня`,
      icon: Package,
      tone: 'title',
    },
    {
      title: 'Выручка за месяц',
      value: formatPrice(stats?.monthRevenue ?? 0),
      sub: 'за текущий месяц',
      icon: DollarSign,
      tone: 'accent',
    },
    {
      title: 'Конверсия',
      value: `${stats?.conversionRate ?? 0}%`,
      sub: 'заявок → оплат',
      icon: TrendingUp,
      tone: 'success',
    },
    {
      title: 'Пользователей',
      value: stats?.totalUsers ?? 0,
      sub: `${stats?.pendingReviews ?? 0} отзывов на модерации`,
      icon: Users,
      tone: 'title-alt',
    },
  ] as const

  const TONE_CLASSES: Record<string, string> = {
    title: 'bg-title/10 border-title text-title',
    accent: 'bg-accent/20 border-accent text-ink',
    success: 'bg-success/10 border-success text-success',
    'title-alt': 'bg-title-alt/10 border-title-alt text-title-alt',
  }

  return (
    <div className="window pixel-shadow">
      <div className="titlebar">
        <h1 className="truncate">Дашборд</h1>
      </div>
      <div className="bg-paper p-4 sm:p-6">
        <p className="text-ink-soft text-sm mb-6">Общая статистика сервиса</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <div key={card.title} className="bevel-out bg-chrome/20 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 border flex items-center justify-center ${TONE_CLASSES[card.tone]}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-ink mb-1 font-mono">{card.value}</p>
              <p className="text-ink text-sm font-medium">{card.title}</p>
              <p className="text-ink-soft text-xs mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Status breakdown */}
        {stats?.statusCounts && stats.statusCounts.length > 0 && (
          <div className="bevel-out bg-chrome/20 p-6">
            <h2 className="font-display text-base text-ink mb-6">Заявки по статусам</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.statusCounts.map((s) => (
                <div
                  key={s.status}
                  className={`px-3 py-3 border text-sm ${getStatusToken(s.status)}`}
                >
                  <p className="font-bold text-lg font-mono">{s.count}</p>
                  <p className="text-xs opacity-80">{getStatusLabel(s.status)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
