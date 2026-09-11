/**
 * Reusable Prisma `select` object that returns user fields
 * WITHOUT the password hash. Use this in every query that returns
 * user data to ensure the hash never leaks into API responses.
 *
 * Usage:
 *   prisma.user.findUnique({ where: { id }, select: safeUserSelect })
 */
const safeUserSelect = {
  id: true,
  email: true,
  userId: true,
  userName: true,
  createdAt: true,
  updatedAt: true,
  // password: deliberately excluded
};

module.exports = { safeUserSelect };
