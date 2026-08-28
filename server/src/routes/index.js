const { Router } = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const workspaceRoutes = require("./workspace.routes");

const router = Router();

// Mount route groups
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
// Future routes will be mounted here:
// router.use("/messages", messageRoutes);

module.exports = router;
