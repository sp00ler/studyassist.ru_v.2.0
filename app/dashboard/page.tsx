'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, LogOut, User, Package, CreditCard, Loader2, Plus, Send, CheckCircle, X } from 'lucide-react'
import { PageLoader } from '@/components/ui/page-loader'
import { OrdersTable } from '@/components/dashboard/OrdersTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, formatPrice } from '@/lib/utils'

interface Order {
  id: string
  type: string
  subject: string
  deadline: string
  status: string
  price: string | number | null
  paymentLink: string | null
  createdAt: string
}

interface Payment {
  id: string
  amount: string | number
  status: string
  createdAt: string
}

interface UserProfile {
  id: string
  name: string | null
  email: string
  phone: string | null
  avatar: string | null
  telegramId: string | null
  provider: string | null
}

type Tab = 'orders' | 'profile' | 'payments'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [tgLinking, setTgLinking] = useState(false)
  const [tgDeepLink, setTgDeepLink] = useState<string | null>(null)
  const [tgUnlinking, setTgUnlinking] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchData()
      // Трекинг входа (IP, UA, время)
      fetch('/api/auth/track-login', { method: 'POST' }).catch(() => {})
    }
  }, [session])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersRes, profileRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/profile'),
      ])
      const ordersData = await ordersRes.json()
      const profileData = await profileRes.json()

      if (ordersData.orders) setOrders(ordersData.orders)
      if (profileData.user) {
        setProfile(profileData.user)
        setProfileName(profileData.user.name || '')
        setProfilePhone(profileData.user.phone || '')
      }
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setProfileSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, phone: profilePhone || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
      }
    } finally {
      setProfileSaving(false)
    }
  }

  const handleLinkTelegram = async () => {
    setTgLinking(true)
    setTgDeepLink(null)
    try {
      const res = await fetch('/api/telegram/link', { method: 'POST' })
      if (res.ok) {
        const { deepLink } = await res.json()
        setTgDeepLink(deepLink)
      }
    } finally {
      setTgLinking(false)
    }
  }

  const handleUnlinkTelegram = async () => {
    if (!confirm('Отвязать Telegram от аккаунта?')) return
    setTgUnlinking(true)
    try {
      const res = await fetch('/api/telegram/link', { method: 'DELETE' })
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, telegramId: null } : null)
        setTgDeepLink(null)
      }
    } finally {
      setTgUnlinking(false)
    }
  }

  if (status === 'loading' || loading) {
    return <PageLoader />
  }

  if (!session) return null

  const tabs = [
    { id: 'orders' as Tab, label: 'Мои заявки', icon: Package, count: orders.length },
    { id: 'profile' as Tab, label: 'Профиль', icon: User, count: null },
    { id: 'payments' as Tab, label: 'История оплат', icon: CreditCard, count: null },
  ]

  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      {/* Header */}
      <header className="bg-[#0F0F1A]/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C3EF4] to-[#3B82F6] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
                StudyAssist
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || ''}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="text-white/70 text-sm">{session.user.name || session.user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="gap-2 text-white/50 hover:text-white">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-1">Личный кабинет</h1>
          <p className="text-white/50">Управляйте своими заявками и профилем</p>
        </motion.div>

        {/* Tabs */}
        <div role="tablist" aria-label="Разделы личного кабинета" className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`text-xs rounded-full px-2 py-0.5 ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                }`} aria-label={`${tab.count} заявок`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Мои заявки</h2>
                <Link href="/#order">
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Новая заявка
                  </Button>
                </Link>
              </div>
              <OrdersTable orders={orders} />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-xl">
              <h2 className="text-lg font-semibold text-white mb-6">Профиль</h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C3EF4] to-[#3B82F6] flex items-center justify-center overflow-hidden">
                    {profile?.avatar ? (
                      <Image src={profile.avatar} alt={`Аватар пользователя ${profile.name || ''}`} width={64} height={64} className="object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{profile?.name || 'Без имени'}</p>
                    <p className="text-white/50 text-sm">{profile?.email}</p>
                    {profile?.provider && (
                      <span className="text-xs text-white/30 capitalize">Вход через: {profile.provider}</span>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Имя</Label>
                  <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Ваше имя" />
                </div>

                <div>
                  <Label className="mb-2 block">Email</Label>
                  <Input value={profile?.email || ''} disabled className="opacity-50 cursor-not-allowed" />
                </div>

                <div>
                  <Label className="mb-2 block">Телефон</Label>
                  <Input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="+7 XXX XXX-XX-XX" />
                </div>

                {/* Telegram linking */}
                <div className="space-y-2">
                  <Label className="block">Telegram уведомления</Label>

                  {profile?.telegramId ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-emerald-400 text-sm font-medium">Telegram привязан</p>
                          <p className="text-white/40 text-xs">ID: {profile.telegramId}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleUnlinkTelegram}
                        disabled={tgUnlinking}
                        className="text-white/30 hover:text-red-400 transition-colors"
                        title="Отвязать"
                      >
                        {tgUnlinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : tgDeepLink ? (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
                      <p className="text-white/70 text-sm">Нажмите кнопку ниже — откроется Telegram. Нажмите <b>Start</b> в боте:</p>
                      <a
                        href={tgDeepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-[#2AABEE] hover:bg-[#1e96d3] text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Открыть в Telegram
                      </a>
                      <button
                        onClick={fetchData}
                        className="w-full text-white/40 hover:text-white/70 text-xs text-center transition-colors"
                      >
                        Уже нажал Start → Проверить
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Button
                        variant="outline"
                        onClick={handleLinkTelegram}
                        disabled={tgLinking}
                        className="w-full gap-2 border-[#2AABEE]/40 text-[#2AABEE] hover:bg-[#2AABEE]/10"
                      >
                        {tgLinking
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Send className="w-4 h-4" />
                        }
                        Привязать Telegram
                      </Button>
                      <p className="text-white/30 text-xs mt-1.5">Получайте уведомления о статусе заявок прямо в Telegram</p>
                    </div>
                  )}
                </div>

                <Button onClick={saveProfile} disabled={profileSaving} className="w-full gap-2">
                  {profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Сохранить изменения
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-6">История оплат</h2>
              {payments.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                  <CreditCard className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">История оплат пуста</p>
                </div>
              ) : (
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th scope="col" className="text-left text-white/40 text-xs px-6 py-4 uppercase">Дата</th>
                        <th scope="col" className="text-left text-white/40 text-xs px-6 py-4 uppercase">Сумма</th>
                        <th scope="col" className="text-left text-white/40 text-xs px-6 py-4 uppercase">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-white/5">
                          <td className="px-6 py-4 text-white/60 text-sm">{formatDate(p.createdAt)}</td>
                          <td className="px-6 py-4 text-white text-sm font-medium">{formatPrice(p.amount)}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-lg border font-semibold ${
                              p.status === 'succeeded' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              p.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                              {p.status === 'succeeded' ? 'Выполнен' : p.status === 'pending' ? 'В обработке' : 'Отменён'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
