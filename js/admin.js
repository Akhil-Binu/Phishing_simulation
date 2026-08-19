/**
 * PhishLab — admin panel logic
 * Password-gates the admin page, then lets an admin view/change/reset the
 * active access code and generate a shareable unlock link.
 */
(function () {
  'use strict';

  const ADMIN_SESSION_KEY = 'phishlab_admin_authed';
  const cfg = window.PhishLabConfig;

  const loginCard = document.getElementById('admin-login');
  const panel = document.getElementById('admin-panel');
  const loginForm = document.getElementById('admin-login-form');
  const loginInput = document.getElementById('admin-password-input');
  const loginError = document.getElementById('admin-login-error');

  function showPanel() {
    loginCard.hidden = true;
    panel.hidden = false;
    refreshPanel();
  }

  function refreshPanel() {
    const current = cfg.getActiveCode();
    const custom = cfg.isCustomCode();

    document.getElementById('current-code-value').textContent = current;
    document.getElementById('current-code-source').textContent = custom
      ? 'Custom code set on this browser'
      : 'Default code (from js/config.js)';

    const link = new URL('../index.html', location.href);
    link.searchParams.set('code', current);
    document.getElementById('share-link').value = link.toString();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = await cfg.verifyAdminPassword(loginInput.value);
    if (ok) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      loginInput.value = '';
      showPanel();
    } else {
      loginError.textContent = 'Incorrect password.';
      loginInput.value = '';
      loginInput.focus();
    }
  });

  document.getElementById('set-code-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('new-code-input');
    const status = document.getElementById('set-code-status');
    const value = input.value.trim();
    if (!value) return;
    cfg.setActiveCode(value);
    input.value = '';
    status.textContent = `Saved. New code is active on this browser as of ${new Date().toLocaleTimeString()}.`;
    refreshPanel();
  });

  document.getElementById('reset-code-btn').addEventListener('click', () => {
    cfg.resetToDefaultCode();
    document.getElementById('set-code-status').textContent = 'Reset to the default code from js/config.js.';
    refreshPanel();
  });

  document.getElementById('copy-link-btn').addEventListener('click', async () => {
    const linkInput = document.getElementById('share-link');
    linkInput.select();
    try {
      await navigator.clipboard.writeText(linkInput.value);
      const btn = document.getElementById('copy-link-btn');
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the input is
      // already selected above so the admin can copy it manually.
    }
  });

  document.getElementById('admin-logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    location.reload();
  });

  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === '1') {
    showPanel();
  } else {
    requestAnimationFrame(() => loginInput.focus());
  }
})();
