'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, BookOpen, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Блог и новости</h1>
          <p className="text-white/50 text-sm mt-1">Управление публикациями</p>
        </div>
        <Link href="/admin/posts/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Новая публикация
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
        {TYPE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t.value
                ? 'bg-[#6C3EF4]/20 text-white border border-[#6C3EF4]/30'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {t.icon && <t.icon className="w-3.5 h-3.5" />}
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-[#6C3EF4] animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">Публикаций нет</p>
          <Link href="/admin/posts/new">
            <Button variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Создать первую
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4"
            >
              {/* Type badge */}
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg flex-shrink-0 ${
                post.type === 'blog'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {post.type === 'blog' ? 'Блог' : 'Новость'}
              </span>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{post.title}</p>
                <p className="text-white/40 text-xs mt-0.5">/{post.slug} · {formatDate(post.createdAt)}</p>
              </div>

              {/* Published */}
              <span className={`text-xs px-2 py-1 rounded-lg border flex-shrink-0 ${
                post.published
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-white/30 border-white/10'
              }`}>
                {post.published ? 'Опубликовано' : 'Черновик'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePublish(post)}
                  title={post.published ? 'Снять с публикации' : 'Опубликовать'}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Link href={`/admin/posts/${post.id}`}>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <Pencil className="w-4 h-4" />
                  </button>
                </Link>
                <button
                  onClick={() => deletePost(post.id)}
                  disabled={deleting === post.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  {deleting === post.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
