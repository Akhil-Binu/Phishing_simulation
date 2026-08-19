# PhishLab — Phishing Simulation & Awareness Training

PhishLab is a web app for phishing awareness training. It walks trainees through 7 realistic attack scenarios, each structured as a 3-phase learning flow: **Bait → Reveal → Defense**. All the training content runs entirely in the browser — no captured "credentials" or simulated data ever leave the trainee's machine. A small serverless backend exists solely to gate entry with a shared access code that an admin can manage.

**Live:** https://phishing-simulation-ecru.vercel.app

> ⚠ **Educational use only.** All scenarios are simulated. Any "captured" credentials, links, or phone numbers shown to the trainee are fabricated and never transmitted or stored anywhere.

## Features

- **7 attack scenarios** — Email Spoofing, Credential Harvesting, Spear Phishing, Smishing, Vishing, Pharming & Homograph Attacks, and Whaling/BEC.
- **3-phase structure per scenario**
  1. **The Bait** — a live, interactive simulation of the attack (fake login page, fake SMS thread, fake call screen, etc.).
  2. **The Reveal** — every red flag in the simulation is annotated and explained.
  3. **The Defense** — actionable, real-world mitigation steps.
- **Progress tracking** — completed scenarios are tracked in the browser's `localStorage`; the homepage shows a live progress bar and per-card completion badges.
- **Access-code gate, enforced server-side** — a shared code, checked against a real backend, keeps the lab from being stumbled into during a training rollout. See [Access Code & Admin Panel](#access-code--admin-panel) below.
- **Accessibility**
  - Skip-to-content link on every page.
  - The access-code modal traps focus and marks the rest of the page `inert` while open, so keyboard and screen-reader users can't interact with hidden content.
  - Visible `:focus-visible` outlines on all interactive elements.
  - Live regions (`aria-live`) for the credential-capture result and progress bar so updates are announced to assistive tech.
  - Decorative icons are marked `aria-hidden`.

## Getting Started (frontend only)

The training content itself (scenario pages, CSS, phase navigation) is static and needs no backend to view:

```bash
python -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080`. Note the access-code gate on `index.html` and scenario pages will fail closed without the backend running (see below), since it calls `/api/verify-code`.

## Running the Full Stack Locally

The access gate and admin panel need the serverless API + Redis. With the [Vercel CLI](https://vercel.com/docs/cli) installed and the project linked (`vercel link`):

```bash
npm install
vercel dev
```

This serves the static site and the `/api/*` functions together, using the same environment variables as production (pulled automatically once the project is linked). Note: local `vercel dev` doesn't reuse warm connections between requests the way production does, so each API call pays a fresh Redis connection cost (a few seconds) — this is a local-only quirk, not a production issue.

## Access Code & Admin Panel

The homepage and every scenario page are gated behind a shared access code, verified by `POST /api/verify-code` against a value stored in Redis (falling back to a built-in default if none has been set). Once a visitor enters the correct code, their browser remembers it (`localStorage`) and won't ask again.

An admin can view, change, or reset that code from **`/admin`** — a page not linked from the homepage nav, protected by its own admin password (checked server-side; the password itself is never sent to or stored in the browser beyond the login request). From there you can also copy a **shareable unlock link** (`?code=...`) that auto-unlocks whoever opens it, since the check happens against the real shared backend — this works for any visitor on any device, not just the admin's own browser.

**Still a soft deterrent, not hardened security.** It stops casual/accidental access (a shared link, search indexing, a public repo) during a controlled rollout — it is not designed to withstand a determined attacker, and there's no protection on the training content itself beyond the gate.

### Environment Variables

Set these in the Vercel project (Settings → Environment Variables), never committed to the repo:

| Variable | Purpose |
|---|---|
| `REDIS_URL` | Connection string for the Redis instance storing the current access code. Auto-populated if you provision Redis via the Vercel Marketplace integration and connect it to this project. |
| `ADMIN_PASSWORD_HASH` | SHA-256 hex digest of the admin password — generate with `node -e "console.log(require('crypto').createHash('sha256').update('your-password','utf8').digest('hex'))"` and paste the output (not the password itself) as the env var value. |
| `SESSION_SECRET` | Random secret used to sign the admin session cookie. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. |

If you need to rotate the admin password or the access code, ask whoever administers the deployment, or check the Vercel project's environment variables / the `/admin` panel directly.

## Project Structure

```
.
├── index.html                          # Homepage / scenario dashboard
├── admin/
│   └── index.html                      # Admin panel (password-gated)
├── api/                                 # Vercel serverless functions
│   ├── verify-code.js                  # POST — checks a code against Redis
│   └── admin/
│       ├── login.js                    # POST — admin password check, issues session cookie
│       ├── logout.js                   # POST — clears session cookie
│       └── code.js                     # GET/POST/DELETE — view/set/reset the access code (session-gated)
├── lib/                                 # Shared backend helpers (Redis client, rate limiting, session signing)
├── css/
│   └── style.css                       # Shared design system (colors, layout, components)
├── js/
│   ├── config.js                       # Client-side API wrapper for the access gate
│   ├── main.js                         # Access gate, progress tracking, phase navigation
│   └── admin.js                        # Admin panel logic
└── scenarios/
    ├── email-spoofing/index.html
    ├── credential-harvesting/index.html
    ├── spear-phishing/index.html
    ├── smishing/index.html
    ├── vishing/index.html
    ├── pharming/index.html
    └── whaling/index.html
```

Each scenario page reuses `css/style.css` and `js/main.js`/`js/config.js` via relative paths (`../../`).

## How Scenarios Work

Every scenario page uses the same `PhishLab` JS object (`js/main.js`) to manage phase state:

- `PhishLab.init(scenarioId)` — called on page load, starts at phase 1.
- `PhishLab.next()` / `PhishLab.prev()` — advance/rewind phases; reaching phase 3 and clicking "Mark Complete" calls `PhishLab.complete()`.
- `PhishLab.complete()` — records the scenario as done in `localStorage` and shows a completion overlay with a link to the next scenario.

The credential-harvesting scenario additionally uses `simulateCapture()` to render a fake "intercepted credentials" panel from whatever the trainee typed — purely client-side, never sent anywhere.

## Deployment

This project is deployed on Vercel, connected to this GitHub repo — pushes to `main` auto-deploy. To set up a fresh deployment:

1. `vercel link` to connect a local checkout to a Vercel project.
2. Provision a Redis database via the Vercel Marketplace (Storage → Create Database → Redis) and connect it to the project — this auto-populates `REDIS_URL`.
3. Set `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` as described above.
4. `vercel deploy --prod`, or just push to `main` if Git integration is connected.

## Customization

- **Colors, spacing, typography** — all defined as CSS custom properties at the top of `css/style.css`.
- **Add a new scenario** — copy an existing `scenarios/<name>/index.html`, update its content and `data-scenario` id, add a corresponding card to `index.html`, and update `TOTAL_SCENARIOS` in `js/main.js`.
- **Reset a trainee's progress** — clear the `localStorage` key `phishlab_progress` in their browser (via dev tools, or `localStorage.clear()` in the console). This is separate from the access code, which is reset via `/admin`.

## Disclaimer

This project is built strictly for security awareness education. The training content does not send, store, or exfiltrate any data a trainee enters. Do not repurpose the templates here (fake login pages, spoofed sender displays, lookalike URLs) for actual phishing campaigns against people who haven't consented to a sanctioned training exercise — that would be unauthorized and, depending on jurisdiction, illegal.
