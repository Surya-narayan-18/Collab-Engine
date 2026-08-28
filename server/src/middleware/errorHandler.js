const AppError = require("../errors/AppError");
const config = require("../config");

/**
 * Consistent error response shape used across the entire API:
 *
 * {
 *   "status": "error",
 *   "message": "Human-readable error description",
 *   "details": { ... }  // optional, e.g. validation errors
 * }
 *
 * In development, `stack` is also included for debugging.
 */

// 404 handler — catches requests that don't match any route
const notFound = (req, res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Global error handler — Express 5 error middleware (4 args)
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default to 500 if no statusCode is set
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details || null;

  // Prisma known-request errors (e.g. unique constraint violation)
  if (err.code === "P2002") {
    statusCode = 409;
    message = "A record with that value already exists";
    const target = err.meta?.target;
    details = target ? { fields: target } : null;
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    statusCode = 400;
    message = "Validation failed";
    details = err.flatten().fieldErrors;
  }

  // Log unexpected (non-operational) errors
  if (!err.isOperational && statusCode === 500) {
    console.error("💥 Unexpected error:", err);
  }

  const response = {
    status: "error",
    message,
  };

  if (details) {
    response.details = details;
  }

  // Include stack trace in development only
  if (config.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
