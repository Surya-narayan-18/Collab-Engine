const http = require("http");
const config = require("./src/config");
const app = require("./src/app");
const prisma = require("./src/lib/prisma");
const redis = require("./src/lib/redis");
const initSocket = require("./src/socket");

const PORT = config.PORT;

// Create HTTP server (required for Socket.IO)
const server = http.createServer(app);

// Initialize Socket.IO on the HTTP server
const io = initSocket(server);

// Connect Redis then start listening
redis.connect().then(() => {
  server.listen(PORT, () => {
    console.log(
      `✅ CollabEngine server running on http://localhost:${PORT} [${config.NODE_ENV}]`
    );
  });
});

// Graceful shutdown — disconnect Prisma and Redis on SIGINT/SIGTERM
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down...`);
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));