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

## Deploy your own relay (optional, recommended)

Browsers cannot call your district's StudentVUE server directly (it sends no CORS headers), so ojjyMelon relays requests. The default public proxies are convenient but rate-limited and third-party. For a private, reliable relay:

1. Go to [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages → Create Worker** (free tier is plenty — the relay only talks to `*.edupoint.com`).
2. Name it anything (e.g. `ojjymelon-proxy`), paste the contents of [`worker/ojjymelon-proxy.js`](worker/ojjymelon-proxy.js), and **Deploy**.
3. Copy your worker URL (`https://ojjymelon-proxy.<your-name>.workers.dev`).
4. In ojjyMelon: sign in → **Settings → Proxy relay** → paste the URL → **Save**.

Nothing is logged by the worker, and you can read its ~80 lines of code before you deploy it.

## How it works (technical)

- **Protocol** — ojjyMelon speaks the same mobile-app API as the official StudentVUE app:
  - JSON API: `POST /api/v1/mobile/PXPWebServices/<Method>` with HTTP Basic login → Bearer token
  - SOAP fallback: `ProcessWebServiceRequestMultiWeb` on `/Service/PXPCommunication.asmx`
  - Both require the `edupointkeyversion` version key, which the app fetches automatically from a public key service (and caches, with manual override in Settings)
- **Connections, in order of preference:**
  1. **Your relay** (Settings → Proxy relay): the Cloudflare Worker from [`worker/`](worker/) (or the Node [`worker/local-relay.js`](worker/local-relay.js) for local use). Full feature set, your infrastructure, nothing logged.
  2. **Zero-setup public relay** (MCPS): a community-hosted [svue-api](https://github.com/Zillorz/svue-api) instance that is CORS-enabled and serves grades, schedule, documents, and student info with your district credentials — this is what makes ojjyMelon work on GitHub Pages with **no deployment steps**. Attendance and document downloads aren't available through it; those need your own relay. Credentials pass through that third-party service (exactly like GradeMelon's proxy did) — use your own worker if that bothers you.
  3. **Public CORS proxies**: best-effort automatic fallback for other districts.
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
