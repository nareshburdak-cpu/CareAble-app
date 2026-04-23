/**
 * Certificate Generator — Premium Edition
 * ---------------------------------------
 * Academic-style PDF certificate with:
 *   - Double-gold ornate border
 *   - Corner flourishes
 *   - Classical serif typography (Times-Roman)
 *   - Official seal
 *   - Signature lines
 *   - Fits on a single landscape A4 page
 */

const PDFDocument = require("pdfkit");
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

function generateCertificate(user, assessment) {
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
      // BOTTOM — Seal + Date + Cert ID + Signature
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

      // ---- CENTER: Official Seal ----
      const sealCX = W / 2;
      const sealCY = bottomY + 15;
      const sealR = 38;

      // Outer ring
      doc
        .circle(sealCX, sealCY, sealR)
        .lineWidth(1.5)
        .stroke(C.seal);

      // Inner ring
      doc
        .circle(sealCX, sealCY, sealR - 6)
        .lineWidth(0.5)
        .stroke(C.seal);

      // Seal text (curved would need more work; use stacked lines instead)
      doc
        .fontSize(7)
        .fillColor(C.seal)
        .font("Times-Bold")
        .text("OFFICIAL", sealCX - 30, sealCY - 18, {
          width: 60,
          align: "center",
          characterSpacing: 1.5,
        });

      doc
        .fontSize(14)
        .fillColor(C.seal)
        .font("Times-Bold")
        .text("❦", sealCX - 30, sealCY - 8, { width: 60, align: "center" });

      doc
        .fontSize(7)
        .fillColor(C.seal)
        .font("Times-Bold")
        .text("CAREABLE", sealCX - 30, sealCY + 8, {
          width: 60,
          align: "center",
          characterSpacing: 1.5,
        });

      doc
        .fontSize(5)
        .fillColor(C.seal)
        .font("Times-Roman")
        .text("✦ CERTIFIED ✦", sealCX - 30, sealCY + 18, {
          width: 60,
          align: "center",
          characterSpacing: 1,
        });

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

// ---- Helper: format date like "the 23rd day of April, 2026" ----
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