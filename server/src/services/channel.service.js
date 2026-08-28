const prisma = require("../lib/prisma");
const AppError = require("../errors/AppError");
const { safeUserSelect } = require("../lib/safeUser");

/**
 * Create a channel in a workspace. Any workspace member can create channels.
 * The creator is automatically added as a channel member.
 */
async function createChannel({ name, workspaceId, userId }) {
  // Check for duplicate channel name in this workspace
  const existing = await prisma.channel.findUnique({
    where: {
      workspaceId_name: { workspaceId, name },
    },
  });

  if (existing) {
    throw new AppError(409, `Channel "${name}" already exists in this workspace`);
  }

  const channel = await prisma.channel.create({
    data: {
      name,
      workspaceId,
      createdById: userId,
      members: {
        create: { userId },
      },
    },
    include: {
      members: {
        include: { user: { select: safeUserSelect } },
      },
      _count: { select: { members: true, messages: true } },
    },
  });

  return channel;
}

/**
 * List all channels in a workspace. For each channel, indicates whether
 * the requesting user has joined it.
 */
async function listChannels({ workspaceId, userId }) {
  const channels = await prisma.channel.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { members: true, messages: true } },
      members: {
        where: { userId },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Transform: replace members array with a boolean `isMember`
  return channels.map((ch) => {
    const { members, ...rest } = ch;
    return { ...rest, isMember: members.length > 0 };
  });
}

/**
 * Get a single channel with its members. Caller must be a workspace member.
 */
async function getChannel({ channelId, workspaceId }) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      members: {
        include: { user: { select: safeUserSelect } },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { members: true, messages: true } },
    },
  });

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError(404, "Channel not found in this workspace");
  }

  return channel;
}

/**
 * Join a channel. The user must be a workspace member (checked by middleware).
 */
async function joinChannel({ channelId, workspaceId, userId }) {
  // Verify channel belongs to workspace
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError(404, "Channel not found in this workspace");
  }

  // Check if already a member
  const existing = await prisma.channelMember.findUnique({
    where: {
      userId_channelId: { userId, channelId },
    },
  });

  if (existing) {
    throw new AppError(409, "You are already a member of this channel");
  }

  const membership = await prisma.channelMember.create({
    data: { userId, channelId },
    include: {
      user: { select: safeUserSelect },
    },
  });

  return membership;
}

/**
 * Delete a channel. Only workspace OWNER can do this (checked by middleware).
 * Cannot delete the "general" channel.
 */
async function deleteChannel({ channelId, workspaceId }) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError(404, "Channel not found in this workspace");
  }

  if (channel.name === "general") {
    throw new AppError(400, 'Cannot delete the "general" channel');
  }

  await prisma.channel.delete({
    where: { id: channelId },
  });

  return { deleted: true };
}

module.exports = {
  createChannel,
  listChannels,
  getChannel,
  joinChannel,
  deleteChannel,
};
