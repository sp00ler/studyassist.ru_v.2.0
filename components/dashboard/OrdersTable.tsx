'use client'

import { useState } from 'react'
import { CreditCard, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaymentModal } from './PaymentModal'
import { OrderViewModal } from './OrderViewModal'
import { formatDate, formatPrice, formatOrderId, getOrderTypeLabel, getStatusLabel, getStatusColor } from '@/lib/utils'

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
      <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
        <p className="text-white/40 text-lg mb-2">Заявок пока нет</p>
        <p className="text-white/30 text-sm">Оставьте первую заявку на главной странице</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider">№</th>
              <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider">Тип работы</th>
              <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider">Предмет</th>
              <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider">Дедлайн</th>
              <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider">Статус</th>
              <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider">Сумма</th>
              <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider">Действие</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr
                key={order.id}
                className={`border-b border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                onClick={() => setViewOrderId(order.id)}
              >
                <td className="px-6 py-4">
                  <span className="text-white/60 text-sm font-mono">{formatOrderId(order.id)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white text-sm">{getOrderTypeLabel(order.type)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white/80 text-sm">{order.subject}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white/60 text-sm">{formatDate(order.deadline)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white/80 text-sm font-medium">{formatPrice(order.price)}</span>
                </td>
                <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                  {order.status === 'awaiting_payment' && order.price ? (
                    <Button
                      size="sm"
                      className="gap-1 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-black font-bold hover:opacity-90"
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
                    <span className="text-white/30 text-sm">—</span>
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
          <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-white/50 text-xs font-mono">{formatOrderId(order.id)}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-white font-medium mb-1">{getOrderTypeLabel(order.type)}</p>
            <p className="text-white/60 text-sm mb-3">{order.subject}</p>
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-white/40">Дедлайн: </span>
                <span className="text-white/70">{formatDate(order.deadline)}</span>
              </div>
              {order.price && (
                <span className="text-[#F59E0B] font-bold">{formatPrice(order.price)}</span>
              )}
            </div>
            {order.status === 'awaiting_payment' && order.price && (
              <Button
                size="sm"
                className="w-full mt-3 gap-2 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-black font-bold"
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
