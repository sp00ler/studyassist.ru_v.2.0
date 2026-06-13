import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'StudyAssist — Помощь студентам'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#07070E',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow orb top right */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -180,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          }}
        />
        {/* Glow orb bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -80,
            width: 440,
            height: 440,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(197,255,69,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Top: badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(197,255,69,0.1)',
            border: '1px solid rgba(197,255,69,0.25)',
            borderRadius: 100,
            padding: '10px 22px',
            width: 'fit-content',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#C5FF45',
            }}
          />
          <span
            style={{
              color: '#C5FF45',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Более 1000 студентов уже сдали
          </span>
        </div>

        {/* Middle: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <span
            style={{
              color: '#F0F0EC',
              fontSize: 110,
              fontWeight: 900,
              lineHeight: 0.92,
              letterSpacing: -4,
            }}
          >
            ДЕДЛАЙН
          </span>
          <span
            style={{
              color: '#C5FF45',
              fontSize: 110,
              fontWeight: 900,
              lineHeight: 0.92,
              letterSpacing: -4,
            }}
          >
            ЗАВТРА?
          </span>
          <span
            style={{
              color: '#6A6A88',
              fontSize: 38,
              fontWeight: 400,
              marginTop: 20,
              letterSpacing: -1,
            }}
          >
            Мы уже работаем.
          </span>
        </div>

        {/* Bottom: domain + tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              color: '#F0F0EC',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            studyassist.ru
          </span>
          <span
            style={{
              color: '#6A6A88',
              fontSize: 22,
            }}
          >
            Курсовые · Дипломные · Рефераты
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
