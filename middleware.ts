// middleware.ts
// Route protection for FinSight — runs on every request

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Protected routes ───────────────────────────────────────────
// All routes under (dashboard) require authentication
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Redirect to onboarding if not completed
    if (
      token &&
      !token.onboardingDone &&
      pathname !== '/onboarding' &&
      !pathname.startsWith('/api')
    ) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    // Redirect away from auth pages if already logged in
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname

        // Public routes that don't need auth
        const publicPaths = [
          '/login',
          '/register',
          '/onboarding',
          '/api/auth',
        ]

        const isPublic = publicPaths.some((path) =>
          pathname.startsWith(path)
        )

        if (isPublic) return true

        // All other routes require token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
