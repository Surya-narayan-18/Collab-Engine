const { Router } = require("express");
const channelController = require("../controllers/channel.controller");
const messageRoutes = require("./message.routes");
const authenticate = require("../middleware/authenticate");
const { requireWorkspaceMember, requireWorkspaceRole } = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { createChannelSchema } = require("../validators/channel.validators");

// mergeParams: true so we can access :workspaceId from the parent router
const router = Router({ mergeParams: true });

// All channel routes require authentication + workspace membership
router.use(authenticate, requireWorkspaceMember);

// POST /api/workspaces/:workspaceId/channels — any workspace member can create
router.post("/", validate(createChannelSchema), channelController.create);

// GET /api/workspaces/:workspaceId/channels — list channels
router.get("/", channelController.list);

// GET /api/workspaces/:workspaceId/channels/:channelId — get channel details
router.get("/:channelId", channelController.get);

// POST /api/workspaces/:workspaceId/channels/:channelId/join — join a channel
router.post("/:channelId/join", channelController.join);

// DELETE /api/workspaces/:workspaceId/channels/:channelId — OWNER only
router.delete(
  "/:channelId",
  requireWorkspaceRole("OWNER"),
  channelController.remove
);

// Nest message routes under /:channelId/messages
router.use("/:channelId/messages", messageRoutes);

module.exports = router;
