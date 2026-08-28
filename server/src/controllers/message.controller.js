const messageService = require("../services/message.service");

/** POST /api/workspaces/:workspaceId/channels/:channelId/messages */
async function create(req, res) {
  const message = await messageService.createMessage({
    content: req.body.content,
    channelId: req.params.channelId,
    userId: req.user.id, // always from JWT, never from body
  });

  res.status(201).json({ status: "success", data: { message } });
}

/**
 * GET /api/workspaces/:workspaceId/channels/:channelId/messages
 * Query params: ?cursor=<ISO timestamp>&limit=<number>
 */
async function list(req, res) {
  const { messages, nextCursor } = await messageService.getMessages({
    channelId: req.params.channelId,
    cursor: req.query.cursor,
    limit: req.query.limit,
  });

  res.json({
    status: "success",
    data: { messages, nextCursor },
  });
}

module.exports = { create, list };
