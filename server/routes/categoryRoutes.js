// server/routes/categoryRoutes.js

/**
 * Admin Category Routes
 * ---------------------
 * Mounted at /api/admin/categories from adminRoutes.js.
 * Auth (protect + requireAdmin) is applied at the parent router,
 * so no middleware is repeated here.
 */

const express = require("express");
const router = express.Router();

const {
  listCategories,
  createCategory,
  updateCategory,
  archiveCategory,
  restoreCategory,
  reorderCategory,
} = require("../controllers/categoryController");

router.get("/", listCategories);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.post("/:id/archive", archiveCategory);
router.post("/:id/restore", restoreCategory);
router.post("/:id/reorder", reorderCategory);

module.exports = router;