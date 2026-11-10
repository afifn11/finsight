// components/dashboard/BentoGrid.tsx
'use client'

import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  stagger?: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export function BentoGrid({
  children,
  className,
  stagger = true,
  ...props
}: BentoGridProps) {
  if (!stagger) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

interface BentoCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2
  glass?: boolean
  interactive?: boolean
  glow?: boolean
  className?: string
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
}

export function BentoCard({
  children,
  colSpan = 1,
  rowSpan = 1,
  glass = false,
  interactive = false,
  glow = false,
  className,
  ...props
}: BentoCardProps) {
  const colClass = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2 lg:col-span-2',
    3: 'col-span-1 md:col-span-2 lg:col-span-3',
    4: 'col-span-1 md:col-span-2 lg:col-span-4',
  }[colSpan]

  const rowClass = {
    1: 'row-span-1',
    2: 'row-span-1 md:row-span-2',
  }[rowSpan]

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        colClass,
        rowClass,
        glass ? 'glass-card' : 'card',
        interactive && 'interactive-card',
        glow && 'glow-accent',
        'overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
