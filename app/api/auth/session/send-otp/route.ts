/**
 * POST /api/send-otp
 * Body: { email: string, code: string }
 *
 * This route ONLY sends the email.
 * OTP generation and Firestore storage are handled client-side
 * so they run under the authenticated user's session and respect
 * Firestore security rules without needing the Admin SDK.
 *
 * SETUP:
 *  1. npm install resend
 *  2. Add to .env.local:
 *       RESEND_API_KEY=re_xxxxxxxxxxxx
 *       FROM_EMAIL=noreply@yourdomain.com
 *
 * Without RESEND_API_KEY the code is logged to the terminal
 * so you can still test the flow locally.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "email and code are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      // ── Dev mode: print to terminal, treat as success ──────────────
      console.log("\n┌─────────────────────────────────┐");
      console.log(`│  OTP for ${email}`);
      console.log(`│  Code: ${code}`);
      console.log("└─────────────────────────────────┘\n");
      return NextResponse.json({ success: true });
    }

    const fromEmail = process.env.FROM_EMAIL || "noreply@pawsheltermumbai.in";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Paw Shelter Mumbai <${fromEmail}>`,
        to: [email],
        subject: "Your Verification Code — Paw Shelter",
        html: `
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#F5F5EC;">
            <h1 style="font-size:2rem;color:#1E1E1E;margin-bottom:8px;">Verify Your Email 🐾</h1>
            <p style="color:#666;margin-bottom:32px;">
              Use this code to complete your sign-up. It expires in <strong>10 minutes</strong>.
            </p>
            <div style="background:white;border:2px solid #E22726;border-radius:16px;padding:24px;text-align:center;margin-bottom:32px;">
              <p style="font-size:3rem;font-weight:bold;letter-spacing:0.5em;color:#E22726;margin:0;">
                ${code}
              </p>
            </div>
            <p style="color:#999;font-size:12px;">
              If you did not request this, ignore this email.<br/>
              Paw Shelter Mumbai · Parel Road, Mumbai — 400 012
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}