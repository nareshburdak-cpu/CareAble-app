/**
 * Health Controller
 * -----------------
 * Handles API health check requests.
 */

const mongoose = require("mongoose");

/**
 * @desc    Check if API and DB are running
 * @route   GET /api/health
 * @access  Public
 */
const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatusMap = {
    0: "disconnected ❌",
    1: "connected ✅",
    2: "connecting ⏳",
    3: "disconnecting ⏹️",
  };

  res.status(200).json({
    success: true,
    message: "CareAble API is running 🚀",
    dbStatus: dbStatusMap[dbState] || "unknown",
    uptime: `${process.uptime().toFixed(2)} seconds`,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth };