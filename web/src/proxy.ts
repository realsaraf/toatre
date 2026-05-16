import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "toatre_session";
const ACCESS_COOKIE_NAME = "toatre_access";

// Paths that don't require auth
const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/privacy", "/tos", "/toats", "/.well-known", "/apple-app-site-association", "/invite-preview"];
const RESERVED_APP_PATHS = new Set(["admin", "bookings", "capture", "help", "inbox", "j", "people", "settings", "timeline"]);

function isPublicHandlePath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return false;
  return !RESERVED_APP_PATHS.has(segments[0]);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Next.js internals + static assets: always pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/__/auth") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/api/") ||
    /\.[a-zA-Z0-9]+$/.test(pathname) // any file with an extension (png, svg, jpg, webp, etc.)
  ) {
    return NextResponse.next();
  }

  const hasSession = !!req.cookies.get(COOKIE_NAME);
  const accessLevel = req.cookies.get(ACCESS_COOKIE_NAME)?.value ?? "approved";

  // Root: authenticated users go straight to the app
  if (pathname === "/") {
    if (hasSession) {
      if (accessLevel === "blocked") {
        return NextResponse.redirect(new URL("/invite-preview", req.url));
      }
      return NextResponse.redirect(new URL("/timeline", req.url));
    }
    // Unauthenticated: serve the landing page
    return NextResponse.next();
  }

  // Public auth pages — pass through (login page handles redirect after sign-in)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith("/invite-preview") && hasSession && accessLevel !== "blocked") {
      return NextResponse.redirect(new URL("/timeline", req.url));
    }
    return NextResponse.next();
  }

  // Public Toatre Links live at /[handle]. Reserved app paths remain protected.
  if (isPublicHandlePath(pathname)) {
    return NextResponse.next();
  }

  // Protected: require session cookie
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && accessLevel !== "admin") {
    return NextResponse.redirect(new URL("/invite-preview", req.url));
  }

  if (accessLevel === "blocked") {
    return NextResponse.redirect(new URL("/invite-preview", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
