import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "email and code are required" },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      // ── Dev mode: print to terminal if env vars are missing ──────────────
      console.log("\n┌─────────────────────────────────┐");
      console.log(`│  OTP for ${email}`);
      console.log(`│  Code: ${code}`);
      console.log("└─────────────────────────────────┘\n");
      console.warn("Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env.local");
      return NextResponse.json({ success: true });
    }

    // Configure the Nodemailer transporter for Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    // Email content
    const mailOptions = {
      from: `"Paw Shelter Mumbai" <${gmailUser}>`,
      to: email,
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
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}