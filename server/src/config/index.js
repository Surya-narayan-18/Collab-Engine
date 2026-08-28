const { z } = require("zod");
require("dotenv").config();

// Validate and parse all environment variables at startup.
// If any are missing or malformed, the server will fail fast with a clear message.
const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}

const config = Object.freeze(parsed.data);

module.exports = config;
