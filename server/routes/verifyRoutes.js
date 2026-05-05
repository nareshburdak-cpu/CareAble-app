/**
 * Verify Routes
 * -------------
 *   GET /api/verify/:certificateId   (PUBLIC — no auth)
 *
 * IMPORTANT: This router is intentionally NOT protected by `protect` middleware.
 * It must remain public so QR-code scanners (employers, third parties) can verify
 * a certificate's authenticity without an account.
 */

const express = require("express");
const { verifyCertificate } = require("../controllers/verifyController");
const router = express.Router();

// Public verification endpoint — DO NOT add auth middleware here.
router.get("/:certificateId", verifyCertificate);

module.exports = router;