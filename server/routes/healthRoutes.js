/** @file Route definition for the public health check endpoint. */
/**
 * Health Routes
 * -------------
 * Defines endpoints for health checks.
 */

const express = require("express");
const router = express.Router();
const { getHealth } = require("../controllers/healthController");

// GET /api/health
router.get("/", getHealth);


module.exports = router;