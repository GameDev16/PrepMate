// Sends transactional email via the Resend HTTP API (https://resend.com).
// No SDK dependency — a single fetch call, consistent with how this project
// already calls the Gemini API directly (see controllers/generate.controller.js).
//
// If RESEND_API_KEY isn't set, falls back to logging the link to the server
// console instead of throwing — this keeps local dev and any deploy that
// hasn't configured email yet working exactly as before, with no crash and
// no behavior change to the calling controller.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "PrepMate <onboarding@resend.dev>";

async function sendPasswordResetEmail(toEmail, resetUrl) {
  if (!RESEND_API_KEY) {
    console.log("Password reset URL:", resetUrl);
    return { sent: false, reason: "no_api_key" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: toEmail,
        subject: "Reset your PrepMate password",
        html: `
          <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #111118;">
            <h2 style="margin-bottom: 8px;">Reset your password</h2>
            <p>We received a request to reset the password for your PrepMate account. This link expires in 1 hour.</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6a4cff;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:bold;">
                Reset Password
              </a>
            </p>
            <p style="font-size: 13px; color: #555;">Or paste this link into your browser:<br>${resetUrl}</p>
            <p style="font-size: 13px; color: #888; margin-top: 24px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Resend API error:", response.status, errText);
      // Fall back to logging the link server-side so the account isn't
      // stranded just because the email provider had an outage.
      console.log("Password reset URL (email send failed):", resetUrl);
      return { sent: false, reason: "provider_error" };
    }

    return { sent: true };
  } catch (err) {
    console.error("Password reset email send failed:", err);
    console.log("Password reset URL (email send failed):", resetUrl);
    return { sent: false, reason: "network_error" };
  }
}

module.exports = { sendPasswordResetEmail };
