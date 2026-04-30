/**
 * Email Service
 * -------------
 * Wraps Resend SDK with consistent logging + error handling.
 *
 * In dev mode (no RESEND_API_KEY), it logs to console instead of sending.
 *
 * Usage:
 *   const { sendEmail } = require('../utils/sendEmail');
 *   await sendEmail({
 *     to: 'user@example.com',
 *     subject: 'Hello',
 *     html: '<p>Welcome!</p>',
 *   });
 */

const { Resend } = require("resend");

// Lazy-init: only create the Resend client if the API key exists
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM || "CareAble <onboarding@resend.dev>";

/**
 * Send an email through Resend.
 *
 * @param {object} params
 * @param {string} params.to       - Recipient email
 * @param {string} params.subject  - Email subject line
 * @param {string} params.html     - HTML body
 * @param {string} [params.text]   - Plain text fallback (optional but recommended)
 * @returns {Promise<{ success: boolean, id?: string, error?: string }>}
 */
async function sendEmail({ to, subject, html, text }) {
  // Dev mode without API key — log to console instead of sending
  if (!resend) {
    console.log("\n📧 [EMAIL — dev mode, not actually sent]");
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Preview: ${html.replace(/<[^>]+>/g, "").slice(0, 100)}...\n`);
    return { success: true, id: "dev-mode" };
  }

  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    if (result.error) {
      console.error("❌ Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`✅ Email sent to ${to} (id: ${result.data?.id})`);
    return { success: true, id: result.data?.id };
  } catch (err) {
    console.error("❌ sendEmail failed:", err.message);
    return { success: false, error: err.message };
  }
}

// Helper: convert HTML to plain text for the text fallback
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")  // remove tags
    .replace(/\s+/g, " ")      // collapse whitespace
    .trim();
}

module.exports = { sendEmail };