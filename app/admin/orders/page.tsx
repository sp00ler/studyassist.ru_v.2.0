'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Loader2, RefreshCw } from 'lucide-react'
import { OrderDetailModal } from '@/components/admin/OrderDetailModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate, formatPrice, formatOrderId, getOrderTypeLabel, getStatusColor, getStatusLabel } from '@/lib/utils'

interface Order {
  id: string
  type: string
  subject: string
  deadline: string
  description: string
  status: string
  price: string | number | null
  paymentLink: string | null
  adminNote: string | null
  files: string | null
  createdAt: string
  user?: { name: string | null; email: string; phone: string | null; telegramId: string | null } | null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, page])

  const filteredOrders = search
    ? orders.filter(
        (o) =>
          o.subject.toLowerCase().includes(search.toLowerCase()) ||
          o.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          formatOrderId(o.id).includes(search)
      )
    : orders

  const handleOrderUpdate = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)))
    setSelectedOrder(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Заявки</h1>
          <p className="text-white/50 text-sm">Всего: {total}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Обновить
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по предмету, клиенту..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <Filter className="w-4 h-4 mr-2 text-white/40" />
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="new">Новые</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="ready_for_review">Готовы к проверке</SelectItem>
            <SelectItem value="awaiting_payment">Ожидают оплаты</SelectItem>
            <SelectItem value="paid">Оплачены</SelectItem>
            <SelectItem value="completed">Завершены</SelectItem>
            <SelectItem value="cancelled">Отменены</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-[#6C3EF4] animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th scope="col" className="text-left text-white/40 text-xs px-4 py-3 uppercase">№</th>
                    <th scope="col" className="text-left text-white/40 text-xs px-4 py-3 uppercase">Тип</th>
                    <th scope="col" className="text-left text-white/40 text-xs px-4 py-3 uppercase">Предмет</th>
                    <th scope="col" className="text-left text-white/40 text-xs px-4 py-3 uppercase">Клиент</th>
                    <th scope="col" className="text-left text-white/40 text-xs px-4 py-3 uppercase">Дедлайн</th>
                    <th scope="col" className="text-left text-white/40 text-xs px-4 py-3 uppercase">Статус</th>
                    <th scope="col" className="text-left text-white/40 text-xs px-4 py-3 uppercase">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-4 py-3 text-white/50 text-xs font-mono">{formatOrderId(order.id)}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{getOrderTypeLabel(order.type)}</td>
                      <td className="px-4 py-3 text-white text-sm max-w-32 truncate">{order.subject}</td>
                      <td className="px-4 py-3 text-white/60 text-sm">
                        <div>
                          <p className="truncate max-w-28">{order.user?.name || '—'}</p>
                          <p className="text-white/30 text-xs truncate max-w-28">{order.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/60 text-sm">{formatDate(order.deadline)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg border font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/80 text-sm">{formatPrice(order.price)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/40">Заявок не найдено</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Предыдущая страница">
                <span aria-hidden="true">←</span>
              </Button>
              <span className="text-white/60 text-sm" aria-live="polite">Страница {page} из {Math.ceil(total / 20)}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)} aria-label="Следующая страница">
                <span aria-hidden="true">→</span>
              </Button>
            </div>
          )}
        </>
      )}

      <OrderDetailModal
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdate={handleOrderUpdate}
      />
    </div>
  )
}
