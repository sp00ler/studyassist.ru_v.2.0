'use client'

import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'

interface PageLoaderProps {
  text?: string
  fullScreen?: boolean
}

export function PageLoader({ text = 'Загрузка', fullScreen = true }: PageLoaderProps) {
  return (
    <div
      className={`dither flex flex-col items-center justify-center bg-desk overflow-hidden ${
        fullScreen ? 'fixed inset-0 z-50' : 'min-h-screen w-full'
      }`}
    >
      <div className="window pixel-shadow flex flex-col items-center gap-4 px-10 py-8">
        {/* Spinning ring — Win95 "busy" indicator, navy on chrome */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.div
            className="absolute inset-0"
            style={{
              border: '3px solid rgb(var(--chrome-dark))',
              borderTopColor: 'rgb(var(--title))',
              borderRightColor: 'rgb(var(--title))',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <GraduationCap className="w-6 h-6 text-title" />
        </div>

        {/* Brand + text */}
        <div className="text-center">
          <div className="font-sans text-base font-bold text-title mb-1 tracking-wide">
            StudyAssist
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-ink-soft text-xs tracking-[0.15em] uppercase">
              {text}
            </span>
            <div className="flex gap-1">
              {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-title"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
