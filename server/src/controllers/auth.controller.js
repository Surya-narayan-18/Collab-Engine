const authService = require("../services/auth.service");

/**
 * POST /api/auth/register
 * Body: { email, username, password }
 */
async function register(req, res) {
  const { user, token } = await authService.register(req.body);

  res.status(201).json({
    status: "success",
    data: { user, token },
  });
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
