# PhishLab — Phishing Simulation & Awareness Training

PhishLab is a self-contained, client-side web app for phishing awareness training. It walks trainees through 7 realistic attack scenarios, each structured as a 3-phase learning flow: **Bait → Reveal → Defense**. Everything runs entirely in the browser — no backend, no data collection, no real messages or credentials sent anywhere.

> ⚠ **Educational use only.** All scenarios are simulated. Any "captured" credentials, links, or phone numbers shown to the trainee are fabricated and never transmitted or stored outside their own browser.

## Features

- **7 attack scenarios** — Email Spoofing, Credential Harvesting, Spear Phishing, Smishing, Vishing, Pharming & Homograph Attacks, and Whaling/BEC.
- **3-phase structure per scenario**
  1. **The Bait** — a live, interactive simulation of the attack (fake login page, fake SMS thread, fake call screen, etc.).
  2. **The Reveal** — every red flag in the simulation is annotated and explained.
  3. **The Defense** — actionable, real-world mitigation steps.
- **Progress tracking** — completed scenarios are tracked in the browser's `localStorage`; the homepage shows a live progress bar and per-card completion badges.
- **Access-code gate** — an entry screen that keeps the lab from being stumbled into or indexed casually during a training rollout. See [Access Code](#access-code) below.
- **Accessibility**
  - Skip-to-content link on every page.
  - The access-code modal traps focus and marks the rest of the page `inert` while open, so keyboard and screen-reader users can't interact with hidden content.
  - Visible `:focus-visible` outlines on all interactive elements.
  - Live regions (`aria-live`) for the credential-capture result and progress bar so updates are announced to assistive tech.
  - Decorative icons are marked `aria-hidden`.
- **Zero dependencies** — plain HTML/CSS/JS, no build step, no package manager required to run it.

## Getting Started

This is a static site — any web server will do.

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080` in a browser. Opening `index.html` directly via `file://` also works, since nothing depends on server-side routing.

## Access Code

The homepage and every scenario page are gated behind a shared access code so the lab isn't reachable by anyone who happens across the URL. When a visitor enters the correct code once, it's remembered in their browser (`localStorage`) and they won't be asked again.

**This is a soft deterrent, not a security control.** The site is 100% static with no backend, so the code is readable in the page's JavaScript source by anyone who opens dev tools — it will not stop a determined or technical user. Its purpose is to keep the lab from being casually stumbled into (e.g. via a shared link, search engine indexing, or a public repo) during a controlled training rollout, not to protect sensitive data.

**The current code is intentionally not documented in this README.** If you're an administrator setting up a training session:

1. Open [`js/main.js`](js/main.js) and locate the `ACCESS_CODE` constant near the top of the file.
2. Set it to a code of your choosing.
3. Distribute that code to trainees out-of-band (email, chat, in person) — never commit it to a public README or issue tracker.
4. To force everyone to re-enter a new code after rotating it, change the value — old codes stored in a visitor's `localStorage` simply won't match anymore.

If you administer this lab and need help locating or rotating the code, ask whoever set it up, or check `js/main.js` directly — the constant is clearly named and easy to find in source.

## Project Structure

```
.
├── index.html                          # Homepage / scenario dashboard
├── css/
│   └── style.css                       # Shared design system (colors, layout, components)
├── js/
│   └── main.js                         # Access gate, progress tracking, phase navigation
└── scenarios/
    ├── email-spoofing/index.html
    ├── credential-harvesting/index.html
    ├── spear-phishing/index.html
    ├── smishing/index.html
    ├── vishing/index.html
    ├── pharming/index.html
    └── whaling/index.html
```

Each scenario page is self-contained and reuses `css/style.css` and `js/main.js` via relative paths (`../../`).

## How Scenarios Work

Every scenario page uses the same `PhishLab` JS object (`js/main.js`) to manage phase state:

- `PhishLab.init(scenarioId)` — called on page load, starts at phase 1.
- `PhishLab.next()` / `PhishLab.prev()` — advance/rewind phases; reaching phase 3 and clicking "Mark Complete" calls `PhishLab.complete()`.
- `PhishLab.complete()` — records the scenario as done in `localStorage` and shows a completion overlay with a link to the next scenario.

The credential-harvesting scenario additionally uses `simulateCapture()` to render a fake "intercepted credentials" panel from whatever the trainee typed — purely client-side, never sent anywhere.

## Customization

- **Colors, spacing, typography** — all defined as CSS custom properties at the top of `css/style.css`.
- **Add a new scenario** — copy an existing `scenarios/<name>/index.html`, update its content and `data-scenario` id, add a corresponding card to `index.html`, and update `TOTAL_SCENARIOS` in `js/main.js`.
- **Reset a trainee's progress** — clear `localStorage` keys `phishlab_progress` and `phishlab_access_granted` in the browser (via dev tools, or `localStorage.clear()` in the console).

## Disclaimer

This project is built strictly for security awareness education. It does not send, store, or exfiltrate any data a trainee enters. Do not repurpose the templates here (fake login pages, spoofed sender displays, lookalike URLs) for actual phishing campaigns against people who haven't consented to a sanctioned training exercise — that would be unauthorized and, depending on jurisdiction, illegal.
