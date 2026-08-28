const { Router } = require("express");
const prisma = require("../lib/prisma");

const router = Router();

// GET /api/health — basic health check
router.get("/", async (req, res) => {
  // Test database connectivity
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
    },
  });
});

module.exports = router;
