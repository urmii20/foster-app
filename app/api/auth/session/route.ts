import { NextRequest, NextResponse } from "next/server";

async function sign(payload: object): Promise<string> {
  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-in-prod";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body   = btoa(JSON.stringify({ ...payload, v: 2 }));
  const data   = `${header}.${body}`;
  const sig    = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}

export async function POST(request: NextRequest) {
  let uid: string;
  let role: string;
  try {
    const body = await request.json();
    uid  = body.uid;
    role = body.role;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!uid || !role) {
    return NextResponse.json({ error: "uid and role are required" }, { status: 400 });
  }
  if (role !== "user" && role !== "shelter_admin") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const token    = await sign({ uid, role });
  const response = NextResponse.json({ ok: true });

  response.cookies.set("__session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("__session");
  return response;
}