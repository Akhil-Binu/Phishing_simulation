const crypto = require('crypto');

const COOKIE_NAME = 'phishlab_admin_session';
const SESSION_TTL_SECONDS = 2 * 60 * 60; // 2 hours

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function createSessionCookie(secret, secure) {
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  const value = `${payload}.${sign(payload, secret)}`;
  return `${COOKIE_NAME}=${value}; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

function clearSessionCookie(secure) {
  return `${COOKIE_NAME}=; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=0`;
}

function verifySession(cookieHeader, secret) {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  const [payload, sig] = match[1].split('.');
  if (!payload || !sig) return false;

  const expectedSig = sign(payload, secret);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

function isSecureRequest(req) {
  return req.headers['x-forwarded-proto'] === 'https';
}

module.exports = { createSessionCookie, clearSessionCookie, verifySession, isSecureRequest };
