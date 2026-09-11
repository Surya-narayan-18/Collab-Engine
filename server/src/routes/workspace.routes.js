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

// ─── Invitation routes (must come before /:workspaceId to avoid param conflict) ───

// GET /api/workspaces/invitations — list pending invitations for current user
router.get("/invitations", workspaceController.listInvitations);

// POST /api/workspaces/invitations/:invitationId/accept
router.post("/invitations/:invitationId/accept", workspaceController.acceptInvitation);

// POST /api/workspaces/invitations/:invitationId/decline
router.post("/invitations/:invitationId/decline", workspaceController.declineInvitation);

// ─── Workspace-specific routes ───

// GET /api/workspaces/:workspaceId — get workspace details (member only)
router.get("/:workspaceId", requireWorkspaceMember, workspaceController.get);

// POST /api/workspaces/:workspaceId/members — send invitation (OWNER/ADMIN only)
router.post(
  "/:workspaceId/members",
  requireWorkspaceMember,
  requireWorkspaceRole("OWNER", "ADMIN"),
  validate(addMemberSchema),
  workspaceController.addMember
);

// GET /api/workspaces/:workspaceId/invitations — list pending invitations for workspace (OWNER/ADMIN only — Bug #5 fix)
router.get(
  "/:workspaceId/invitations",
  requireWorkspaceMember,
  requireWorkspaceRole("OWNER", "ADMIN"),
  workspaceController.listWorkspaceInvitations
);

// DELETE /api/workspaces/:workspaceId/invitations/:invitationId — revoke invitation (OWNER/ADMIN only — Bug #7)
router.delete(
  "/:workspaceId/invitations/:invitationId",
  requireWorkspaceMember,
  requireWorkspaceRole("OWNER", "ADMIN"),
  workspaceController.revokeInvitation
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
