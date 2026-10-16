# BRIEF · ojjyMelon landing — gradebook transformation

Supersedes `scrollcraft/BRIEF.md` (the 2026-10-16 engine build the user rejected
as a plain navy page with floating chips). That build's page structure is fully
replaced; its engine assets under `assets/engine/` remain on disk, unused and
untouched.

## Interview facts (user answers, verbatim intent)

- Visual identity: **"Product as spectacle (Recommended)"** — the dimensional
  gradebook is the visual centerpiece.
- Structure: **"Continuous transformation"** — the same object persists through
  the whole journey.
- Contrast: **"Use the contrast shift"** — electric-blue opening, pale product
  surfaces, dark close.
- Peak: **"Scroll, then editable"** — separate assignment/category layers
  assemble as a sample test changes 16/20 → 19/20 and the course crosses B → A;
  visitors then edit the sample themselves.
- Removals: **"do what u want for this"** — creative removal decisions delegated.
- The user asked for GLM-5.3, scroll-driven behavior, and a substantial
  redesign, **not** another decorative polish pass. A prior plain navy page was
  strongly rejected.
- Direction contract and motion contract: `.plans/landing-transformation-spec.md`
  (binding).

## Authored decisions (mine, under that delegation)

- **No engine.** Native vertical scroll drives one custom reversible timeline:
  a single sticky stage, direct `transform`/`opacity` writes, one writer per
  element, frame-independent exponential damping on progress only. No wheel
  interception, no snap points, no keyframed bobbing, no width animation.
- **The gradebook is one physical object**, not a screenshot and not a prop: the
  base board (course list) carries two real sheets — weighted categories and
  the assignment card — that detach along z to explain weighted grading, then
  reassemble. All three run the app's actual `calculateCategory` /
  `calculateGrade` chain.
- **Removals executed:** floating glass chips, enlarged melon logo, hills/wave
  footer, aurora blobs, A+ outline stamp, marquee/kinetic splits, six
  disconnected pinned acts, scrub rails, spotlight/magnet close.
- **Palette:** cobalt canvas `#174ae3`, icy paper `#eef2fa`, ink `#12265a`,
  soft `#53617e`, hairlines `#cfdaed`, close ground `#101c3a`. One blue family;
  green `#176044` used for A letters, including the other sample courses and the
  B-to-A outcome; not a general decorative accent.
- **Type:** Archivo Black (self-hosted OFL TTF, see
  `assets/fonts/PROVENANCE.md`) for display; Manrope (the app's existing text
  face) for everything else. Two families total.
- **Short screens and reduced motion get the complete static story** in normal
  flow — full gradebook, editable score, working controls — never a clipped pin.
  JS and CSS agree on `(max-height: 680px), (max-width: 759px) and (max-height: 819px)`,
  alongside reduced motion. Narrow dynamic boards show two courses (Algebra and
  one other), not all three. Validation space is reserved with `visibility`, so
  errors do not change the measured sheet extent.

## Feeling curve

```
1  Recognition     oversized white type on electric cobalt; the tilted live gradebook
                    enters the lower-right field; Get started visible immediately
2  Clarity         the paper ground rises; the same gradebook's category and
                    assignment sheets detach along z — the layers of the grade
3  Control (PEAK)  the sheets re-lock into one board while scroll drives the real
                    math: 16/20 → 19/20, 88.4% B → 91.1% A, letter flips mid-scroll
4  Participation   the assembled simulator becomes a real labeled input + range +
                    reset; the visitor's own numbers recompute instantly
5  Ownership       capabilities ledger on paper, then the dark close: one CTA,
                    authorship credits, legal line
```

## Peak and tell-someone

Peak sentence: "the gradebook pulls apart to show you the weighting, locks back
together, and then the grade flips from B to A while you scroll."

Tell-someone: **"It's the site where the gradebook pulls apart to show the
math, then lets you change it."**

## Signature move

**One object, three surfaces, one handoff.** The same DOM gradebook — no swaps,
no clones — separates into weighted-category and assignment planes (grid-layout
identity preserved across the transformation, the Codrops grid-transitions
lesson), reassembles, recomputes B → A through the app's own grading code, and
finally hands the visitor a live input. Scroll is the playhead; the last beat is
editable, not a button.

## Verification plan

`scrollcraft/fastcheck.mjs` (rewritten): exact math (16 → 88.4 B, 19 → 91.1 A),
forward/reverse/direct-jump native scroll, editable
numeric/range/reset/invalid/decimal, keyboard Try-sample + Home/End/PageDown,
mobile overflow, short-screen and reduced-motion static controls, route
reentry/resize cleanup. One batched screenshot pass: 1440×900, 2000 wide,
390×844, 360×640 (short), plus intermediate scene frames — then at most one
correction round.

## Local verification status · 2026-10-16

The parent implementation session reports **160/160 functional checks passed**,
clean JavaScript syntax checks, and clean `git diff --check`. Local captures are
under `.impeccable/review/`; the current design extraction is `DESIGN.md` with
`.impeccable/design.json`. The verification appendix in
`.plans/landing-transformation-spec.md` records evidence and limitations.

An independent fresh visual reviewer initially requested navigation-evidence
correction, then returned **ship for that single listed fix** after viewing the
same PNG capture transcoded to JPEG. The remaining matrix matched the approved
direction. This is a scoped review outcome, not an award or general quality
certification. Physical-phone feel is unverified; external motion-reference
research was text-only, not visually observed. The published site is unchanged;
no commit, push, or deployment is part of this documentation handoff.
