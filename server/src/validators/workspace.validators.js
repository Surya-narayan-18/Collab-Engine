const { z } = require("zod");

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Workspace name must be at least 2 characters")
    .max(50, "Workspace name must be at most 50 characters")
    .trim(),
});

const addMemberSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((v) => v.toLowerCase().trim()),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

module.exports = { createWorkspaceSchema, addMemberSchema };
