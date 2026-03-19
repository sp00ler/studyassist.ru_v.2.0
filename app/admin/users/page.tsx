'use client'

import { useEffect, useState } from 'react'
import { Loader2, Users, Shield } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  name: string | null
  email: string
  phone: string | null
  isAdmin: boolean
  provider: string | null
  createdAt: string
  _count: { orders: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/users?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || [])
        setTotal(d.total || 0)
      })
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Пользователи</h1>
        <p className="text-white/50 text-sm">Всего: {total}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-[#6C3EF4] animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/40 text-xs px-4 py-3 uppercase">Пользователь</th>
                    <th className="text-left text-white/40 text-xs px-4 py-3 uppercase">Провайдер</th>
                    <th className="text-left text-white/40 text-xs px-4 py-3 uppercase">Заявок</th>
                    <th className="text-left text-white/40 text-xs px-4 py-3 uppercase">Роль</th>
                    <th className="text-left text-white/40 text-xs px-4 py-3 uppercase">Дата регистрации</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white text-sm font-medium">{user.name || '—'}</p>
                          <p className="text-white/40 text-xs">{user.email}</p>
                          {user.phone && <p className="text-white/30 text-xs">{user.phone}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/60 text-sm capitalize">{user.provider || 'credentials'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/80 text-sm">{user._count.orders}</span>
                      </td>
                      <td className="px-4 py-3">
                        {user.isAdmin ? (
                          <span className="flex items-center gap-1 text-[#6C3EF4] text-xs font-medium">
                            <Shield className="w-3.5 h-3.5" /> Администратор
                          </span>
                        ) : (
                          <span className="text-white/40 text-xs">Пользователь</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-sm">{formatDate(user.createdAt)}</td>
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
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/60 disabled:opacity-30 hover:bg-white/10 transition-colors text-sm"
              >
                ←
              </button>
              <span className="text-white/60 text-sm">Страница {page} из {Math.ceil(total / 20)}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/60 disabled:opacity-30 hover:bg-white/10 transition-colors text-sm"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
