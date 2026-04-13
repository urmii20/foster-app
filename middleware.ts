import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
 
 
// ── Route configuration ──────────────────────────────────────────────────────
 
/** Routes that only a logged-in USER (role="user") may access */
const USER_ROUTES = ["/UserCalendar", "/dashboard", "/blogs"];
 
/** Routes that only a SHELTER ADMIN (role="shelter_admin") may access */
const SHELTER_ROUTES = ["/shelter/dashboard", "/shelter/Inbox", "/shelter/Inventory", "/shelter/active-fosters", "/shelter/foster-setup"];
 
/** Public routes — anyone may access these without a session */
const PUBLIC_ROUTES = ["/", "/transition", "/login", "/shelter/login"];
 
// ── Main middleware function ─────────────────────────────────────────────────
 
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
 
  // 1. Read the session cookie we set on login
  const sessionCookie = request.cookies.get("__session")?.value;
 
  // 2. Decode it (simple base64 JSON — no crypto needed in Edge runtime
  //    for reading; the API route that WRITES it validates the signature)
  let session: { uid: string; role: "user" | "shelter_admin" } | null = null;
  if (sessionCookie) {
    try {
      session = JSON.parse(atob(sessionCookie));
    } catch {
      // Malformed cookie — treat as logged out
      session = null;
    }
  }
 
  const isLoggedIn = !!session;
  const isUser = session?.role === "user";
  const isAdmin = session?.role === "shelter_admin";
 
  // 3. Check which category the current path falls into
  const isUserRoute    = USER_ROUTES.some(r => pathname.startsWith(r));
  const isShelterRoute = SHELTER_ROUTES.some(r => pathname.startsWith(r));
  const isPublicRoute  = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));
 
  // 4. Enforce access rules
 
  // Not logged in and trying to reach a protected route → send to /login
  if (!isLoggedIn && (isUserRoute || isShelterRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);   // so login page can send them back
    return NextResponse.redirect(loginUrl);
  }
 
  // Logged-in USER trying to reach a shelter route → back to dashboard
  if (isUser && isShelterRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
 
  // Logged-in SHELTER ADMIN trying to reach user routes → back to shelter dashboard
  if (isAdmin && isUserRoute) {
    return NextResponse.redirect(new URL("/shelter/dashboard", request.url));
  }
 
  // Already logged in and hitting a login page → send to the right home
  if (isLoggedIn && (pathname === "/login" || pathname === "/shelter/login")) {
    const home = isAdmin ? "/shelter/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }
 
  // All good — let the request through
  return NextResponse.next();
}
 
// ── Which routes should middleware run on? ───────────────────────────────────
// Exclude Next.js internals and static assets — only protect real pages.
 
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};