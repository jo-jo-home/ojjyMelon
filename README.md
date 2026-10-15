# 🫐 ojjyMelon

**Stay in control of your grades.** ojjyMelon is a free, open, third-party app for viewing and calculating your grades from Synergy **StudentVUE** — built for MCPS students, works for any Edupoint district. It is a blue-themed tribute to the late, great [GradeMelon](https://www.grademelon.org/), rebuilt from scratch for the new 2026 Synergy servers.

> ⚠️ This is a third-party, unofficial tool. Not affiliated with Edupoint, Synergy, or Montgomery County Public Schools. StudentVUE is a registered trademark of Edupoint Educational Systems.

## Features

- **Sign in with your StudentVUE account** (student ID + password — same as the official app)
- **Gradebook**: marking-period switcher, card & table views, color-coded letter grades
- **Live grade editor**: change any assignment score and watch your category + overall grade recalculate instantly — changes are local-only what-ifs
- **Grade Optimizer**: "what do I need on the rest of the quarter to get an A?"
- **GPA calculator**: unweighted + weighted GPA (MCPS policy: +1.0 for A/B/C in Honors/AP/IB), with per-course weighted toggles
- **Schedule** (all terms), **Attendance** (bar chart + day grid), **Documents** (report cards & test results as PDFs)
- **Guest mode** with realistic sample data
- **Dark mode**, **PWA install**, mobile-first responsive design, zero trackers

## Deploy to GitHub Pages (the main deployment)

The app is 100% static — no build step, no dependencies.

1. **Fork or push this repo** to your GitHub account.
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch** → Branch: `main`, folder: `/ (root)`.
3. Wait ~1 minute. Your site is live at `https://<your-username>.github.io/ojjyMelon/`.

That's it — login works immediately using the built-in public proxy chain.

## Deploy your own relay (optional)

ojjyMelon already ships with a **built-in hosted relay** ([ojjymelon-relay.jonasamlee.workers.dev](https://ojjymelon-relay.jonasamlee.workers.dev)) that gives everyone the full feature set with zero setup — you don't need to deploy anything. But the relays are what your school network can block, so if you want your own infrastructure (or the built-in one ever goes down), both of these use the same ~80-line protocol:

### Option A — Cloudflare Worker (the built-in relay's platform, free forever)

```bash
cd worker
npx wrangler login     # opens your browser → sign in → Allow
npx wrangler deploy    # deploys to https://<name>.<your-subdomain>.workers.dev
# paste your Worker URL into ojjyMelon Settings → Proxy relay
```

Cloudflare Workers free tier = 100,000 requests/day, no card required, never expires.

### Option B — Fly.io (pay-as-you-go, needs a card)

```bash
cd worker
fly apps create <your-app-name>       # or edit app = "..." in fly.toml
fly deploy
# paste https://<your-app-name>.fly.dev into ojjyMelon Settings → Proxy relay
```

The `fly.toml` is pre-tuned: single shared-cpu machine in `iad`, **auto-stop when idle** (wakes in ~1–3 s).

Both relays only talk to `*.edupoint.com` servers, forward and immediately forget every request, and log nothing. You can also run the same relay locally with `node worker/local-relay.js`.

## How it works (technical)

- **Protocol** — ojjyMelon speaks the same mobile-app API as the official StudentVUE app:
  - JSON API: `POST /api/v1/mobile/PXPWebServices/<Method>` with HTTP Basic login → Bearer token
  - SOAP fallback: `ProcessWebServiceRequestMultiWeb` on `/Service/PXPCommunication.asmx`
  - Both require the `edupointkeyversion` version key, which the app fetches automatically from a public key service (and caches, with manual override in Settings)
- **Connections, in order of preference:**
  1. **Your relay** (Settings → Proxy relay): your own Fly.io app or Cloudflare Worker from [`worker/`](worker/). Full feature set, your infrastructure, nothing logged.
  2. **Built-in hosted relay** (`ojjymelon-relay.jonasamlee.workers.dev`): full feature set for everyone, zero setup — this is the default path.
  3. **Zero-setup public relay** (MCPS fallback): a community-hosted [svue-api](https://github.com/Zillorz/svue-api) instance serving grades, schedule, documents, and student info — used automatically if the hosted relay is unreachable.
  4. **Public CORS proxies**: best-effort automatic fallback.
- **MCPS grading** — A ≥ 89.5, B ≥ 79.5, C ≥ 69.5, D ≥ 59.5, E below (verified against the district's own grading scale). Grades are recalculated from assignment scores with empty categories skipped, exactly like GradeMelon did. Weighted GPA adds +1.0 for A/B/C in Honors/AP/IB per MCPS policy.
- **Privacy** — no servers of our own, no databases, no analytics. Credentials live only in your browser (and only if you check *Remember me*). See the in-app Privacy page.

## Development

```bash
# serve locally (any static server works)
python3 -m http.server 8000
# open http://localhost:8000
```

Everything is vanilla JS (ES modules) + hand-written CSS. `js/api.js` is the data layer, `js/grades.js` is the grade engine, `js/views/` are the pages. `docs/PLAN.md` documents the full build.

## Credits

- **GradeMelon** by Tinu Vanapamula — the original. ojjyMelon clones its features with gratitude.
- The StudentVue reverse-engineering community (`StudentVue/docs`, `svue-api`) for protocol documentation.
- Synergy grading data belongs to your school district; ojjyMelon just displays it.

## License

MIT — see [LICENSE](LICENSE).
