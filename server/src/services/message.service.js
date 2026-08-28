const prisma = require("../lib/prisma");
const { safeUserSelect } = require("../lib/safeUser");

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/**
 * Create a message in a channel.
 * Author is always the authenticated user (from JWT), never from request body.
 */
async function createMessage({ content, channelId, userId }) {
  const message = await prisma.message.create({
    data: {
      content,
      channelId,
      userId,
    },
    include: {
      user: { select: safeUserSelect },
    },
  });

  return message;
}

/**
 * Encode a compound cursor from a message's createdAt + id.
 * Format: base64("createdAt|id")
 */
function encodeCursor(message) {
  const raw = `${message.createdAt.toISOString()}|${message.id}`;
  return Buffer.from(raw).toString("base64url");
}

/**
 * Decode a compound cursor back to { createdAt, id }.
 */
function decodeCursor(cursor) {
  const raw = Buffer.from(cursor, "base64url").toString("utf-8");
  const [createdAt, id] = raw.split("|");
  return { createdAt: new Date(createdAt), id };
}

/**
 * Get messages for a channel using cursor-based pagination.
 *
 * Cursor strategy:
 * - Uses compound sort: createdAt DESC, id DESC (tiebreaker for same-millisecond)
 * - Cursor is an opaque base64url-encoded string containing createdAt + id
 * - If `cursor` is provided, returns messages older than that point
 * - Fetches `limit + 1` records to determine if there's a next page
 * - Returns `nextCursor` if more exist, null otherwise
 *
 * @param {object} params
 * @param {string} params.channelId
 * @param {string} [params.cursor]  - opaque cursor from a previous response
 * @param {number} [params.limit]   - page size (default 50, max 100)
 * @returns {{ messages: object[], nextCursor: string | null }}
 */
async function getMessages({ channelId, cursor, limit }) {
  // Clamp limit
  const pageSize = Math.min(
    Math.max(parseInt(limit, 10) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );

  // Build where clause with compound cursor
  const where = { channelId };
  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor);
    // Messages that are strictly older, OR same timestamp but with a smaller id
    where.OR = [
      { createdAt: { lt: createdAt } },
      { createdAt: createdAt, id: { lt: id } },
    ];
  }

  // Fetch one extra to check for next page
  const messages = await prisma.message.findMany({
    where,
    include: {
      user: { select: safeUserSelect },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: pageSize + 1,
  });

  // Determine if there's a next page
  let nextCursor = null;
  if (messages.length > pageSize) {
    messages.pop(); // remove the extra record
    nextCursor = encodeCursor(messages[messages.length - 1]);
  }

  return { messages, nextCursor };
}

module.exports = { createMessage, getMessages };
