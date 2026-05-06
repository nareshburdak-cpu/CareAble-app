// server/utils/generateCertificate.js

/**
 * Certificate Generator — CareAble Brand Edition
 * ------------------------------------------------
 * Redesigned for Phase 12-A brief alignment:
 *   - Brand colours (teal #2BBFAA + blue #2B7FC0) replace gold/navy palette
 *   - CareAble logo PNG embedded top-left
 *   - QR code top-right for instant verification
 *   - Per-domain 1-5 scoring reflected in score line
 *   - Top capability areas (domains >= 4.0) listed if any exist
 *   - Brief-aligned level labels: Support | Growth | Strength
 *   - A4 landscape, clean geometric layout
 *
 * Logo dependency:
 *   server/assets/careable-logo.png  (400x400 PNG, transparent background)
 *   If missing, certificate renders without logo (graceful fallback).
 *
 * QR dependency:
 *   Encodes CLIENT_URL/verify/<certificateId>.
 *   Falls back to text-only if QR generation fails.
 */

const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const categoryCache = require("./categoryCache");

// ── Brand colour palette ──────────────────────────────────────────
const C = {
  teal:        "#2BBFAA",
  blue:        "#2B7FC0",
  tealDark:    "#1E8F7E",
  blueDark:    "#1A5F8F",
  ink:         "#1A1A2E",
  inkSoft:     "#4A4A6A",
  parchment:   "#FAFCFF",
  rule:        "#D0EAE8",
  chipBg:      "#E8F8F6",
  chipText:    "#1A6B60",
  white:       "#FFFFFF",
};

// ── Level metadata ────────────────────────────────────────────────
const LEVEL_META = {
  Strength: {
    honorific: "Strength in Caregiving Capabilities",
    descriptor: "demonstrating strong, well-developed caregiving capabilities",
  },
  Growth: {
    honorific: "Growth in Caregiving Capabilities",
    descriptor: "demonstrating developing caregiving capabilities with positive momentum",
  },
  Support: {
    honorific: "Foundation in Caregiving Capabilities",
    descriptor: "demonstrating foundational caregiving capabilities",
  },
};

// ── Paths ─────────────────────────────────────────────────────────
const LOGO_PATH = path.join(__dirname, "../assets/careable-logo.png");

// ── Helpers ───────────────────────────────────────────────────────
function buildVerifyUrl(certificateId) {
  const base = (process.env.CLIENT_URL || "https://careable.site").replace(/\/$/, "");
  return `${base}/verify/${encodeURIComponent(certificateId)}`;
}

