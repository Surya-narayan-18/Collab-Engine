/**
 * Integration tests for authentication — login by identifier (email or userId).
 *
 * Covers:
 * - Login via email → success
 * - Login via userId → success
 * - Wrong password on email → 401
 * - Wrong password on userId → 401
 * - Non-existent identifier → 401
 * - Existing register + login flow
 */
const request = require("supertest");
const {
  app,
  createTestUser,
  loginUser,
  cleanDatabase,
  disconnectPrisma,
} = require("./setup");

describe("Auth — Login by Identifier", () => {
  let testUser;
  const TEST_PASSWORD = "SecurePass123!";

  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser({
      email: "auth@test.com",
      username: "authuser",
      password: TEST_PASSWORD,
    });
  });

  // ─── Login via email ─────────────────────────────────────────────────

  describe("Login via email", () => {
    it("should login successfully with email and correct password", async () => {
      const res = await loginUser("auth@test.com", TEST_PASSWORD);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.user.email).toBe("auth@test.com");
      expect(res.body.data.token).toBeDefined();
      // Password should not be in response
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("should login with mixed-case email (normalization)", async () => {
      const res = await loginUser("AUTH@TEST.COM", TEST_PASSWORD);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("auth@test.com");
    });

    it("should reject login with wrong password (401)", async () => {
      const res = await loginUser("auth@test.com", "WrongPassword!");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });
  });

  // ─── Login via userId ─────────────────────────────────────────────────

  describe("Login via userId", () => {
    it("should login successfully with userId and correct password", async () => {
      const res = await loginUser(testUser.user.id, TEST_PASSWORD);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.user.id).toBe(testUser.user.id);
      expect(res.body.data.token).toBeDefined();
    });

    it("should reject login with userId and wrong password (401)", async () => {
      const res = await loginUser(testUser.user.id, "WrongPassword!");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });
  });

  // ─── Non-existent identifier ──────────────────────────────────────────

  describe("Non-existent identifier", () => {
    it("should reject login with non-existent email (401)", async () => {
      const res = await loginUser("nobody@test.com", TEST_PASSWORD);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it("should reject login with non-existent userId (401)", async () => {
      const res = await loginUser("00000000-0000-0000-0000-000000000000", TEST_PASSWORD);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────────────

  describe("Edge cases", () => {
    it("should reject empty identifier (400)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ identifier: "", password: TEST_PASSWORD });

      expect(res.status).toBe(400);
    });

    it("should reject missing password (400)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ identifier: "auth@test.com" });

      expect(res.status).toBe(400);
    });

    it("should return a valid JWT that works with /auth/me", async () => {
      const loginRes = await loginUser(testUser.user.id, TEST_PASSWORD);
      expect(loginRes.status).toBe(200);

      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${loginRes.body.data.token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.id).toBe(testUser.user.id);
    });
  });
});
