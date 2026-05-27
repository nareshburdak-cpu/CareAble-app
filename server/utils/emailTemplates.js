/**
 * Email Templates
 * ---------------
 * HTML email templates. Each function takes input and returns a complete HTML string.
 *
 * Design philosophy:
 *   - Inline styles only (email clients strip <style> blocks)
 *   - Use tables for layout (email clients ignore CSS grid/flexbox)
 *   - Test in Gmail, Outlook, Apple Mail before launch
 *   - Brand-consistent: indigo + purple, Playfair-style headlines
 */

const BRAND = {
  name: "CareAble",
  url: "https://careable.site",
  supportEmail: "hello@careable.site",
  partnersLine: "La Trobe University × ACAMI",
};

// Reusable wrapper — every email uses this shell
function emailWrapper(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND.name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 40px; text-align: center;">
              <div style="font-size: 40px; line-height: 1;">🫶</div>
              <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">${BRAND.name}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; padding: 24px 40px; text-align: center; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0 0 8px 0; color: #78716c; font-size: 12px; line-height: 1.6;">
                ${BRAND.name} — Supporting hidden caregiving workers
              </p>
              <p style="margin: 0 0 8px 0; color: #a8a29e; font-size: 11px;">
                In partnership with ${BRAND.partnersLine}
              </p>
              <p style="margin: 0; color: #a8a29e; font-size: 11px;">
                Need help? <a href="mailto:${BRAND.supportEmail}" style="color: #4f46e5; text-decoration: none;">${BRAND.supportEmail}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Reusable button styling
function button(label, href) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 9999px; background: linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
          <a href="${href}" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// =============================================================================
// WELCOME EMAIL
// =============================================================================
function welcomeEmail({ name }) {
  const firstName = name?.split(" ")[0] || "there";

  const content = `
    <h2 style="margin: 0 0 16px 0; color: #1c1917; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">
      Welcome, ${firstName} 🫶
    </h2>

    <p style="margin: 0 0 16px 0; color: #44403c; font-size: 16px; line-height: 1.6;">
      Thank you for joining ${BRAND.name}. You're now part of a community recognising
      the extraordinary work of unpaid carers.
    </p>

    <p style="margin: 0 0 24px 0; color: #44403c; font-size: 16px; line-height: 1.6;">
      Ready to discover your caregiving capabilities? The self-assessment takes
      about 10–15 minutes, saves automatically, and ends with a personalised
      report and digital certificate.
    </p>

    ${button("Take your first assessment", `${BRAND.url}/assessment`)}

    <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 32px 0;">

    <h3 style="margin: 0 0 12px 0; color: #1c1917; font-size: 17px; font-weight: 600;">
      What to expect
    </h3>

    <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #44403c; font-size: 15px; line-height: 1.8;">
      <li>30 questions across 6 caregiving capability areas</li>
      <li>Aligned with the Australian Skills Classification</li>
      <li>Auto-saves — pause and resume anytime</li>
      <li>Personalised insights + a downloadable certificate</li>
    </ul>

    <p style="margin: 24px 0 0 0; color: #78716c; font-size: 14px; line-height: 1.6;">
      Questions? Reply to this email or reach us at
      <a href="mailto:${BRAND.supportEmail}" style="color: #4f46e5; text-decoration: none;">${BRAND.supportEmail}</a>.
      We'd love to hear from you.
    </p>
  `;

  return {
    subject: `Welcome to ${BRAND.name}, ${firstName} 🫶`,
    html: emailWrapper(content),
  };
}

// =============================================================================
// PASSWORD RESET EMAIL
// =============================================================================
function passwordResetEmail({ name, resetUrl }) {
  const firstName = name?.split(" ")[0] || "there";

  const content = `
    <h2 style="margin: 0 0 16px 0; color: #1c1917; font-size: 26px; font-weight: 700; letter-spacing: -0.02em;">
      Reset your password 🔐
    </h2>

    <p style="margin: 0 0 16px 0; color: #44403c; font-size: 16px; line-height: 1.6;">
      Hi ${firstName}, we received a request to reset your ${BRAND.name} password.
    </p>

    <p style="margin: 0 0 24px 0; color: #44403c; font-size: 16px; line-height: 1.6;">
      Click the button below to choose a new password. This link will expire in
      <strong>30 minutes</strong>.
    </p>

    ${button("Reset my password", resetUrl)}

    <p style="margin: 24px 0 16px 0; color: #78716c; font-size: 14px; line-height: 1.6;">
      Or copy and paste this link into your browser:
    </p>

    <p style="margin: 0 0 24px 0; padding: 12px 16px; background-color: #f5f5f4; border-radius: 8px; color: #44403c; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
      ${resetUrl}
    </p>

    <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 32px 0;">

    <table cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 12px; padding: 16px;">
      <tr>
        <td>
          <p style="margin: 0 0 6px 0; color: #92400e; font-size: 14px; font-weight: 600;">
            🛡️ Didn't request this?
          </p>
          <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.6;">
            If you didn't ask to reset your password, you can safely ignore this email.
            Your password won't change unless you click the link above.
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Reset your ${BRAND.name} password`,
    html: emailWrapper(content),
  };
}

