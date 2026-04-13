import { NextRequest, NextResponse } from "next/server";
 

export async function POST(request: NextRequest) {
  const { uid, role } = await request.json();
 
  if (!uid || !role) {
    return NextResponse.json({ error: "uid and role are required" }, { status: 400 });
  }
 
  if (role !== "user" && role !== "shelter_admin") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
 
  // Encode the session payload
  const sessionPayload = btoa(JSON.stringify({ uid, role }));
 
  const response = NextResponse.json({ ok: true });
 
  // Set the session cookie
  response.cookies.set("__session", sessionPayload, {
    httpOnly: true,       // JavaScript can't read it — prevents XSS theft
    secure: process.env.NODE_ENV === "production",  // HTTPS only in prod
    sameSite: "lax",      // Protects against CSRF
    path: "/",
    maxAge: 60 * 60 * 24 * 7,  // 7 days
  });
 
  return response;
}
 
/**
 * DELETE /api/auth/session
 *
 * Clears the session cookie on logout.
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("__session");
  return response;
}