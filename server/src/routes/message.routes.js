const { Router } = require("express");
const messageController = require("../controllers/message.controller");
const authenticate = require("../middleware/authenticate");
const { requireWorkspaceMember, requireChannelMember } = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { createMessageSchema } = require("../validators/message.validators");

// mergeParams: true to access :workspaceId and :channelId from parent routers
const router = Router({ mergeParams: true });

// All message routes require auth + workspace membership + channel membership
router.use(authenticate, requireWorkspaceMember, requireChannelMember);

// POST /api/workspaces/:workspaceId/channels/:channelId/messages
router.post("/", validate(createMessageSchema), messageController.create);

// GET /api/workspaces/:workspaceId/channels/:channelId/messages?cursor=&limit=
router.get("/", messageController.list);

module.exports = router;
