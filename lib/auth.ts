import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import VkProvider from 'next-auth/providers/vk'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { Adapter } from 'next-auth/adapters'

// VK provider (встроенный NextAuth, oauth.vk.com — стандартный OAuth 2.0)
// Redirect URI: https://studyassist.ru/api/auth/callback/vk
// Важно: токен запрашивается через client_secret_post (не Basic Auth)
const vkProviderConfig = VkProvider({
  clientId: process.env.VK_CLIENT_ID!,
  clientSecret: process.env.VK_CLIENT_SECRET!,
  profile(profile) {
    const p = profile.response?.[0] ?? {}
    const userId = p.id
    return {
      id: String(userId),
      name: [p.first_name, p.last_name].filter(Boolean).join(' ') || `vk_${userId}`,
      email: `vk_${userId}@studyassist.ru`,
      image: p.photo_100 ?? null,
      isAdmin: false,
      phone: null,
    }
  },
})

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
  userinfo: 'https://oauth.mail.ru/userinfo',
  profile(profile: { id: string; name: string; email: string; image?: string }) {
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
    vkProviderConfig,
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
      // Устанавливаем provider для нового пользователя
      if (user.email) {
        await prisma.user.update({
          where: { id: user.id },
          data: { provider: 'credentials' },
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
