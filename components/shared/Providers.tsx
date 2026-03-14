// components/shared/Providers.tsx
'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ duration: 3000 }}
        />
      </ThemeProvider>
    </SessionProvider>
  )
}
