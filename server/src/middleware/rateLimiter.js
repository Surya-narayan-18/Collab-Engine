const rateLimit = require("express-rate-limit");

/**
 * In test environment, disable rate limiting to avoid flaky tests.
 */

/**
 * Passthrough middleware that does nothing (used in test environment).
 */
function noopLimiter(req, res, next) {
  next();
}

/**
 * General rate limiter: 100 requests per minute per IP.
 */
const generalLimiter = process.env.NODE_ENV === "test"
  ? noopLimiter
  : rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: "error",
        message: "Too many requests. Please try again later.",
      },
    });

/**
 * Auth rate limiter: 10 requests per minute per IP.
 * Applied to login and register routes to prevent brute-force attacks.
 */
const authLimiter = process.env.NODE_ENV === "test"
  ? noopLimiter
  : rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: "error",
        message: "Too many authentication attempts. Please try again later.",
      },
    });

module.exports = { generalLimiter, authLimiter };
