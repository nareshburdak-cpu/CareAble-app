/**
 * Certificate Generator — Premium Edition
 * ---------------------------------------
 * Academic-style PDF certificate with:
 *   - Double-gold ornate border
 *   - Corner flourishes
 *   - Classical serif typography (Times-Roman)
 *   - Verification QR code (Phase 14)
 *   - Signature lines
 *   - Fits on a single landscape A4 page
 */

const PDFDocument = require("pdfkit");
const QRCode = require("qrcode"); // QR: Phase 14 — verification QR
const CATEGORIES = require("./categories");

// ---- Color palette ----
const C = {
  gold: "#B8860B",          // Classic gold
  goldLight: "#D4A017",
  navy: "#1E3A5F",          // Deep navy
  parchment: "#FDFBF4",     // Cream background
  seal: "#8B2E2E",          // Burgundy seal
  ink: "#1A1A1A",           // Near-black
  inkSoft: "#4A4A4A",
  divider: "#8B7355",       // Warm brown
};

// Level → honorific
const LEVEL_HONORIFIC = {
  Emerging: "Emerging Carer",
  Developing: "Developing Carer",
  Confident: "Confident Carer",
  Advanced: "Advanced Carer",
};

/**
 * QR: Phase 14 — Build the verification URL the QR encodes.
 * Falls back to careable.site if CLIENT_URL is missing (e.g., misconfigured Render env).
 */
function buildVerifyUrl(certificateId) {
  const base = (process.env.CLIENT_URL || "https://careable.site").replace(/\/$/, "");
  return `${base}/verify/${encodeURIComponent(certificateId)}`;
}

/**
 * QR: Phase 14 — Generate a PNG buffer for the QR code.
 * Tuned for print legibility:
 *   - errorCorrectionLevel 'M' (15% redundancy — good balance for paper scans)
 *   - margin 1 (compact white-space border)
 *   - dark color matches seal burgundy for visual cohesion
 */
async function generateQrBuffer(verifyUrl) {
  return QRCode.toBuffer(verifyUrl, {
    errorCorrectionLevel: "M",
    type: "png",
    margin: 1,
    width: 300, // Render large; we scale down when drawing — keeps it crisp
    color: {
      dark: "#8B2E2E",  // matches C.seal
      light: "#FDFBF4", // matches C.parchment so it blends with background
    },
  });
}

