'use client'

import { useEffect, useState } from 'react'
import { X, FileText, Calendar, Tag, MessageSquare, CreditCard, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatPrice, formatOrderId, getOrderTypeLabel, getStatusLabel, getStatusColor } from '@/lib/utils'
import { PaymentModal } from './PaymentModal'

interface OrderDetail {
  id: string
  type: string
  subject: string
  deadline: string
  description: string
  files: string | null
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

  useEffect(() => {
    if (!orderId) { setOrder(null); return }
    setLoading(true)
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

              {/* Файлы */}
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

              {/* Заметка от администратора */}
              {order.adminNote && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Сообщение от администратора
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{order.adminNote}</p>
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
