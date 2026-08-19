/**
 * PhishLab — client for the /api access-code backend.
 * The actual code and admin password now live server-side (Redis +
 * hashed env var) so a change made in the admin panel applies to every
 * visitor, not just one browser.
 */
window.PhishLabConfig = (function () {
  'use strict';

  const UNLOCK_KEY = 'phishlab_access_granted';

  async function verifyCode(code) {
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        return { ok: false, error: data.error || 'Too many attempts. Try again shortly.' };
      }
      return { ok: !!data.ok };
    } catch {
      return { ok: false, error: 'Could not reach the server. Check your connection and try again.' };
    }
  }

  return { UNLOCK_KEY, verifyCode };
})();
