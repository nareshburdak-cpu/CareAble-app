// server/utils/emailTemplates.js

/** @file HTML email templates — simplified for mobile-first readability. */

const BRAND = {
  name: "CareAble",
  url: "https://careable.site",
  supportEmail: "hello@careable.site",
  partnersLine: "La Trobe University × ACAMI",
};

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
      <td align="center" style="padding: 24px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 24px 20px; text-align: center;">
              <div style="font-size: 32px; line-height: 1;">🫶</div>
              <p style="margin: 6px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">${BRAND.name}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 28px 24px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; padding: 18px 24px; text-align: center; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0 0 4px 0; color: #a8a29e; font-size: 11px; line-height: 1.6;">
                ${BRAND.name} · In partnership with ${BRAND.partnersLine}
              </p>
              <p style="margin: 0; color: #a8a29e; font-size: 11px;">
                Questions? <a href="mailto:${BRAND.supportEmail}" style="color: #4f46e5; text-decoration: none;">${BRAND.supportEmail}</a>
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

function button(label, href) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%);">
          <a href="${href}" style="display: inline-block; padding: 13px 28px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function warningBox(heading, body) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 24px;">
      <tr>
        <td style="background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 6px; padding: 14px 16px;">
          <p style="margin: 0 0 4px 0; color: #92400e; font-size: 13px; font-weight: 600;">${heading}</p>
          <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.6;">${body}</p>
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
    <p style="margin: 0 0 12px 0; color: #1c1917; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">
      Welcome, ${firstName} 🫶
    </p>

    <p style="margin: 0 0 16px 0; color: #44403c; font-size: 15px; line-height: 1.7;">
      You're now part of a community recognising the extraordinary work of unpaid carers.
    </p>

    <p style="margin: 0 0 20px 0; color: #44403c; font-size: 15px; line-height: 1.7;">
      Your self-assessment takes about 10–15 minutes, saves automatically, and ends with a
      personalised report and digital certificate you can share with employers.
    </p>

    ${button("Take your first assessment", `${BRAND.url}/assessment`)}

    <p style="margin: 16px 0 0 0; color: #78716c; font-size: 13px; line-height: 1.6;">
      Questions? Reply to this email — we'd love to hear from you.
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
    <p style="margin: 0 0 12px 0; color: #1c1917; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">
      Reset your password 🔐
    </p>

    <p style="margin: 0 0 16px 0; color: #44403c; font-size: 15px; line-height: 1.7;">
      Hi ${firstName}, we received a request to reset your ${BRAND.name} password.
      This link expires in <strong>30 minutes</strong>.
    </p>

    ${button("Reset my password", resetUrl)}

    <p style="margin: 0 0 8px 0; color: #78716c; font-size: 13px; line-height: 1.6;">
      Or copy this link into your browser:
    </p>

    <p style="margin: 0 0 0 0; padding: 10px 14px; background-color: #f5f5f4; border-radius: 6px; color: #44403c; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace;">
      ${resetUrl}
    </p>

    ${warningBox("🛡️ Didn't request this?", "You can safely ignore this email — your password won't change unless you click the link above.")}
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
    <p style="margin: 0 0 12px 0; color: #1c1917; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">
      Verify your email ✉️
    </p>

    <p style="margin: 0 0 16px 0; color: #44403c; font-size: 15px; line-height: 1.7;">
      Hi ${firstName}, thanks for joining ${BRAND.name}! Click below to verify your email
      and unlock certificate generation when you complete your assessment.
    </p>

    ${button("Verify my email", verifyUrl)}

    <p style="margin: 0 0 8px 0; color: #78716c; font-size: 13px; line-height: 1.6;">
      Or copy this link into your browser:
    </p>

    <p style="margin: 0 0 16px 0; padding: 10px 14px; background-color: #f5f5f4; border-radius: 6px; color: #44403c; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace;">
      ${verifyUrl}
    </p>

    <p style="margin: 0; color: #a8a29e; font-size: 12px;">
      This link expires in 7 days. Didn't sign up? You can safely ignore this email.
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

  const ACTION_LABELS = {
    "change-password": "change your password",
    "delete-account": "delete your account",
  };
  const actionLabel = ACTION_LABELS[action] || "confirm this action";

  const content = `
    <p style="margin: 0 0 12px 0; color: #1c1917; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">
      Your security code 🔐
    </p>

    <p style="margin: 0 0 20px 0; color: #44403c; font-size: 15px; line-height: 1.7;">
      Hi ${firstName}, you requested to <strong>${actionLabel}</strong>. Use this code to confirm:
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0;">
      <tr>
        <td style="background-color: #f5f3ff; border: 2px solid #c4b5fd; border-radius: 10px; padding: 20px 36px;">
          <div style="font-family: 'Courier New', Consolas, monospace; font-size: 36px; font-weight: 700; color: #4f46e5; letter-spacing: 8px;">
            ${otp}
          </div>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 0 0; color: #78716c; font-size: 13px;">
      Expires in <strong>10 minutes</strong>.
    </p>

    ${warningBox("🛡️ Didn't request this?", `If you didn't ask to ${actionLabel}, please log in and change your password immediately.`)}
  `;

  return {
    subject: `Your ${BRAND.name} security code: ${otp}`,
    html: emailWrapper(content),
  };
}

// =============================================================================
// EMPLOYER INTEREST EMAIL
// =============================================================================
function employerInterestEmail({ carerName, employerName, employerOrg, message }) {
  const firstName = carerName?.split(" ")[0] || "there";

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
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="background-color: #f5f3ff; border-left: 3px solid #7c3aed; border-radius: 6px; padding: 14px 16px; color: #44403c; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</td>
      </tr>
    </table>`
    : "";

  const content = `
    <p style="margin: 0 0 12px 0; color: #1c1917; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">
      An employer is interested 🤝
    </p>

    <p style="margin: 0 0 16px 0; color: #44403c; font-size: 15px; line-height: 1.7;">
      Hi ${esc(firstName)}, <strong>${safeEmployer}</strong>${safeOrg ? ` from <strong>${safeOrg}</strong>` : ""} verified your ${BRAND.name} certificate and would like to connect with you.
    </p>

    ${messageBlock}

    <p style="margin: 0 0 16px 0; color: #44403c; font-size: 15px; line-height: 1.7;">
      <strong>Reply to this email</strong> to reach them directly. Your email address was not shared —
      you're in full control of whether and how you respond.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 8px;">
      <tr>
        <td style="background-color: #eef2ff; border-left: 3px solid #4f46e5; border-radius: 6px; padding: 14px 16px;">
          <p style="margin: 0; color: #3730a3; font-size: 13px; line-height: 1.6;">
            🛡️ CareAble never shares your contact details without your action. Never send money or sensitive documents to unverified contacts.
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

// =============================================================================
// ASSESSMENT CERTIFICATE EMAIL
// =============================================================================
function assessmentCertificateEmail({ name, assessment, verifyUrl, resultsUrl }) {
  const firstName = name?.split(" ")[0] || "there";
  const score = assessment.overallScore != null
    ? assessment.overallScore.toFixed(2)
    : null;

  const content = `
    <p style="margin: 0 0 12px 0; color: #1c1917; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">
      Your certificate is ready 🎉
    </p>

    <p style="margin: 0 0 20px 0; color: #44403c; font-size: 15px; line-height: 1.7;">
      Hi ${firstName}, congratulations on completing your ${BRAND.name} self-assessment.
      Your digital certificate is attached to this email as a PDF.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 20px 0;">
      <tr>
        <td style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px 18px;">
          <p style="margin: 0 0 6px 0; color: #44403c; font-size: 14px; line-height: 1.6;">
            <strong>Certificate ID:</strong> ${assessment.certificateId || "Pending"}
          </p>
          <p style="margin: 0 0 6px 0; color: #44403c; font-size: 14px; line-height: 1.6;">
            <strong>Level:</strong> ${assessment.level || "Completed"}
          </p>
          ${score ? `<p style="margin: 0; color: #44403c; font-size: 14px; line-height: 1.6;"><strong>Overall score:</strong> ${score} / 5.00</p>` : ""}
        </td>
      </tr>
    </table>

    ${button("View my results", resultsUrl)}

    <p style="margin: 4px 0 8px 0; color: #78716c; font-size: 13px; line-height: 1.6;">
      Or verify this certificate online:
    </p>

    <p style="margin: 0; padding: 10px 14px; background-color: #f5f5f4; border-radius: 6px; color: #44403c; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace;">
      ${verifyUrl}
    </p>
  `;

  return {
    subject: `Your ${BRAND.name} certificate is ready`,
    html: emailWrapper(content),
  };
}

module.exports = {
  welcomeEmail,
  passwordResetEmail,
  verifyEmailTemplate,
  otpEmail,
  employerInterestEmail,
  assessmentCertificateEmail,
};