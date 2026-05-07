// server/routes/verifyRoutes.js

/**
 * Verify Routes
 * -------------
 *   GET /api/verify/:certificateId             (PUBLIC — no auth)
 *   GET /api/verify/employer/:certificateId    (protected — employer or admin)
 *   GET /api/verify/admin/:certificateId       (protected — admin only)
 */

const express = require("express");
const {
  verifyCertificate,
  verifyCertificateEmployer,
  verifyCertificateAdmin,
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

router.get(
  "/admin/:certificateId",
  protect,
  requireAdmin,
  verifyCertificateAdmin
);

// Public route LAST — catch-all param
router.get("/:certificateId", verifyCertificate);

module.exports = router;