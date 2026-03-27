'use client'

import { useEffect, useRef, useState } from 'react'
import { X, FileText, Calendar, Tag, MessageSquare, CreditCard, ExternalLink, Download, Upload, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatPrice, formatOrderId, getOrderTypeLabel, getStatusLabel, getStatusColor } from '@/lib/utils'
import { PaymentModal } from './PaymentModal'

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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-white font-semibold text-lg">Заявка {order ? formatOrderId(order.id) : '...'}</h2>
              {order && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border mt-1 ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-white/40">Загрузка...</div>
          ) : order ? (
            <div className="p-6 space-y-5">
              {/* Основная информация */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                    <Tag className="w-3.5 h-3.5" /> Тип работы
                  </div>
                  <p className="text-white text-sm font-medium">{getOrderTypeLabel(order.type)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Дедлайн
                  </div>
                  <p className="text-white text-sm font-medium">{formatDate(order.deadline)}</p>
                </div>
              </div>

              {/* Предмет */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/40 text-xs mb-1">Предмет / Тема</p>
                <p className="text-white text-sm">{order.subject}</p>
              </div>

              {/* Описание */}
              {order.description && (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
                    <FileText className="w-3.5 h-3.5" /> Описание задания
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{order.description}</p>
                </div>
              )}

              {/* Исходные файлы */}
              {files.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs mb-2">Прикреплённые файлы</p>
                  <div className="space-y-1.5">
                    {files.map((f, i) => (
                      <a
                        key={i}
                        href={f}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
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
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-3">
                    <Download className="w-4 h-4" />
                    Готовая работа — доступна для скачивания
                  </div>
                  <div className="space-y-2">
                    {resultFiles.map((f, i) => (
                      <a
                        key={i}
                        href={f}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg px-3 py-2 text-sm text-emerald-300 transition-colors"
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
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Сообщение от администратора
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{order.adminNote}</p>
                </div>
              )}

              {/* Ранее отправленный запрос на доработку */}
              {order.status === 'revision' && order.revisionNote && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-semibold mb-2">
                    <RefreshCw className="w-3.5 h-3.5" /> Ваш запрос на доработку отправлен
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{order.revisionNote}</p>
                </div>
              )}

              {/* Уведомление об успешной отправке доработки */}
              {revisionSuccess && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
                  <p className="text-orange-400 font-semibold">✅ Запрос на доработку отправлен!</p>
                  <p className="text-white/50 text-sm mt-1">Администратор получил уведомление и свяжется с вами.</p>
                </div>
              )}

              {/* Стоимость и оплата */}
              {order.price && (
                <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs mb-1">Стоимость работы</p>
                    <p className="text-white text-xl font-bold">{formatPrice(order.price)}</p>
                  </div>
                  {order.status === 'awaiting_payment' && (
                    <Button
                      className="gap-2 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-black font-bold hover:opacity-90"
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
                  className="w-full gap-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  onClick={() => setShowRevisionForm(true)}
                >
                  <RefreshCw className="w-4 h-4" />
                  Запросить доработку
                </Button>
              )}

              {/* Форма доработки */}
              {showRevisionForm && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 space-y-4">
                  <h3 className="text-orange-400 font-semibold text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Запрос на доработку
                  </h3>
                  <div>
                    <label className="text-white/60 text-xs mb-1.5 block">Опишите замечания</label>
                    <Textarea
                      value={revisionNote}
                      onChange={e => setRevisionNote(e.target.value)}
                      placeholder="Подробно опишите, что нужно исправить или доработать..."
                      rows={4}
                      className="bg-white/5 border-white/10 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-xs mb-1.5 block">Прикрепить файлы (необязательно)</label>
                    <div
                      className="border border-dashed border-white/20 rounded-lg p-3 cursor-pointer hover:border-orange-500/40 transition-colors text-center"
                      onClick={() => revisionFileInputRef.current?.click()}
                    >
                      <Upload className="w-5 h-5 text-white/20 mx-auto mb-1" />
                      <p className="text-white/30 text-xs">Нажмите для выбора файлов</p>
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
                          <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                            <FileText className="w-3.5 h-3.5" />
                            <span className="flex-1 truncate">{f.name}</span>
                            <button
                              onClick={() => setRevisionFiles(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-white/30 hover:text-red-400"
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
                      className="flex-1 border-white/10 text-white/50"
                      onClick={() => { setShowRevisionForm(false); setRevisionNote(''); setRevisionFiles([]) }}
                    >
                      Отмена
                    </Button>
                    <Button
                      className="flex-1 gap-2 bg-orange-600 hover:bg-orange-500 text-white"
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
              <p className="text-white/25 text-xs text-right">Заявка создана {formatDate(order.createdAt)}</p>
            </div>
          ) : (
            <div className="p-12 text-center text-white/40">Заявка не найдена</div>
          )}
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
