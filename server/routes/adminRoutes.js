// server/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const {
  getAnalytics,
  listUsers,
  getUser,
  updateUser,
  listQuestions,
  createQuestion,
  updateQuestion,
  reorderQuestion,
  getAuditLogs,
} = require("../controllers/adminController");
const { listSettings, updateSetting, getSettingsMeta } = require("../controllers/settingsController");
const categoryRoutes = require("./categoryRoutes");

router.use(protect, requireAdmin);

router.get("/analytics", getAnalytics);
router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.patch("/users/:id", updateUser);
router.get("/questions", listQuestions);
router.post("/questions", createQuestion);
router.patch("/questions/:id", updateQuestion);
router.post("/questions/:id/reorder", reorderQuestion);
router.get("/audit", getAuditLogs);

// Phase 12-A Task 6: platform settings
router.get("/settings/meta", getSettingsMeta);
router.get("/settings", listSettings);
router.patch("/settings/:key", updateSetting);

router.use("/categories", categoryRoutes);

module.exports = router;