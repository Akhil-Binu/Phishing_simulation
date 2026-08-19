/**
 * Phishing Simulation Lab — Main JS
 * Handles: progress tracking, scenario navigation
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'phishlab_progress';
  const TOTAL_SCENARIOS = 7;
  // Plaintext by design: this is a static site with no backend, so nothing
  // here is truly secret regardless of encoding. This is a soft gate to keep
  // the lab from being stumbled into during a training rollout, not a real
  // auth control. The active code is configurable via the /admin panel and
  // falls back to PhishLabConfig.DEFAULT_CODE (see js/config.js).
  const { UNLOCK_KEY, matchesCode } = window.PhishLabConfig;

  // ── Skip link (keyboard/screen-reader users) ──────────────────────
  function initSkipLink() {
    const link = document.createElement('a');
    link.href = '#main-content';
    link.className = 'skip-link';
    link.textContent = 'Skip to main content';
    document.body.prepend(link);
  }

  // ── Shareable unlock link (?code=...) ──────────────────────────────
  // Lets an admin hand trainees a direct link instead of the raw code.
  function tryUnlockFromQueryString() {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code && matchesCode(code)) {
      localStorage.setItem(UNLOCK_KEY, '1');
    }
    if (params.has('code')) {
      params.delete('code');
      const rest = params.toString();
      history.replaceState(null, '', location.pathname + (rest ? `?${rest}` : '') + location.hash);
    }
  }

  // ── Access code gate ───────────────────────────────────────────────
  function initAccessGate() {
    tryUnlockFromQueryString();
    if (localStorage.getItem(UNLOCK_KEY) === '1') return;

    // Snapshot current children before inserting the gate, then make
    // everything else inert so keyboard/AT users can't reach the page
    // behind the modal gate.
    const siblings = Array.from(document.body.children).filter(el => el.tagName !== 'SCRIPT');
    siblings.forEach(el => el.setAttribute('inert', ''));

    const gate = document.createElement('div');
    gate.className = 'access-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'access-gate-title');
    gate.innerHTML = `
      <div class="access-gate__card">
        <div class="access-gate__icon" aria-hidden="true">🔑</div>
        <h2 id="access-gate-title">Enter Access Code</h2>
        <p class="access-gate__desc">PhishLab is a private security-awareness training lab. Enter the code your training organiser gave you to continue.</p>
        <form id="access-gate-form" novalidate>
          <label for="access-gate-input" class="sr-only">Access code</label>
          <input type="text" id="access-gate-input" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ACCESS CODE" />
          <div id="access-gate-error" class="access-gate__error" role="alert"></div>
          <button type="submit" class="btn btn--primary btn--lg">Unlock Lab</button>
        </form>
        <p class="access-gate__note">This is a soft access gate for controlled training rollouts, not a security control — no real data is protected here.</p>
      </div>`;
    document.body.prepend(gate);

    const card = gate.querySelector('.access-gate__card');
    const input = gate.querySelector('#access-gate-input');
    const form = gate.querySelector('#access-gate-form');
    const error = gate.querySelector('#access-gate-error');

    requestAnimationFrame(() => input.focus());

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value;
      if (value.trim() && matchesCode(value)) {
        localStorage.setItem(UNLOCK_KEY, '1');
        siblings.forEach(el => el.removeAttribute('inert'));
        gate.remove();
      } else {
        error.textContent = 'Incorrect code. Please try again.';
        card.classList.remove('shake');
        void card.offsetWidth; // restart animation
        card.classList.add('shake');
        input.value = '';
        input.focus();
      }
    });
  }

  initSkipLink();
  initAccessGate();

  // ── Progress tracking ──────────────────────────────────────────────
  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function markCompleted(scenarioId) {
    const p = getProgress();
    p[scenarioId] = true;
    saveProgress(p);
    updateUI();
  }

  function isCompleted(scenarioId) {
    return !!getProgress()[scenarioId];
  }

  function getCompletedCount() {
    return Object.keys(getProgress()).filter(k => getProgress()[k]).length;
  }

  // ── Update dashboard UI ────────────────────────────────────────────
  function updateUI() {
    const count = getCompletedCount();

    // Progress bar
    const bar = document.querySelector('.progress-bar');
    const fill = document.querySelector('.progress-bar__fill');
    const counter = document.querySelector('.progress-count');
    if (bar) bar.setAttribute('aria-valuenow', String(count));
    if (fill) fill.style.width = `${(count / TOTAL_SCENARIOS) * 100}%`;
    if (counter) counter.textContent = `${count} / ${TOTAL_SCENARIOS}`;

    // Scenario cards
    const progress = getProgress();
    document.querySelectorAll('.scenario-card[data-scenario]').forEach(card => {
      const id = card.dataset.scenario;
      if (progress[id]) card.classList.add('completed');
      else card.classList.remove('completed');
    });
  }

  // ── Phase navigation (scenario pages) ────────────────────────────
  window.PhishLab = {
    currentPhase: 1,
    totalPhases: 3,
    scenarioId: null,

    init(scenarioId) {
      this.scenarioId = scenarioId;
      this.currentPhase = 1;
      this.showPhase(1);

      // Auto-mark completed when user reaches phase 3 and clicks finish
    },

    showPhase(n) {
      this.currentPhase = n;

      // Update panels
      document.querySelectorAll('.phase-panel').forEach((el, i) => {
        el.classList.toggle('active', i + 1 === n);
      });

      // Update step indicators
      document.querySelectorAll('.phase-step').forEach((el, i) => {
        el.classList.remove('active', 'completed');
        if (i + 1 < n)      el.classList.add('completed');
        else if (i + 1 === n) el.classList.add('active');
      });

      // Update nav buttons
      const btnPrev = document.getElementById('btn-prev');
      const btnNext = document.getElementById('btn-next');

      if (btnPrev) btnPrev.style.display = n === 1 ? 'none' : 'inline-flex';
      if (btnNext) {
        if (n === this.totalPhases) {
          btnNext.textContent = '✓  Mark Complete';
          btnNext.classList.remove('btn--ghost');
          btnNext.classList.add('btn--primary');
        } else {
          btnNext.innerHTML = 'Next <span>→</span>';
          btnNext.classList.remove('btn--primary');
          btnNext.classList.add('btn--ghost');
        }
      }

      // Scroll to top of content
      const content = document.querySelector('.scenario-content');
      if (content) content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    next() {
      if (this.currentPhase < this.totalPhases) {
        this.showPhase(this.currentPhase + 1);
      } else {
        this.complete();
      }
    },

    prev() {
      if (this.currentPhase > 1) {
        this.showPhase(this.currentPhase - 1);
      }
    },

    complete() {
      markCompleted(this.scenarioId);
      const overlay = document.getElementById('completion-overlay');
      if (overlay) overlay.classList.add('show');
    },

    closeOverlay() {
      const overlay = document.getElementById('completion-overlay');
      if (overlay) overlay.classList.remove('show');
    }
  };

  // ── Credential capture simulation ─────────────────────────────────
  window.simulateCapture = function (formId, resultId) {
    const form = document.getElementById(formId);
    const result = document.getElementById(resultId);
    if (!form || !result) return;

    const emailInput = form.querySelector('input[type="email"], input[name="email"]');
    const passInput  = form.querySelector('input[type="password"]');
    const email = emailInput ? emailInput.value || 'victim@example.com' : 'victim@example.com';
    const pass  = passInput  ? passInput.value  || '••••••••' : '••••••••';

    result.innerHTML = `
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:20px;margin-top:20px;font-family:var(--font-mono);font-size:0.82rem;line-height:2">
        <div style="color:#ef4444;font-weight:700;margin-bottom:10px;font-size:0.95rem;">⚠ CREDENTIALS INTERCEPTED [SIMULATED]</div>
        <div><span style="color:#5a6380">EMAIL   :</span> <span style="color:#fca5a5">${email}</span></div>
        <div><span style="color:#5a6380">PASSWORD:</span> <span style="color:#fca5a5">${pass}</span></div>
        <div><span style="color:#5a6380">IP ADDR :</span> <span style="color:#fca5a5">192.168.x.x [masked]</span></div>
        <div><span style="color:#5a6380">UA      :</span> <span style="color:#fca5a5">${navigator.userAgent.substring(0, 48)}…</span></div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(239,68,68,0.2);color:#6b7280;font-size:0.75rem;">
          ✱ This is a simulation. No real data was transmitted or stored.
        </div>
      </div>`;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // ── Initialise on DOMContentLoaded ───────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    updateUI();

    // Wire global keyboard shortcut: Escape closes overlay
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') PhishLab.closeOverlay();
    });
  });
})();
