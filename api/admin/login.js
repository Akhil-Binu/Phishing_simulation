const crypto = require('crypto');
const { checkRateLimit, getClientIp } = require('../../lib/rateLimit');
const { createSessionCookie, isSecureRequest } = require('../../lib/session');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const allowed = await checkRateLimit(`ratelimit:admin-login:${ip}`, 5);
  if (!allowed) {
    return res.status(429).json({ ok: false, error: 'Too many attempts. Try again in a minute.' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ ok: false, error: 'Password required' });
  }

  const expected = process.env.ADMIN_PASSWORD_HASH;
  if (!expected) {
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  const hash = crypto.createHash('sha256').update(password, 'utf8').digest('hex');
  const hashBuf = Buffer.from(hash);
  const expectedBuf = Buffer.from(expected);
  const match = hashBuf.length === expectedBuf.length && crypto.timingSafeEqual(hashBuf, expectedBuf);

  if (!match) {
    return res.status(401).json({ ok: false, error: 'Incorrect password' });
  }

  res.setHeader('Set-Cookie', createSessionCookie(process.env.SESSION_SECRET, isSecureRequest(req)));
  return res.status(200).json({ ok: true });
};
