/** @file Express async wrapper that forwards rejected promises to error middleware. */
/**
 * asyncHandler
 * ------------
 * Wraps async route handlers so we don't need try/catch in every controller.
 * Any rejected promise is automatically forwarded to the Express error handler.
 *
 * Usage:
 *   const getUser = asyncHandler(async (req, res) => {
 *     const user = await User.findById(req.params.id);
 *     res.json(user);
 *   });
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;