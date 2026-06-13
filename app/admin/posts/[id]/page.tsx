'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    fetch(`/api/admin/posts/${params.id}`)
      .then((r) => r.json())
      .then(({ post }) => {
        if (post) setForm({
          type: post.type,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || '',
          content: post.content,
          coverImage: post.coverImage || '',
          published: post.published,
        })
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/posts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      toast({ title: 'Сохранено' })
      router.push('/admin/posts')
    } catch (err) {
      toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-[#C5FF45] animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/posts">
          <Button variant="ghost" size="sm" className="gap-2 text-white/50">
            <ArrowLeft className="w-4 h-4" /> Назад
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-white">Редактировать публикацию</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
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
            <Label className="mb-2 block">Заголовок *</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>

          <div>
            <Label className="mb-2 block">URL-slug</Label>
            <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} />
          </div>

          <div>
            <Label className="mb-2 block">Краткое описание</Label>
            <Textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} />
          </div>

          <div>
            <Label className="mb-2 block">URL обложки</Label>
            <Input value={form.coverImage} onChange={(e) => set('coverImage', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        {/* WYSIWYG Content editor */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <Label>Содержимое *</Label>
            <button
              type="button"
              onClick={() => setPreviewMode((v) => !v)}
              className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
            >
              {previewMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {previewMode ? 'Редактор' : 'Превью'}
            </button>
          </div>

          {previewMode ? (
            <div
              className="prose-sa min-h-[320px] bg-[#07070E] border border-white/10 rounded-xl px-4 py-3"
              dangerouslySetInnerHTML={{ __html: form.content }}
            />
          ) : (
            <RichTextEditor
              value={form.content}
              onChange={(html) => set('content', html)}
            />
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Сохранить
          </Button>
          <Link href="/admin/posts">
            <Button type="button" variant="outline">Отмена</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
