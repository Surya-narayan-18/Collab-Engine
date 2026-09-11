const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    globals: true,
    testTimeout: 30000, // 30s — tests hit a real DB
    hookTimeout: 30000,
    include: ["tests/**/*.test.js"],
  },
});
