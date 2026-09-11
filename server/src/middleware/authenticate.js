const jwt = require("jsonwebtoken");
const config = require("../config");
const AppError = require("../errors/AppError");
const prisma = require("../lib/prisma");
const { safeUserSelect } = require("../lib/safeUser");

/**
 * Express middleware that verifies a JWT Bearer token from the Authorization header.
 * On success, attaches the user object (without password) to `req.user`.
 * On failure, throws an AppError with 401 status.
 *
 * Usage:
 *   router.get("/protected", authenticate, controller.handler);
 */
const authenticate = async (req, res, next) => {
  // Extract token from "Bearer <token>" header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "Authentication required");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new AppError(401, "Authentication required");
  }

  // Verify token
  let payload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError(401, "Token expired");
    }
    throw new AppError(401, "Invalid token");
  }

  // Fetch user from DB to ensure they still exist
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: safeUserSelect,
  });

  if (!user) {
    throw new AppError(401, "User no longer exists");
  }

  req.user = user;
  next();
};

module.exports = authenticate;
