import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This is a simplified middleware for demo purposes
// In a real application, you would verify JWT tokens or session cookies
export function middleware(request: NextRequest) {
  // Get the path of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/auth"

  // Define onboarding path
  const isOnboardingPath = path === "/onboarding"

  // Check if the user is authenticated by looking for a simulated auth cookie
  const isAuthenticated = request.cookies.has("auth-token")

  // Get onboarding status from cookie (in a real app, this would be from JWT or session)
  // For demo purposes, we'll use a simple cookie
  const hasCompletedOnboarding = request.cookies.has("onboarding-complete")

  // If the user is not authenticated and trying to access a protected route, redirect to auth
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  // If the user is authenticated and trying to access auth page, redirect to dashboard or onboarding
  if (isAuthenticated && isPublicPath) {
    if (hasCompletedOnboarding) {
      return NextResponse.redirect(new URL("/", request.url))
    } else {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  // If the user is authenticated but hasn't completed onboarding and is trying to access a page other than onboarding
  if (isAuthenticated && !hasCompletedOnboarding && !isOnboardingPath && path !== "/auth") {
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }

  // If the user has completed onboarding and is trying to access the onboarding page
  if (isAuthenticated && hasCompletedOnboarding && isOnboardingPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Otherwise, continue with the request
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/", "/settings/:path*", "/auth", "/onboarding"],
}
