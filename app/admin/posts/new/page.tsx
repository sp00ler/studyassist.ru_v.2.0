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

export default function NewPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

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
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/posts">
          <Button variant="ghost" size="sm" className="gap-2 text-white/50">
            <ArrowLeft className="w-4 h-4" /> Назад
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-white">Новая публикация</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Тип</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all w-full justify-center ${
                  form.published
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
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
              onChange={(e) => {
                set('title', e.target.value)
                if (!form.slug) {
                  // auto-slug will be generated server-side
                }
              }}
              placeholder="Как написать курсовую работу за 3 дня"
              required
            />
          </div>

          <div>
            <Label htmlFor="slug" className="mb-2 block">
              URL-slug <span className="text-white/30 text-xs">(оставьте пустым для автогенерации)</span>
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

          <div>
            <Label htmlFor="coverImage" className="mb-2 block">URL обложки (необязательно)</Label>
            <Input
              id="coverImage"
              value={form.coverImage}
              onChange={(e) => set('coverImage', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Content editor */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <Label htmlFor="content">Содержимое (Markdown) *</Label>
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
            >
              {preview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {preview ? 'Редактор' : 'Превью'}
            </button>
          </div>

          {preview ? (
            <div
              className="prose prose-invert prose-sm max-w-none min-h-[320px] text-white/80 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
            />
          ) : (
            <Textarea
              id="content"
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              placeholder={`# Заголовок\n\nТекст статьи...\n\n## Подзаголовок\n\nПродолжение...`}
              rows={16}
              className="font-mono text-sm"
              required
            />
          )}
          <p className="text-xs text-white/30 mt-2">Поддерживается Markdown: **жирный**, *курсив*, ## заголовки, - списки</p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {form.published ? 'Опубликовать' : 'Сохранить черновик'}
          </Button>
          <Link href="/admin/posts">
            <Button type="button" variant="outline">Отмена</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}

// Simple markdown renderer (no deps needed for basic use)
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-white mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-white mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-white mt-6 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/^(?!<)(.+)$/gm, '<p class="mb-3">$1</p>')
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1 rounded text-[#C5FF45] text-xs">$1</code>')
}
