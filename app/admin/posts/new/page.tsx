'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { CoverImageField } from '@/components/admin/CoverImageField'

export default function NewPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const [form, setForm] = useState({
    type: 'blog' as 'blog' | 'news',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    published: false,
  })

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      toast({ title: 'Публикация создана' })
      router.push('/admin/posts')
    } catch (err) {
      toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="window pixel-shadow max-w-3xl">
      <div className="titlebar">
        <h1 className="truncate">Новая публикация</h1>
      </div>
      <div className="bg-paper p-4 sm:p-6">
      <Link href="/admin/posts" className="inline-flex items-center gap-2 text-ink-soft hover:text-ink text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Назад
      </Link>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bevel-out bg-chrome/20 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Тип</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Блог</SelectItem>
                  <SelectItem value="news">Новость</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => set('published', !form.published)}
                className={`btn-95 flex items-center gap-2 px-4 py-2 text-[11px] font-display w-full justify-center ${
                  form.published ? 'bg-success/15 text-success' : 'text-ink-soft'
                }`}
              >
                {form.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {form.published ? 'Опубликовано' : 'Черновик'}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="title" className="mb-2 block">Заголовок *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Как написать курсовую работу за 3 дня"
              required
            />
          </div>

          <div>
            <Label htmlFor="slug" className="mb-2 block">
              URL-slug <span className="text-ink-soft text-xs">(оставьте пустым для автогенерации)</span>
            </Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="kak-napisat-kursovuyu"
            />
          </div>

          <div>
            <Label htmlFor="excerpt" className="mb-2 block">Краткое описание (анонс)</Label>
            <Textarea
              id="excerpt"
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              placeholder="Краткий анонс для карточки на странице блога..."
              rows={2}
            />
          </div>

          <CoverImageField value={form.coverImage} onChange={(url) => set('coverImage', url)} />
        </div>

        {/* WYSIWYG Content editor */}
        <div className="bevel-out bg-chrome/20 p-6">
          <div className="flex items-center justify-between mb-3">
            <Label>Содержимое *</Label>
            <button
              type="button"
              onClick={() => setPreviewMode((v) => !v)}
              className="text-xs text-ink-soft hover:text-ink flex items-center gap-1 transition-colors"
            >
              {previewMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {previewMode ? 'Редактор' : 'Превью'}
            </button>
          </div>

          {previewMode ? (
            <div
              className="prose-sa min-h-[320px] field-95 px-4 py-3"
              dangerouslySetInnerHTML={{ __html: form.content }}
            />
          ) : (
            <RichTextEditor
              value={form.content}
              onChange={(html) => set('content', html)}
              placeholder="Начните писать содержимое статьи..."
            />
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || !form.title || !form.content} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {form.published ? 'Опубликовать' : 'Сохранить черновик'}
          </Button>
          <Link href="/admin/posts">
            <Button type="button" variant="outline">Отмена</Button>
          </Link>
        </div>
      </form>
      </div>
    </div>
  )
}
