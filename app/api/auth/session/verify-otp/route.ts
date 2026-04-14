/**
 * POST /api/verify-otp
 * Validates the 6-digit OTP against the Firestore record.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }

    const { db } = await import("@/lib/firebase");
    const { doc, getDoc, updateDoc } = await import("firebase/firestore");

    const safeKey = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const otpRef = doc(db, "otps", safeKey);
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists()) {
      return NextResponse.json({ error: "Code not found. Please request a new one." }, { status: 400 });
    }

    const data = otpSnap.data();

    if (data.used) {
      return NextResponse.json({ error: "This code has already been used." }, { status: 400 });
    }

    if (new Date(data.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
    }

    if (data.code !== code) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    // Mark as used
    await updateDoc(otpRef, { used: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}