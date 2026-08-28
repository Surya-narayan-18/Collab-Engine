const AppError = require("../errors/AppError");

/**
 * Creates an Express middleware that validates the request body against a Zod schema.
 * On failure, throws an AppError with status 400 and the Zod field errors as details.
 *
 * Usage:
 *   router.post("/example", validate(someZodSchema), controller.handler);
 *
 * @param {import("zod").ZodSchema} schema - A Zod schema to validate req.body against
 * @returns {import("express").RequestHandler}
 */
const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, "Validation failed", result.error.flatten().fieldErrors);
    }
    // Replace req.body with the parsed (and potentially transformed/stripped) data
    req.body = result.data;
    next();
  };
};

module.exports = validate;
