const workspaceService = require("../services/workspace.service");

/** POST /api/workspaces */
async function create(req, res) {
  const workspace = await workspaceService.createWorkspace({
    name: req.body.name,
    userId: req.user.id,
  });

  res.status(201).json({ status: "success", data: { workspace } });
}

/** GET /api/workspaces */
async function list(req, res) {
  const workspaces = await workspaceService.listWorkspaces(req.user.id);

  res.json({ status: "success", data: { workspaces } });
}

/** GET /api/workspaces/:workspaceId */
async function get(req, res) {
  const workspace = await workspaceService.getWorkspace(req.params.workspaceId);

  res.json({ status: "success", data: { workspace } });
}

/** POST /api/workspaces/:workspaceId/members — now sends an invitation */
async function addMember(req, res) {
  const invitation = await workspaceService.sendInvitation({
    workspaceId: req.params.workspaceId,
    email: req.body.email,
    role: req.body.role,
    inviterId: req.user.id,
  });

  // Emit real-time notification to the invitee if io is attached
  if (req.app.get("io")) {
    req.app.get("io").to(`user:${invitation.inviteeId}`).emit("invitation:new", invitation);
  }

  res.status(201).json({ status: "success", data: { invitation } });
}

/** GET /api/workspaces/invitations — list pending invitations for the current user */
async function listInvitations(req, res) {
  const invitations = await workspaceService.listInvitations(req.user.id);

  res.json({ status: "success", data: { invitations } });
}

/** POST /api/workspaces/invitations/:invitationId/accept */
async function acceptInvitation(req, res) {
  const result = await workspaceService.acceptInvitation({
    invitationId: req.params.invitationId,
    userId: req.user.id,
  });

  res.json({ status: "success", data: result });
}

/** POST /api/workspaces/invitations/:invitationId/decline */
async function declineInvitation(req, res) {
  const invitation = await workspaceService.declineInvitation({
    invitationId: req.params.invitationId,
    userId: req.user.id,
  });

  res.json({ status: "success", data: { invitation } });
}

/** GET /api/workspaces/:workspaceId/invitations — list pending invitations for a workspace */
async function listWorkspaceInvitations(req, res) {
  const invitations = await workspaceService.listWorkspaceInvitations(req.params.workspaceId);

  res.json({ status: "success", data: { invitations } });
}

/** DELETE /api/workspaces/:workspaceId/members/:userId */
async function removeMember(req, res) {
  await workspaceService.removeMember({
    workspaceId: req.params.workspaceId,
    memberUserId: req.params.userId,
  });

  res.json({ status: "success", message: "Member removed" });
}

/** DELETE /api/workspaces/:workspaceId */
async function remove(req, res) {
  await workspaceService.deleteWorkspace(req.params.workspaceId);

  res.json({ status: "success", message: "Workspace deleted" });
}

module.exports = {
  create,
  list,
  get,
  addMember,
  listInvitations,
  acceptInvitation,
  declineInvitation,
  listWorkspaceInvitations,
  removeMember,
  remove,
};
