'use client'

import { useEffect, useRef } from 'react'

export function MagicCursor() {
  const ref = useRef<HTMLDivElement>(null)
  const target = useRef({ x: -1000, y: -1000 })
  const current = useRef({ x: -1000, y: -1000 })
  const raf = useRef<number>(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.07
      current.current.y += (target.current.y - current.current.y) * 0.07
      el.style.transform = `translate(${current.current.x - 300}px, ${current.current.y - 300}px)`
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[1] hidden md:block"
      style={{
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(197,255,69,0.055) 0%, transparent 65%)',
        willChange: 'transform',
      }}
    />
  )
}
