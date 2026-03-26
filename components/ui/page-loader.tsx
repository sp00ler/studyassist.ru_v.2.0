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
      className={`flex flex-col items-center justify-center bg-[#0F0F1A] overflow-hidden ${
        fullScreen ? 'fixed inset-0 z-50' : 'min-h-screen w-full'
      }`}
    >
      {/* Ambient glow */}
      <div className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(108,62,244,0.15) 0%, transparent 70%)' }} />
      <div className="absolute w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />

      {/* Rings + center */}
      <div className="relative w-36 h-36">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#6C3EF4',
            borderRightColor: 'rgba(108,62,244,0.25)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />

        {/* Mid ring */}
        <motion.div
          className="absolute inset-3 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#3B82F6',
            borderLeftColor: 'rgba(59,130,246,0.25)',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner ring */}
        <motion.div
          className="absolute inset-6 rounded-full"
          style={{
            border: '2px solid transparent',
            borderBottomColor: '#8B5CF6',
            borderRightColor: 'rgba(139,92,246,0.25)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* Center orb */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6C3EF4] to-[#3B82F6] flex items-center justify-center"
            animate={{
              boxShadow: [
                '0 0 15px rgba(108,62,244,0.4)',
                '0 0 35px rgba(108,62,244,0.8), 0 0 60px rgba(59,130,246,0.3)',
                '0 0 15px rgba(108,62,244,0.4)',
              ],
              scale: [1, 1.06, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <GraduationCap className="w-7 h-7 text-white" />
          </motion.div>
        </div>
      </div>

      {/* Brand + text */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="text-base font-bold bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent mb-2 tracking-wide">
          StudyAssist
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-white/30 text-xs tracking-[0.2em] uppercase">{text}</span>
          <div className="flex gap-1">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-[#6C3EF4]"
                animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, delay, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
