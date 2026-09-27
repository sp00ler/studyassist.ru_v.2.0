'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

export default function EditPortfolioPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    // Fetch from list since there's no GET /[id] for portfolio
    fetch('/api/admin/portfolio')
      .then((r) => r.json())
      .then(({ items }) => {
        const item = items?.find((i: { id: string }) => i.id === params.id)
        if (item) {
          setForm({
            title: item.title,
            workType: item.workType,
            subject: item.subject || '',
            description: item.description || '',
            previewText: item.previewText || '',
            fileUrl: item.fileUrl || '',
            published: item.published,
            sortOrder: item.sortOrder,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const set = (key: keyof typeof form, value: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/portfolio/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      toast({ title: 'Сохранено' })
      router.push('/admin/portfolio')
    } catch (err) {
      toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-title animate-spin" />
    </div>
  )

  return (
    <div className="window pixel-shadow max-w-2xl">
      <div className="titlebar">
        <h1 className="truncate">Редактировать пример</h1>
      </div>
      <div className="bg-paper p-4 sm:p-6">
      <Link href="/admin/portfolio" className="inline-flex items-center gap-2 text-ink-soft hover:text-ink text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Назад
      </Link>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bevel-out bg-chrome/20 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Тип работы</Label>
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
            <div>
              <Label className="mb-2 block">Порядок</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Название *</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>

          <div>
            <Label className="mb-2 block">Предмет</Label>
            <Input value={form.subject} onChange={(e) => set('subject', e.target.value)} />
          </div>

          <div>
            <Label className="mb-2 block">Описание</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
          </div>

          <div>
            <Label className="mb-2 block">Фрагмент работы</Label>
            <Textarea value={form.previewText} onChange={(e) => set('previewText', e.target.value)} rows={5} />
          </div>

          <div>
            <Label className="mb-2 block">Ссылка на PDF</Label>
            <Input value={form.fileUrl} onChange={(e) => set('fileUrl', e.target.value)} placeholder="https://..." />
          </div>

          <button
            type="button"
            onClick={() => set('published', !form.published)}
            className={`btn-95 flex items-center gap-2 px-4 py-2 text-sm font-medium ${
              form.published ? 'bg-success/15 text-success' : 'text-ink-soft'
            }`}
          >
            {form.published ? '✓ Показывать на сайте' : 'Скрыто'}
          </button>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Сохранить
          </Button>
          <Link href="/admin/portfolio">
            <Button type="button" variant="outline">Отмена</Button>
          </Link>
        </div>
      </form>
      </div>
    </div>
  )
}
