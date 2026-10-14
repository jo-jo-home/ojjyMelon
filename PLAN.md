# ojjyMelon — Complete Build Plan & Implementation Guide

**ojjyMelon** is a direct clone of [GradeMelon](https://www.grademelon.org/) (by Tinu Vanapamula) — a third-party StudentVUE client for MCPS students — with only two differences: the name and the color theme (ojjyMelon is **blue-themed**). It is a fully static PWA that deploys to **GitHub Pages (`.github.io`)** and works with real MCPS credentials.

This document is the single source of truth for the build. Everything below has been **verified live** against the MCPS StudentVUE server using a real student account (Oct 13–14, 2026).

---

## Part 1 — Research Findings (all verified)

### 1.1 What GradeMelon is

- Created Oct 2022 by Tinu Vanapamula (WCHS student); Next.js PWA with TailwindCSS, Flowbite, Framer Motion, Chart.js. Reached 1.2M+ unique visitors, 12.8k daily peak. MCPS blocked it on Chromebooks in early 2026; the original author graduated and the app broke after Synergy's 2024 API change. A fork (`genesis55/GradeMelon`, Feb 2025 "deploy NOW") is what runs on grademelon.org today, using the `studentvue.js` library (Jshap06) through a hosted proxy at `studentvuelib.up.railway.app`.
- **IMPORTANT: as of Oct 2026, even that fork's proxy path fails for MCPS** (verified: it returns the PXP2 login-page HTML — MCPS's web login is Google-SSO-only now, and Synergy was upgraded server-side on 2026-05-11, with another upgrade Oct 15, 2026 that permanently kills the legacy apps). ojjyMelon must NOT depend on that proxy.

### 1.2 Complete GradeMelon feature inventory (to clone 1:1)

From both repos + the live site + news coverage:

