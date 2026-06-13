'use client'

import { useEffect, useState } from 'react'

const CHARS = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯ?!'

export function useTextScramble(target: string, delayMs = 0) {
  const [display, setDisplay] = useState(target)

  useEffect(() => {
    let iteration = 0
    const frames = 22
    let iv: ReturnType<typeof setInterval>

    const timer = setTimeout(() => {
      iv = setInterval(() => {
        const progress = iteration / frames
        setDisplay(
          target
            .split('')
            .map((char, i) => {
              if (char === ' ') return ' '
              if (i / target.length < progress) return char
              return CHARS[Math.floor(Math.random() * CHARS.length)]
            })
            .join(''),
        )
        iteration++
        if (iteration > frames) {
          setDisplay(target)
          clearInterval(iv)
        }
      }, 35)
    }, delayMs)

    return () => {
      clearTimeout(timer)
      clearInterval(iv)
    }
  }, [target, delayMs])

  return display
}
