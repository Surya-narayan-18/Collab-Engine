const Redis = require("ioredis");
const config = require("../config");

const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

module.exports = redis;
