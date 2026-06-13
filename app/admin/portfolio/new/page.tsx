'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

export default function NewPortfolioPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    workType: 'coursework',
    subject: '',
    description: '',
    previewText: '',
    fileUrl: '',
    published: false,
    sortOrder: 0,
  })

  const set = (key: keyof typeof form, value: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      toast({ title: 'Пример добавлен' })
      router.push('/admin/portfolio')
    } catch (err) {
      toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/portfolio">
          <Button variant="ghost" size="sm" className="gap-2 text-white/50">
            <ArrowLeft className="w-4 h-4" /> Назад
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-white">Новый пример работы</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Тип работы *</Label>
              <Select value={form.workType} onValueChange={(v) => set('workType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="essay">Реферат / эссе</SelectItem>
                  <SelectItem value="coursework">Курсовая работа</SelectItem>
                  <SelectItem value="diploma">ВКР / Дипломная</SelectItem>
                  <SelectItem value="lab">Лабораторная</SelectItem>
                  <SelectItem value="presentation">Презентация</SelectItem>
                  <SelectItem value="practice-report">Отчёт по практике</SelectItem>
                  <SelectItem value="uir">УИР</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="mb-2 block">Порядок (меньше = выше)</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set('sortOrder', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Название работы *</Label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Курсовая по экономике организации, 2024"
              required
            />
          </div>

          <div>
            <Label className="mb-2 block">Предмет / дисциплина</Label>
            <Input
              value={form.subject}
              onChange={(e) => set('subject', e.target.value)}
              placeholder="Экономика организации"
            />
          </div>

          <div>
            <Label className="mb-2 block">Краткое описание (для карточки)</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Анализ финансово-хозяйственной деятельности предприятия..."
              rows={3}
            />
          </div>

          <div>
            <Label className="mb-2 block">
              Фрагмент работы <span className="text-white/30 text-xs">(обезличенный текст для показа на сайте)</span>
            </Label>
            <Textarea
              value={form.previewText}
              onChange={(e) => set('previewText', e.target.value)}
              placeholder="В данной работе рассматривается... Объектом исследования является..."
              rows={5}
            />
          </div>

          <div>
            <Label className="mb-2 block">Ссылка на PDF (необязательно)</Label>
            <Input
              value={form.fileUrl}
              onChange={(e) => set('fileUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => set('published', !form.published)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                form.published
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
              }`}
            >
              {form.published ? '✓ Показывать на сайте' : 'Скрыто (черновик)'}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Добавить
          </Button>
          <Link href="/admin/portfolio">
            <Button type="button" variant="outline">Отмена</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
