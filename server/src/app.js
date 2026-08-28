const express = require("express");
const cors = require("cors");
const config = require("./config");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { generalLimiter } = require("./middleware/rateLimiter");

const app = express();

// ─── Global Middleware ───────────────────────────────────────────────

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// CORS — allow requests from the frontend dev server
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
  })
);

// Rate limiting — 100 req/min per IP (applied to all API routes)
app.use("/api", generalLimiter);

// ─── API Routes ──────────────────────────────────────────────────────

app.use("/api", routes);

// ─── Error Handling ──────────────────────────────────────────────────

// 404 for unmatched routes
app.use(notFound);

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
