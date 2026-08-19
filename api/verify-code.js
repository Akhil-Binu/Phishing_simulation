const { getClient } = require('../lib/redis');
const { checkRateLimit, getClientIp } = require('../lib/rateLimit');
const { CODE_KEY, DEFAULT_CODE } = require('../lib/config');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const allowed = await checkRateLimit(`ratelimit:verify:${ip}`, 10);
  if (!allowed) {
    return res.status(429).json({ ok: false, error: 'Too many attempts. Try again in a minute.' });
  }

  const { code } = req.body || {};
  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ ok: false, error: 'Code required' });
  }

  const client = await getClient();
  const activeCode = (await client.get(CODE_KEY)) || DEFAULT_CODE;
  const ok = code.trim().toLowerCase() === activeCode.trim().toLowerCase();

  return res.status(200).json({ ok });
};
