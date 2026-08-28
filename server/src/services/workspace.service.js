const prisma = require("../lib/prisma");
const AppError = require("../errors/AppError");
const { safeUserSelect } = require("../lib/safeUser");

/**
 * Create a new workspace. The creator automatically becomes OWNER
 * and is added as a workspace member.
 */
async function createWorkspace({ name, userId }) {
  const workspace = await prisma.workspace.create({
    data: {
      name,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
      // Create a default "general" channel
      channels: {
        create: {
          name: "general",
          createdById: userId,
          members: {
            create: {
              userId,
            },
          },
        },
      },
    },
    include: {
      members: {
        include: { user: { select: safeUserSelect } },
      },
      channels: true,
    },
  });

  return workspace;
}

/**
 * List all workspaces the user is a member of.
 */
async function listWorkspaces(userId) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true, channels: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

/**
 * Get a single workspace by ID. Caller must already be verified as a member
 * (via requireWorkspaceMember middleware).
 */
async function getWorkspace(workspaceId) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: { select: safeUserSelect } },
        orderBy: { joinedAt: "asc" },
      },
      channels: {
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { members: true, channels: true } },
    },
  });

  if (!workspace) {
    throw new AppError(404, "Workspace not found");
  }

  return workspace;
}

/**
 * Add a member to a workspace by email. Only OWNER/ADMIN can do this.
 * The new member gets the specified role (default MEMBER).
 */
async function addMember({ workspaceId, email, role }) {
  // Find the user to add
  const userToAdd = await prisma.user.findUnique({
    where: { email },
    select: safeUserSelect,
  });

  if (!userToAdd) {
    throw new AppError(404, "No user found with that email");
  }

  // Check if already a member
  const existing = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: userToAdd.id,
        workspaceId,
      },
    },
  });

  if (existing) {
    throw new AppError(409, "User is already a member of this workspace");
  }

  // Add the member
  const membership = await prisma.workspaceMember.create({
    data: {
      userId: userToAdd.id,
      workspaceId,
      role,
    },
    include: {
      user: { select: safeUserSelect },
    },
  });

  return membership;
}

/**
 * Remove a member from a workspace. OWNER/ADMIN can remove members.
 * Cannot remove the workspace OWNER.
 */
async function removeMember({ workspaceId, memberUserId }) {
  // Find the membership to remove
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: memberUserId,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new AppError(404, "User is not a member of this workspace");
  }

  // Cannot remove the OWNER
  if (membership.role === "OWNER") {
    throw new AppError(403, "Cannot remove the workspace owner");
  }

  await prisma.workspaceMember.delete({
    where: { id: membership.id },
  });

  return { removed: true };
}

/**
 * Delete a workspace. Only the OWNER can do this.
 * Cascading deletes will remove all members, channels, channel members, and messages.
 */
async function deleteWorkspace(workspaceId) {
  await prisma.workspace.delete({
    where: { id: workspaceId },
  });

  return { deleted: true };
}

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  addMember,
  removeMember,
  deleteWorkspace,
};
