import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd.MM.yyyy', { locale: ru })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd.MM.yyyy HH:mm', { locale: ru })
}

export function formatPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '—'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `${num.toLocaleString('ru-RU')} ₽`
}

export function formatOrderId(id: string): string {
  const hash = id.replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')
  return `#${hash}`
}

export function getOrderTypeLabel(type: string): string {
  const types: Record<string, string> = {
    coursework: 'Курсовая работа',
    diploma: 'Дипломная работа (ВКР)',
    essay: 'Реферат / Эссе',
    lab: 'Лабораторная работа / Задача',
    presentation: 'Презентация / Отчёт',
    other: 'Другое',
  }
  return types[type] || type
}

export function getStatusLabel(status: string): string {
  const statuses: Record<string, string> = {
    new: 'Новая',
    in_progress: 'В работе',
    ready_for_review: 'Готова к проверке',
    awaiting_payment: 'Ожидает оплаты',
    paid: 'Оплачена',
    completed: 'Завершена',
    cancelled: 'Отменена',
  }
  return statuses[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    ready_for_review: 'bg-green-500/20 text-green-400 border-green-500/30',
    awaiting_payment: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    completed: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}
