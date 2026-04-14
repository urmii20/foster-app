/**
 * POST /api/send-approval-email
 * Called from the Shelter Inbox when an application is approved.
 *
 * Body: { toEmail, userName, petName, startDate, endDate, shelterPhone, tasks[] }
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      toEmail,
      userName = "Foster Parent",
      petName,
      startDate,
      endDate,
      shelterPhone = "+91 98765 43210",
      tasks = [],
    } = await req.json();

    if (!toEmail || !petName) {
      return NextResponse.json({ error: "toEmail and petName required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — email not sent");
      return NextResponse.json({ success: true, skipped: true });
    }

    const fromEmail = process.env.FROM_EMAIL || "noreply@pawsheltermumbai.in";

    const taskList = (tasks as string[])
      .map((t) => `<li style="margin-bottom:8px;">${t}</li>`)
      .join("");

    const html = `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; background: #F5F5EC; color: #1E1E1E;">
        <h1 style="font-size: 2rem; color: #E22726; margin-bottom: 4px;">🐾 Congratulations, ${userName}!</h1>
        <p style="font-size: 1.1rem; margin-bottom: 24px;">
          Your application to foster <strong>${petName}</strong> has been <strong>approved</strong>.
        </p>

        <div style="background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 2px solid #D9D9D9;">
          <h2 style="font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; color: #E22726; margin-bottom: 16px;">Foster Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr>
              <td style="padding: 8px 0; color: #999; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em;">Pet Name</td>
              <td style="padding: 8px 0;">${petName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em;">Start Date</td>
              <td style="padding: 8px 0;">${startDate ? new Date(startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "To be confirmed"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em;">End Date</td>
              <td style="padding: 8px 0;">${endDate ? new Date(endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "Flexible"}</td>
            </tr>
          </table>
        </div>

        ${tasks.length > 0 ? `
        <div style="background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 2px solid #D9D9D9;">
          <h2 style="font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; color: #E22726; margin-bottom: 16px;">Your Care Checklist</h2>
          <ul style="padding-left: 20px; color: #444; font-size: 0.9rem;">${taskList}</ul>
        </div>` : ""}

        <div style="background: #FCEAEB; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <h2 style="font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; color: #E22726; margin-bottom: 8px;">Next Steps</h2>
          <ol style="padding-left: 20px; color: #444; font-size: 0.9rem; line-height: 1.8;">
            <li>Please visit our shelter to meet ${petName} before the start date.</li>
            <li>Bring a valid photo ID (Aadhaar / PAN / Passport).</li>
            <li>Our team will conduct a brief orientation (approx. 30 minutes).</li>
            <li>You'll receive ${petName}'s medical records and care kit on pickup day.</li>
          </ol>
        </div>

        <div style="text-align: center; padding: 24px 0; border-top: 2px solid #D9D9D9;">
          <p style="color: #666; font-size: 0.85rem;">Questions? Call us at <strong>${shelterPhone}</strong></p>
          <p style="color: #666; font-size: 0.85rem;">Mon–Sat · 9 AM – 6 PM IST</p>
          <p style="color: #999; font-size: 0.75rem; margin-top: 16px;">
            Paw Shelter Mumbai · 47, Parel Road, Mumbai — 400 012, Maharashtra
          </p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Paw Shelter Mumbai <${fromEmail}>`,
        to: [toEmail],
        subject: `✅ Your Foster Application for ${petName} is Approved!`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return NextResponse.json({ error: "Email send failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-approval-email error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}