/**
 * PhishLab — shared config for the access gate and admin panel.
 * Loaded before main.js (trainee pages) and admin.js (admin page).
 */
window.PhishLabConfig = (function () {
  'use strict';

  const UNLOCK_KEY = 'phishlab_access_granted';
  const CODE_KEY = 'phishlab_access_code';
  const DEFAULT_CODE = 'PHISHLAB2026';

  // SHA-256 of the admin password. The password itself is never stored —
  // only this hash, which is compared against a hash of what's typed in.
  // To change the admin password, compute a new SHA-256 hex digest of it
  // and replace ADMIN_HASH below.
  const ADMIN_HASH = '733fdea6e2fed77ba8f1a57465488a431f69ebc37b57300a5cae62168c82426f';

  async function sha256Hex(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getActiveCode() {
    return localStorage.getItem(CODE_KEY) || DEFAULT_CODE;
  }

  function isCustomCode() {
    return !!localStorage.getItem(CODE_KEY);
  }

  function setActiveCode(code) {
    localStorage.setItem(CODE_KEY, code);
  }

  function resetToDefaultCode() {
    localStorage.removeItem(CODE_KEY);
  }

  function matchesCode(input) {
    return input.trim().toLowerCase() === getActiveCode().trim().toLowerCase();
  }

  async function verifyAdminPassword(password) {
    return (await sha256Hex(password)) === ADMIN_HASH;
  }

  return {
    UNLOCK_KEY,
    DEFAULT_CODE,
    getActiveCode,
    isCustomCode,
    setActiveCode,
    resetToDefaultCode,
    matchesCode,
    verifyAdminPassword
  };
})();
