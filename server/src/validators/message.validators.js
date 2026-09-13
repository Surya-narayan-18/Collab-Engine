const { z } = require("zod");

const createMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message content is required")
    .max(4000, "Message must be at most 4000 characters")
    .refine((val) => !val.includes("\u0000"), "Message contains invalid characters"),
});

module.exports = { createMessageSchema };
