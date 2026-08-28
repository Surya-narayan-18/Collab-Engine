const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const authenticate = require("../middleware/authenticate");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validators/auth.validators");
const { authLimiter } = require("../middleware/rateLimiter");

const router = Router();

// POST /api/auth/register (10 req/min)
router.post("/register", authLimiter, validate(registerSchema), authController.register);

// POST /api/auth/login (10 req/min)
router.post("/login", authLimiter, validate(loginSchema), authController.login);

// GET /api/auth/me (protected)
router.get("/me", authenticate, authController.me);

module.exports = router;