| # | Feature | Details |
|---|---------|---------|
| 1 | **Login** | Username + password, "Remember me" checkbox (stores credentials client-side), district selector modal (zip-code search + full 672-district list), "having trouble?" link to district portal, loading spinner, guest mode |
| 2 | **Guest mode** | Explore the full app with sample student data, no account needed ("Login As Guest") |
| 3 | **Grades overview** | Marking-period dropdown (with live date labels like "ends in 12 days"), refresh button, GPA-calculator button, card view / table view toggle (choice persisted), course cards: period, name, teacher, colored letter grade + %, "View" button, animated card→detail transitions |
| 4 | **GPA Calculator modal** | GPA (unweighted) & WGPA (weighted) with per-course "Weighted?" toggle switches; recalculates live |
| 5 | **Course detail page** | Course name, teacher, big grade; total progress bar; per-category progress bars with points earned/possible; assignment table: date, name (click → details modal), **editable score fields (earned/possible)**, **editable category dropdown**; add-assignment button; delete assignment; refresh; period selector |
| 6 | **Assignment details modal** | Grade (letter + %), points, date due, category, delete button |
| 7 | **Grade Optimizer** | Modal: desired grade (1–100) + "points left" per category → table of solutions (points needed per category to hit target), "No Solutions Found!" state |
| 8 | **Attendance** | Stacked bar chart (Chart.js) per period, colored by type (Absent #FF7F7F, Excused #FFEC1F, Illness #ADD8E6, Activities/Supervision #50C878, Tardy #FA8A20); date × period grid table of absences |
| 9 | **Schedule** | Term selector dropdown; table: period, course, room, teacher (mailto link) |
| 10 | **Documents** | List (name, type, date) → fetch base64 PDF → open in new tab / download |
| 11 | **Student info** | Top-bar dropdown with student name, school, etc. (from StudentInfo); logout |
| 12 | **Navigation** | Desktop: fixed left sidebar (Grades card/table, Schedule, Attendance, Documents, FAQ) + top bar (logo, dark-mode toggle, privacy/FAQ icons, avatar dropdown, logout); Mobile: fixed bottom nav bar |
| 13 | **Dark mode** | Toggle in top bar, persisted, all pages |
| 14 | **Toasts** | Error/success toasts (auto-dismiss 5s, click X to close) |
| 15 | **PWA** | manifest.json (standalone, icons 192/256/384/512 + maskable), service worker, install-promo banner ("install the app"), "open in real browser" banner if in-app browser |
| 16 | **Home page** | Hero, features grid (Edit grades, Grade Optimizer, Schedule, Attendance, Documents, Dark Mode), open-source section, FAQ link, contact, footer |
| 17 | **FAQ page, Privacy page** | Static content |
| 18 | **Grading logic** | MCPS scale A≥89.5 / B≥79.5 / C≥69.5 / D≥59.5 / E else, N/A when no score; per-course gradingScale override (letter ranges + rounding) when provided; category renormalization when a category is empty; weighted-course detection (AP/Hon/IB/Mag in title); GPA 4.0 + WGPA (+1 for weighted), DP (double-period) ×2 |
| 19 | **Grades editing math** | Editing an assignment recomputes: assignment % → category points → course grade (renormalized) → GPA/WGPA; add/delete assignments updates categories live |
| 20 | **Periods from API** | ReportingPeriods list w/ dates; "MP1 Interim", "MP1", … MP4; period selector refetches or re-derives gradebook |

### 1.3 MCPS grading & policy (2025–26 & 2026–27 regs — researched)

- **Scale (confirmed live by the district's own gradingScale payload):** A = 89.5–100, B = 79.5–89.49, C = 69.5–79.49, D = 59.5–69.49, E = 0–59.49. Rounding: percent → 2 places.
- **GPA (IKC-RA):** A=4, B=3, C=2, D=1, E=0. WGPA adds **+1.0 to A, B, and C only** in Honors/Advanced-Level/AP/IB (D and E get no bump — MCPS policy table). GPA = Σ points ÷ credits, rounded to 2 decimals (up if 3rd decimal > 4).
- **New for 2025-26 onward (IKA-RA):** final course grade = average of marking-period percentages (semester: (MP1+MP2)÷2; full-year: ÷4). EOC (Biology, NSL Gov't) = 20% of semester B; districtwide summative assessments = 10% of MP2/MP4 in listed subjects (Eng 6-12, Alg 1/2, Pre-Calc).
- **2026-27 changes:** no single assignment >20% of an MP grade; ≥2 reassessment opportunities per MP — eligible assignments flagged **"R"** in StudentVUE (confirmed live: assignment names carry "(R)"); deadlines ≤10 school days after due date; no new graded work in final 5 days of MP.
- **Marking periods (live SY 2026-27):** MP1 Interim (8/25–10/2), **MP1 (8/25–10/30)** ← current, MP2 Interim (10/5–12/10), MP2 (11/4–1/22/27), MP3 Interim (12/11/26–2/26/27), MP3 (1/26–4/16/27), MP4 Interim, MP4 (through June).
- **MPA** (marking-period average, athletics eligibility) = simple average of letter grades for the MP, not cumulative. MCPS does not rank. Middle-school GPA is not official (client-side estimate only).
- **MCPS gradebook reality (live):** categories e.g. "All Tasks / Assessments" 90% / "Practice / Preparation" 10% (+ TOTAL row); assignments carry Canvas import links, DisplayScore "15 out of 15", ScoreType "Raw Score", "Not Due" items with "5 Points Possible".

### 1.4 StudentVUE API — the ONLY working protocol for MCPS (verified live)

The server (`md-mcps-psv.edupoint.com`) is Synergy 2026-MD.r-MCPS1. Two API generations exist:

- ❌ **Legacy SOAP** (`ProcessWebServiceRequest`) — student-data methods dead server-side.
- ❌ **PXP2 web scraping** — MCPS web login is **Google SSO only** (verified: login page has no credential form; SAML config `ShowLoginButtonForStudentVUE=false`, Google SSO only). Not cloneable.
- ✅ **New JSON mobile API** (`StudentVUE (New)` app, com.edupoint.studentvue v2.0.16): `POST /api/v1/mobile/PXPWebServices/<Method>` — Basic auth at login → Bearer token.
- ✅ **SOAP MultiWeb wrapper** (`ProcessWebServiceRequestMultiWeb` on `/Service/PXPCommunication.asmx`) with credentials in each envelope — still works for student data too (stateless, no session needed!).
- ✅ **Public svue-api relay** (`axum-svue.fly.dev`, CORS-enabled, MCPS-only, HTTP Basic on GET endpoints `/grades?report_period=N`, `/student`, `/schedule?term_index=N`, `/documents`, `/akey`) — the zero-setup fallback that makes ojjyMelon work on GitHub Pages with no relay deployed. (Its `/attendance`, `/document`, `/photo` endpoints are broken for MCPS — those features need the proxied path.)

**The gate (verified):** every authenticated call must present the **`edupointkeyversion`** value (a 32-byte base64 constant served by a public endpoint). Without it the server returns `UPD5304-00: "We have upgraded our server for better performance. You must update app to the new version to continue."`. With it, everything works.

**Key endpoint (verified, CORS-enabled):** `https://axum-svue.fly.dev/akey` → returns the current value (e.g. `Fws7lq+y7btySqYP52MXIZEjQbNo1EUhdAdwCvic8Ptlsf65icaE//ZYiHvvw8hh`). It echoes `access-control-allow-origin: <origin>` so a browser on github.io can fetch it directly. Fallback: it can also be fetched via `api.allorigins.win/raw?url=…` (verified).

**JSON API methods (all verified live with the real account):**

| Method | Request inner fields | Returns (`data.*`) |
|---|---|---|
| `AttemptLogin` | Basic auth header; body `{"arguments":{"request":"{\"userID\":null,\"password\":null,\"userType\":\"Student\"}"}}` | bare `{access_token, refresh_token}` (88-char opaque) |
| `RefreshToken` | empty body + Bearer refresh | fresh token pair (on 401) |
| `Gradebook` | `{reportPeriod:"<index or empty>", concurrentSchOrgYearGU:"", childIntID:0, languageCode:"en"}` | `traditionalGradebook` (reportingPeriods, courses→marks→gradeCalculationSummary+assignments) |
| `StudentClassList` | `{childIntID:0, loadAllTerms:true, conSchOrgYearGU:"", conSchTermIndex:"-1", termIndex:"-1"}` | `studentClassScheduleForAllTerms`, `studentClassSchedule` |
| `GetStudentAttendanceList` | `{childIntID:0}` | `dailyAttendance`, `periodAttendance` |
| `GetStudentDocuments` | `{childIntID:0, languageCode:"en"}` | `studentDocuments` (doc list) |
| `GetStudentDocumentContent` | `{childIntID:0, documentGU:"…"}` | `studentAttachedDocumentData` (base64 PDF inline) |
| `GetStudentInfoData` | `{childIntID:0}` | `studentInfoXML`, `studentInfoDetailXML` |

Headers on every JSON call: `Content-Type: application/json`, `User-Agent: ksoap`, `AppNameOSAndVersion: StudentVUE|Android|2.0.16`, `edupointkeyversion: <key>`, `Authorization: Basic/Bearer …`. Errors come back **HTTP 200** with `{"error":{"code","message"}}` — always check `error`. `code "2100"` = feature not enabled (treat as empty). 401 → `RefreshToken`.

**SOAP fallback (verified live):** `POST /Service/PXPCommunication.asmx`, `Content-Type: text/xml`, `Cookie: AppSupportsSession=1; edupointkey=1; edupointkeyversion=<key>`; envelope `ProcessWebServiceRequestMultiWeb` with `userID/password/skipLoginLog/parent=0/webDBName/webServiceHandleName=PXPWebServices/methodName/paramStr`; **paramStr must be HTML-escaped** (`<Parms>…`) or you get HTTP 400. Inner result is double-escaped XML. Methods: `Gradebook` (param `ReportPeriod`), `Attendance`, `StudentClassList` (param `TermIndex`), `GetStudentDocumentInitialData`, `GetContentOfAttachedDoc` (param `DocumentGU`), `StudentInfo`.

### 1.5 CORS constraint (verified) & the proxy design

- `md-mcps-psv.edupoint.com` sends **no CORS headers** and rejects `OPTIONS` preflight → a browser on github.io **cannot** call it directly. GradeMelon solved this with a backend proxy; ojjyMelon (static GH Pages) uses a **proxy chain**:
  1. **Direct** (for districts that do send CORS headers; MCPS does not)
  2. **User-configured proxy URL** (settings panel; for a self-hosted worker)
  3. **Cloudflare Worker** we ship in-repo (`worker/`) — free tier, forwards method/headers/body, returns proper CORS. This is the recommended/documented path (one-click deploy instructions in README).
  4. **Public proxies** (corsproxy.io etc.) — best-effort automatic fallback; verified unreliable from curl but may work in real browsers. Each candidate is health-checked; failures fall through.
- The **akey fetch needs no proxy** (CORS-enabled itself) but also gets a proxy fallback.

### 1.6 Environment facts

- GitHub CLI authenticated as **jo-jo-home** (repo + workflow scopes) → we can create the repo, push, and enable Pages. Site will live at `https://jo-jo-home.github.io/ojjyMelon/`.
- Node v24 available locally for any build-free tooling checks (none required — the app is buildless).
- Test account: the user's real MCPS student account (7th grade, North Bethesda Middle) — verified working end-to-end. Credentials are never committed to the repo.

---

## Part 2 — Architecture

### 2.1 Tech stack (buildless static PWA)

- **Vanilla JS (ES modules) + hand-written CSS** — zero build step, zero dependencies, deployable by committing to the repo. GH Pages serves it as-is.
- **Single-page app** with hash routing (`#/`, `#/login`, `#/grades`, `#/grades/<i>`, `#/schedule`, `#/attendance`, `#/documents`, `#/faq`, `#/privacy`). Hash routing = works on GH Pages without 404 rewrites.
- **Chart.js via CDN** (jsdelivr) for the attendance bar chart, with graceful no-canvas fallback table.
- **Manrope** font via Google Fonts (with system-font fallback).
- **PWA**: `manifest.json`, service worker (cache-first for static assets, network-only for API), maskable icons (blue-themed, generated as SVG→PNG).
- **Theme**: GradeMelon's layout/flow cloned exactly; **primary = blue** (`#3b82f6` family replacing rose `#f43f5e`), accent/gradient backgrounds in blues. Dark mode via `[data-theme=dark]` CSS variables.

### 2.2 File structure

```
ojjyMelon/
├── index.html                 # SPA shell (all views, top bar, sidebar, mobile bar, toasts)
├── manifest.json              # PWA manifest (ojjyMelon, blue theme, standalone)
├── sw.js                      # service worker
├── favicon.svg / apple-touch-icon.png
├── assets/
│   ├── icons/                 # 192/256/384/512 + maskable, blue ojjyMelon icon
│   └── img/                   # hero SVGs, logo, mockup art (blue)
├── css/
│   └── style.css              # full design system (light/dark, blue theme)
├── js/
│   ├── main.js                # bootstrap, router, state, toasts, dark mode, PWA promos
│   ├── api.js                 # StudentVUEClient: key fetch+cache, proxy chain, JSON API, SOAP fallback, RefreshToken
│   ├── districts.js           # full 672-district list + zip search (from GradeMelon lib)
│   ├── grades.js              # grade math: letter scale, categories, editing, optimizer, GPA/WGPA (GradeMelon parity)
│   ├── views/                 # per-page renderers:
│   │   ├── home.js  login.js  grades.js  course.js
│   │   ├── schedule.js  attendance.js  documents.js
│   │   └── faq.js  privacy.js  guestdata.js
│   └── ui.js                  # components: modal, dropdown, spinner, progress bar, table builders
├── worker/
│   └── ojjymelon-proxy.js     # Cloudflare Worker (copy-paste deploy) + README
├── 404.html                   # redirects to index.html (GH Pages)
├── README.md                  # deploy instructions (GH Pages + optional worker), privacy notes
└── docs/PLAN.md               # this file
```

### 2.3 Data & auth flow (as-built)

1. **Login**: fetch key (cached 12h + last-known fallback) → automatic mode selection:
   - Relay configured (or non-MCPS district) → **JSON mode**: `AttemptLogin` (Basic, via proxy chain) → Bearer token. On proxy failure for MCPS → fall back to svue mode.
   - MCPS without a relay → **svue mode** (zero-setup): validate via the public relay, then use its parsed endpoints. Attendance & document downloads attempt the proxied JSON path opportunistically (once per session) and degrade to clear notices if no relay is available.
   - JSON API disabled (error 2100/400) → **SOAP mode** (MultiWeb wrapper + key cookie, injected by the relay from `x-ojjy-key`).
   - "Remember me" stores credentials base64-obfuscated in `localStorage` (convenience only, clearly disclosed; logout wipes).
2. **Grades view**: gradebook for the selected `reportPeriod` (svue: `?report_period=N`). All modes normalize to the same internal model, so `parseGrades` + views are identical everywhere.
3. **Course view**: per-course; edits recalc categories/course/GPA locally (never written back — like GradeMelon).
4. **Attendance/Schedule/Documents/Info**: one call each; cached in memory per session (mirrors GradeMelon's `client.loaded*`).
5. **401 anywhere** → `RefreshToken` once, retry, else force re-login. Boot auto-login is gated so hash navigation mid-sign-in can't bounce to the login page.
6. **Logout** clears memory + storage; guest mode swaps in sample data through the same client interface.

### 2.4 Grade math spec (exact GradeMelon behavior, MCPS-correct weighting)

- `letterGrade(pct, scale?)` → default scale `[[A,89.5..100],[B,79.5..89.49],[C,69.5..79.49],[D,59.5..69.49],[E,0..59.49]]`, rounding to 2 places; optional per-course scale ranges (future-proof, from API if present).
- Colors: A green, B blue, C yellow, D orange, E red, N/A gray (unchanged — the *brand* color changes to blue, grade colors stay).
- Category % = Σ earned/Σ possible of scored assignments in category; course % = Σ (cat% × weight) ÷ Σ weights of non-empty categories (renormalization) — identical to GradeMelon.
- GPA: mean of quality points across courses; WGPA: +1 for A/B/C only (MCPS IKC-RA — fixes GradeMelon's D/E bug, per the user's "research MCPS grading" requirement); DP courses ×2 (fork parity); per-course weighted toggle in the GPA modal.
- Optimizer: same recursive search over points-remaining per category for a target grade, capped and deduped, showing "points needed / points left" per category + resulting %.

---

## Part 3 — Implementation Phases

### Phase 1 — Scaffold & design system
1. `index.html` shell: top bar, sidebar, mobile bar, toast host, modal host, view container.
2. `css/style.css`: full GradeMelon-parity design system (Flowbite-like components, cards, tables, modals, toggles, spinners, progress bars) in blue; light + dark via CSS variables; Manrope.
3. Router + state store + dark-mode persistence + hash navigation.

### Phase 2 — API layer (all verified protocols)
4. `api.js`: key fetch+cache; proxy chain w/ health checks + user-config override; JSON client (login/refresh/gradebook/schedule/attendance/documents/info) + SOAP MultiWeb fallback; rich error mapping (invalid credentials, locked, network, proxy dead, `2100` etc.).
5. `districts.js`: 672-district dataset + zip search (port from GradeMelon).

### Phase 3 — Grade engine
6. `grades.js`: parser (JSON → internal `Grades` model identical to GradeMelon's), letter/colors, category math, editing (update/add/delete/re-categorize), GPA/WGPA, optimizer, period labels ("ends in N days").

### Phase 4 — Views (feature parity checklist)
7. Home (hero, features, open-source, FAQ, contact, footer) — blue artwork.
8. Login (district modal w/ zip search, remember-me, trouble link, guest button).
9. Grades overview (period dropdown, refresh, view toggle persisted, cards/table, GPA modal, animated transitions via FLIP-style transforms).
10. Course detail (progress bars, editable assignment table, details modal, add/delete, optimizer).
11. Attendance (Chart.js stacked bars + grid table).
12. Schedule (term selector + mailto table).
13. Documents (list → blob → new tab/download).
14. FAQ, Privacy, 404.
15. Student info dropdown, toasts, logout, PWA install/browser banners.

### Phase 5 — PWA & polish
16. manifest + icons (blue) + sw.js + install flow.
17. Guest mode sample data (realistic MCPS 7-course middle-school data).
18. Accessibility & mobile pass (labels, focus, reduced-motion, bottom nav).
19. Error states everywhere (offline, proxy dead, expired, empty).

### Phase 6 — Deploy
20. `git init`, commit, create repo `ojjyMelon` under jo-jo-home via `gh`, push, enable Pages (main / root), verify `https://jo-jo-home.github.io/ojjyMelon/`.
21. Ship `worker/` + README deploy guide.

### Phase 7 — Test (real credentials, per user requirement)
22. Live login with the real student account → verify real grades (7 courses, MP1), attendance, schedule, documents render.
23. Verify every feature against the checklist (§1.2) — editing math, optimizer, GPA modal, dark mode, PWA, guest mode, mobile.
24. In-browser proxy-chain verification; adjust order based on results; document findings.

### Phase 8 — Continuous refinement (do not stop until told)
25. Fix all bugs found in testing; add robustness (token refresh races, proxy failover caching, retry logic).
26. Track the Oct 15, 2026 Synergy upgrade — re-run the live API test after it lands (endpoint formats may shift; both JSON+SOAP paths give redundancy).
27. Keep polishing UI parity with GradeMelon screenshots.

---

## Part 4 — Risks & mitigations

| Risk | Mitigation |
|---|---|
| akey endpoint dies / key rotates | Client caches last-known key; settings allow manual key paste; worker can relay akey; both JSON & SOAP paths tried |
| Public proxies rate-limit | Worker is the documented primary; chain health-checks; user-configurable proxy |
| Edupoint blocks the key/app version gate again (e.g. after Oct 15 upgrade) | Dual protocol paths; version strings configurable; graceful error surfacing; re-verify after upgrade |
| Credential storage | Off by default ("Remember me" opt-in, clearly disclosed in privacy page; XOR+base64 obfuscation; logout wipes) |
| MCPS blocks github.io on Chromebooks (like GradeMelon) | Out of our control; site works on personal devices; document mirror options |

---

## Part 5 — Definition of Done

- Every feature in §1.2 present and working, clone-grade UI parity with GradeMelon (blue theme).
- Deployed live at the `.github.io` URL, login works with the real MCPS account, all pages verified with real data.
- Guest mode, PWA install, dark mode, mobile responsive all functional.
- README empowers the user to redeploy and to stand up the proxy worker.
