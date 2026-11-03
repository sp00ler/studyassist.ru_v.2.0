'use client'

import { useEffect, useRef, useState } from 'react'
import { X, FileText, Calendar, Tag, MessageSquare, CreditCard, ExternalLink, Download, Upload, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatPrice, formatOrderId, getOrderTypeLabel, getStatusLabel } from '@/lib/utils'

function toFileUrl(p: string) {
  if (!p) return p
  if (p.startsWith('/uploads/')) return '/api/files/' + p.slice('/uploads/'.length)
  return p
}
import { PaymentModal } from './PaymentModal'

// Win95 token classes for order status — see OrdersTable.tsx for rationale
// (lib/utils.ts getStatusColor() is legacy and out of this migration's scope).
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

interface OrderDetail {
  id: string
  type: string
  subject: string
  deadline: string
  description: string
  files: string | null
  resultFiles: string | null
  revisionNote: string | null
  revisionFiles: string | null
  status: string
  price: string | number | null
  paymentLink: string | null
  adminNote: string | null
  createdAt: string
}

interface OrderViewModalProps {
  orderId: string | null
  onClose: () => void
}

export function OrderViewModal({ orderId, onClose }: OrderViewModalProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)

  // Revision form state
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')
  const [revisionFiles, setRevisionFiles] = useState<File[]>([])
  const [revisionLoading, setRevisionLoading] = useState(false)
  const [revisionSuccess, setRevisionSuccess] = useState(false)
  const revisionFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!orderId) { setOrder(null); return }
    setLoading(true)
    setShowRevisionForm(false)
    setRevisionSuccess(false)
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(d => setOrder(d.order))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [orderId])

  if (!orderId) return null

  const files: string[] = (() => {
    try { return order?.files ? JSON.parse(order.files) : [] } catch { return [] }
  })()

  const resultFiles: string[] = (() => {
    try { return order?.resultFiles ? JSON.parse(order.resultFiles) : [] } catch { return [] }
  })()

  const handleRevisionSubmit = async () => {
    if (!revisionNote.trim() && revisionFiles.length === 0) return
    setRevisionLoading(true)
    try {
      const fd = new FormData()
      fd.append('note', revisionNote)
      for (const f of revisionFiles) fd.append('files', f)

      const res = await fetch(`/api/orders/${orderId}/revision`, {
        method: 'POST',
        body: fd,
      })

      if (res.ok) {
        const data = await res.json()
        setOrder(prev => prev ? { ...prev, ...data.order } : null)
        setRevisionSuccess(true)
        setShowRevisionForm(false)
        setRevisionNote('')
        setRevisionFiles([])
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка отправки')
      }
    } finally {
      setRevisionLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="window pixel-shadow w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="titlebar sticky top-0 z-10">
            <span className="truncate">Заявка {order ? formatOrderId(order.id) : '...'}</span>
            <button onClick={onClose} className="titlebar-btn hover:bg-danger hover:text-white" aria-label="Закрыть">
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-paper">
            {order && (
              <div className="px-6 pt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold border ${getStatusToken(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            )}

            {loading ? (
              <div className="p-12 text-center text-ink-soft">Загрузка...</div>
            ) : order ? (
              <div className="p-6 space-y-5">
                {/* Основная информация */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bevel-out bg-chrome/20 p-4">
                    <div className="flex items-center gap-2 text-ink-soft text-xs mb-1">
                      <Tag className="w-3.5 h-3.5" /> Тип работы
                    </div>
                    <p className="text-ink text-sm font-medium">{getOrderTypeLabel(order.type)}</p>
                  </div>
                  <div className="bevel-out bg-chrome/20 p-4">
                    <div className="flex items-center gap-2 text-ink-soft text-xs mb-1">
                      <Calendar className="w-3.5 h-3.5" /> Дедлайн
                    </div>
                    <p className="text-ink text-sm font-medium">{formatDate(order.deadline)}</p>
                  </div>
                </div>

                {/* Предмет */}
                <div className="bevel-out bg-chrome/20 p-4">
                  <p className="text-ink-soft text-xs mb-1">Предмет / Тема</p>
                  <p className="text-ink text-sm">{order.subject}</p>
                </div>

                {/* Описание */}
                {order.description && (
                  <div className="bevel-out bg-chrome/20 p-4">
                    <div className="flex items-center gap-2 text-ink-soft text-xs mb-2">
                      <FileText className="w-3.5 h-3.5" /> Описание задания
                    </div>
                    <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{order.description}</p>
                  </div>
                )}

                {/* Исходные файлы */}
                {files.length > 0 && (
                  <div className="bevel-out bg-chrome/20 p-4">
                    <p className="text-ink-soft text-xs mb-2">Прикреплённые файлы</p>
                    <div className="space-y-1.5">
                      {files.map((f, i) => (
                        <a
                          key={i}
                          href={toFileUrl(f)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-title hover:text-title-alt text-sm transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Файл {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Готовые файлы для скачивания */}
                {resultFiles.length > 0 && (
                  <div className="bevel-out bg-success/10 p-4">
                    <div className="flex items-center gap-2 text-ink text-sm font-semibold mb-3">
                      <Download className="w-4 h-4 text-success" />
                      Готовая работа — доступна для скачивания
                    </div>
                    <div className="space-y-2">
                      {resultFiles.map((f, i) => (
                        <a
                          key={i}
                          href={toFileUrl(f)}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-95 flex items-center gap-2 px-3 py-2 text-[11px] text-ink font-display"
                        >
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 truncate">{f.split('/').pop()}</span>
                          <Download className="w-3.5 h-3.5 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Заметка от администратора */}
                {order.adminNote && (
                  <div className="bevel-out bg-title/10 p-4">
                    <div className="flex items-center gap-2 text-title text-xs mb-2">
                      <MessageSquare className="w-3.5 h-3.5" /> Сообщение от администратора
                    </div>
                    <p className="text-ink text-sm leading-relaxed">{order.adminNote}</p>
                  </div>
                )}

                {/* Ранее отправленный запрос на доработку */}
                {order.status === 'revision' && order.revisionNote && (
                  <div className="bevel-out bg-warning/10 p-4">
                    <div className="flex items-center gap-2 text-ink text-xs font-semibold mb-2">
                      <RefreshCw className="w-3.5 h-3.5 text-warning" /> Ваш запрос на доработку отправлен
                    </div>
                    <p className="text-ink-soft text-sm leading-relaxed whitespace-pre-wrap">{order.revisionNote}</p>
                  </div>
                )}

                {/* Уведомление об успешной отправке доработки */}
                {revisionSuccess && (
                  <div className="bevel-out bg-warning/10 p-4 text-center">
                    <p className="text-ink font-semibold">Запрос на доработку отправлен!</p>
                    <p className="text-ink-soft text-sm mt-1">Администратор получил уведомление и свяжется с вами.</p>
                  </div>
                )}

                {/* Стоимость и оплата */}
                {order.price && (
                  <div className="bevel-out bg-chrome/20 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-ink-soft text-xs mb-1">Стоимость работы</p>
                      <p className="text-ink text-xl font-bold font-mono">{formatPrice(order.price)}</p>
                    </div>
                    {order.status === 'awaiting_payment' && (
                      <Button
                        variant="amber"
                        className="gap-2"
                        onClick={() => setPaymentModal(true)}
                      >
                        <CreditCard className="w-4 h-4" />
                        Оплатить
                      </Button>
                    )}
                  </div>
                )}

                {/* Кнопка «Запросить доработку» — только когда работа завершена */}
                {order.status === 'completed' && !revisionSuccess && !showRevisionForm && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowRevisionForm(true)}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Запросить доработку
                  </Button>
                )}

                {/* Форма доработки */}
                {showRevisionForm && (
                  <div className="bevel-out bg-warning/5 p-4 space-y-4">
                    <h3 className="text-ink text-sm flex items-center gap-2 font-display">
                      <RefreshCw className="w-4 h-4 text-warning" /> Запрос на доработку
                    </h3>
                    <div>
                      <label className="text-ink-soft text-xs mb-1.5 block">Опишите замечания</label>
                      <Textarea
                        value={revisionNote}
                        onChange={e => setRevisionNote(e.target.value)}
                        placeholder="Подробно опишите, что нужно исправить или доработать..."
                        rows={4}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-ink-soft text-xs mb-1.5 block">Прикрепить файлы (необязательно)</label>
                      <div
                        className="bevel-in p-3 cursor-pointer text-center"
                        onClick={() => revisionFileInputRef.current?.click()}
                      >
                        <Upload className="w-5 h-5 text-ink-soft mx-auto mb-1" />
                        <p className="text-ink-soft text-xs">Нажмите для выбора файлов</p>
                      </div>
                      <input
                        ref={revisionFileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={e => {
                          const f = Array.from(e.target.files || [])
                          setRevisionFiles(prev => [...prev, ...f])
                        }}
                      />
                      {revisionFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {revisionFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-ink-soft">
                              <FileText className="w-3.5 h-3.5" />
                              <span className="flex-1 truncate">{f.name}</span>
                              <button
                                onClick={() => setRevisionFiles(prev => prev.filter((_, idx) => idx !== i))}
                                className="text-ink-soft hover:text-danger"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setShowRevisionForm(false); setRevisionNote(''); setRevisionFiles([]) }}
                      >
                        Отмена
                      </Button>
                      <Button
                        variant="amber"
                        className="flex-1 gap-2"
                        onClick={handleRevisionSubmit}
                        disabled={revisionLoading || (!revisionNote.trim() && revisionFiles.length === 0)}
                      >
                        {revisionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Отправить
                      </Button>
                    </div>
                  </div>
                )}

                {/* Дата создания */}
                <p className="text-ink-soft text-xs text-right">Заявка создана {formatDate(order.createdAt)}</p>
              </div>
            ) : (
              <div className="p-12 text-center text-ink-soft">Заявка не найдена</div>
            )}
          </div>
        </div>
      </div>

      {order && (
        <PaymentModal
          open={paymentModal}
          onClose={() => setPaymentModal(false)}
          orderId={order.id}
          amount={order.price ? parseFloat(String(order.price)) : null}
          existingPaymentLink={order.paymentLink}
        />
      )}
    </>
  )
}
