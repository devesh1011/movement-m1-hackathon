import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ["/"]

  // Check if route is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Check for session cookie on protected routes
  const sessionCookie = request.cookies.get("scavnger-session")

  if (!sessionCookie) {
    // Redirect to login if no session
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/home", "/challenge/:path*", "/dashboard", "/create"],
}
