'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, User, Package, CreditCard, Loader2, Plus, Send, CheckCircle, X, Camera } from 'lucide-react'
import { PageLoader } from '@/components/ui/page-loader'
import { OrdersTable } from '@/components/dashboard/OrdersTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, formatPrice, cn } from '@/lib/utils'

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
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const autoLinkedRef = useRef(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/auth/login?callbackUrl=${callbackUrl}`)
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

        // Авто-привязка Telegram если пришли из бота (?tg=link) и ещё не привязан
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('tg') === 'link' && !profileData.user.telegramId && !autoLinkedRef.current) {
          autoLinkedRef.current = true
          setActiveTab('profile')
          setTimeout(() => {
            fetch('/api/telegram/link', { method: 'POST' })
              .then(r => r.json())
              .then(d => { if (d.deepLink) setTgDeepLink(d.deepLink) })
              .catch(() => {})
          }, 300)
        }
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, avatar: data.avatar } : null)
      } else {
        alert(data.error || 'Ошибка загрузки аватара')
      }
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
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
    <div className="min-h-screen bg-desk dither">
      {/* Header */}
      <header className="bg-chrome border-b border-chrome-shadow shadow-[inset_0_1px_0_0_rgb(var(--chrome-light))] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-display text-[15px] sm:text-[18px] text-ink hover:text-title transition-colors">
              Study<span className="text-title">Assist</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                {(profile?.avatar || session.user.image) && (
                  <Image
                    src={profile?.avatar || session.user.image!}
                    alt={session.user.name || ''}
                    width={32}
                    height={32}
                    className="object-cover bevel-out"
                    unoptimized
                  />
                )}
                <span className="text-ink-soft text-sm">{session.user.name || session.user.email}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-95 h-9 px-3 text-[13px] inline-flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-paper text-sm mb-4">Управляйте своими заявками и профилем</p>

        <div className="window pixel-shadow overflow-hidden">
          <div className="titlebar">
            <h1 className="truncate">Личный кабинет</h1>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Разделы личного кабинета" className="flex gap-1 px-2 pt-2 bg-chrome border-b border-chrome-shadow overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 h-10 min-h-[44px] text-[13px] font-sans font-semibold border border-b-0 border-chrome-shadow whitespace-nowrap',
                  activeTab === tab.id ? 'bg-paper text-ink relative -mb-px' : 'bg-chrome text-ink-soft hover:text-ink'
                )}
              >
                <tab.icon className="w-4 h-4" aria-hidden="true" />
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="text-xs bg-title text-white px-1.5" aria-label={`${tab.count} заявок`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div
            key={activeTab}
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="bg-paper p-4 sm:p-6"
          >
            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-base text-ink">Мои заявки</h2>
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
                <h2 className="font-display text-base text-ink mb-6">Профиль</h2>
                <div className="border border-chrome-dark p-6 space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="group relative w-16 h-16 bevel-out bg-chrome flex items-center justify-center overflow-hidden"
                        title="Сменить аватар"
                        aria-label="Сменить аватар"
                      >
                        {avatarUploading ? (
                          <Loader2 className="w-6 h-6 text-title animate-spin" />
                        ) : profile?.avatar ? (
                          <>
                            <Image
                              src={profile.avatar}
                              alt={`Аватар ${profile.name || ''}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-5 h-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <User className="w-8 h-8 text-ink-soft group-hover:opacity-0 transition-opacity" />
                            <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-5 h-5 text-white" />
                            </div>
                          </>
                        )}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleAvatarUpload}
                        className="sr-only"
                        aria-label="Загрузить аватар"
                      />
                    </div>
                    <div>
                      <p className="text-ink font-semibold">{profile?.name || 'Без имени'}</p>
                      <p className="text-ink-soft text-sm">{profile?.email}</p>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="text-xs text-title hover:text-title-alt transition-colors mt-0.5"
                      >
                        Сменить фото
                      </button>
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
                      <div className="bevel-in bg-success/10 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <div>
                            <p className="text-ink text-sm font-medium">Telegram привязан</p>
                            <p className="text-ink-soft text-xs">ID: {profile.telegramId}</p>
                          </div>
                        </div>
                        <button
                          onClick={handleUnlinkTelegram}
                          disabled={tgUnlinking}
                          className="text-ink-soft hover:text-danger transition-colors"
                          title="Отвязать"
                        >
                          {tgUnlinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : tgDeepLink ? (
                      <div className="bevel-in bg-title/10 p-4 space-y-3">
                        <p className="text-ink-soft text-sm">Нажмите кнопку ниже — откроется Telegram. Нажмите <b>Start</b> в боте:</p>
                        <a
                          href={tgDeepLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ backgroundColor: '#2AABEE' }}
                          className="btn-95 flex items-center justify-center gap-2 w-full text-white py-2.5 text-sm font-semibold"
                        >
                          <Send className="w-4 h-4" />
                          Открыть в Telegram
                        </a>
                        <button
                          onClick={fetchData}
                          className="w-full text-ink-soft hover:text-ink text-xs text-center transition-colors"
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
                          className="w-full gap-2"
                        >
                          {tgLinking
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />
                          }
                          Привязать Telegram
                        </Button>
                        <p className="text-ink-soft text-xs mt-1.5">Получайте уведомления о статусе заявок прямо в Telegram</p>
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
                <h2 className="font-display text-base text-ink mb-6">История оплат</h2>
                {payments.length === 0 ? (
                  <div className="text-center py-16 border border-chrome-dark bg-chrome/20">
                    <CreditCard className="w-12 h-12 text-ink-soft mx-auto mb-3" />
                    <p className="text-ink-soft">История оплат пуста</p>
                  </div>
                ) : (
                  <div className="window overflow-hidden overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-chrome border-b border-chrome-shadow">
                          <th scope="col" className="text-left text-ink text-xs px-6 py-3 uppercase font-semibold">Дата</th>
                          <th scope="col" className="text-left text-ink text-xs px-6 py-3 uppercase font-semibold">Сумма</th>
                          <th scope="col" className="text-left text-ink text-xs px-6 py-3 uppercase font-semibold">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="bg-paper">
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b border-chrome-dark/40">
                            <td className="px-6 py-4 text-ink-soft text-sm">{formatDate(p.createdAt)}</td>
                            <td className="px-6 py-4 text-ink text-sm font-medium font-mono">{formatPrice(p.amount)}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                'text-xs px-2 py-1 border font-semibold',
                                p.status === 'succeeded' ? 'bg-success/15 text-success border-success' :
                                p.status === 'pending' ? 'bg-warning/15 text-warning border-warning' :
                                'bg-danger/15 text-danger border-danger'
                              )}>
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
          </div>
        </div>
      </main>
    </div>
  )
}
