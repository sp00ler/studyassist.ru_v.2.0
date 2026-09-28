'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, BookOpen, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate, cn } from '@/lib/utils'

interface Post {
  id: string
  type: 'blog' | 'news'
  title: string
  slug: string
  published: boolean
  publishedAt: string | null
  createdAt: string
  excerpt: string | null
  coverImage: string | null
}

const TYPE_TABS = [
  { value: 'all', label: 'Все' },
  { value: 'blog', label: 'Блог', icon: BookOpen },
  { value: 'news', label: 'Новости', icon: Newspaper },
]

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'blog' | 'news'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    const url = tab === 'all' ? '/api/admin/posts' : `/api/admin/posts?type=${tab}`
    const res = await fetch(url)
    const data = await res.json()
    setPosts(data.posts || [])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [tab])

  const togglePublish = async (post: Post) => {
    await fetch(`/api/admin/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !post.published }),
    })
    fetchPosts()
  }

  const deletePost = async (id: string) => {
    if (!confirm('Удалить публикацию?')) return
    setDeleting(id)
    await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' })
    setPosts((prev) => prev.filter((p) => p.id !== id))
    setDeleting(null)
  }

  return (
    <div className="window pixel-shadow">
      <div className="titlebar">
        <h1 className="truncate">Блог и новости</h1>
      </div>
      <div className="bg-paper p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-ink-soft text-sm">Управление публикациями</p>
        <Link href="/admin/posts/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Новая публикация
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-chrome p-1 w-fit border border-chrome-shadow">
        {TYPE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value as typeof tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-[11px] font-display transition-all',
              tab === t.value ? 'btn-95-primary' : 'text-ink-soft hover:text-ink'
            )}
          >
            {t.icon && <t.icon className="w-3.5 h-3.5" />}
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-title animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border border-chrome-dark bg-chrome/20">
          <BookOpen className="w-12 h-12 text-ink-soft mx-auto mb-3" />
          <p className="text-ink-soft">Публикаций нет</p>
          <Link href="/admin/posts/new">
            <Button variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Создать первую
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bevel-out bg-chrome/20 px-5 py-4 flex items-center gap-4"
            >
              {/* Type badge */}
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-1 border flex-shrink-0',
                post.type === 'blog'
                  ? 'bg-title/10 text-title border-title'
                  : 'bg-title-alt/10 text-ink border-title-alt'
              )}>
                {post.type === 'blog' ? 'Блог' : 'Новость'}
              </span>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-ink font-medium truncate">{post.title}</p>
                <p className="text-ink-soft text-xs mt-0.5">/{post.slug} · {formatDate(post.createdAt)}</p>
              </div>

              {/* Published */}
              <span className={cn(
                'text-xs px-2 py-1 border flex-shrink-0',
                post.published
                  ? 'bg-success/15 text-success border-success'
                  : 'bg-chrome text-ink-soft border-chrome-shadow'
              )}>
                {post.published ? 'Опубликовано' : 'Черновик'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePublish(post)}
                  title={post.published ? 'Снять с публикации' : 'Опубликовать'}
                  className="btn-95 w-9 h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 flex items-center justify-center"
                >
                  {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Link href={`/admin/posts/${post.id}`}>
                  <button className="btn-95 w-9 h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </button>
                </Link>
                <button
                  onClick={() => deletePost(post.id)}
                  disabled={deleting === post.id}
                  className="btn-95 w-9 h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-danger hover:text-white"
                >
                  {deleting === post.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
