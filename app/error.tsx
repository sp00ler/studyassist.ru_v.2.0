'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="ru">
      <body style={{ background: '#07070E', color: '#F0F0EC', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(80px,20vw,160px)', lineHeight: 1, color: 'rgba(197,255,69,0.1)', userSelect: 'none', marginBottom: '1.5rem' }}>
            500
          </div>
          <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(20px,4vw,32px)', letterSpacing: '-1px', marginBottom: '1rem' }}>
            Что-то пошло не так
          </h1>
          <p style={{ color: '#6A6A88', fontSize: '16px', marginBottom: '2.5rem', maxWidth: '400px' }}>
            Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{ padding: '14px 28px', borderRadius: '9999px', background: '#C5FF45', color: '#07070E', fontWeight: 900, fontSize: '13px', fontFamily: 'Unbounded, sans-serif', border: 'none', cursor: 'pointer' }}
            >
              Попробовать снова
            </button>
            <a
              href="/"
              style={{ padding: '14px 28px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0EC', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
            >
              На главную
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
