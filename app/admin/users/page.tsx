'use client'

import { useEffect, useState } from 'react'
import { Loader2, Users, Shield, Edit2, X, Save, Search } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { countryFlag, parseOs, parseBrowser } from '@/lib/geo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface User {
  id: string
  name: string | null
  email: string
  phone: string | null
  telegramId: string | null
  isAdmin: boolean
  provider: string | null
  createdAt: string
  lastLoginAt: string | null
  prevLoginAt: string | null
  lastIp: string | null
  prevIp: string | null
  lastCountry: string | null
  lastUserAgent: string | null
  _count: { orders: number }
}

function EditUserModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: (u: User) => void }) {
  const [name, setName] = useState(user.name || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [telegramId, setTelegramId] = useState(user.telegramId || '')
  const [email, setEmail] = useState(user.email)
  const [isAdmin, setIsAdmin] = useState(user.isAdmin)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, telegramId, email, isAdmin }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Ошибка'); return }
      onSaved({ ...user, name, phone, telegramId, email, isAdmin })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-white font-semibold">Редактировать пользователя</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-white/60 text-xs">Имя</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-white/60 text-xs">Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-white/60 text-xs">Телефон</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="+7..." />
          </div>
          <div>
            <Label className="text-white/60 text-xs">Telegram ID</Label>
            <Input value={telegramId} onChange={e => setTelegramId(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="123456789" />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isAdmin"
              checked={isAdmin}
              onChange={e => setIsAdmin(e.target.checked)}
              className="w-4 h-4 accent-[#6C3EF4]"
            />
            <Label htmlFor="isAdmin" className="text-white/80 text-sm cursor-pointer">Администратор</Label>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-white/60">Отмена</Button>
          <Button onClick={save} disabled={loading} className="flex-1 bg-[#6C3EF4] hover:bg-[#5b2de3]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />Сохранить</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<User | null>(null)

  const loadUsers = (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '20' })
    if (search) params.set('search', search)
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setTotal(d.total || 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadUsers(1)
  }

  const providerLabel: Record<string, string> = {
    credentials: '🔑 Пароль',
    vk: '💙 ВК',
    mailru: '📧 Mail.ru',
    yandex: '🟡 Яндекс',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Пользователи</h1>
          <p className="text-white/50 text-sm">Всего: {total}</p>
        </div>
      </div>

      {/* Поиск */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени, email, телефону..."
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
        <Button type="submit" className="bg-[#6C3EF4] hover:bg-[#5b2de3] shrink-0">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-[#6C3EF4] animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/40 text-xs px-4 py-3 uppercase">Пользователь</th>
                    <th className="text-left text-white/40 text-xs px-4 py-3 uppercase">Вход</th>
                    <th className="text-left text-white/40 text-xs px-4 py-3 uppercase">IP / Страна</th>
                    <th className="text-left text-white/40 text-xs px-4 py-3 uppercase">ОС / Браузер</th>
                    <th className="text-left text-white/40 text-xs px-4 py-3 uppercase">Заявок</th>
                    <th className="text-left text-white/40 text-xs px-4 py-3 uppercase">Роль</th>
                    <th className="text-white/40 text-xs px-4 py-3 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{user.name || '—'}</p>
                          <p className="text-white/50 text-xs">{user.email}</p>
                          {user.phone && <p className="text-white/40 text-xs">{user.phone}</p>}
                          {user.telegramId && <p className="text-blue-400/70 text-xs">TG: {user.telegramId}</p>}
                          <p className="text-white/25 text-xs mt-0.5">{providerLabel[user.provider || 'credentials'] || user.provider}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.lastLoginAt ? (
                          <div>
                            <p className="text-white/70 text-xs">{formatDateTime(user.lastLoginAt)}</p>
                            {user.prevLoginAt && (
                              <p className="text-white/30 text-xs">пред: {formatDateTime(user.prevLoginAt)}</p>
                            )}
                          </div>
                        ) : <span className="text-white/25 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {user.lastIp ? (
                          <div>
                            <span className="text-white/70 text-xs font-mono">{user.lastIp}</span>
                            {user.lastCountry && (
                              <span className="ml-1 text-base" title={user.lastCountry}>{countryFlag(user.lastCountry)}</span>
                            )}
                            {user.prevIp && user.prevIp !== user.lastIp && (
                              <p className="text-white/30 text-xs font-mono">пред: {user.prevIp}</p>
                            )}
                          </div>
                        ) : <span className="text-white/25 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white/70 text-xs">{parseOs(user.lastUserAgent)}</p>
                        <p className="text-white/40 text-xs">{parseBrowser(user.lastUserAgent)}</p>
                      </td>
                      <td className="px-4 py-3 text-white/80">{user._count.orders}</td>
                      <td className="px-4 py-3">
                        {user.isAdmin ? (
                          <span className="flex items-center gap-1 text-[#6C3EF4] text-xs font-medium">
                            <Shield className="w-3.5 h-3.5" /> Администратор
                          </span>
                        ) : (
                          <span className="text-white/30 text-xs">Пользователь</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditUser(user)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">Пользователей не найдено</p>
              </div>
            )}
          </div>

          {total > 20 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/60 disabled:opacity-30 hover:bg-white/10 transition-colors text-sm">←</button>
              <span className="text-white/60 text-sm">Страница {page} из {Math.ceil(total / 20)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/60 disabled:opacity-30 hover:bg-white/10 transition-colors text-sm">→</button>
            </div>
          )}
        </>
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={updated => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))}
        />
      )}
    </div>
  )
}