async function generateQrBuffer(verifyUrl) {
  return QRCode.toBuffer(verifyUrl, {
    errorCorrectionLevel: "M",
    type: "png",
    margin: 1,
    width: 300,
    color: {
      dark: C.blue,
      light: C.white,
    },
  });
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Main export ───────────────────────────────────────────────────
async function generateCertificate(user, assessment) {

  // ── QR code ──────────────────────────────────────────────────────
  const verifyUrl = buildVerifyUrl(assessment.certificateId || "CA-UNKNOWN");
  let qrBuffer = null;
  try {
    qrBuffer = await generateQrBuffer(verifyUrl);
  } catch (err) {
    console.error("[CERT] QR generation failed — continuing without QR:", err.message);
  }

  // ── Logo ──────────────────────────────────────────────────────────
  const logoExists = fs.existsSync(LOGO_PATH);
  if (!logoExists) {
    console.warn("[CERT] Logo not found at", LOGO_PATH, "— continuing without logo");
  }

  // ── Category label map (FIX 1) ───────────────────────────────────
  // Fetch all categories from the in-memory cache (no extra DB hit).
  // Includes archived — so historical certs with archived domains still
  // resolve their labels correctly.
  let categoryLabelMap = {}; // { "communication-relational-care": "Communication & Relational Care", ... }
  try {
    const allCats = await categoryCache.getAllCategoriesIncludingArchived();
    for (const cat of allCats) {
      categoryLabelMap[cat.key] = cat.label;
    }
  } catch (err) {
    // Non-fatal — falls back to key-derived labels below
    console.warn("[CERT] Could not load category labels from cache:", err.message);
  }

  // Fallback: format raw key → readable label when cache lookup misses.
  // e.g. "digital-literacy" → "Digital Literacy"
  function keyToLabel(key) {
    return categoryLabelMap[key] || key
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // ── Top capability areas ─────────────────────────────────────────
  const scoresObj = assessment.categoryScores instanceof Map
    ? Object.fromEntries(assessment.categoryScores)
    : (assessment.categoryScores || {});

  const topAreas = Object.entries(scoresObj)
    .filter(([, score]) => score != null && score >= 4.0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // ── Build PDF ────────────────────────────────────────────────────
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
        autoFirstPage: true,
        info: {
          Title: `CareAble Certificate — ${user.name}`,
          Author: "CareAble",
          Subject: "Caregiver Capability Certificate",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = doc.page.width;   // 842pt
      const H = doc.page.height;  // 595pt

      // ── BACKGROUND ──────────────────────────────────────────────
      doc.rect(0, 0, W, H).fill(C.parchment);

      // ── TOP COLOUR BAR ──────────────────────────────────────────
      const barH = 8;
      doc.rect(0, 0, W / 2, barH).fill(C.teal);
      doc.rect(W / 2, 0, W / 2, barH).fill(C.blue);

      // ── BOTTOM COLOUR BAR ───────────────────────────────────────
      doc.rect(0, H - barH, W / 2, barH).fill(C.teal);
      doc.rect(W / 2, H - barH, W / 2, barH).fill(C.blue);

      // ── OUTER BORDER ────────────────────────────────────────────
      const bm = 18;
      doc.rect(bm, bm, W - bm * 2, H - bm * 2)
        .lineWidth(1.2)
        .stroke(C.teal);

      const bm2 = 24;
      doc.rect(bm2, bm2, W - bm2 * 2, H - bm2 * 2)
        .lineWidth(0.4)
        .stroke(C.rule);

      // ── HEADER ZONE ─────────────────────────────────────────────
      const headerY = 36;
      const headerH = 90;

      // ---- Logo ----
      const logoSize = 68;
      const logoX = 46;
      const logoY = headerY;

      if (logoExists) {
        doc.image(LOGO_PATH, logoX, logoY, { width: logoSize, height: logoSize });
      } else {
        doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).fill(C.teal);
        doc.fontSize(28).fillColor(C.white).font("Helvetica-Bold")
          .text("C", logoX, logoY + logoSize / 2 - 16, { width: logoSize, align: "center" });
      }

      // ---- Brand wordmark ----
      const wordmarkX = logoX + logoSize + 12;
      const wordmarkY = logoY + 8;

      doc.fontSize(26).font("Helvetica-Bold");
      const careWidth = doc.widthOfString("Care");

      doc.fillColor(C.teal)
        .text("Care", wordmarkX, wordmarkY, { continued: false, lineBreak: false });
      doc.fillColor(C.blue)
        .text("Able", wordmarkX + careWidth, wordmarkY, { lineBreak: false });

      doc.fontSize(9)
        .fillColor(C.inkSoft)
        .font("Helvetica")
        .text("Caregiver Capability Certificate", wordmarkX, wordmarkY + 32, {
          characterSpacing: 1.5,
        });

      doc.fontSize(7.5)
        .fillColor(C.inkSoft)
        .text("La Trobe University · Capstone 2026 · Team NEXA", wordmarkX, wordmarkY + 48, {
          characterSpacing: 0.5,
        });

      // ---- QR Code ----
      const qrSize = 72;
      const qrX = W - 46 - qrSize;
      const qrY = headerY;

      if (qrBuffer) {
        doc.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6).fill(C.white);
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
        doc.fontSize(7)
          .fillColor(C.inkSoft)
          .font("Helvetica")
          .text("Scan to verify", qrX - 3, qrY + qrSize + 5, {
            width: qrSize + 6,
            align: "center",
          });
      } else {
        doc.fontSize(7).fillColor(C.inkSoft).font("Helvetica")
          .text(
            `Verify at careable.site/verify/${assessment.certificateId || ""}`,
            qrX, qrY + qrSize / 2,
            { width: qrSize + 6, align: "center" }
          );
      }

      // ── DIVIDER RULE 1 ───────────────────────────────────────────
      const ruleY = headerY + headerH;
      doc.moveTo(bm2 + 4, ruleY).lineTo(W / 2, ruleY).lineWidth(1).stroke(C.teal);
      doc.moveTo(W / 2, ruleY).lineTo(W - bm2 - 4, ruleY).lineWidth(1).stroke(C.blue);

      // ── BODY ─────────────────────────────────────────────────────
      let y = ruleY + 20;

      // "This certifies that"
      doc.fontSize(10)
        .fillColor(C.inkSoft)
        .font("Helvetica")
        .text("This certifies that", 0, y, {
          align: "center",
          width: W,
          characterSpacing: 1,
        });

      y += 20;

      // Carer name
      doc.fontSize(34)
        .fillColor(C.blueDark)
        .font("Helvetica-Bold")
        .text(user.name, 0, y, { align: "center", width: W });

      y += 44;

      // Name underline
      const nameLineLen = 220;
      const nameCX = W / 2;
      doc.moveTo(nameCX - nameLineLen / 2, y - 6)
        .lineTo(nameCX, y - 6).lineWidth(0.8).stroke(C.teal);
      doc.moveTo(nameCX, y - 6)
        .lineTo(nameCX + nameLineLen / 2, y - 6).lineWidth(0.8).stroke(C.blue);

      // Descriptor lines
      const levelMeta = LEVEL_META[assessment.level] || LEVEL_META.Growth;

      doc.fontSize(10)
        .fillColor(C.inkSoft)
        .font("Helvetica")
        .text(
          "has successfully completed the CareAble Self-Assessment,",
          0, y,
          { align: "center", width: W }
        );

      y += 16;

      doc.text(levelMeta.descriptor, 0, y, { align: "center", width: W });

      y += 24;

      // Level honorific
      doc.fontSize(19)
        .fillColor(C.tealDark)
        .font("Helvetica-Bold")
        .text(levelMeta.honorific, 0, y, {
          align: "center",
          width: W,
          characterSpacing: 0.5,
        });

      y += 30;

      // Overall score
      const scoreStr = assessment.overallScore != null
        ? `Overall capability score: ${assessment.overallScore.toFixed(2)} / 5.00`
        : "Overall capability score: —";

      doc.fontSize(9.5)
        .fillColor(C.inkSoft)
        .font("Helvetica")
        .text(scoreStr, 0, y, {
          align: "center",
          width: W,
          characterSpacing: 0.5,
        });

      y += 18;

      // ── TOP CAPABILITY AREAS ─────────────────────────────────────
      if (topAreas.length > 0) {
        doc.fontSize(8.5)
          .fillColor(C.inkSoft)
          .font("Helvetica")
          .text("Top capability areas:", 0, y, { align: "center", width: W });

        y += 14;

        const chipPadX = 10;
        const chipPadY = 4;
        const chipFontSize = 7.5;
        const chipGap = 8;
        const chipH = chipFontSize + chipPadY * 2 + 2;

        // Measure chips using real labels from categoryCache (FIX 1)
        doc.fontSize(chipFontSize).font("Helvetica-Bold");
        const chipData = topAreas.map(([key, score]) => {
          const label = keyToLabel(key);           // ← real label now
          const scoreLabel = `  ${score.toFixed(2)}`;
          // Measure label bold + score regular separately for accuracy
          const labelW = doc.widthOfString(label);
          doc.font("Helvetica");
          const scoreW = doc.widthOfString(scoreLabel);
          doc.font("Helvetica-Bold");
          return {
            label,
            scoreLabel,
            width: labelW + scoreW + chipPadX * 2,
          };
        });

        // Centre the chip row
        const totalChipW = chipData.reduce((s, c) => s + c.width, 0)
          + chipGap * (chipData.length - 1);

        // If chips would overflow the safe width, scale gap down gracefully
        const safeW = W - bm2 * 2 - 16;
        const effectiveGap = totalChipW > safeW
          ? Math.max(2, chipGap - Math.ceil((totalChipW - safeW) / chipData.length))
          : chipGap;

        const adjustedTotalW = chipData.reduce((s, c) => s + c.width, 0)
          + effectiveGap * (chipData.length - 1);
        let chipX = (W - adjustedTotalW) / 2;

        for (const chip of chipData) {
          // Chip background (rounded rect)
          doc.roundedRect(chipX, y, chip.width, chipH, 4).fill(C.chipBg);

          // Label — bold teal
          doc.fontSize(chipFontSize)
            .fillColor(C.chipText)
            .font("Helvetica-Bold")
            .text(chip.label, chipX + chipPadX, y + chipPadY + 1, { lineBreak: false });

          // Score — regular, muted
          const labelW = doc.widthOfString(chip.label);
          doc.font("Helvetica")
            .fillColor(C.inkSoft)
            .text(chip.scoreLabel, chipX + chipPadX + labelW, y + chipPadY + 1, {
              lineBreak: false,
            });

          chipX += chip.width + effectiveGap;
        }

        y += chipH + 8;
      }

      // ── DIVIDER RULE 2 (FIX 2 — dynamic position) ───────────────
      // Sits 28pt below last body content, but never above the
      // footer zone (footer needs ~75pt from bottom).
      const footerZoneTop = H - 75;
      const rule2Y = Math.min(y + 28, footerZoneTop);

      doc.moveTo(bm2 + 4, rule2Y).lineTo(W / 2, rule2Y).lineWidth(0.8).stroke(C.teal);
      doc.moveTo(W / 2, rule2Y).lineTo(W - bm2 - 4, rule2Y).lineWidth(0.8).stroke(C.blue);

      // ── FOOTER ───────────────────────────────────────────────────
      const footerY = H - 62;

      // Date of issue — left
      const leftFootX = 46;
      doc.fontSize(7.5)
        .fillColor(C.inkSoft)
        .font("Helvetica")
        .text("DATE OF ISSUE", leftFootX, footerY, { characterSpacing: 1 });

      doc.fontSize(11)
        .fillColor(C.ink)
        .font("Helvetica-Bold")
        .text(formatDate(assessment.submittedAt), leftFootX, footerY + 11);

      // Certificate ID — right
      const certIdStr = assessment.certificateId || "CA-UNKNOWN";
      const rightFootX = W - 46 - 160;
      doc.fontSize(7.5)
        .fillColor(C.inkSoft)
        .font("Helvetica")
        .text("CERTIFICATE ID", rightFootX, footerY, {
          width: 160,
          align: "right",
          characterSpacing: 1,
        });

      doc.fontSize(11)
        .fillColor(C.ink)
        .font("Courier-Bold")
        .text(certIdStr, rightFootX, footerY + 11, { width: 160, align: "right" });

      // Fine print — centred
      doc.fontSize(6.5)
        .fillColor(C.inkSoft)
        .font("Helvetica")
        .text(
          "Aligned with the Australian Skills Classification · Care and Support Economy Strategy (2023–2033)",
          0, footerY + 28,
          { align: "center", width: W, characterSpacing: 0.3 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateCertificate;