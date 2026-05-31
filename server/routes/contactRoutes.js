/** @file Route definition for the public contact form endpoint. */
// server/routes/contactRoutes.js

const express = require("express");
const contactController = require("../controllers/contactController");

const router = express.Router();

// POST /api/contact — public, no auth
router.post("/", contactController);

module.exports = router;