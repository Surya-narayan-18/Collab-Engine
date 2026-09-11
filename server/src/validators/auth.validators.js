const { z } = require("zod");

const registerSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((v) => v.toLowerCase().trim()),
  userId: z
    .string()
    .min(3, "User ID must be at least 3 characters")
    .max(30, "User ID must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "User ID can only contain letters, numbers, hyphens, and underscores"
    )
    .transform((v) => v.toLowerCase().trim()),
  userName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be at most 50 characters")
    .transform((v) => v.trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or user ID is required")
    .transform((v) => v.trim()),
  password: z.string().min(1, "Password is required"),
});

module.exports = { registerSchema, loginSchema };
