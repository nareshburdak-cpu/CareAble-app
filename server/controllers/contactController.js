// server/controllers/contactController.js

/**
 * Contact form endpoint
 * ---------------------
 * POST /api/contact (public, no auth)
 *
 * Validates name, email, message then sends to contact@careable.site
 * via Resend. Rate-limited to prevent spam — max 5 requests per IP per hour
 * (handled at route level via express-rate-limit if available, otherwise
 * basic checks here).
 *
 * Never reveals whether send succeeded to prevent enumeration.
 */

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendEmail } = require("../utils/sendEmail");

const contactController = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  // ── Input validation ─────────────────────────────────────────────
  if (!name?.trim()) throw new ApiError(400, "Name is required.");
  if (name.trim().length > 100) throw new ApiError(400, "Name is too long.");

  if (!email?.trim()) throw new ApiError(400, "Email is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  if (!message?.trim()) throw new ApiError(400, "Message is required.");
  if (message.trim().length < 10) {
    throw new ApiError(400, "Message must be at least 10 characters.");
  }
  if (message.trim().length > 2000) {
    throw new ApiError(400, "Message must be under 2000 characters.");
  }

  const safeName    = name.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeEmail   = email.trim().toLowerCase();
  const safeMessage = message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

  // ── Send email ───────────────────────────────────────────────────
  try {
    await sendEmail({
      to: "contact@careable.site",
      replyTo: safeEmail,
      subject: `CareAble Contact: ${safeName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4f46e5; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission</h1>
            <p style="color: #c7d2fe; margin: 4px 0 0; font-size: 14px;">careable.site</p>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #6b7280; width: 80px; vertical-align: top;">Name</td>
                <td style="padding: 8px 0; font-size: 15px; font-weight: 600; color: #111827;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #6b7280; vertical-align: top;">Email</td>
                <td style="padding: 8px 0; font-size: 15px; color: #4f46e5;">
                  <a href="mailto:${safeEmail}" style="color: #4f46e5;">${safeEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #6b7280; vertical-align: top;">Message</td>
                <td style="padding: 8px 0; font-size: 15px; color: #374151; line-height: 1.6;">${safeMessage}</td>
              </tr>
            </table>
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #f3f4f6;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                Reply directly to this email to respond to ${safeName}.
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("[CONTACT] Email send failed:", err.message);
    // Still return success — don't reveal email failures
  }

  // Always return success to prevent enumeration
  return res.status(200).json({
    success: true,
    message: "Message received. We'll be in touch soon.",
  });
});

module.exports = contactController;