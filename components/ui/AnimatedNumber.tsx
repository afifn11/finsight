// components/ui/AnimatedNumber.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  format?: (value: number) => string
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedNumber({
  value,
  format,
  prefix = '',
  suffix = '',
  className,
}: AnimatedNumberProps) {
  const motionVal = useMotionValue(value)
  const springVal = useSpring(motionVal, {
    mass: 0.8,
    stiffness: 85,
    damping: 18,
  })

  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    motionVal.set(value)
  }, [motionVal, value])

  useEffect(() => {
    return springVal.on('change', (latest) => {
      if (spanRef.current) {
        const formatted = format
          ? format(latest)
          : Math.round(latest).toLocaleString('id-ID')
        spanRef.current.textContent = `${prefix}${formatted}${suffix}`
      }
    })
  }, [springVal, format, prefix, suffix])

  // Initial SSR representation
  const initialDisplay = `${prefix}${
    format ? format(value) : Math.round(value).toLocaleString('id-ID')
  }${suffix}`

  return (
    <span ref={spanRef} className={className}>
      {initialDisplay}
    </span>
  )
}
