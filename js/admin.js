/**
 * PhishLab — admin panel logic
 * Talks to /api/admin/* (cookie-based session, hashed password checked
 * server-side) to view/change/reset the shared access code.
 */
(function () {
  'use strict';

  const loginCard = document.getElementById('admin-login');
  const panel = document.getElementById('admin-panel');
  const loginForm = document.getElementById('admin-login-form');
  const loginInput = document.getElementById('admin-password-input');
  const loginError = document.getElementById('admin-login-error');
  const loginBtn = loginForm.querySelector('button[type="submit"]');

  async function api(path, options) {
    let res;
    try {
      res = await fetch(path, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
    } catch {
      return { status: 0, data: { ok: false, error: 'Could not reach the server.' } };
    }
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  function showLogin() {
    loginCard.hidden = false;
    panel.hidden = true;
    requestAnimationFrame(() => loginInput.focus());
  }

  function applyCodeData(data) {
    document.getElementById('current-code-value').textContent = data.code;
    document.getElementById('current-code-source').textContent = data.isCustom
      ? 'Custom code — live for every visitor'
      : 'Default code';

    const link = new URL('../index.html', location.href);
    link.searchParams.set('code', data.code);
    document.getElementById('share-link').value = link.toString();
  }

  function showPanel(data) {
    loginCard.hidden = true;
    panel.hidden = false;
    applyCodeData(data);
  }

  async function refreshCode() {
    const { status, data } = await api('/api/admin/code');
    if (status === 401) {
      showLogin();
      return;
    }
    applyCodeData(data);
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginBtn.disabled = true;
    const { status, data } = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: loginInput.value })
    });
    loginBtn.disabled = false;
    loginInput.value = '';

    if (status === 200 && data.ok) {
      loginError.textContent = '';
      const codeRes = await api('/api/admin/code');
      if (codeRes.status === 200) showPanel(codeRes.data);
    } else {
      loginError.textContent = data.error || 'Incorrect password.';
      loginInput.focus();
    }
  });

  document.getElementById('set-code-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('new-code-input');
    const status = document.getElementById('set-code-status');
    const value = input.value.trim();
    if (!value) return;

    const res = await api('/api/admin/code', { method: 'POST', body: JSON.stringify({ code: value }) });
    if (res.status === 401) { showLogin(); return; }
    input.value = '';
    status.textContent = res.data.ok
      ? `Saved. This code is now live for everyone as of ${new Date().toLocaleTimeString()}.`
      : (res.data.error || 'Could not save the code.');
    if (res.data.ok) applyCodeData(res.data);
  });

  document.getElementById('reset-code-btn').addEventListener('click', async () => {
    const res = await api('/api/admin/code', { method: 'DELETE' });
    if (res.status === 401) { showLogin(); return; }
    document.getElementById('set-code-status').textContent = 'Reset to the default code for everyone.';
    if (res.data.ok) applyCodeData(res.data);
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

  document.getElementById('admin-logout-btn').addEventListener('click', async () => {
    await api('/api/admin/logout', { method: 'POST' });
    showLogin();
  });

  (async () => {
    const { status, data } = await api('/api/admin/code');
    if (status === 200) showPanel(data);
    else requestAnimationFrame(() => loginInput.focus());
  })();
})();
