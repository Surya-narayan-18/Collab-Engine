const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// Prisma client singleton.
// Under nodemon hot-reload, module-level variables reset on each restart,
// which can create multiple PrismaClient instances and exhaust DB connections.
// We attach the instance to `globalThis` so it persists across reloads.
//
// Prisma 7 requires a driver adapter — we use @prisma/adapter-pg with the
// DATABASE_URL from environment.

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

/** @type {import("@prisma/client").PrismaClient} */
const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

module.exports = prisma;
