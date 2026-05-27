// server/routes/verifyRoutes.js

/**
 * Verify Routes
 * -------------
 *   GET  /api/verify/:certificateId                    (PUBLIC — no auth)
 *   GET  /api/verify/employer/:certificateId           (protected — employer)
 *   POST /api/verify/employer/:certificateId/connect   (protected — employer)
 *   GET  /api/verify/admin/:certificateId              (protected — admin only)
 */

const express = require("express");
const {
  verifyCertificate,
  verifyCertificateEmployer,
  verifyCertificateAdmin,
  requestCarerConnect,
} = require("../controllers/verifyController");
const { protect } = require("../middleware/authMiddleware");
const requireEmployer = require("../middleware/requireEmployer");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Authenticated routes FIRST — before the public wildcard
router.get(
  "/employer/:certificateId",
  protect,
  requireEmployer,
  verifyCertificateEmployer
);

router.post(
  "/employer/:certificateId/connect",
  protect,
  requireEmployer,
  requestCarerConnect
);

router.get(
  "/admin/:certificateId",
  protect,
  requireAdmin,
  verifyCertificateAdmin
);

// Public route LAST — catch-all param
router.get("/:certificateId", verifyCertificate);

module.exports = router;