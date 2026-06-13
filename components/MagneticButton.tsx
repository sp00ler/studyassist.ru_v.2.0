'use client'

import { useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  strength?: number
  className?: string
}

export function MagneticButton({ children, strength = 0.38, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setOffset({
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength,
    })
  }

  const onLeave = () => setOffset({ x: 0, y: 0 })

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{
        display: 'inline-block',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: 'transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      {children}
    </div>
  )
}
