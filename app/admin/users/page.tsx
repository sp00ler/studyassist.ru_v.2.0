'use client'

import { useEffect, useState } from 'react'
import { Loader2, Users, Shield, Edit2, X, Save, Search, Trash2 } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { countryFlag, countryName, parseOs, parseBrowser } from '@/lib/geo'
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

function EditUserModal({ user, onClose, onSaved, onDeleted }: { user: User; onClose: () => void; onSaved: (u: User) => void; onDeleted: (id: string) => void }) {
  const [name, setName] = useState(user.name || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [telegramId, setTelegramId] = useState(user.telegramId || '')
  const [email, setEmail] = useState(user.email)
  const [isAdmin, setIsAdmin] = useState(user.isAdmin)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState('')

  const deleteUser = async () => {
    if (!confirm(`Удалить пользователя ${user.email}?\nБудут удалены все его заявки и платежи. Это действие необратимо.`)) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Ошибка'); return }
      onDeleted(user.id)
      onClose()
    } finally {
      setDeleteLoading(false)
    }
  }

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
    <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="window pixel-shadow w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="titlebar">
          <span className="truncate">Редактировать пользователя</span>
          <button onClick={onClose} className="titlebar-btn hover:bg-danger hover:text-white" aria-label="Закрыть"><X className="w-3 h-3" /></button>
        </div>
        <div className="bg-paper p-5 space-y-4">
          <div>
            <Label className="text-ink-soft text-xs">Имя</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-ink-soft text-xs">Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-ink-soft text-xs">Телефон</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" placeholder="+7..." />
          </div>
          <div>
            <Label className="text-ink-soft text-xs">Telegram ID</Label>
            <Input value={telegramId} onChange={e => setTelegramId(e.target.value)} className="mt-1" placeholder="123456789" />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isAdmin"
              checked={isAdmin}
              onChange={e => setIsAdmin(e.target.checked)}
              className="w-4 h-4 field-95 accent-title"
            />
            <Label htmlFor="isAdmin" className="text-ink text-sm cursor-pointer">Администратор</Label>
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
        <div className="flex gap-2 p-5 border-t border-chrome-dark bg-paper">
          <Button variant="destructive" onClick={deleteUser} disabled={deleteLoading}
            className="px-3">
            {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Отмена</Button>
          <Button onClick={save} disabled={loading} className="flex-1">
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
    credentials: 'Пароль',
    vk: 'ВКонтакте',
    mailru: 'Mail.ru',
    yandex: 'Яндекс',
  }

  return (
    <div className="window pixel-shadow">
      <div className="titlebar">
        <h1 className="truncate">Пользователи</h1>
      </div>
      <div className="bg-paper p-4 sm:p-6">
      <p className="text-ink-soft text-sm mb-5">Всего: {total}</p>

      {/* Поиск */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени, email, телефону..."
        />
        <Button type="submit" className="shrink-0">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-title animate-spin" />
        </div>
      ) : (
        <>
          <div className="window overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-chrome border-b border-chrome-shadow">
                    <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">Пользователь</th>
                    <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">Вход</th>
                    <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">IP / Страна</th>
                    <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">ОС / Браузер</th>
                    <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">Заявок</th>
                    <th className="text-left text-ink text-xs px-4 py-3 uppercase font-semibold">Роль</th>
                    <th className="text-ink text-xs px-4 py-3 uppercase font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="bg-paper">
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-chrome-dark/40 hover:bg-chrome/20 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-ink font-medium">{user.name || '—'}</p>
                          <p className="text-ink-soft text-xs">{user.email}</p>
                          {user.phone && <p className="text-ink-soft text-xs">{user.phone}</p>}
                          {user.telegramId && <p className="text-title text-xs">TG: {user.telegramId}</p>}
                          <p className="text-ink-soft text-xs mt-0.5">{providerLabel[user.provider || 'credentials'] || user.provider}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.lastLoginAt ? (
                          <div>
                            <p className="text-ink-soft text-xs">{formatDateTime(user.lastLoginAt)}</p>
                            {user.prevLoginAt && (
                              <p className="text-ink-soft text-xs">пред: {formatDateTime(user.prevLoginAt)}</p>
                            )}
                          </div>
                        ) : <span className="text-ink-soft text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {user.lastIp ? (
                          <div>
                            <span className="text-ink-soft text-xs font-mono">{user.lastIp}</span>
                            {user.lastCountry && (
                              <span className="ml-1.5" title={user.lastCountry}>
                                {countryFlag(user.lastCountry)}
                                <span className="text-ink-soft text-xs ml-1">{countryName(user.lastCountry)}</span>
                              </span>
                            )}
                            {user.prevIp && user.prevIp !== user.lastIp && (
                              <p className="text-ink-soft text-xs font-mono mt-0.5">пред: {user.prevIp}</p>
                            )}
                          </div>
                        ) : <span className="text-ink-soft text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink-soft text-xs">{parseOs(user.lastUserAgent)}</p>
                        <p className="text-ink-soft text-xs">{parseBrowser(user.lastUserAgent)}</p>
                      </td>
                      <td className="px-4 py-3 text-ink font-mono">{user._count.orders}</td>
                      <td className="px-4 py-3">
                        {user.isAdmin ? (
                          <span className="flex items-center gap-1 text-title text-xs font-medium">
                            <Shield className="w-3.5 h-3.5" /> Администратор
                          </span>
                        ) : (
                          <span className="text-ink-soft text-xs">Пользователь</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditUser(user)}
                          className="btn-95 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 flex items-center justify-center"
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
                <Users className="w-12 h-12 text-ink-soft mx-auto mb-3" />
                <p className="text-ink-soft">Пользователей не найдено</p>
              </div>
            )}
          </div>

          {total > 20 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-95 px-4 py-2 min-h-[44px] disabled:opacity-30 text-[12px] font-display">←</button>
              <span className="text-ink-soft text-sm">Страница {page} из {Math.ceil(total / 20)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
                className="btn-95 px-4 py-2 min-h-[44px] disabled:opacity-30 text-[12px] font-display">→</button>
            </div>
          )}
        </>
      )}
      </div>

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={updated => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))}
          onDeleted={id => { setUsers(prev => prev.filter(u => u.id !== id)); setTotal(t => t - 1) }}
        />
      )}
    </div>
  )
}
