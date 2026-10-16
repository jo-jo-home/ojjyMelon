# Landing transformation spec

## Confirmed interview answers

- Visual identity: “Product as spectacle (Recommended)”. The dimensional gradebook is the visual centerpiece.
- Structure: “Continuous transformation”. The same object persists through the journey.
- Removals: “do what u want for this”. Creative removal decisions delegated.
- Contrast: “Use the contrast shift”. Electric-blue opening, pale product surfaces, dark close.
- Peak: “Scroll, then editable”. Separate assignment/category layers assemble as a sample test changes 16/20 to 19/20 and the course crosses B to A; visitors then edit the sample themselves.
- User explicitly requested GLM-5.3, scroll-driven behavior, and a substantial redesign, not another decorative polish pass.

## Direction contract

THESIS: The gradebook is the spectacle. Refuse the logo-left/copy-right template, decorative floating chips, landscape, aurora, and six disconnected pinned sections.

OWN-WORLD: Saturated cobalt canvas, oversized confident white typography, crisp icy-white product surfaces, ink-blue data, structural fine rules, offset soft shadows. Logo only in branding. No glow, glass pills, emoji icons, or filler feature-card grid.

STORY: Immediately understand this is a StudentVUE grade client. Inspect the dimensional gradebook. Follow its grading layers into a real B-to-A recomputation. Try the sample score. Open the app through “Get started”.

FIRST VIEWPORT: An oversized typographic composition interlocks with a substantial angled gradebook occupying the lower and right visual field. Product content is readable, labeled sample, and never overlaps live copy or controls. CTA visible immediately. Strong composition at 1440x900, 2000px wide, and portrait 390x844.

FORM: User-pinned continuous working-surface transformation (concept-seed 6f1ec03e recorded; the user-pinned approved product transformation overrides the aesthetic assignment). Code-led because the subject is live HTML product UI, not generated scenery. Native vertical scroll, no snapping or wheel interception. One coordinated sticky scene with purposeful perspective, layer separation, typography handoff, and assembly. A separate accessible editable continuation and anchored close resolve the story.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Scope and constraints

Replace `js/views/home.js` and the landing-specific styles. Preserve `renderHome(view)` / `destroyHomeFX()` and isolate effects to home. Old uncommitted home scene changes are previous agent work in this same task, intentionally superseded, not unrelated work. Do not alter auth, relay, school data, or app behavior. Preserve all required credits from PRODUCT.md. Do not push or deploy until verification and user approval of this materially new direction.

## Motion contract

Rare marketing interaction. Purposes: explanation and spatial consistency. Scroll owns a single reversible timeline; native keyboard, touch, trackpad, and scrollbar remain functional. Use direct transform and opacity writes with one writer per element. Frame-rate-independent bounded smoothing of visual progress if needed, not scroll hijacking. Do not animate width or layout per frame. No independent bobbing, endless keyframes, or badge-flash timeline.

Maintain coherent fast-forward/reverse and direct jumps. Reset lifecycle cleanly on route changes; cancel rAF, listeners, observers, and pending callbacks. Reduced motion gives a fully readable static composition and editable demonstration without long sticky scroll. Respond to preference changes during a session.

Button press 0.96/150ms ease-out, excluding disabled. Hover motion only for hover-capable fine pointers. Use existing animation tokens where present; strong ease-out `cubic-bezier(0.23,1,0.32,1)`. Inputs and repeated editing get instant feedback. All controls have labels and focus-visible indication.

## Journey and feeling curve

1. Recognition / intrigue: electric blue, large purposeful typography, dimensional live gradebook, immediate action.
2. Understanding / clarity: typography clears as the same gradebook opens into assignment and category planes.
3. Agency / peak: planes lock together and the real grading code recomputes B to A under scroll. Largest meaningful visual change and longest transformation interval.
4. Confidence / participation: the assembled simulator becomes a real labeled score input/range with reset. 16/20 gives 88.4% B, 19/20 gives 91.1% A.
5. Resolution / ownership: concise app capabilities and personal credits, dark anchored close, Get started.

The tell-someone sentence: “It's the site where the gradebook pulls apart to show the math, then lets you change it.”

## Acceptance and evidence

- Visually inspect first viewport and intermediate transformation frames in one desktop/mobile batch, then at most one correction/confirmation batch.
- Test 1440x900, wide desktop, 390x844, narrow mobile, short viewport, and reduced motion.
- No horizontal document overflow, headline/product/control collisions, blank sticky intervals, or hidden primary CTA.
- Verify deterministic B-to-A and reverse; input score 0,16,19,20, decimal and invalid values; reset; keyboard control; fast wheel bursts/reverse; native PageDown/Home/End.
- Verify home → login → home, rapid route reentry, resize, preference change, no duplicate loops or stale styling.
- No real login attempts. Fresh isolated browser context; block relay/MCPS requests if necessary.
- Retain local screenshot evidence. Run syntax checks, mechanical design detector, and fresh finish review. Report limitations honestly, especially physical-phone feel.
- Research supplied references, separating observed implementation from inferred techniques. No claim of being award-winning.

## Verification appendix · local finishing handoff · 2026-10-16

- **Implementation-session results:** parent reports 160/160 actual functional checks passed, JavaScript syntax checks clean, and `git diff --check` clean. These are reported execution results from the parent session, not tests rerun by the documentation pass.
- **Implemented fallback:** `(max-height: 680px), (max-width: 759px) and (max-height: 819px)`, plus `(prefers-reduced-motion: reduce)`, yields the normal-flow, immediately editable story. Narrow boards show two courses. Validation reserves layout space through visibility rather than display.
- **Visual evidence:** `.impeccable/review/desktop.png`, `user-2000.png`, `mobile.png`, `compact.png`, `reduced.png`, and the desktop/mobile exploded, grade, and editable captures in that directory. JPEG transcodes `desktop-exploded.jpg`, `desktop-grade.jpg`, `mobile-exploded.jpg`, and `mobile-editable.jpg` represent the existing PNG captures, not a new UI revision or a fresh browser state. Preserve both original captures and their actual encoding; do not relabel bytes by changing extensions.
- **Viewer discrepancy:** some PNG presentation hid the header in the viewer, although raw RGBA/header evidence showed opaque cobalt. Supporting files are `.impeccable/review/header-evidence.json` and `header-proof.png`. The independent fresh visual reviewer first requested a navigation-evidence fix, then returned ship for that single listed fix after the exact same PNG was transcoded to JPEG. The rest of the reviewed matrix matched the approved direction. This does not certify awards or overall product quality.
- **Design extraction:** root `DESIGN.md` records actual home tokens and explicitly separates the unchanged application theme; `.impeccable/design.json` schema version 2 extends it with depth, motion, breakpoints, and renderable component samples. No UI/source change belongs to this documentation-only handoff.
- **Limits:** no physical-phone verification; external reference motion was researched as text, not visually observed; no real-account login or application-security review claim. The live published site remains unchanged. No commit, push, or deployment was performed by this handoff.

## Publication approval and checks

The user approved the preview, requested a GitHub push, then explicitly selected “Publish to main”. Publication may now update the main-branch GitHub Pages site.

The publishing pass adds a stylesheet compatibility guard for older cached HTML shells and advances the service-worker cache to `ojjymelon-v4`, including the new landing assets. `node scrollcraft/fastcheck.mjs` passed **163/163** checks, including the older-shell regression and stylesheet deduplication; JavaScript syntax and `git diff --check` passed. This extends the earlier implementation-session result without changing its historical review scope.
