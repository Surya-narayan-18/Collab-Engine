const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require("../config");
const prisma = require("../lib/prisma");
const redis = require("../lib/redis");
const { safeUserSelect } = require("../lib/safeUser");

/**
 * Initialize Socket.IO on the given HTTP server.
 * Handles JWT authentication, room management, real-time messaging,
 * and Redis-backed presence/typing indicators.
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.CLIENT_URL,
      credentials: true,
    },
  });

  // ─── Authentication Middleware ──────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const payload = jwt.verify(token, config.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: safeUserSelect,
      });
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // ─── Connection Handler ────────────────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.user.id;
    const username = socket.user.username;

    console.log(`🔌 ${username} connected (${socket.id})`);

    // Join personal room for direct notifications (e.g. invitations)
    socket.join(`user:${userId}`);

    // ── Join workspace room ──────────────────────────────────────────
    socket.on("join:workspace", async (workspaceId) => {
      // Verify membership
      const membership = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } },
      });
      if (!membership) {
        socket.emit("error", { message: "Not a workspace member" });
        return;
      }

      socket.join(`workspace:${workspaceId}`);

      // Track presence in Redis
      await redis.sadd(`presence:${workspaceId}`, userId);
      const onlineIds = await redis.smembers(`presence:${workspaceId}`);

      // Fetch user info for all online users
      const onlineUsers = await prisma.user.findMany({
        where: { id: { in: onlineIds } },
        select: safeUserSelect,
      });

      // Broadcast updated presence to the workspace
      io.to(`workspace:${workspaceId}`).emit("presence:update", onlineUsers);
    });

    // ── Join channel room ────────────────────────────────────────────
    socket.on("join:channel", async (channelId) => {
      // Verify channel membership
      const membership = await prisma.channelMember.findUnique({
        where: { userId_channelId: { userId, channelId } },
      });
      if (!membership) {
        socket.emit("error", { message: "Not a channel member" });
        return;
      }

      socket.join(`channel:${channelId}`);
    });

    // ── Leave channel room ───────────────────────────────────────────
    socket.on("leave:channel", (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    // ── Send message (real-time) ─────────────────────────────────────
    socket.on("message:send", async ({ channelId, content }) => {
      if (!content || !content.trim() || content.length > 4000) {
        socket.emit("error", { message: "Invalid message content" });
        return;
      }

      // Verify channel membership
      const membership = await prisma.channelMember.findUnique({
        where: { userId_channelId: { userId, channelId } },
      });
      if (!membership) {
        socket.emit("error", { message: "Not a channel member" });
        return;
      }

      // Create message in DB
      const message = await prisma.message.create({
        data: {
          content: content.trim(),
          channelId,
          userId,
        },
        include: {
          user: { select: safeUserSelect },
        },
      });

      // Broadcast to all channel members
      io.to(`channel:${channelId}`).emit("message:new", message);
    });

    // ── Typing indicators ────────────────────────────────────────────
    socket.on("typing:start", (channelId) => {
      socket.to(`channel:${channelId}`).emit("typing:update", {
        userId,
        username,
        channelId,
        isTyping: true,
      });
    });

    socket.on("typing:stop", (channelId) => {
      socket.to(`channel:${channelId}`).emit("typing:update", {
        userId,
        username,
        channelId,
        isTyping: false,
      });
    });

    // ── Disconnect ───────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`🔌 ${username} disconnected (${socket.id})`);

      // Remove from all workspace presence sets
      // Get all rooms this socket was in
      const workspaceRooms = [...socket.rooms].filter((r) =>
        r.startsWith("workspace:")
      );
      for (const room of workspaceRooms) {
        const workspaceId = room.replace("workspace:", "");
        await redis.srem(`presence:${workspaceId}`, userId);

        const onlineIds = await redis.smembers(`presence:${workspaceId}`);
        const onlineUsers = await prisma.user.findMany({
          where: { id: { in: onlineIds } },
          select: safeUserSelect,
        });
        io.to(room).emit("presence:update", onlineUsers);
      }
    });
  });

  return io;
}

module.exports = initSocket;
