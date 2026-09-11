const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const config = require("../config");
const AppError = require("../errors/AppError");
const { safeUserSelect } = require("../lib/safeUser");

const BCRYPT_COST_FACTOR = 12;
const JWT_EXPIRY = "24h";

/**
 * UUID v4 pattern — used to detect whether a login identifier is a user ID.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Register a new user.
 * @param {{ email: string, username: string, password: string }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
async function register({ email, username, password }) {
  // Check if email or username already taken
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
    select: { email: true, username: true },
  });

  if (existing) {
    if (existing.email === email) {
      throw new AppError(409, "Email already in use");
    }
    throw new AppError(409, "Username already taken");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
    },
    select: safeUserSelect,
  });

  // Generate JWT
  const token = generateToken(user);

  return { user, token };
}

/**
 * Login with an identifier (email or user ID) and password.
 * Detects whether the identifier looks like a UUID and resolves the user
 * by `id` or `email` accordingly. Password verification always applies.
 *
 * @param {{ identifier: string, password: string }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
async function login({ identifier, password }) {
  const isUUID = UUID_RE.test(identifier);

  // Resolve user by id or email
  const user = isUUID
    ? await prisma.user.findUnique({ where: { id: identifier } })
    : await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } });

  if (!user) {
    throw new AppError(401, "Invalid credentials");
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError(401, "Invalid credentials");
  }

  // Generate JWT
  const token = generateToken(user);

  // Return user without password
  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
}

/**
 * Get current authenticated user by ID.
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
}

/**
 * Generate a JWT for the given user.
 * Payload contains only userId and username — nothing sensitive.
 * @param {{ id: string, username: string }} user
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    config.JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

module.exports = { register, login, getCurrentUser };
