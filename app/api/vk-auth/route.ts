import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { encode } from 'next-auth/jwt'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://studyassist.ru'
const VK_CLIENT_ID = process.env.VK_CLIENT_ID!
const VK_CLIENT_SECRET = process.env.VK_CLIENT_SECRET!
const REDIRECT_URI = `${BASE_URL}/api/vk-auth`

// Генерация code_challenge для PKCE (S256)
function pkceChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const stateParam = searchParams.get('state')

  // ── Шаг 1: начало авторизации ──
  if (!code && !error) {
    const deviceId = crypto.randomUUID()
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = pkceChallenge(codeVerifier)
    const state = crypto.randomBytes(16).toString('hex')

    const vkUrl = new URL('https://id.vk.com/authorize')
    vkUrl.searchParams.set('client_id', VK_CLIENT_ID)
    vkUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    vkUrl.searchParams.set('response_type', 'code')
    vkUrl.searchParams.set('scope', 'vkid.personal_info email')
    vkUrl.searchParams.set('state', state)
    vkUrl.searchParams.set('code_challenge', codeChallenge)
    vkUrl.searchParams.set('code_challenge_method', 'S256')
    vkUrl.searchParams.set('device_id', deviceId)

    const res = NextResponse.redirect(vkUrl.toString())
    const cookieOpts = { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax' as const, secure: true }
    res.cookies.set('vk_device_id', deviceId, cookieOpts)
    res.cookies.set('vk_code_verifier', codeVerifier, cookieOpts)
    res.cookies.set('vk_state', state, cookieOpts)
    return res
  }

  // ── Ошибка от VK ──
  if (error) {
    return NextResponse.redirect(`${BASE_URL}/auth/login?error=OAuthSignin`)
  }

  // ── Шаг 2: callback от VK ──
  // VK ID 2.1 возвращает device_id в URL callback'а — используем его
  const callbackDeviceId = searchParams.get('device_id')
  const codeVerifier = req.cookies.get('vk_code_verifier')?.value
  const storedState = req.cookies.get('vk_state')?.value
  const cookieDeviceId = req.cookies.get('vk_device_id')?.value

  // device_id приоритет: из callback URL, потом из cookie
  const deviceId = callbackDeviceId || cookieDeviceId

  console.log('VK callback params:', { code: code?.slice(0, 10), callbackDeviceId, cookieDeviceId, stateParam, storedState: storedState?.slice(0, 10) })

  if (!deviceId || !codeVerifier || !storedState) {
    console.error('VK callback missing params:', { deviceId: !!deviceId, codeVerifier: !!codeVerifier, storedState: !!storedState })
    return NextResponse.redirect(`${BASE_URL}/auth/login?error=OAuthState`)
  }
  if (stateParam !== storedState) {
    console.error('VK state mismatch:', { stateParam, storedState })
    return NextResponse.redirect(`${BASE_URL}/auth/login?error=OAuthState`)
  }

  // Обмен кода на токен
  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code!,
    redirect_uri: REDIRECT_URI,
    client_id: VK_CLIENT_ID,
    client_secret: VK_CLIENT_SECRET,
    code_verifier: codeVerifier,
    device_id: deviceId,
    state: stateParam || '',
  })
  console.log('VK token request device_id:', deviceId)

  const tokenRes = await fetch('https://id.vk.com/oauth2/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody,
  })

  const tokens = await tokenRes.json()
  if (tokens.error) {
    console.error('VK token error:', tokens)
    return NextResponse.redirect(`${BASE_URL}/auth/login?error=OAuthCallback`)
  }

  // Получение данных пользователя
  const userRes = await fetch('https://id.vk.com/oauth2/user_info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${tokens.access_token}`,
    },
    body: new URLSearchParams({ client_id: VK_CLIENT_ID }),
  })

  const userData = await userRes.json()
  if (!userData.user) {
    console.error('VK userinfo error:', userData)
    return NextResponse.redirect(`${BASE_URL}/auth/login?error=OAuthCallback`)
  }

  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '—'
  const ua = req.headers.get('user-agent') || null

  const vk = userData.user
  const vkId = String(vk.user_id)
  const email = vk.email || `vk_${vkId}@vk.user`
  const name = `${vk.first_name || ''} ${vk.last_name || ''}`.trim() || `vk_${vkId}`
  const image = vk.avatar || null

  // Найти или создать пользователя
  let user = await prisma.user.findFirst({
    where: { OR: [{ email }, { providerId: vkId, provider: 'vk' }] },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        avatar: image,
        provider: 'vk',
        providerId: vkId,
        emailVerified: true,
      },
    })
  } else if (!user.emailVerified || user.provider !== 'vk') {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        provider: 'vk',
        providerId: vkId,
        emailVerified: true,
        avatar: image ?? undefined,
        name: name || undefined,
      },
    })
  }

  // Трекинг входа
  await prisma.user.update({
    where: { id: user.id },
    data: {
      prevIp: user.lastIp ?? null,
      prevLoginAt: user.lastLoginAt ?? null,
      lastIp: ip,
      lastLoginAt: new Date(),
      lastUserAgent: ua,
    },
  }).catch(() => {})

  // Создать NextAuth JWT-сессию вручную
  const sessionToken = await encode({
    token: {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.avatar,
      isAdmin: user.isAdmin,
      phone: user.phone ?? null,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 30 * 24 * 60 * 60,
  })

  const isSecure = BASE_URL.startsWith('https')
  const cookieName = isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token'

  const res = NextResponse.redirect(`${BASE_URL}/dashboard`)
  res.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  })
  // Очистить временные cookies
  res.cookies.delete('vk_device_id')
  res.cookies.delete('vk_code_verifier')
  res.cookies.delete('vk_state')

  return res
}
