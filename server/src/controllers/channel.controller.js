const channelService = require("../services/channel.service");

/** POST /api/workspaces/:workspaceId/channels */
async function create(req, res) {
  const channel = await channelService.createChannel({
    name: req.body.name,
    workspaceId: req.params.workspaceId,
    userId: req.user.id,
  });

  res.status(201).json({ status: "success", data: { channel } });
}

/** GET /api/workspaces/:workspaceId/channels */
async function list(req, res) {
  const channels = await channelService.listChannels({
    workspaceId: req.params.workspaceId,
    userId: req.user.id,
  });

  res.json({ status: "success", data: { channels } });
}

/** GET /api/workspaces/:workspaceId/channels/:channelId */
async function get(req, res) {
  const channel = await channelService.getChannel({
    channelId: req.params.channelId,
    workspaceId: req.params.workspaceId,
  });

  res.json({ status: "success", data: { channel } });
}

/** POST /api/workspaces/:workspaceId/channels/:channelId/join */
async function join(req, res) {
  const membership = await channelService.joinChannel({
    channelId: req.params.channelId,
    workspaceId: req.params.workspaceId,
    userId: req.user.id,
  });

  res.status(201).json({ status: "success", data: { member: membership } });
}

/** DELETE /api/workspaces/:workspaceId/channels/:channelId */
async function remove(req, res) {
  await channelService.deleteChannel({
    channelId: req.params.channelId,
    workspaceId: req.params.workspaceId,
  });

  res.json({ status: "success", message: "Channel deleted" });
}

module.exports = { create, list, get, join, remove };
