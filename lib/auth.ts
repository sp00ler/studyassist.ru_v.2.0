import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { Adapter } from 'next-auth/adapters'

// VK OAuth 2.0 (oauth.vk.com) — классический серверный flow
// Требует в настройках приложения vk.com/editapp:
//   Адрес сайта: https://studyassist.ru
const VKIDProvider = {
  id: 'vk',
  name: 'ВКонтакте',
  type: 'oauth' as const,
  authorization: {
    url: 'https://oauth.vk.com/authorize',
    params: {
      scope: 'email',
      response_type: 'code',
      display: 'page',
      v: '5.131',
    },
  },
  token: {
    url: 'https://oauth.vk.com/access_token',
    async request({ params, provider }: {
      params: Record<string, string>
      provider: Record<string, any>
    }) {
      const url = new URL('https://oauth.vk.com/access_token')
      url.searchParams.set('grant_type', 'authorization_code')
      url.searchParams.set('code', params.code)
      url.searchParams.set('redirect_uri', provider.callbackUrl)
      url.searchParams.set('client_id', process.env.VK_CLIENT_ID!)
      url.searchParams.set('client_secret', process.env.VK_CLIENT_SECRET!)

      const response = await fetch(url.toString())
      const tokens = await response.json()
      if (tokens.error) {
        throw new Error(`VK token error: ${tokens.error} — ${tokens.error_description}`)
      }
      return { tokens }
    },
  },
  userinfo: {
    url: 'https://api.vk.com/method/users.get',
    async request({ tokens }: { tokens: Record<string, any> }) {
      const url = new URL('https://api.vk.com/method/users.get')
      url.searchParams.set('access_token', tokens.access_token)
      if (tokens.user_id) url.searchParams.set('user_ids', String(tokens.user_id))
      url.searchParams.set('fields', 'photo_200')
      url.searchParams.set('v', '5.131')

      const res = await fetch(url.toString())
      const data = await res.json()
      const user = data.response?.[0]
      if (!user) {
        throw new Error(`VK userinfo failed: ${JSON.stringify(data)}`)
      }
      const userId = user.id || tokens.user_id
      return {
        id: String(userId),
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || `vk_${userId}`,
        email: tokens.email || `vk_${userId}@vk.user`,
        image: user.photo_200 || null,
      }
    },
  },
  profile(profile: { id: string; name: string; email: string; image: string | null }) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.image,
      isAdmin: false,
      phone: null,
    }
  },
  clientId: process.env.VK_CLIENT_ID,
  clientSecret: process.env.VK_CLIENT_SECRET,
}

// Mail.ru custom provider
const MailRuProvider = {
  id: 'mailru',
  name: 'Mail.ru',
  type: 'oauth' as const,
  authorization: {
    url: 'https://oauth.mail.ru/login',
    params: {
      scope: 'userinfo',
      response_type: 'code',
    },
  },
  token: 'https://oauth.mail.ru/token',
  userinfo: {
    url: 'https://oauth.mail.ru/userinfo',
    async request({ tokens }: { tokens: Record<string, any> }) {
      const res = await fetch('https://oauth.mail.ru/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      const profile = await res.json()
      const name =
        profile.name ||
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
        profile.email
      return {
        id: String(profile.id || profile.email),
        name,
        email: profile.email,
        image: profile.image || profile.pic || null,
      }
    },
  },
  profile(profile: { id: string; name: string; email: string; image?: string | null }) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.image,
    }
  },
  clientId: process.env.MAILRU_CLIENT_ID,
  clientSecret: process.env.MAILRU_CLIENT_SECRET,
}

// Yandex custom provider
const YandexProvider = {
  id: 'yandex',
  name: 'Яндекс',
  type: 'oauth' as const,
  authorization: {
    url: 'https://oauth.yandex.ru/authorize',
    params: {
      scope: 'login:email login:info login:avatar',
      response_type: 'code',
    },
  },
  token: 'https://oauth.yandex.ru/token',
  userinfo: 'https://login.yandex.ru/info?format=json',
  profile(profile: { id: string; real_name?: string; display_name?: string; default_email: string; default_avatar_id?: string }) {
    return {
      id: profile.id,
      name: profile.real_name || profile.display_name,
      email: profile.default_email,
      image: profile.default_avatar_id
        ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`
        : null,
    }
  },
  clientId: process.env.YANDEX_CLIENT_ID,
  clientSecret: process.env.YANDEX_CLIENT_SECRET,
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Введите email и пароль')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Неверный email или пароль')
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          throw new Error('Неверный email или пароль')
        }

        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          isAdmin: user.isAdmin,
          phone: user.phone,
        }
      },
    }),
    VKIDProvider as any,
    MailRuProvider as any,
    YandexProvider as any,
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false
        token.phone = (user as { phone?: string | null }).phone ?? null
      }
      // При OAuth входе обновляем данные из БД
      if (account && account.provider !== 'credentials') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.isAdmin = dbUser.isAdmin
          token.phone = dbUser.phone
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.isAdmin = token.isAdmin
        session.user.phone = token.phone
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // OAuth-пользователи создаются через адаптер — email подтверждён провайдером
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        }).catch(() => {})
      }
    },
    async signIn({ user, account }) {
      if (account && account.provider !== 'credentials') {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: account.provider,
            providerId: account.providerAccountId,
            avatar: user.image ?? undefined,
          },
        }).catch(() => {})
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
