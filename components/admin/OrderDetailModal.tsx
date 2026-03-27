'use client'

import { useRef, useState } from 'react'
import { Loader2, FileText, User, Calendar, DollarSign, MessageSquare, Link2, Trash2, Upload, X, Download } from 'lucide-react'
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
  resultFiles: string | null
  revisionNote: string | null
  revisionFiles: string | null
  createdAt: string
  user?: { name: string | null; email: string; phone: string | null; telegramId: string | null } | null
  clientName?: string | null
  clientEmail?: string | null
  clientPhone?: string | null
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
  { value: 'revision', label: 'На доработке' },
  { value: 'cancelled', label: 'Отменена' },
]

export function OrderDetailModal({ order, open, onClose, onUpdate, onDelete }: OrderDetailModalProps) {
  const [status, setStatus] = useState(order?.status || '')
  const [price, setPrice] = useState(order?.price ? String(order.price) : '')
  const [adminNote, setAdminNote] = useState(order?.adminNote || '')
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [resultUploadLoading, setResultUploadLoading] = useState(false)
  const [selectedResultFiles, setSelectedResultFiles] = useState<File[]>([])
  const resultFileInputRef = useRef<HTMLInputElement>(null)

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

  const files: string[] = (() => { try { return order.files ? JSON.parse(order.files) : [] } catch { return [] } })()
  const resultFiles: string[] = (() => { try { return order.resultFiles ? JSON.parse(order.resultFiles) : [] } catch { return [] } })()
  const revisionFiles: string[] = (() => { try { return order.revisionFiles ? JSON.parse(order.revisionFiles) : [] } catch { return [] } })()

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

  const handleUploadResultFiles = async () => {
    if (selectedResultFiles.length === 0) return
    setResultUploadLoading(true)
    try {
      const fd = new FormData()
      for (const file of selectedResultFiles) {
        fd.append('files', file)
      }
      const res = await fetch(`/api/admin/orders/${order.id}/result-files`, {
        method: 'POST',
        body: fd,
      })
      if (res.ok) {
        const data = await res.json()
        onUpdate({ ...order, ...data.order })
        setSelectedResultFiles([])
        if (resultFileInputRef.current) resultFileInputRef.current.value = ''
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка загрузки файлов')
      }
    } finally {
      setResultUploadLoading(false)
    }
  }

  const handleDeleteResultFile = async (index: number) => {
    if (!confirm('Удалить этот файл готовой работы?')) return
    const res = await fetch(`/api/admin/orders/${order.id}/result-files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIndex: index }),
    })
    if (res.ok) {
      const data = await res.json()
      onUpdate({ ...order, ...data.order })
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

          {/* Client files */}
          {files.length > 0 && (
            <div>
              <Label className="mb-2 block text-white/60">Файлы от заказчика ({files.length})</Label>
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

          {/* Revision request from client */}
          {(order.revisionNote || revisionFiles.length > 0) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-amber-400 text-xs mb-3 font-semibold flex items-center gap-1">
                🔄 Запрос на доработку от клиента
              </p>
              {order.revisionNote && (
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                  {order.revisionNote}
                </p>
              )}
              {revisionFiles.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-white/40 text-xs">Прикреплено файлов: {revisionFiles.length}</p>
                  {revisionFiles.map((f, i) => (
                    <a
                      key={i}
                      href={f}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {f.split('/').pop()}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Client info */}
          {(order.user || order.clientEmail || order.clientName) && (
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-3 flex items-center gap-1">
                <User className="w-3 h-3" /> Клиент
                {!order.user && <span className="ml-1 text-white/20">(гость)</span>}
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-white">{order.user?.name || order.clientName || 'Без имени'}</p>
                <p className="text-white/60">{order.user?.email || order.clientEmail}</p>
                {(order.user?.phone || order.clientPhone) && (
                  <p className="text-white/60">{order.user?.phone || order.clientPhone}</p>
                )}
                {order.user?.telegramId && (
                  <p className="text-white/40">Telegram ID: {order.user.telegramId}</p>
                )}
              </div>
            </div>
          )}

          {/* Result files section */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              Файлы готовой работы
            </h3>

            {/* Existing result files */}
            {resultFiles.length > 0 && (
              <div className="space-y-2 mb-3">
                {resultFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                    <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <a
                      href={f}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 text-sm hover:underline flex-1 truncate"
                    >
                      {f.split('/').pop()}
                    </a>
                    <button
                      onClick={() => handleDeleteResultFile(i)}
                      className="text-white/30 hover:text-red-400 transition-colors ml-auto flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload new result files */}
            <div className="space-y-3">
              <div
                className="border-2 border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-emerald-500/40 transition-colors text-center"
                onClick={() => resultFileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-white/30 mx-auto mb-2" />
                <p className="text-white/40 text-sm">Нажмите для выбора файлов готовой работы</p>
                <p className="text-white/20 text-xs mt-1">После загрузки статус изменится на «Завершена» и клиент получит уведомление</p>
              </div>
              <input
                ref={resultFileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const f = Array.from(e.target.files || [])
                  setSelectedResultFiles(prev => [...prev, ...f])
                }}
              />

              {selectedResultFiles.length > 0 && (
                <div className="space-y-1.5">
                  {selectedResultFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm">
                      <FileText className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-white/70 flex-1 truncate">{f.name}</span>
                      <button
                        onClick={() => setSelectedResultFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-white/30 hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button
                    onClick={handleUploadResultFiles}
                    disabled={resultUploadLoading}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {resultUploadLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Upload className="w-4 h-4" />
                    }
                    Загрузить и уведомить клиента ({selectedResultFiles.length} файл{selectedResultFiles.length !== 1 ? 'а' : ''})
                  </Button>
                </div>
              )}
            </div>
          </div>

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
