const { getClient } = require('../../lib/redis');
const { verifySession } = require('../../lib/session');
const { CODE_KEY, DEFAULT_CODE } = require('../../lib/config');

function requireAdmin(req, res) {
  if (!verifySession(req.headers.cookie, process.env.SESSION_SECRET)) {
    res.status(401).json({ ok: false, error: 'Not authenticated' });
    return false;
  }
  return true;
}

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const client = await getClient();

  if (req.method === 'GET') {
    const stored = await client.get(CODE_KEY);
    return res.status(200).json({ ok: true, code: stored || DEFAULT_CODE, isCustom: !!stored });
  }

  if (req.method === 'POST') {
    const { code } = req.body || {};
    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ ok: false, error: 'Code required' });
    }
    const trimmed = code.trim();
    await client.set(CODE_KEY, trimmed);
    return res.status(200).json({ ok: true, code: trimmed, isCustom: true });
  }

  if (req.method === 'DELETE') {
    await client.del(CODE_KEY);
    return res.status(200).json({ ok: true, code: DEFAULT_CODE, isCustom: false });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
