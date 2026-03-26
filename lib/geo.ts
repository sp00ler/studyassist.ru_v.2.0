/** Определить страну по IP через ip-api.com (бесплатно, без ключа) */
export async function getCountryByIp(ip: string): Promise<string | null> {
  if (!ip || ip === '—' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    const data = await res.json()
    return data.countryCode || null
  } catch {
    return null
  }
}

/** Получить эмодзи флага по коду страны (RU → 🇷🇺) */
export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐'
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0))
  )
}

/** Парсить ОС из user-agent строки */
export function parseOs(ua: string | null): string {
  if (!ua) return '—'
  if (/Windows NT 10/i.test(ua)) return 'Windows 10/11'
  if (/Windows NT 6\.3/i.test(ua)) return 'Windows 8.1'
  if (/Windows NT 6\.1/i.test(ua)) return 'Windows 7'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/iPhone/i.test(ua)) return 'iOS (iPhone)'
  if (/iPad/i.test(ua)) return 'iOS (iPad)'
  if (/Android/i.test(ua)) return 'Android'
  if (/Mac OS X/i.test(ua)) return 'macOS'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Другое'
}

/** Парсить браузер из user-agent */
export function parseBrowser(ua: string | null): string {
  if (!ua) return '—'
  if (/YaBrowser/i.test(ua)) return 'Яндекс.Браузер'
  if (/OPR|Opera/i.test(ua)) return 'Opera'
  if (/Edg/i.test(ua)) return 'Edge'
  if (/Chrome/i.test(ua)) return 'Chrome'
  if (/Firefox/i.test(ua)) return 'Firefox'
  if (/Safari/i.test(ua)) return 'Safari'
  return 'Другое'
}
