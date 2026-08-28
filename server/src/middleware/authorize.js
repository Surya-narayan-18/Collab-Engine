const prisma = require("../lib/prisma");
const AppError = require("../errors/AppError");

/**
 * Middleware that verifies the authenticated user is a member of the workspace
 * identified by `req.params.workspaceId`. On success, attaches the membership
 * record to `req.workspaceMember` (includes role) for downstream use.
 *
 * Must be used AFTER the `authenticate` middleware.
 *
 * Usage:
 *   router.get("/:workspaceId", authenticate, requireWorkspaceMember, handler);
 */
const requireWorkspaceMember = async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user.id;

  if (!workspaceId) {
    throw new AppError(400, "Workspace ID is required");
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
  });

  if (!membership) {
    throw new AppError(403, "You are not a member of this workspace");
  }

  // Attach membership (with role) for downstream checks
  req.workspaceMember = membership;
  next();
};

/**
 * Factory that creates middleware to check if the user has one of the
 * specified roles in the workspace. Must be used AFTER `requireWorkspaceMember`
 * (which attaches `req.workspaceMember`).
 *
 * Usage:
 *   router.delete("/:workspaceId", authenticate, requireWorkspaceMember,
 *     requireWorkspaceRole("OWNER"), handler);
 *
 *   router.post("/:workspaceId/members", authenticate, requireWorkspaceMember,
 *     requireWorkspaceRole("OWNER", "ADMIN"), handler);
 *
 * @param {...string} roles - Allowed WorkspaceRole values (e.g. "OWNER", "ADMIN", "MEMBER")
 * @returns {import("express").RequestHandler}
 */
const requireWorkspaceRole = (...roles) => {
  return (req, res, next) => {
    if (!req.workspaceMember) {
      throw new AppError(
        500,
        "requireWorkspaceRole must be used after requireWorkspaceMember"
      );
    }

    if (!roles.includes(req.workspaceMember.role)) {
      throw new AppError(
        403,
        `This action requires one of these roles: ${roles.join(", ")}`
      );
    }

    next();
  };
};

/**
 * Middleware that verifies:
 * 1. The channel identified by `req.params.channelId` exists and belongs to
 *    the workspace identified by `req.params.workspaceId`
 * 2. The authenticated user is a member of that specific channel
 *
 * On success, attaches `req.channel` and `req.channelMember`.
 * Must be used AFTER `authenticate` and `requireWorkspaceMember`.
 *
 * Usage:
 *   router.post("/:channelId/messages", authenticate, requireWorkspaceMember,
 *     requireChannelMember, handler);
 */
const requireChannelMember = async (req, res, next) => {
  const { channelId, workspaceId } = req.params;
  const userId = req.user.id;

  if (!channelId) {
    throw new AppError(400, "Channel ID is required");
  }

  // Verify channel exists AND belongs to this workspace
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError(404, "Channel not found in this workspace");
  }

  // Verify user is a member of this channel
  const channelMembership = await prisma.channelMember.findUnique({
    where: {
      userId_channelId: { userId, channelId },
    },
  });

  if (!channelMembership) {
    throw new AppError(403, "You are not a member of this channel");
  }

  req.channel = channel;
  req.channelMember = channelMembership;
  next();
};

module.exports = { requireWorkspaceMember, requireWorkspaceRole, requireChannelMember };
