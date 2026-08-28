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

/** POST /api/workspaces/:workspaceId/members */
async function addMember(req, res) {
  const membership = await workspaceService.addMember({
    workspaceId: req.params.workspaceId,
    email: req.body.email,
    role: req.body.role,
  });

  res.status(201).json({ status: "success", data: { member: membership } });
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

module.exports = { create, list, get, addMember, removeMember, remove };