// =============================================================================
// EMAIL VERIFICATION
// =============================================================================
function verifyEmailTemplate({ name, verifyUrl }) {
  const firstName = name?.split(" ")[0] || "there";

  const content = `
    <h2 style="margin: 0 0 16px 0; color: #1c1917; font-size: 26px; font-weight: 700; letter-spacing: -0.02em;">
      Verify your email ✉️
    </h2>

    <p style="margin: 0 0 16px 0; color: #44403c; font-size: 16px; line-height: 1.6;">
      Hi ${firstName}, thanks for joining ${BRAND.name}!
    </p>

    <p style="margin: 0 0 24px 0; color: #44403c; font-size: 16px; line-height: 1.6;">
      Click the button below to verify your email. This confirms it's really you and unlocks
      certificate generation when you complete your assessment.
    </p>

    ${button("Verify my email", verifyUrl)}

    <p style="margin: 24px 0 16px 0; color: #78716c; font-size: 14px; line-height: 1.6;">
      Or copy and paste this link:
    </p>

    <p style="margin: 0 0 24px 0; padding: 12px 16px; background-color: #f5f5f4; border-radius: 8px; color: #44403c; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
      ${verifyUrl}
    </p>

    <p style="margin: 0 0 8px 0; color: #78716c; font-size: 13px; line-height: 1.6;">
      This link expires in <strong>7 days</strong>. If it expires, you can request a new one from your dashboard.
    </p>

    <p style="margin: 24px 0 0 0; color: #78716c; font-size: 13px; line-height: 1.6;">
      Didn't sign up? You can safely ignore this email.
    </p>
  `;

  return {
    subject: `Verify your email for ${BRAND.name}`,
    html: emailWrapper(content),
  };
}

// =============================================================================
// OTP CODE EMAIL
// =============================================================================
function otpEmail({ name, otp, action }) {
  const firstName = name?.split(" ")[0] || "there";

  // Friendly action labels
  const ACTION_LABELS = {
    "change-password": "change your password",
    "delete-account": "delete your account",
  };
  const actionLabel = ACTION_LABELS[action] || "confirm this action";

  const content = `
    <h2 style="margin: 0 0 16px 0; color: #1c1917; font-size: 26px; font-weight: 700; letter-spacing: -0.02em;">
      Your security code 🔐
    </h2>

    <p style="margin: 0 0 24px 0; color: #44403c; font-size: 16px; line-height: 1.6;">
      Hi ${firstName}, you requested to <strong>${actionLabel}</strong>. Enter this code to confirm:
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 24px auto;">
      <tr>
        <td style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border: 2px solid #c4b5fd; border-radius: 14px; padding: 24px 40px; text-align: center;">
          <div style="font-family: 'Courier New', Consolas, monospace; font-size: 38px; font-weight: 700; color: #4f46e5; letter-spacing: 8px;">
            ${otp}
          </div>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px 0; color: #78716c; font-size: 14px; line-height: 1.6; text-align: center;">
      This code expires in <strong>10 minutes</strong>.
    </p>

    <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 32px 0;">

    <table cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 12px; padding: 16px;">
      <tr>
        <td>
          <p style="margin: 0 0 6px 0; color: #92400e; font-size: 14px; font-weight: 600;">
            🛡️ Didn't request this?
          </p>
          <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.6;">
            If you didn't ask to ${actionLabel}, someone may be trying to access your account.
            Please log in and change your password immediately.
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Your ${BRAND.name} security code: ${otp}`,
    html: emailWrapper(content),
  };
}

// =============================================================================
// EMPLOYER INTEREST EMAIL (brokered contact)
// =============================================================================
/**
 * Sent to a carer when an employer requests to connect via certificate verification.
 * The carer's email is NEVER shared with the employer — CareAble brokers the intro.
 * The employer's email is set as reply-to (handled in the controller), so the carer
 * can choose to respond directly.
 */
function employerInterestEmail({ carerName, employerName, employerOrg, message }) {
  const firstName = carerName?.split(" ")[0] || "there";

  // Escape any user-supplied text to prevent HTML injection in the email body.
  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const safeEmployer = esc(employerName) || "An employer";
  const safeOrg = employerOrg ? esc(employerOrg) : "";
  const safeMessage = message ? esc(message) : "";

  const messageBlock = safeMessage
    ? `
    <p style="margin: 0 0 8px 0; color: #78716c; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
      Their message
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #f5f3ff; border-left: 4px solid #7c3aed; border-radius: 8px; margin: 0 0 24px 0;">
      <tr>
        <td style="padding: 16px 20px; color: #44403c; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</td>
      </tr>
    </table>`
    : "";

  const content = `
    <h2 style="margin: 0 0 16px 0; color: #1c1917; font-size: 26px; font-weight: 700; letter-spacing: -0.02em;">
      An employer is interested 🤝
    </h2>

    <p style="margin: 0 0 16px 0; color: #44403c; font-size: 16px; line-height: 1.6;">
      Hi ${esc(firstName)}, good news — <strong>${safeEmployer}</strong>${
        safeOrg ? ` from <strong>${safeOrg}</strong>` : ""
      } verified your ${BRAND.name} certificate and would like to connect with you about an opportunity.
    </p>

    ${messageBlock}

    <p style="margin: 0 0 24px 0; color: #44403c; font-size: 16px; line-height: 1.6;">
      If you're interested, simply <strong>reply to this email</strong> to reach them directly.
      Your email address was not shared with the employer — you're in full control of whether
      and how you respond.
    </p>

    <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 32px 0;">

    <table cellpadding="0" cellspacing="0" border="0" style="background-color: #eef2ff; border-radius: 12px; padding: 16px;">
      <tr>
        <td>
          <p style="margin: 0 0 6px 0; color: #3730a3; font-size: 14px; font-weight: 600;">
            🛡️ Staying safe
          </p>
          <p style="margin: 0; color: #4338ca; font-size: 13px; line-height: 1.6;">
            CareAble never shares your contact details without your action. Only reply if you're
            comfortable. Never send money or sensitive personal documents to someone you haven't verified.
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `${safeEmployer} is interested in connecting — ${BRAND.name}`,
    html: emailWrapper(content),
  };
}



module.exports = {
  welcomeEmail,
  passwordResetEmail,
  verifyEmailTemplate,
  otpEmail,
  employerInterestEmail,
};