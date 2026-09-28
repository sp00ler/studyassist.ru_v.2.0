'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { formatDateTime, formatPrice, formatOrderId } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const STATUS_LABELS: Record<string, string> = {
  pending: 'В ожидании',
  succeeded: 'Успешно',
  cancelled: 'Отменён',
}

const STATUS_TOKEN_CLASSES: Record<string, string> = {
  pending: 'bg-warning/15 text-warning border-warning',
  succeeded: 'bg-success/15 text-success border-success',
  cancelled: 'bg-danger/15 text-danger border-danger',
}
const getStatusToken = (status: string) => STATUS_TOKEN_CLASSES[status] || 'bg-chrome text-ink-soft border-chrome-shadow'
const getStatusLabel = (status: string) => STATUS_LABELS[status] || status

interface Payment {
  id: string
  orderId: string
  amount: string | number
  status: string
  yukassaId: string | null
  createdAt: string
  user: { id: string; email: string; name: string | null } | null
  order: { id: string } | null
}

interface Totals {
  status: string
  count: number
  sum: string | number | null
}

export default function AdminPaymentsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [totals, setTotals] = useState<Totals[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isSuperAdmin = !!session?.user?.isSuperAdmin

  const fetchPayments = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/payments?page=${page}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ошибка загрузки')
        return
      }
      setPayments(data.payments || [])
      setTotal(data.total || 0)
      setTotals(data.totals || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperAdmin) fetchPayments()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isSuperAdmin])

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-title animate-spin" />
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="window pixel-shadow max-w-md">
        <div className="titlebar">
          <span className="truncate">Ошибка доступа</span>
        </div>
        <div className="bg-paper p-6 text-center">
          <p className="font-display text-[13px] text-danger mb-2">Доступ запрещён</p>
          <p className="text-ink-soft text-sm">Раздел «Платежи» доступен только главному администратору.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="window pixel-shadow">
      <div className="titlebar">
        <h1 className="truncate">Платежи</h1>
      </div>
      <div className="bg-paper p-4 sm:p-6">
        <p className="text-ink-soft text-sm mb-5">Всего: {total}</p>

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        {/* Totals panel */}
        {totals.length > 0 && (
          <div className="window mb-6 overflow-hidden">
            <div className="bg-chrome border-b border-chrome-shadow px-4 py-2">
              <p className="text-ink text-xs uppercase font-semibold">Итоги по статусам</p>
            </div>
            <div className="bg-paper p-4 flex flex-wrap gap-4">
              {totals.map((t) => (
                <div key={t.status} className={`border px-3 py-2 ${getStatusToken(t.status)}`}>
                  <p className="text-xs font-semibold">{getStatusLabel(t.status)}</p>
                  <p className="text-sm font-mono mt-1">{t.count} шт. · {formatPrice(t.sum)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-title animate-spin" />
          </div>
        ) : (
          <>
            <div className="window overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-chrome border-b border-chrome-shadow">
                      <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">Дата</th>
                      <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">Пользователь</th>
                      <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">Заявка</th>
                      <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">Сумма</th>
                      <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">Статус</th>
                      <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">ID платежа</th>
                    </tr>
                  </thead>
                  <tbody className="bg-paper">
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-chrome-dark/40 hover:bg-chrome/20 transition-colors">
                        <td className="px-4 py-3 text-ink-soft text-xs">{formatDateTime(p.createdAt)}</td>
                        <td className="px-4 py-3">
                          <p className="text-ink text-sm">{p.user?.name || '—'}</p>
                          <p className="text-ink-soft text-xs">{p.user?.email || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-ink-soft text-xs font-mono">
                          {p.order ? formatOrderId(p.order.id) : '—'}
                        </td>
                        <td className="px-4 py-3 text-ink text-sm font-mono">{formatPrice(p.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 border font-semibold ${getStatusToken(p.status)}`}>
                            {getStatusLabel(p.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-soft text-xs font-mono">{p.yukassaId || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {payments.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-ink-soft">Платежей не найдено</p>
                </div>
              )}
            </div>

            {total > 50 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Предыдущая страница">
                  <span aria-hidden="true">←</span>
                </Button>
                <span className="text-ink-soft text-sm" aria-live="polite">Страница {page} из {Math.ceil(total / 50)}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 50)} aria-label="Следующая страница">
                  <span aria-hidden="true">→</span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
