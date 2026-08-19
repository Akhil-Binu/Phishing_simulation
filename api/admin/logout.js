const { clearSessionCookie, isSecureRequest } = require('../../lib/session');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', clearSessionCookie(isSecureRequest(req)));
  return res.status(200).json({ ok: true });
};
