'use client'

import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'

const particles = [
  { top: '8%',  left: '82%', size: 3, delay: 0,   color: '#6C3EF4' },
  { top: '75%', left: '12%', size: 2, delay: 0.5,  color: '#3B82F6' },
  { top: '18%', left: '6%',  size: 4, delay: 1.0,  color: '#6C3EF4' },
  { top: '87%', left: '72%', size: 2, delay: 0.3,  color: '#8B5CF6' },
  { top: '55%', left: '91%', size: 3, delay: 0.8,  color: '#3B82F6' },
  { top: '5%',  left: '42%', size: 2, delay: 1.4,  color: '#6C3EF4' },
  { top: '91%', left: '33%', size: 4, delay: 0.6,  color: '#8B5CF6' },
  { top: '42%', left: '2%',  size: 2, delay: 1.1,  color: '#3B82F6' },
  { top: '30%', left: '95%', size: 3, delay: 1.7,  color: '#6C3EF4' },
  { top: '65%', left: '88%', size: 2, delay: 0.9,  color: '#3B82F6' },
]

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
      {/* Ambient glow blobs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(108,62,244,0.18) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)' }}
        animate={{ scale: [1.1, 0.85, 1.1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ top: p.top, left: p.left, width: p.size, height: p.size, background: p.color }}
          animate={{ opacity: [0.1, 0.7, 0.1], scale: [0.7, 1.5, 0.7], y: [0, -7, 0] }}
          transition={{ duration: 2 + i * 0.25, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Orbital system */}
      <div className="relative w-44 h-44" style={{ perspective: '500px' }}>

        {/* Outer ring — horizontal, clockwise */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#6C3EF4',
            borderRightColor: 'rgba(108,62,244,0.2)',
            filter: 'drop-shadow(0 0 4px rgba(108,62,244,0.7))',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        />

        {/* Mid ring — tilted on X, counter-clockwise */}
        <motion.div
          className="absolute inset-3 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#3B82F6',
            borderLeftColor: 'rgba(59,130,246,0.2)',
            filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.7))',
            rotateX: 68,
          }}
          animate={{ rotateZ: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner ring — tilted on Y, clockwise */}
        <motion.div
          className="absolute inset-6 rounded-full"
          style={{
            border: '2px solid transparent',
            borderBottomColor: '#8B5CF6',
            borderRightColor: 'rgba(139,92,246,0.2)',
            filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.7))',
            rotateY: 68,
          }}
          animate={{ rotateZ: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* Orbit dot on outer ring */}
        <motion.div
          className="absolute w-2.5 h-2.5 rounded-full bg-[#6C3EF4] pointer-events-none"
          style={{ top: '0%', left: '50%', marginLeft: -5, marginTop: -3, boxShadow: '0 0 10px 3px rgba(108,62,244,0.8)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          transformTemplate={({ rotate }) =>
            `rotate(${rotate}) translateX(88px) rotate(-${rotate})`
          }
        />

        {/* Central orb */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6C3EF4] to-[#3B82F6] flex items-center justify-center"
            animate={{
              boxShadow: [
                '0 0 15px rgba(108,62,244,0.4), 0 0 30px rgba(108,62,244,0.15)',
                '0 0 35px rgba(108,62,244,0.8), 0 0 70px rgba(59,130,246,0.35), 0 0 100px rgba(108,62,244,0.1)',
                '0 0 15px rgba(108,62,244,0.4), 0 0 30px rgba(108,62,244,0.15)',
              ],
              scale: [1, 1.06, 1],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <GraduationCap className="w-7 h-7 text-white" />
          </motion.div>
        </div>
      </div>

      {/* Brand + loading text */}
      <motion.div
        className="mt-10 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="text-lg font-bold bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent mb-2 tracking-wide">
          StudyAssist
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-white/30 text-xs tracking-[0.25em] uppercase">{text}</span>
          <div className="flex gap-1">
            {[0, 0.18, 0.36].map((delay, i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-[#6C3EF4]"
                animate={{ opacity: [0.2, 1, 0.2], y: [0, -2.5, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, delay, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
