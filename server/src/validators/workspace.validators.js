const { z } = require("zod");

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Workspace name must be at least 2 characters")
    .max(50, "Workspace name must be at most 50 characters")
    .trim(),
});

const addMemberSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email address")
      .transform((v) => v.toLowerCase().trim())
      .optional(),
    userId: z
      .string()
      .uuid("Invalid user ID")
      .optional(),
    role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  })
  .refine(
    (data) => (data.email && !data.userId) || (!data.email && data.userId),
    { message: "Provide exactly one of 'email' or 'userId', not both or neither" }
  );

const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], {
    errorMap: () => ({ message: "Role must be either ADMIN or MEMBER" }),
  }),
});

module.exports = { createWorkspaceSchema, addMemberSchema, updateMemberRoleSchema };
