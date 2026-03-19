'use client'

import { useState } from 'react'
import { Loader2, CreditCard, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatPrice, formatOrderId } from '@/lib/utils'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  orderId: string
  amount: number | string | null
  existingPaymentLink?: string | null
}

export function PaymentModal({ open, onClose, orderId, amount, existingPaymentLink }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState(existingPaymentLink || '')
  const [error, setError] = useState('')

  const handleGetPaymentLink = async () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (res.ok) {
        setPaymentUrl(data.paymentUrl)
        window.open(data.paymentUrl, '_blank')
      } else {
        setError(data.error || 'Ошибка создания платежа')
      }
    } catch {
      setError('Произошла ошибка. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#6C3EF4]" />
            Оплата заявки
          </DialogTitle>
          <DialogDescription>
            Заявка {formatOrderId(orderId)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-white/60 text-sm mb-1">Стоимость работы</p>
            <p className="text-3xl font-bold text-[#F59E0B]">{formatPrice(amount)}</p>
          </div>

          <div className="text-white/60 text-sm space-y-2">
            <p>После нажатия кнопки вы перейдёте на защищённую страницу оплаты ЮKassa.</p>
            <p>Принимаем: банковские карты, СБП, электронные кошельки.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Отмена
            </Button>
            <Button
              onClick={handleGetPaymentLink}
              disabled={loading}
              className="flex-1 gap-2 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] hover:opacity-90 text-black font-bold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Перейти к оплате
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
