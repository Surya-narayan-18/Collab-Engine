const authService = require("../services/auth.service");

/**
 * POST /api/auth/register
 * Body: { email, userId, userName, password }
 */
async function register(req, res) {
  try {
    const { user, token } = await authService.register(req.body);

    res.status(201).json({
      status: "success",
      data: { user, token },
    });
  } catch (err) {
    // Race condition: unique constraint violation on email or userId
    if (err.code === "P2002") {
      const target = err.meta?.target;
      if (target && target.includes("user_id")) {
        const AppError = require("../errors/AppError");
        throw new AppError(409, "User ID already taken");
      }
      if (target && target.includes("email")) {
        const AppError = require("../errors/AppError");
        throw new AppError(409, "Email already in use");
      }
    }
    throw err;
  }
}

/**
 * POST /api/auth/login
 * Body: { identifier, password }
 * `identifier` can be an email address or a user ID (UUID).
 */
async function login(req, res) {
  const { user, token } = await authService.login(req.body);

  res.json({
    status: "success",
    data: { user, token },
  });
}

/**
 * GET /api/auth/me
 * Protected — requires authenticate middleware
 */
async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.id);

  res.json({
    status: "success",
    data: { user },
  });
}

module.exports = { register, login, me };
