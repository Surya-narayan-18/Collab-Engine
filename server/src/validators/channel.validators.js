const { z } = require("zod");

const createChannelSchema = z.object({
  name: z
    .string()
    .min(2, "Channel name must be at least 2 characters")
    .max(50, "Channel name must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Channel name can only contain letters, numbers, hyphens, and underscores"
    )
    .transform((v) => v.toLowerCase().trim()),
});

module.exports = { createChannelSchema };
