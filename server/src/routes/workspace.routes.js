const { Router } = require("express");
const workspaceController = require("../controllers/workspace.controller");
const channelRoutes = require("./channel.routes");
const authenticate = require("../middleware/authenticate");
const { requireWorkspaceMember, requireWorkspaceRole } = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { createWorkspaceSchema, addMemberSchema } = require("../validators/workspace.validators");

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

// POST /api/workspaces — create a new workspace
router.post("/", validate(createWorkspaceSchema), workspaceController.create);

// GET /api/workspaces — list user's workspaces
router.get("/", workspaceController.list);

// GET /api/workspaces/:workspaceId — get workspace details (member only)
router.get("/:workspaceId", requireWorkspaceMember, workspaceController.get);

// POST /api/workspaces/:workspaceId/members — add member (OWNER/ADMIN only)
router.post(
  "/:workspaceId/members",
  requireWorkspaceMember,
  requireWorkspaceRole("OWNER", "ADMIN"),
  validate(addMemberSchema),
  workspaceController.addMember
);

// DELETE /api/workspaces/:workspaceId/members/:userId — remove member (OWNER/ADMIN only)
router.delete(
  "/:workspaceId/members/:userId",
  requireWorkspaceMember,
  requireWorkspaceRole("OWNER", "ADMIN"),
  workspaceController.removeMember
);

// DELETE /api/workspaces/:workspaceId — delete workspace (OWNER only)
router.delete(
  "/:workspaceId",
  requireWorkspaceMember,
  requireWorkspaceRole("OWNER"),
  workspaceController.remove
);

// Nest channel routes under /api/workspaces/:workspaceId/channels
router.use("/:workspaceId/channels", channelRoutes);

module.exports = router;
