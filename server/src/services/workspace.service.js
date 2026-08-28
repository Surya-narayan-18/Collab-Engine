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
 * Send an invitation to join a workspace. Only OWNER/ADMIN can do this.
 * Creates a PENDING invitation instead of directly adding the member.
 */
async function sendInvitation({ workspaceId, email, role, inviterId }) {
  // Find the user to invite
  const userToInvite = await prisma.user.findUnique({
    where: { email },
    select: safeUserSelect,
  });

  if (!userToInvite) {
    throw new AppError(404, "No user found with that email");
  }

  // Check if already a workspace member
  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: userToInvite.id,
        workspaceId,
      },
    },
  });

  if (existingMember) {
    throw new AppError(409, "User is already a member of this workspace");
  }

  // Check if there's already a pending invitation
  const existingInvitation = await prisma.invitation.findUnique({
    where: {
      workspaceId_inviteeId: {
        workspaceId,
        inviteeId: userToInvite.id,
      },
    },
  });

  if (existingInvitation && existingInvitation.status === "PENDING") {
    throw new AppError(409, "An invitation is already pending for this user");
  }

  // If there's a declined invitation, update it to pending; otherwise create new
  let invitation;
  if (existingInvitation) {
    invitation = await prisma.invitation.update({
      where: { id: existingInvitation.id },
      data: {
        status: "PENDING",
        inviterId,
        role,
      },
      include: {
        workspace: true,
        inviter: { select: safeUserSelect },
        invitee: { select: safeUserSelect },
      },
    });
  } else {
    invitation = await prisma.invitation.create({
      data: {
        workspaceId,
        inviterId,
        inviteeId: userToInvite.id,
        role,
      },
      include: {
        workspace: true,
        inviter: { select: safeUserSelect },
        invitee: { select: safeUserSelect },
      },
    });
  }

  return invitation;
}

/**
 * List pending invitations for a user.
 */
async function listInvitations(userId) {
  const invitations = await prisma.invitation.findMany({
    where: {
      inviteeId: userId,
      status: "PENDING",
    },
    include: {
      workspace: true,
      inviter: { select: safeUserSelect },
      invitee: { select: safeUserSelect },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations;
}

/**
 * Accept an invitation. Creates a WorkspaceMember and marks invitation as ACCEPTED.
 */
async function acceptInvitation({ invitationId, userId }) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      workspace: true,
      inviter: { select: safeUserSelect },
    },
  });

  if (!invitation) {
    throw new AppError(404, "Invitation not found");
  }

  if (invitation.inviteeId !== userId) {
    throw new AppError(403, "This invitation is not for you");
  }

  if (invitation.status !== "PENDING") {
    throw new AppError(400, `Invitation has already been ${invitation.status.toLowerCase()}`);
  }

  // Use transaction to atomically accept invitation + create membership
  const [updatedInvitation, membership] = await prisma.$transaction([
    prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED" },
      include: {
        workspace: true,
        inviter: { select: safeUserSelect },
        invitee: { select: safeUserSelect },
      },
    }),
    prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
      include: {
        user: { select: safeUserSelect },
      },
    }),
  ]);

  return { invitation: updatedInvitation, membership };
}

/**
 * Decline an invitation.
 */
async function declineInvitation({ invitationId, userId }) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new AppError(404, "Invitation not found");
  }

  if (invitation.inviteeId !== userId) {
    throw new AppError(403, "This invitation is not for you");
  }

  if (invitation.status !== "PENDING") {
    throw new AppError(400, `Invitation has already been ${invitation.status.toLowerCase()}`);
  }

  const updatedInvitation = await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "DECLINED" },
    include: {
      workspace: true,
      inviter: { select: safeUserSelect },
      invitee: { select: safeUserSelect },
    },
  });

  return updatedInvitation;
}

/**
 * List pending invitations for a workspace (for displaying in member panel).
 */
async function listWorkspaceInvitations(workspaceId) {
  const invitations = await prisma.invitation.findMany({
    where: {
      workspaceId,
      status: "PENDING",
    },
    include: {
      inviter: { select: safeUserSelect },
      invitee: { select: safeUserSelect },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations;
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
  sendInvitation,
  listInvitations,
  acceptInvitation,
  declineInvitation,
  listWorkspaceInvitations,
  removeMember,
  deleteWorkspace,
};
