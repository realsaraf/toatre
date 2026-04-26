import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "toatre_session";

// Paths that don't require auth
const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/privacy", "/tos"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Next.js internals + static assets: always pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  const hasSession = !!req.cookies.get(COOKIE_NAME);

  // Root: authenticated users go straight to the app
  if (pathname === "/") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/timeline", req.url));
    }
    // Unauthenticated: serve the landing page
    return NextResponse.next();
  }

  // Public auth pages — pass through (login page handles redirect after sign-in)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protected: require session cookie
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
