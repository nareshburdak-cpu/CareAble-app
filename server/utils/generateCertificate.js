// server/utils/generateCertificate.js

/**
 * Certificate Generator - CareAble Brand Edition
 * ------------------------------------------------
 * v4 changes:
 *   - Partner logos share one display box and preserve their PNG aspect ratio.
 *   - Capability highlights use fixed cards instead of cramped chips.
 *   - The lower certificate space includes scope, result, and verification notes.
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

// ── Asset paths ───────────────────────────────────────────────────
const LOGO_PATH    = path.join(__dirname, "../assets/careable-logo.png");
const ACAMI_PATH   = path.join(__dirname, "../assets/acami.png");
const LATROBE_PATH = path.join(__dirname, "../assets/latrobe.png");

// Partner logos are prepared at matching size, so do not distort them.
const PARTNER_LOGO_W = 155;
const PARTNER_LOGO_H = 36;
const LOGO_GAP = 46; // space between the two logos

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
    color: { dark: C.blue, light: C.white },
  });
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
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
    console.error("[CERT] QR generation failed:", err.message);
  }

  // ── Logo existence checks ─────────────────────────────────────────
  const logoExists    = fs.existsSync(LOGO_PATH);
  const acamiExists   = fs.existsSync(ACAMI_PATH);
  const latrobeExists = fs.existsSync(LATROBE_PATH);
  if (!logoExists)    console.warn("[CERT] CareAble logo missing:", LOGO_PATH);
  if (!acamiExists)   console.warn("[CERT] ACAMI logo missing:", ACAMI_PATH);
  if (!latrobeExists) console.warn("[CERT] La Trobe logo missing:", LATROBE_PATH);

  // ── Category label map ───────────────────────────────────────────
  let categoryLabelMap = {};
  try {
    const allCats = await categoryCache.getAllCategoriesIncludingArchived();
    for (const cat of allCats) categoryLabelMap[cat.key] = cat.label;
  } catch (err) {
    console.warn("[CERT] Could not load category labels:", err.message);
  }

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
          Title: `CareAble Certificate - ${user.name}`,
          Author: "CareAble",
          Subject: "Caregiver Capability Certificate",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = doc.page.width;   // 842 pt
      const H = doc.page.height;  // 595 pt

      // ── BACKGROUND ──────────────────────────────────────────────
      doc.rect(0, 0, W, H).fill(C.parchment);

      // ── COLOUR BARS ─────────────────────────────────────────────
      const barH = 8;
      doc.rect(0, 0, W / 2, barH).fill(C.teal);
      doc.rect(W / 2, 0, W / 2, barH).fill(C.blue);
      doc.rect(0, H - barH, W / 2, barH).fill(C.teal);
      doc.rect(W / 2, H - barH, W / 2, barH).fill(C.blue);

      // ── BORDERS ─────────────────────────────────────────────────
      const bm = 18, bm2 = 24;
      doc.rect(bm, bm, W - bm * 2, H - bm * 2).lineWidth(1.2).stroke(C.teal);
      doc.rect(bm2, bm2, W - bm2 * 2, H - bm2 * 2).lineWidth(0.4).stroke(C.rule);

      // ── HEADER ──────────────────────────────────────────────────
      const headerY = 34, headerH = 82;
      const logoSize = 58, logoX = 48, logoY = headerY + 2;

      if (logoExists) {
        doc.image(LOGO_PATH, logoX, logoY, { width: logoSize, height: logoSize });
      } else {
        doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).fill(C.teal);
        doc.fontSize(28).fillColor(C.white).font("Helvetica-Bold")
          .text("C", logoX, logoY + logoSize / 2 - 16, { width: logoSize, align: "center" });
      }

      const wordmarkX = logoX + logoSize + 14, wordmarkY = logoY + 7;
      doc.fontSize(24).font("Helvetica-Bold");
      const careWidth = doc.widthOfString("Care");
      doc.fillColor(C.teal).text("Care", wordmarkX, wordmarkY, { continued: false, lineBreak: false });
      doc.fillColor(C.blue).text("Able", wordmarkX + careWidth, wordmarkY, { lineBreak: false });
      doc.fontSize(8.5).fillColor(C.inkSoft).font("Helvetica")
        .text("Caregiver Capability Certificate", wordmarkX, wordmarkY + 32, { characterSpacing: 1.5 });
      doc.fontSize(7).fillColor(C.inkSoft)
        .text("La Trobe University - Capstone 2026 - Team NEXA", wordmarkX, wordmarkY + 48, { characterSpacing: 0.5 });

      const qrSize = 66, qrX = W - 48 - qrSize, qrY = headerY + 2;
      if (qrBuffer) {
        doc.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6).fill(C.white);
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
        doc.fontSize(7).fillColor(C.inkSoft).font("Helvetica")
          .text("Scan to verify", qrX - 3, qrY + qrSize + 5, { width: qrSize + 6, align: "center" });
      }

      // ── RULE 1 ───────────────────────────────────────────────────
      const ruleY = headerY + headerH;
      doc.moveTo(bm2 + 4, ruleY).lineTo(W / 2, ruleY).lineWidth(1).stroke(C.teal);
      doc.moveTo(W / 2, ruleY).lineTo(W - bm2 - 4, ruleY).lineWidth(1).stroke(C.blue);

      // ── BODY ─────────────────────────────────────────────────────
      let y = ruleY + 18;

      doc.fontSize(10).fillColor(C.inkSoft).font("Helvetica")
        .text("This certifies that", 0, y, { align: "center", width: W, characterSpacing: 1 });
      y += 18;

      doc.font("Helvetica-Bold");
      const nameText = user.name || "CareAble participant";
      const nameMaxWidth = W - 180;
      let nameFontSize = 34;
      while (nameFontSize > 24) {
        doc.fontSize(nameFontSize);
        if (doc.widthOfString(nameText) <= nameMaxWidth) break;
        nameFontSize -= 1;
      }
      doc.fillColor(C.blueDark)
        .text(nameText, 90, y, { align: "center", width: nameMaxWidth, lineGap: 1 });
      y += nameFontSize + 14;

      const nameLineLen = 220, nameCX = W / 2;
      doc.moveTo(nameCX - nameLineLen / 2, y - 6).lineTo(nameCX, y - 6).lineWidth(0.8).stroke(C.teal);
      doc.moveTo(nameCX, y - 6).lineTo(nameCX + nameLineLen / 2, y - 6).lineWidth(0.8).stroke(C.blue);

      const levelMeta = LEVEL_META[assessment.level] || LEVEL_META.Growth;
      doc.fontSize(10).fillColor(C.inkSoft).font("Helvetica")
        .text("has successfully completed the CareAble Self-Assessment,", 0, y, { align: "center", width: W });
      y += 16;
      doc.text(levelMeta.descriptor, 0, y, { align: "center", width: W });
      y += 24;

      doc.fontSize(18).fillColor(C.tealDark).font("Helvetica-Bold")
        .text(levelMeta.honorific, 0, y, { align: "center", width: W, characterSpacing: 0.5 });
      y += 27;

      const scoreStr = assessment.overallScore != null
        ? `Overall capability score: ${assessment.overallScore.toFixed(2)} / 5.00`
        : "Overall capability score: not recorded";
      doc.fontSize(9.5).fillColor(C.inkSoft).font("Helvetica")
        .text(scoreStr, 0, y, { align: "center", width: W, characterSpacing: 0.5 });
      y += 18;

      // ── TOP CAPABILITY CHIPS ─────────────────────────────────────
      if (topAreas.length > 0) {
        doc.fontSize(8.5).fillColor(C.inkSoft).font("Helvetica")
          .text("Top capability areas:", 0, y, { align: "center", width: W });
        y += 14;

        const chipGap = 7;
        const chipW = topAreas.length >= 5 ? 136 : 150;
        const chipH = 21;
        const totalChipW = topAreas.length * chipW + (topAreas.length - 1) * chipGap;
        let chipX = (W - totalChipW) / 2;

        topAreas.forEach(([key, score]) => {
          const label = keyToLabel(key);
          doc.roundedRect(chipX, y, chipW, chipH, 4).fill(C.chipBg);
          doc.fontSize(7.2).fillColor(C.chipText).font("Helvetica-Bold")
            .text(label, chipX + 9, y + 6, {
              width: chipW - 43,
              height: 10,
              ellipsis: true,
              lineBreak: false,
            });
          doc.fontSize(7.2).fillColor(C.inkSoft).font("Helvetica")
            .text(score.toFixed(2), chipX + chipW - 34, y + 6, {
              width: 25,
              align: "right",
              lineBreak: false,
            });

          chipX += chipW + chipGap;
        });
        y += chipH + 8;
      }

      // ── RULE 2 ───────────────────────────────────────────────────
      const footerZoneTop = H - 82;
      const rule2Y = Math.min(y + 10, footerZoneTop - 140);
      doc.moveTo(bm2 + 4, rule2Y).lineTo(W / 2, rule2Y).lineWidth(0.8).stroke(C.teal);
      doc.moveTo(W / 2, rule2Y).lineTo(W - bm2 - 4, rule2Y).lineWidth(0.8).stroke(C.blue);

      // ── PARTNER LOGO ZONE ────────────────────────────────────────
      const pzt = rule2Y + 7;
      // "In partnership with" label
      doc.fontSize(7).fillColor(C.inkSoft).font("Helvetica")
        .text("In partnership with", 0, pzt + 4, {
          align: "center", width: W, characterSpacing: 1.2,
        });

      // Vertical centre of logo row (below label)
      const logoRowY = pzt + 22;

      // Horizontal layout: centre both logos as a unit
      const totalLogoW = PARTNER_LOGO_W * 2 + LOGO_GAP;
      const startX = (W - totalLogoW) / 2;

      // ACAMI (left)
      const acamiX = startX;
      if (acamiExists) {
        doc.image(ACAMI_PATH, acamiX, logoRowY, {
          fit: [PARTNER_LOGO_W, PARTNER_LOGO_H],
          align: "center",
          valign: "center",
        });
      } else {
        doc.fontSize(8).fillColor(C.blue).font("Helvetica-Bold")
          .text("ACAMI", acamiX, logoRowY + 10, { width: PARTNER_LOGO_W, align: "center" });
        doc.fontSize(6).fillColor(C.inkSoft).font("Helvetica")
          .text("Australian Centre for AI in Medical Innovation", acamiX, logoRowY + 21, {
            width: PARTNER_LOGO_W, align: "center",
          });
      }

      // La Trobe (right)
      const latrobeX = startX + PARTNER_LOGO_W + LOGO_GAP;
      if (latrobeExists) {
        doc.image(LATROBE_PATH, latrobeX, logoRowY, {
          fit: [PARTNER_LOGO_W, PARTNER_LOGO_H],
          align: "center",
          valign: "center",
        });
      } else {
        doc.fontSize(8).fillColor("#CC0000").font("Helvetica-Bold")
          .text("LA TROBE UNIVERSITY", latrobeX, logoRowY + 10, {
            width: PARTNER_LOGO_W, align: "center",
          });
      }

      // ── FOOTER ───────────────────────────────────────────────────
      const noteY = logoRowY + PARTNER_LOGO_H + 15;
      const noteW = 206;
      const noteGap = 12;
      const notesStartX = (W - noteW * 3 - noteGap * 2) / 2;
      const notes = [
        {
          title: "Certificate scope",
          body: "Recognises completion of a reflective CareAble self-assessment across caregiving capability domains.",
        },
        {
          title: "Result meaning",
          body: "Scores summarise self-reported strengths and growth areas at the time the assessment was submitted.",
        },
        {
          title: "Verification",
          body: "Use the QR code or certificate ID to confirm issue details and certificate authenticity online.",
        },
      ];

      notes.forEach((note, index) => {
        const x = notesStartX + index * (noteW + noteGap);
        doc.roundedRect(x, noteY, noteW, 48, 5).fill(C.white);
        doc.roundedRect(x, noteY, noteW, 48, 5).lineWidth(0.35).stroke(C.rule);
        doc.fontSize(7.2).fillColor(index === 1 ? C.blueDark : C.tealDark).font("Helvetica-Bold")
          .text(note.title, x + 10, noteY + 8, { width: noteW - 20 });
        doc.fontSize(6.6).fillColor(C.inkSoft).font("Helvetica")
          .text(note.body, x + 10, noteY + 20, {
            width: noteW - 20,
            height: 22,
            lineGap: 1.2,
          });
      });

      const footerY = H - 60;

      doc.fontSize(7.5).fillColor(C.inkSoft).font("Helvetica")
        .text("DATE OF ISSUE", 46, footerY, { characterSpacing: 1 });
      doc.fontSize(11).fillColor(C.ink).font("Helvetica-Bold")
        .text(formatDate(assessment.submittedAt), 46, footerY + 11);

      const certIdStr = assessment.certificateId || "CA-UNKNOWN";
      doc.fontSize(7.5).fillColor(C.inkSoft).font("Helvetica")
        .text("CERTIFICATE ID", W - 46 - 160, footerY, { width: 160, align: "right", characterSpacing: 1 });
      doc.fontSize(11).fillColor(C.ink).font("Courier-Bold")
        .text(certIdStr, W - 46 - 160, footerY + 11, { width: 160, align: "right" });

      doc.fontSize(6.5).fillColor(C.inkSoft).font("Helvetica")
        .text(
          "Aligned with the Australian Skills Classification - Care and Support Economy Strategy (2023-2033)",
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
