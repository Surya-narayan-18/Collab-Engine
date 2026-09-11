const prisma = require("../lib/prisma");
const AppError = require("../errors/AppError");
const { safeUserSelect } = require("../lib/safeUser");

/** Default invitation TTL — 7 days in milliseconds */
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
 * Resolve the invitee by email or userId.
 * Exactly one of the two must be provided (validated upstream by Zod).
 * @param {{ email?: string, userId?: string }} params
 * @returns {Promise<object>} The resolved user (safeUserSelect fields)
 */
async function resolveInvitee({ email, userId }) {
  let user;

  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: safeUserSelect,
    });
    if (!user) {
      throw new AppError(404, "No user found with that ID");
    }
  } else {
    user = await prisma.user.findUnique({
      where: { email },
      select: safeUserSelect,
    });
    if (!user) {
      throw new AppError(404, "No account found for that email");
    }
  }

  return user;
}

/**
 * Send an invitation to join a workspace. Only OWNER/ADMIN can do this.
 * Creates a PENDING invitation instead of directly adding the member.
 *
 * Accepts either `email` or `userId` to identify the invitee.
 * The entire check-then-create/update flow runs inside an interactive
 * transaction to prevent duplicate pending invites from racing (Bug #8).
 */
async function sendInvitation({ workspaceId, email, userId, role, inviterId }) {
  // Resolve the invitee outside the transaction (read-only, idempotent)
  const userToInvite = await resolveInvitee({ email, userId });

  // Can't invite yourself
  if (userToInvite.id === inviterId) {
    throw new AppError(400, "You cannot invite yourself");
  }

  // Interactive transaction for atomic check + create/update (Bug #8)
  const invitation = await prisma.$transaction(async (tx) => {
    // Check if already a workspace member
    const existingMember = await tx.workspaceMember.findUnique({
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

    // Check if there's already an invitation for this user in this workspace
    const existingInvitation = await tx.invitation.findUnique({
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

    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    // If there's a declined/accepted invitation, update it to pending; otherwise create new
    if (existingInvitation) {
      return tx.invitation.update({
        where: { id: existingInvitation.id },
        data: {
          status: "PENDING",
          inviterId,
          role,
          expiresAt,
        },
        include: {
          workspace: true,
          inviter: { select: safeUserSelect },
          invitee: { select: safeUserSelect },
        },
      });
    }

    return tx.invitation.create({
      data: {
        workspaceId,
        inviterId,
        inviteeId: userToInvite.id,
        role,
        expiresAt,
      },
      include: {
        workspace: true,
        inviter: { select: safeUserSelect },
        invitee: { select: safeUserSelect },
      },
    });
  });

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
 *
 * Uses an interactive transaction so that a P2002 on WorkspaceMember (the user
 * is already a member due to a race) is caught cleanly (Bug #2).
 * Also checks invitation expiry (Bug #6).
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

  // Bug #6: check expiry
  if (invitation.expiresAt && new Date() > invitation.expiresAt) {
    throw new AppError(410, "This invitation has expired");
  }

  // Bug #2: interactive transaction + P2002 catch for race condition
  try {
    const [updatedInvitation, membership] = await prisma.$transaction(async (tx) => {
      const inv = await tx.invitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
        include: {
          workspace: true,
          inviter: { select: safeUserSelect },
          invitee: { select: safeUserSelect },
        },
      });

      const mem = await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
        include: {
          user: { select: safeUserSelect },
        },
      });

      return [inv, mem];
    });

    return { invitation: updatedInvitation, membership };
  } catch (err) {
    if (err.code === "P2002") {
      // Race: membership was created between our check and accept.
      // Still mark invitation as accepted for consistency.
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
      });
      throw new AppError(409, "You are already a member of this workspace");
    }
    throw err;
  }
}

/**
 * Decline an invitation.
 * Checks invitation expiry (Bug #6).
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

  // Bug #6: check expiry
  if (invitation.expiresAt && new Date() > invitation.expiresAt) {
    throw new AppError(410, "This invitation has expired");
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
 * Restricted to OWNER/ADMIN via middleware (Bug #5).
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
 * Revoke (cancel/delete) a PENDING invitation. Only OWNER/ADMIN can do this (Bug #7).
 * The invitation must belong to the specified workspace and must be PENDING.
 */
async function revokeInvitation({ invitationId, workspaceId }) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new AppError(404, "Invitation not found");
  }

  if (invitation.workspaceId !== workspaceId) {
    throw new AppError(404, "Invitation not found in this workspace");
  }

  if (invitation.status !== "PENDING") {
    throw new AppError(400, `Cannot revoke an invitation that has been ${invitation.status.toLowerCase()}`);
  }

  await prisma.invitation.delete({
    where: { id: invitationId },
  });

  return { revoked: true };
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
  resolveInvitee,
  sendInvitation,
  listInvitations,
  acceptInvitation,
  declineInvitation,
  listWorkspaceInvitations,
  revokeInvitation,
  removeMember,
  deleteWorkspace,
};
