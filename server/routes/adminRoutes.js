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


module.exports = router;