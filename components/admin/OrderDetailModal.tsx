'use client'

import { useState } from 'react'
import { Loader2, FileText, User, Calendar, DollarSign, MessageSquare, Link2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatOrderId, getOrderTypeLabel, getStatusColor, getStatusLabel } from '@/lib/utils'

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

interface OrderDetailModalProps {
  order: Order | null
  open: boolean
  onClose: () => void
  onUpdate: (updatedOrder: Order) => void
  onDelete?: (orderId: string) => void
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'ready_for_review', label: 'Готова к проверке' },
  { value: 'awaiting_payment', label: 'Ожидает оплаты' },
  { value: 'paid', label: 'Оплачена' },
  { value: 'completed', label: 'Завершена' },
  { value: 'cancelled', label: 'Отменена' },
]

export function OrderDetailModal({ order, open, onClose, onUpdate, onDelete }: OrderDetailModalProps) {
  const [status, setStatus] = useState(order?.status || '')
  const [price, setPrice] = useState(order?.price ? String(order.price) : '')
  const [adminNote, setAdminNote] = useState(order?.adminNote || '')
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDelete = async () => {
    if (!order || !confirm(`Удалить заявку ${formatOrderId(order.id)}? Это действие необратимо.`)) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      if (res.ok) { onDelete?.(order.id); onClose() }
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!order) return null

  const files: string[] = order.files ? JSON.parse(order.files) : []

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status !== order.status ? status : undefined,
          price: price ? parseFloat(price) : undefined,
          adminNote,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        onUpdate(data.order)
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePaymentLink = async () => {
    if (!price) {
      alert('Укажите стоимость работы')
      return
    }
    setPaymentLoading(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatePaymentLink: true,
          price: parseFloat(price),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        onUpdate(data.order)
        alert(`Ссылка оплаты создана и отправлена клиенту: ${data.order.paymentLink}`)
      }
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#6C3EF4]" />
            Заявка {formatOrderId(order.id)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Тип работы</p>
              <p className="text-white font-medium">{getOrderTypeLabel(order.type)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Предмет</p>
              <p className="text-white font-medium">{order.subject}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Дедлайн
              </p>
              <p className="text-amber-400 font-medium">{formatDate(order.deadline)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Дата создания</p>
              <p className="text-white/70">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="mb-2 block text-white/60">Описание задания</Label>
            <div className="bg-white/5 rounded-xl p-4 text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
              {order.description}
            </div>
          </div>

          {/* Files */}
          {files.length > 0 && (
            <div>
              <Label className="mb-2 block text-white/60">Прикреплённые файлы ({files.length})</Label>
              <div className="space-y-2">
                {files.map((f, i) => (
                  <a
                    key={i}
                    href={f}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 text-sm text-[#6C3EF4] transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    {f.split('/').pop()}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Client info */}
          {order.user && (
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-3 flex items-center gap-1">
                <User className="w-3 h-3" /> Клиент
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-white">{order.user.name || 'Без имени'}</p>
                <p className="text-white/60">{order.user.email}</p>
                {order.user.phone && <p className="text-white/60">{order.user.phone}</p>}
                {order.user.telegramId && (
                  <p className="text-white/40">Telegram ID: {order.user.telegramId}</p>
                )}
              </div>
            </div>
          )}

          {/* Admin controls */}
          <div className="border-t border-white/10 pt-4 space-y-4">
            <h3 className="text-white font-semibold">Управление заявкой</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Статус</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Стоимость (₽)</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Введите сумму"
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Заметка администратора
              </Label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Заметки для внутреннего использования..."
                rows={3}
              />
            </div>

            {/* Payment link */}
            {order.paymentLink && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <p className="text-emerald-400 text-xs mb-1 flex items-center gap-1">
                  <Link2 className="w-3 h-3" /> Ссылка оплаты создана
                </p>
                <a href={order.paymentLink} target="_blank" rel="noopener noreferrer"
                  className="text-emerald-300 text-xs break-all hover:underline">
                  {order.paymentLink}
                </a>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={handleGeneratePaymentLink}
                disabled={paymentLoading || !price}
                variant="outline"
                className="gap-2 flex-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                Сформировать оплату
              </Button>
              <Button onClick={handleSave} disabled={loading} className="gap-2 flex-1">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Сохранить
              </Button>
              <Button onClick={handleDelete} disabled={deleteLoading} variant="outline"
                className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Удалить
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
