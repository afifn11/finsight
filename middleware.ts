// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Redirect away from auth pages if already logged in
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Redirect to onboarding only if explicitly false (not undefined)
    // undefined = session belum load onboardingDone, jangan redirect
    if (
      token &&
      token.onboardingDone === false &&
      !pathname.startsWith('/onboarding') &&
      !pathname.startsWith('/api')
    ) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname
        const publicPaths = ['/login', '/register', '/api/auth']
        const isPublic = publicPaths.some((p) => pathname.startsWith(p))
        if (isPublic) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|manifest.webmanifest|manifest.json|sw.js|icon-192.png|icon-512.png|apple-touch-icon.png|offline|.*\.png$|.*\.ico$|.*\.svg$|.*\.webmanifest$).*)' 
  ],
}