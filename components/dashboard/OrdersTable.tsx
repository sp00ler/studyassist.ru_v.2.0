'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaymentModal } from './PaymentModal'
import { OrderViewModal } from './OrderViewModal'
import { formatDate, formatPrice, formatOrderId, getOrderTypeLabel, getStatusLabel } from '@/lib/utils'

// Win95 token classes for order status — local to owned dashboard components,
// replaces lib/utils.ts getStatusColor() (legacy blue/purple/green/etc, out of
// scope: lib/utils.ts isn't in this migration's owned file list).
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

interface Order {
  id: string
  type: string
  subject: string
  deadline: string
  status: string
  price: string | number | null
  paymentLink: string | null
  createdAt: string
}

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; orderId: string; amount: number | null; link: string | null }>({
    open: false,
    orderId: '',
    amount: null,
    link: null,
  })
  const [viewOrderId, setViewOrderId] = useState<string | null>(null)

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 border border-chrome-dark bg-chrome/20">
        <p className="text-ink text-lg mb-2">Заявок пока нет</p>
        <p className="text-ink-soft text-sm">Оставьте первую заявку на главной странице</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block window overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-chrome border-b border-chrome-shadow">
              <th className="text-left text-ink text-xs font-semibold px-6 py-3 uppercase tracking-wide">№</th>
              <th className="text-left text-ink text-xs font-semibold px-6 py-3 uppercase tracking-wide">Тип работы</th>
              <th className="text-left text-ink text-xs font-semibold px-6 py-3 uppercase tracking-wide">Предмет</th>
              <th className="text-left text-ink text-xs font-semibold px-6 py-3 uppercase tracking-wide">Дедлайн</th>
              <th className="text-left text-ink text-xs font-semibold px-6 py-3 uppercase tracking-wide">Статус</th>
              <th className="text-left text-ink text-xs font-semibold px-6 py-3 uppercase tracking-wide">Сумма</th>
              <th className="text-left text-ink text-xs font-semibold px-6 py-3 uppercase tracking-wide">Действие</th>
            </tr>
          </thead>
          <tbody className="bg-paper">
            {orders.map((order, idx) => (
              <tr
                key={order.id}
                className={`border-b border-chrome-dark/40 hover:bg-chrome/20 transition-colors cursor-pointer ${idx % 2 === 0 ? '' : 'bg-chrome/10'}`}
                onClick={() => setViewOrderId(order.id)}
              >
                <td className="px-6 py-4">
                  <span className="text-ink-soft text-sm font-mono">{formatOrderId(order.id)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-ink text-sm">{getOrderTypeLabel(order.type)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-ink-soft text-sm">{order.subject}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-ink-soft text-sm">{formatDate(order.deadline)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold border ${getStatusToken(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-ink text-sm font-medium font-mono">{formatPrice(order.price)}</span>
                </td>
                <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                  {order.status === 'awaiting_payment' && order.price ? (
                    <Button
                      size="sm"
                      variant="amber"
                      className="gap-1"
                      onClick={() => setPaymentModal({
                        open: true,
                        orderId: order.id,
                        amount: parseFloat(String(order.price)),
                        link: order.paymentLink,
                      })}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Оплатить
                    </Button>
                  ) : (
                    <span className="text-ink-soft text-sm">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="window p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-ink-soft text-xs font-mono">{formatOrderId(order.id)}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold border ${getStatusToken(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-ink font-medium mb-1">{getOrderTypeLabel(order.type)}</p>
            <p className="text-ink-soft text-sm mb-3">{order.subject}</p>
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-ink-soft">Дедлайн: </span>
                <span className="text-ink">{formatDate(order.deadline)}</span>
              </div>
              {order.price && (
                <span className="text-title font-bold font-mono">{formatPrice(order.price)}</span>
              )}
            </div>
            {order.status === 'awaiting_payment' && order.price && (
              <Button
                size="sm"
                variant="amber"
                className="w-full mt-3 gap-2"
                onClick={() => setPaymentModal({
                  open: true,
                  orderId: order.id,
                  amount: parseFloat(String(order.price)),
                  link: order.paymentLink,
                })}
              >
                <CreditCard className="w-4 h-4" />
                Оплатить работу
              </Button>
            )}
          </div>
        ))}
      </div>

      <PaymentModal
        open={paymentModal.open}
        onClose={() => setPaymentModal({ ...paymentModal, open: false })}
        orderId={paymentModal.orderId}
        amount={paymentModal.amount}
        existingPaymentLink={paymentModal.link}
      />

      <OrderViewModal
        orderId={viewOrderId}
        onClose={() => setViewOrderId(null)}
      />
    </>
  )
}
