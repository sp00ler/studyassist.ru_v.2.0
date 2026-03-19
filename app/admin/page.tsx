'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, TrendingUp, DollarSign, Users, Star, Loader2 } from 'lucide-react'
import { formatPrice, getStatusLabel, getStatusColor } from '@/lib/utils'

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
        <Loader2 className="w-8 h-8 text-[#6C3EF4] animate-spin" />
      </div>
    )
  }

  const cards = [
    {
      title: 'Всего заявок',
      value: stats?.totalOrders ?? 0,
      sub: `+${stats?.newOrdersToday ?? 0} сегодня`,
      icon: Package,
      color: '#6C3EF4',
    },
    {
      title: 'Выручка за месяц',
      value: formatPrice(stats?.monthRevenue ?? 0),
      sub: 'за текущий месяц',
      icon: DollarSign,
      color: '#F59E0B',
    },
    {
      title: 'Конверсия',
      value: `${stats?.conversionRate ?? 0}%`,
      sub: 'заявок → оплат',
      icon: TrendingUp,
      color: '#10B981',
    },
    {
      title: 'Пользователей',
      value: stats?.totalUsers ?? 0,
      sub: `${stats?.pendingReviews ?? 0} отзывов на модерации`,
      icon: Users,
      color: '#3B82F6',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Дашборд</h1>
        <p className="text-white/50 text-sm mt-1">Общая статистика сервиса</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${card.color}20`, border: `1px solid ${card.color}30` }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
            <p className="text-white/60 text-sm font-medium">{card.title}</p>
            <p className="text-white/30 text-xs mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Status breakdown */}
      {stats?.statusCounts && stats.statusCounts.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Заявки по статусам</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.statusCounts.map((s) => (
              <div
                key={s.status}
                className={`px-3 py-3 rounded-xl border text-sm ${getStatusColor(s.status)}`}
              >
                <p className="font-bold text-lg">{s.count}</p>
                <p className="text-xs opacity-80">{getStatusLabel(s.status)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
