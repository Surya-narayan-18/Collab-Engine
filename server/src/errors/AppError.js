/**
 * Custom application error class.
 * All thrown errors in the app should use this class (or be caught and wrapped by it)
 * to ensure a consistent error response shape.
 */
class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404, 500)
   * @param {string} message    - Human-readable error message
   * @param {object} [details]  - Optional additional details (e.g. validation errors)
   */
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // distinguishes expected errors from programming bugs

    // Capture stack trace, excluding this constructor from the trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
