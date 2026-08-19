const { getClient } = require('./redis');

const WINDOW_SECONDS = 60;

// Fixed-window counter per key (e.g. per IP + endpoint). Returns false once
// the caller has exceeded `limit` attempts within the current 60s window.
async function checkRateLimit(key, limit) {
  const client = await getClient();
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, WINDOW_SECONDS);
  }
  return count <= limit;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

module.exports = { checkRateLimit, getClientIp };
