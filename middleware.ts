import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER_ROUTES    = ["/UserCalendar", "/dashboard", "/blogs"];
const SHELTER_ROUTES = ["/shelter/dashboard", "/shelter/Inbox", "/shelter/Inventory", "/shelter/active-fosters", "/shelter/foster-setup"];
const PUBLIC_ROUTES  = ["/", "/transition", "/login", "/shelter/login"];

async function verifySession(token: string): Promise<{ uid: string; role: "user" | "shelter_admin"; v: number } | null> {
  try {
    const secret = process.env.SESSION_SECRET ?? "dev-secret-change-in-prod";
    const parts  = token.split(".");
    if (parts.length !== 3) return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data   = `${parts[0]}.${parts[1]}`;
    const sigBuf = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
    const valid  = await crypto.subtle.verify("HMAC", key, sigBuf, new TextEncoder().encode(data));
    if (!valid) return null;

    const payload = JSON.parse(atob(parts[1]));
    if (payload.v !== 2) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get("__session")?.value;
  const session       = sessionCookie ? await verifySession(sessionCookie) : null;

  const isLoggedIn = !!session;
  const isUser     = session?.role === "user";
  const isAdmin    = session?.role === "shelter_admin";

  const isUserRoute    = USER_ROUTES.some(r => pathname.startsWith(r));
  const isShelterRoute = SHELTER_ROUTES.some(r => pathname.startsWith(r));

  if (!isLoggedIn && (isUserRoute || isShelterRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isUser && isShelterRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAdmin && isUserRoute) {
    return NextResponse.redirect(new URL("/shelter/dashboard", request.url));
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/shelter/login")) {
    return NextResponse.redirect(new URL(isAdmin ? "/shelter/dashboard" : "/dashboard", request.url));
  }

  const redirectParam = request.nextUrl.searchParams.get("redirect");
  if (redirectParam && !redirectParam.startsWith("/")) {
    const safe = new URL(request.url);
    safe.searchParams.delete("redirect");
    return NextResponse.redirect(safe);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};