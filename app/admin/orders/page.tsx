'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Loader2, RefreshCw, Plus, X } from 'lucide-react'
import { OrderDetailModal } from '@/components/admin/OrderDetailModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { formatDate, formatPrice, formatOrderId, getOrderTypeLabel, getStatusColor, getStatusLabel } from '@/lib/utils'

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    type: 'coursework',
    subject: '',
    deadline: '',
    description: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    price: '',
    source: 'phone',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.type || !form.subject || !form.deadline) {
      setError('Заполните тип работы, предмет и дедлайн')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Ошибка'); return }
      onCreated()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const types = [
    { value: 'coursework', label: 'Курсовая работа' },
    { value: 'diploma', label: 'Дипломная (ВКР)' },
    { value: 'essay', label: 'Реферат / Эссе' },
    { value: 'lab', label: 'Лабораторная' },
    { value: 'presentation', label: 'Презентация' },
    { value: 'other', label: 'Другое' },
  ]

  const sources = [
    { value: 'phone', label: '📞 Телефон' },
    { value: 'telegram', label: '✈️ Telegram' },
    { value: 'whatsapp', label: '💬 WhatsApp' },
    { value: 'email', label: '📧 Email' },
    { value: 'other', label: 'Другое' },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-[#0f1117]">
          <h2 className="text-white font-semibold">Новая заявка вручную</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/60 text-xs">Тип работы *</Label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                {types.map(t => <option key={t.value} value={t.value} className="bg-[#0f1117]">{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Источник</Label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                {sources.map(s => <option key={s.value} value={s.value} className="bg-[#0f1117]">{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Предмет / Тема *</Label>
            <Input value={form.subject} onChange={e => set('subject', e.target.value)}
              className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Например: Экономика организации" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/60 text-xs">Дедлайн *</Label>
              <Input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Стоимость (₽)</Label>
              <Input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                className="mt-1 bg-white/5 border-white/10 text-white" placeholder="0" />
            </div>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Описание задания</Label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none h-20 placeholder:text-white/30"
              placeholder="Подробности..." />
          </div>
          <div className="border-t border-white/10 pt-4">
            <p className="text-white/50 text-xs mb-3">Данные клиента (необязательно)</p>
            <div className="space-y-3">
              <Input value={form.clientName} onChange={e => set('clientName', e.target.value)}
                className="bg-white/5 border-white/10 text-white" placeholder="Имя клиента" />
              <Input value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)}
                className="bg-white/5 border-white/10 text-white" placeholder="Email" type="email" />
              <Input value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)}
                className="bg-white/5 border-white/10 text-white" placeholder="Телефон" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-white/60">Отмена</Button>
          <Button onClick={submit} disabled={loading} className="flex-1 bg-[#6C3EF4] hover:bg-[#5b2de3]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Создать заявку'}
          </Button>
        </div>
      </div>
    </div>
  )
}

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
  const [showCreate, setShowCreate] = useState(false)

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

  const handleOrderDelete = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id))
    setTotal(t => t - 1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Заявки</h1>
          <p className="text-white/50 text-sm">Всего: {total}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2 bg-[#6C3EF4] hover:bg-[#5b2de3]">
            <Plus className="w-4 h-4" /> Новая заявка
          </Button>
          <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Обновить
          </Button>
        </div>
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
        onDelete={handleOrderDelete}
      />

      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchOrders(); setShowCreate(false) }}
        />
      )}
    </div>
  )
}
