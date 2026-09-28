'use client'

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

  // Inline styles only (no Tailwind/component imports): this boundary must
  // render even if globals.css or app providers failed to load.
  return (
    <html lang="ru">
      <body style={{ background: '#008080', color: '#000', fontFamily: "'Tiny5', system-ui, sans-serif", margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              border: '1px solid #000',
              boxShadow: 'inset 1px 1px 0 0 #fff, inset -1px -1px 0 0 #808080',
              background: '#C0C0C0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: 28,
                padding: '0 8px',
                background: 'linear-gradient(90deg, #000080, #1084D0)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              ОШИБКА.EXE
            </div>
            <div style={{ background: '#FFFBEA', padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'JetBrains Mono', Consolas, monospace", fontWeight: 700, fontSize: 'clamp(56px,14vw,96px)', lineHeight: 1, color: 'rgba(0,0,128,0.15)', userSelect: 'none', marginBottom: '1.25rem' }}>
                500
              </div>
              <h1 style={{ fontFamily: "'Press Start 2P', system-ui, sans-serif", fontWeight: 400, fontSize: 'clamp(16px,4vw,22px)', lineHeight: 1.4, margin: '0 0 1rem', color: '#000' }}>
                Что-то пошло не так
              </h1>
              <p style={{ color: '#3A3A3A', fontSize: 16, lineHeight: 1.6, margin: '0 0 2rem', maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
                Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={reset}
                  style={{
                    padding: '12px 28px',
                    background: '#000080',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    fontFamily: "'Tiny5', system-ui, sans-serif",
                    border: '1px solid #000',
                    boxShadow: 'inset 1px 1px 0 0 rgba(255,255,255,.45), inset -1px -1px 0 0 rgba(0,0,0,.4)',
                    cursor: 'pointer',
                  }}
                >
                  Попробовать снова
                </button>
                <a
                  href="/"
                  style={{
                    padding: '12px 28px',
                    background: '#C0C0C0',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: 13,
                    fontFamily: "'Tiny5', system-ui, sans-serif",
                    border: '1px solid #000',
                    boxShadow: 'inset 1px 1px 0 0 #fff, inset -1px -1px 0 0 #808080',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  На главную
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