async function generateCertificate(user, assessment) {
  // QR: Phase 14 — generate the QR buffer FIRST (async), then build the PDF synchronously.
  // We do this outside the Promise wrapper so any QR error is caught cleanly.
  const verifyUrl = buildVerifyUrl(assessment.certificateId || "CA-UNKNOWN");
  let qrBuffer = null;
  try {
    qrBuffer = await generateQrBuffer(verifyUrl);
  } catch (err) {
    // If QR generation fails, continue without it rather than failing the whole certificate.
    console.error("⚠️ QR code generation failed; certificate will be issued without QR:", err.message);
  }

  return new Promise((resolve, reject) => {
    try {
      // ---- A4 Landscape dimensions in points ----
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,         // We'll draw borders manually
        autoFirstPage: true,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = doc.page.width;   // 842 pt
      const H = doc.page.height;  // 595 pt

      // ========================================
      // BACKGROUND (parchment)
      // ========================================
      doc.rect(0, 0, W, H).fill(C.parchment);

      // ========================================
      // ORNATE DOUBLE BORDER
      // ========================================
      const outerMargin = 25;
      const innerMargin = 35;

      // Outer thick gold line
      doc
        .rect(outerMargin, outerMargin, W - outerMargin * 2, H - outerMargin * 2)
        .lineWidth(3)
        .stroke(C.gold);

      // Inner thin gold line
      doc
        .rect(innerMargin, innerMargin, W - innerMargin * 2, H - innerMargin * 2)
        .lineWidth(0.75)
        .stroke(C.gold);

      // ========================================
      // CORNER FLOURISHES (ornamental)
      // ========================================
      const drawCornerOrnament = (x, y, rotate) => {
        doc.save();
        doc.translate(x, y);
        doc.rotate(rotate);

        // Classical fleur-de-lis-inspired ornament using curves
        doc.lineWidth(1).strokeColor(C.gold).fillColor(C.gold);

        // Center dot
        doc.circle(0, 0, 2).fill(C.gold);

        // Four radiating flourishes
        for (let i = 0; i < 4; i++) {
          doc.save();
          doc.rotate(i * 90);
          doc
            .moveTo(0, 0)
            .bezierCurveTo(4, -2, 10, -4, 18, 0)
            .bezierCurveTo(10, 4, 4, 2, 0, 0)
            .fill(C.gold);
          doc.restore();
        }

        // Outer corner arcs
        doc.strokeColor(C.gold).lineWidth(1);
        doc
          .moveTo(-25, 0)
          .bezierCurveTo(-22, -22, -22, -22, 0, -25)
          .stroke();

        doc.restore();
      };

      // Four corners
      const cornerInset = 50;
      drawCornerOrnament(cornerInset, cornerInset, 0);
      drawCornerOrnament(W - cornerInset, cornerInset, 90);
      drawCornerOrnament(W - cornerInset, H - cornerInset, 180);
      drawCornerOrnament(cornerInset, H - cornerInset, 270);

      // ========================================
      // HEADER — Brand
      // ========================================
      let y = 65;

      // Heart symbol (decorative)
      doc
        .fontSize(16)
        .fillColor(C.seal)
        .font("Times-Roman")
        .text("❦", 0, y, { align: "center", width: W });

      y += 22;

      // CareAble brand wordmark
      doc
        .fontSize(30)
        .fillColor(C.navy)
        .font("Times-Bold")
        .text("CareAble", 0, y, { align: "center", width: W, characterSpacing: 4 });

      y += 38;

      // Decorative divider line with center ornament
      const lineY = y;
      const lineStart = W / 2 - 80;
      const lineEnd = W / 2 + 80;

      doc.strokeColor(C.divider).lineWidth(0.5);
      doc.moveTo(lineStart, lineY).lineTo(W / 2 - 8, lineY).stroke();
      doc.moveTo(W / 2 + 8, lineY).lineTo(lineEnd, lineY).stroke();

      // Center ornament (diamond)
      doc
        .save()
        .translate(W / 2, lineY)
        .rotate(45)
        .rect(-3, -3, 6, 6)
        .fill(C.gold)
        .restore();

      // ========================================
      // TITLE
      // ========================================
      y += 18;

      doc
        .fontSize(11)
        .fillColor(C.inkSoft)
        .font("Times-Italic")
        .text("is proud to present the", 0, y, {
          align: "center",
          width: W,
          characterSpacing: 2,
        });

      y += 22;

      doc
        .fontSize(32)
        .fillColor(C.navy)
        .font("Times-Bold")
        .text("Certificate of Capability", 0, y, {
          align: "center",
          width: W,
          characterSpacing: 2,
        });

      y += 52;

      // ========================================
      // BODY — Name, Level, Body Text
      // ========================================
      doc
        .fontSize(12)
        .fillColor(C.inkSoft)
        .font("Times-Italic")
        .text("This certifies that", 0, y, {
          align: "center",
          width: W,
        });

      y += 24;

      // Name — prominent, italic serif
      doc
        .fontSize(34)
        .fillColor(C.ink)
        .font("Times-BoldItalic")
        .text(user.name, 0, y, { align: "center", width: W });

      y += 48;

      // Decorative short line under the name
      const nameLineStart = W / 2 - 120;
      const nameLineEnd = W / 2 + 120;
      doc
        .moveTo(nameLineStart, y - 8)
        .lineTo(nameLineEnd, y - 8)
        .lineWidth(0.5)
        .stroke(C.divider);

      // Body paragraph
      doc
        .fontSize(11)
        .fillColor(C.inkSoft)
        .font("Times-Roman")
        .text(
          "has successfully completed the CareAble Caregiving Self-Assessment,",
          0,
          y,
          { align: "center", width: W }
        );

      y += 16;

      doc.text("demonstrating the capabilities of a", 0, y, {
        align: "center",
        width: W,
      });

      y += 22;

      // Level honorific
      const levelText = LEVEL_HONORIFIC[assessment.level] || "Caregiver";
      doc
        .fontSize(22)
        .fillColor(C.seal)
        .font("Times-Bold")
        .text(levelText, 0, y, {
          align: "center",
          width: W,
          characterSpacing: 3,
        });

      y += 32;

      // Overall score as supporting line
      doc
        .fontSize(11)
        .fillColor(C.inkSoft)
        .font("Times-Italic")
        .text(
          `with an overall capability score of ${assessment.overallScore} out of 100`,
          0,
          y,
          { align: "center", width: W }
        );

      // ========================================
      // BOTTOM — QR + Date + Cert ID + Signature
      // ========================================
      const bottomY = H - 120;

      // ---- LEFT: Date + Signature Line ----
      const leftX = 90;
      const signatureY = bottomY + 20;

      // Signature line
      doc
        .moveTo(leftX, signatureY)
        .lineTo(leftX + 160, signatureY)
        .lineWidth(0.5)
        .stroke(C.ink);

      doc
        .fontSize(9)
        .fillColor(C.inkSoft)
        .font("Times-Italic")
        .text("Date of Issue", leftX, signatureY + 6, { width: 160, align: "center" });

      doc
        .fontSize(11)
        .fillColor(C.ink)
        .font("Times-Roman")
        .text(
          formatDate(assessment.submittedAt),
          leftX,
          signatureY - 18,
          { width: 160, align: "center" }
        );

      // ---- CENTER: Verification QR Block ----
      // QR: Phase 14 — Replaced decorative seal with a clean, scannable QR block.
      // Larger QR scans more reliably from both screen and printed paper.
      const qrCX = W / 2;
      const qrTopY = bottomY - 18;
      const qrSize = 70;

      if (qrBuffer) {
        // The QR itself
        doc.image(qrBuffer, qrCX - qrSize / 2, qrTopY, {
          width: qrSize,
          height: qrSize,
        });

        // Caption line 1 — call to action
        doc
          .fontSize(8)
          .fillColor(C.inkSoft)
          .font("Times-Italic")
          .text("Scan to verify this credential", qrCX - 90, qrTopY + qrSize + 6, {
            width: 180,
            align: "center",
            characterSpacing: 0.5,
          });

        // Caption line 2 — issuer (subtle prestige)
        doc
          .fontSize(7)
          .fillColor(C.seal)
          .font("Times-Bold")
          .text("CareAble", qrCX - 90, qrTopY + qrSize + 19, {
            width: 180,
            align: "center",
            characterSpacing: 2,
          });
      } else {
        // Fallback if QR generation failed: render a simple "Verified" badge
        // so the certificate still looks intentional.
        const badgeY = bottomY + 5;
        doc
          .circle(qrCX, badgeY + 20, 28)
          .lineWidth(1.5)
          .stroke(C.seal);

        doc
          .fontSize(9)
          .fillColor(C.seal)
          .font("Times-Bold")
          .text("CareAble", qrCX - 40, badgeY + 12, {
            width: 80,
            align: "center",
            characterSpacing: 1,
          });

        doc
          .fontSize(7)
          .fillColor(C.seal)
          .font("Times-Italic")
          .text("Certified", qrCX - 40, badgeY + 24, {
            width: 80,
            align: "center",
          });
      }

      // ---- RIGHT: Certificate ID ----
      const rightX = W - 90 - 160;
      doc
        .moveTo(rightX, signatureY)
        .lineTo(rightX + 160, signatureY)
        .lineWidth(0.5)
        .stroke(C.ink);

      doc
        .fontSize(9)
        .fillColor(C.inkSoft)
        .font("Times-Italic")
        .text("Certificate ID", rightX, signatureY + 6, { width: 160, align: "center" });

      doc
        .fontSize(12)
        .fillColor(C.ink)
        .font("Courier-Bold")
        .text(
          assessment.certificateId || "CA-UNKNOWN",
          rightX,
          signatureY - 18,
          { width: 160, align: "center" }
        );

      // ========================================
      // FINE PRINT (bottom)
      // ========================================
      doc
        .fontSize(7)
        .fillColor(C.inkSoft)
        .font("Times-Italic")
        .text(
          "Aligned with the Australian Skills Classification · Care and Support Economy Strategy (2023-2033)",
          0,
          H - 42,
          { align: "center", width: W, characterSpacing: 0.5 }
        );

      // Finalize
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ---- Helper: format date like "23 April 2026" ----
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

module.exports = generateCertificate;