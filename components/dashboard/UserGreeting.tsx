// components/dashboard/UserGreeting.tsx
'use client'

import { useState, useEffect } from 'react'

function getClientGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

interface UserGreetingProps {
  name?: string | null | undefined
}

export function UserGreeting({ name }: UserGreetingProps) {
  // Use time-agnostic default during SSR to prevent hydration mismatch,
  // then sync to actual local device time immediately on client mount.
  const [salutation, setSalutation] = useState<string>('Halo')

  useEffect(() => {
    setSalutation(getClientGreeting())
  }, [])

  return (
    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
      {name ? `${salutation}, ${name}` : 'Dashboard'}
    </h1>
  )
}
