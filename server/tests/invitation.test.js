/**
 * Integration tests for the invitation system.
 *
 * Covers:
 * - Bug #1: Accept/decline ownership check (verify existing guards)
 * - Bug #2: Stale invitation race on accept (P2002 handling)
 * - Bug #3: Invite non-existent email (verify existing guard)
 * - Bug #4: Email normalization (verify existing guard)
 * - Bug #5: listWorkspaceInvitations authorization
 * - Bug #6: Invitation expiry
 * - Bug #7: Revoke invitation
 * - Bug #8: Duplicate pending invite protection
 * - Feature: Invite by userId
 */
const request = require("supertest");
const {
  app,
  prisma,
  createTestUser,
  createTestWorkspace,
  sendTestInvitation,
  cleanDatabase,
  disconnectPrisma,
} = require("./setup");

describe("Invitation System", () => {
  let owner, member, outsider;
  let workspace;

  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
    // Create three users: owner, a regular member, and an outsider
    owner = await createTestUser({ email: "owner@test.com", username: "owner" });
    member = await createTestUser({ email: "member@test.com", username: "member_user" });
    outsider = await createTestUser({ email: "outsider@test.com", username: "outsider" });

    // Owner creates a workspace
    workspace = await createTestWorkspace(owner.token, "Test WS");
  });

  // ─── Bug #1: Accept/decline ownership check ──────────────────────────

  describe("Bug #1 — Accept/decline ownership check", () => {
    it("should reject accept by a user who is not the invitee (403)", async () => {
      // Owner invites member
      const invRes = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      expect(invRes.status).toBe(201);
      const invitationId = invRes.body.data.invitation.id;

      // Outsider tries to accept member's invitation
      const res = await request(app)
        .post(`/api/workspaces/invitations/${invitationId}/accept`)
        .set("Authorization", `Bearer ${outsider.token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not for you/i);
    });

    it("should reject decline by a user who is not the invitee (403)", async () => {
      const invRes = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      const invitationId = invRes.body.data.invitation.id;

      const res = await request(app)
        .post(`/api/workspaces/invitations/${invitationId}/decline`)
        .set("Authorization", `Bearer ${outsider.token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not for you/i);
    });
  });

  // ─── Bug #2: Stale invitation race on accept ─────────────────────────

  describe("Bug #2 — Stale invitation race on accept", () => {
    it("should handle accept gracefully when user is already a member (409)", async () => {
      // Owner invites member
      const invRes = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      const invitationId = invRes.body.data.invitation.id;

      // Manually add member to workspace (simulating the race)
      await prisma.workspaceMember.create({
        data: {
          userId: member.user.id,
          workspaceId: workspace.id,
          role: "MEMBER",
        },
      });

      // Now member tries to accept — should get a clean 409
      const res = await request(app)
        .post(`/api/workspaces/invitations/${invitationId}/accept`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already a member/i);

      // Invitation should still be marked ACCEPTED
      const inv = await prisma.invitation.findUnique({ where: { id: invitationId } });
      expect(inv.status).toBe("ACCEPTED");
    });
  });

  // ─── Bug #3: Invite non-existent email ────────────────────────────────

  describe("Bug #3 — Invite non-existent email", () => {
    it("should return 404 when inviting a non-existent email", async () => {
      const res = await sendTestInvitation(owner.token, workspace.id, { email: "nobody@test.com" });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/no account found/i);
    });
  });

  // ─── Bug #4: Email normalization ──────────────────────────────────────

  describe("Bug #4 — Email normalization", () => {
    it("should normalize email case when sending invitation", async () => {
      const res = await sendTestInvitation(owner.token, workspace.id, { email: "MEMBER@TEST.COM" });

      expect(res.status).toBe(201);
      expect(res.body.data.invitation.invitee.email).toBe("member@test.com");
    });
  });

  // ─── Bug #5: listWorkspaceInvitations authorization ──────────────────

  describe("Bug #5 — listWorkspaceInvitations authorization", () => {
    it("should allow OWNER to list workspace invitations", async () => {
      // Send an invitation first
      await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });

      const res = await request(app)
        .get(`/api/workspaces/${workspace.id}/invitations`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.invitations).toHaveLength(1);
    });

    it("should reject MEMBER from listing workspace invitations (403)", async () => {
      // First add member to the workspace so they're a member
      await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });

      // Member accepts
      const invitations = await prisma.invitation.findMany({
        where: { inviteeId: member.user.id, status: "PENDING" },
      });
      await request(app)
        .post(`/api/workspaces/invitations/${invitations[0].id}/accept`)
        .set("Authorization", `Bearer ${member.token}`)
        .expect(200);

      // Now send another invitation to outsider
      await sendTestInvitation(owner.token, workspace.id, { email: outsider.user.email });

      // Member (now a workspace member with role MEMBER) tries to list invitations
      const res = await request(app)
        .get(`/api/workspaces/${workspace.id}/invitations`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── Bug #6: Invitation expiry ────────────────────────────────────────

  describe("Bug #6 — Invitation expiry", () => {
    it("should set expiresAt when creating an invitation", async () => {
      const res = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      expect(res.status).toBe(201);

      const inv = await prisma.invitation.findUnique({ where: { id: res.body.data.invitation.id } });
      expect(inv.expiresAt).not.toBeNull();

      // expiresAt should be roughly 7 days from now
      const diff = inv.expiresAt.getTime() - Date.now();
      expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000); // > 6 days
      expect(diff).toBeLessThan(8 * 24 * 60 * 60 * 1000); // < 8 days
    });

    it("should reject accept on expired invitation (410)", async () => {
      const res = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      const invitationId = res.body.data.invitation.id;

      // Manually set expiresAt to the past
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const acceptRes = await request(app)
        .post(`/api/workspaces/invitations/${invitationId}/accept`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(acceptRes.status).toBe(410);
      expect(acceptRes.body.message).toMatch(/expired/i);
    });

    it("should reject decline on expired invitation (410)", async () => {
      const res = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      const invitationId = res.body.data.invitation.id;

      // Manually expire it
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const declineRes = await request(app)
        .post(`/api/workspaces/invitations/${invitationId}/decline`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(declineRes.status).toBe(410);
      expect(declineRes.body.message).toMatch(/expired/i);
    });
  });

  // ─── Bug #7: Revoke invitation ────────────────────────────────────────

  describe("Bug #7 — Revoke invitation", () => {
    it("should allow OWNER to revoke a pending invitation", async () => {
      const invRes = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      const invitationId = invRes.body.data.invitation.id;

      const res = await request(app)
        .delete(`/api/workspaces/${workspace.id}/invitations/${invitationId}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/revoked/i);

      // Invitation should be deleted from DB
      const inv = await prisma.invitation.findUnique({ where: { id: invitationId } });
      expect(inv).toBeNull();
    });

    it("should reject revoke by a non-member (403)", async () => {
      const invRes = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      const invitationId = invRes.body.data.invitation.id;

      const res = await request(app)
        .delete(`/api/workspaces/${workspace.id}/invitations/${invitationId}`)
        .set("Authorization", `Bearer ${outsider.token}`);

      expect(res.status).toBe(403);
    });

    it("should reject revoking a non-pending invitation", async () => {
      const invRes = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      const invitationId = invRes.body.data.invitation.id;

      // Member declines
      await request(app)
        .post(`/api/workspaces/invitations/${invitationId}/decline`)
        .set("Authorization", `Bearer ${member.token}`)
        .expect(200);

      // Owner tries to revoke already-declined
      const res = await request(app)
        .delete(`/api/workspaces/${workspace.id}/invitations/${invitationId}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot revoke/i);
    });
  });

  // ─── Bug #8: Duplicate pending invite protection ──────────────────────

  describe("Bug #8 — Duplicate pending invite protection", () => {
    it("should reject duplicate invitation for the same user (409)", async () => {
      // First invitation succeeds
      const res1 = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      expect(res1.status).toBe(201);

      // Second invitation to same user should fail
      const res2 = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      expect(res2.status).toBe(409);
      expect(res2.body.message).toMatch(/already pending/i);
    });

    it("should allow re-invite after decline", async () => {
      // Send and decline
      const res1 = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      const invId = res1.body.data.invitation.id;

      await request(app)
        .post(`/api/workspaces/invitations/${invId}/decline`)
        .set("Authorization", `Bearer ${member.token}`)
        .expect(200);

      // Re-invite should succeed
      const res2 = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      expect(res2.status).toBe(201);
      expect(res2.body.data.invitation.status).toBe("PENDING");
    });
  });

  // ─── Feature: Invite by userId ────────────────────────────────────────

  describe("Feature — Invite by userId", () => {
    it("should send invitation by userId", async () => {
      const res = await sendTestInvitation(owner.token, workspace.id, { userId: member.user.id });

      expect(res.status).toBe(201);
      expect(res.body.data.invitation.invitee.id).toBe(member.user.id);
    });

    it("should reject invite with non-existent userId (404)", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const res = await sendTestInvitation(owner.token, workspace.id, { userId: fakeId });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/no user found with that id/i);
    });

    it("should reject invite with invalid userId format (400)", async () => {
      const res = await sendTestInvitation(owner.token, workspace.id, { userId: "not-a-uuid" });

      expect(res.status).toBe(400);
    });

    it("should reject invite with both email and userId (400)", async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ email: member.user.email, userId: member.user.id });

      expect(res.status).toBe(400);
    });

    it("should reject invite with neither email nor userId (400)", async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ role: "MEMBER" });

      expect(res.status).toBe(400);
    });

    it("should prevent duplicate invite by userId (409)", async () => {
      await sendTestInvitation(owner.token, workspace.id, { userId: member.user.id });
      const res = await sendTestInvitation(owner.token, workspace.id, { userId: member.user.id });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already pending/i);
    });
  });

  // ─── Happy path: full invitation flow ─────────────────────────────────

  describe("Happy path — full invitation flow", () => {
    it("should send, accept, and create membership", async () => {
      // Send invitation
      const invRes = await sendTestInvitation(owner.token, workspace.id, { email: member.user.email });
      expect(invRes.status).toBe(201);
      const invitationId = invRes.body.data.invitation.id;

      // Member sees invitation in their list
      const listRes = await request(app)
        .get("/api/workspaces/invitations")
        .set("Authorization", `Bearer ${member.token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.invitations).toHaveLength(1);

      // Member accepts
      const acceptRes = await request(app)
        .post(`/api/workspaces/invitations/${invitationId}/accept`)
        .set("Authorization", `Bearer ${member.token}`);
      expect(acceptRes.status).toBe(200);

      // Member should now be a workspace member
      const wsRes = await request(app)
        .get(`/api/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${member.token}`);
      expect(wsRes.status).toBe(200);
      expect(wsRes.body.data.workspace.members).toHaveLength(2);
    });
  });
});
