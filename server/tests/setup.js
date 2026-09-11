/**
 * Test setup and shared helpers.
 *
 * Provides helper functions to register users, create workspaces, and
 * authenticate requests. Uses the real Express app + Prisma database.
 * Tests are expected to run against a fresh or wiped database.
 */
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

let userCounter = 0;

/**
 * Generate a unique test user and register them via the API.
 * Returns { user, token, agent } where agent is a supertest agent
 * with the token pre-set for convenience.
 */
async function createTestUser(overrides = {}) {
  userCounter++;
  const email = overrides.email || `testuser${userCounter}_${Date.now()}@test.com`;
  const userId = overrides.userId || `testuser${userCounter}_${Date.now()}`;
  const userName = overrides.userName || userId;
  const password = overrides.password || "TestPassword123!";

  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, userId, userName, password })
    .expect(201);

  return {
    user: res.body.data.user,
    token: res.body.data.token,
    password,
  };
}

/**
 * Login via the API using the identifier (email or userId) + password.
 */
async function loginUser(identifier, password) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ identifier, password });

  return res;
}

/**
 * Create a workspace as the given user and return the workspace data.
 */
async function createTestWorkspace(token, name = "Test Workspace") {
  const res = await request(app)
    .post("/api/workspaces")
    .set("Authorization", `Bearer ${token}`)
    .send({ name })
    .expect(201);

  return res.body.data.workspace;
}

/**
 * Send an invitation from the given user to a workspace.
 */
async function sendTestInvitation(token, workspaceId, { email, userId, role } = {}) {
  const body = {};
  if (email) body.email = email;
  if (userId) body.userId = userId;
  if (role) body.role = role;

  const res = await request(app)
    .post(`/api/workspaces/${workspaceId}/members`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);

  return res;
}

/**
 * Clean up all test data from the database.
 * Runs TRUNCATE CASCADE on all tables to reset state.
 */
async function cleanDatabase() {
  // Delete in dependency order to avoid FK violations
  await prisma.invitation.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Disconnect Prisma after all tests are done.
 */
async function disconnectPrisma() {
  await prisma.$disconnect();
}

module.exports = {
  app,
  prisma,
  createTestUser,
  loginUser,
  createTestWorkspace,
  sendTestInvitation,
  cleanDatabase,
  disconnectPrisma,
};
