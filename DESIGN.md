---
name: ojjyMelon
description: Implemented homepage design system; the application retains its separate incumbent theme.
colors:
  hm-blue: "#174ae3"
  hm-ink: "#12265a"
  hm-paper: "#eef2fa"
  hm-soft: "#53617e"
  hm-line: "#cfdaed"
  hm-close: "#101c3a"
  hm-grade-green: "#176044"
  hm-white: "#ffffff"
  hm-white-button-ink: "#153ec1"
  hm-selected: "#eaf0ff"
  hm-field: "#f5f8ff"
typography:
  hm-display:
    fontFamily: "'Archivo Black', 'Manrope', sans-serif"
    fontSize: "clamp(80px, 10.8vw, 176px)"
    fontWeight: 400
    lineHeight: 0.93
    letterSpacing: "-.04em"
  hm-headline:
    fontFamily: "'Archivo Black', 'Manrope', sans-serif"
    fontSize: "clamp(38px, 4.1vw, 60px)"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-.035em"
  hm-body:
    fontFamily: "'Manrope', sans-serif"
    fontSize: "clamp(14px, 1.1vw, 18px)"
    lineHeight: 1.65
  hm-button:
    fontFamily: "'Manrope', sans-serif"
    fontSize: "15px"
    fontWeight: 800
  hm-course-title:
    fontFamily: "'Manrope', sans-serif"
    fontSize: "24px"
    fontWeight: 800
    letterSpacing: "-.03em"
rounded:
  hm-sheet: "12px"
  hm-action: "8px"
  hm-field-row: "6px"
spacing:
  hm-sheet-inset: "16px"
  hm-nav-inline: "24px"
  hm-layer-gap: "12px"
  hm-action-top: "28px"
components:
  hm-button-primary:
    backgroundColor: "{colors.hm-blue}"
    textColor: "{colors.hm-white}"
    typography: "{typography.hm-button}"
    rounded: "{rounded.hm-action}"
    padding: "14px 22px"
  hm-button-white:
    backgroundColor: "{colors.hm-white}"
    textColor: "{colors.hm-white-button-ink}"
    typography: "{typography.hm-button}"
    rounded: "{rounded.hm-action}"
    padding: "14px 22px"
  hm-sheet:
    backgroundColor: "{colors.hm-white}"
    textColor: "{colors.hm-ink}"
    rounded: "{rounded.hm-sheet}"
  hm-score-input:
    backgroundColor: "{colors.hm-field}"
    textColor: "{colors.hm-ink}"
    rounded: "{rounded.hm-field-row}"
    padding: "2px 4px"
    width: "77px"
  hm-selected-course:
    backgroundColor: "{colors.hm-selected}"
    textColor: "{colors.hm-ink}"
    rounded: "{rounded.hm-field-row}"
    padding: "10px 12px"
---

# Design System: ojjyMelon

## Overview

**Creative North Star: "Product as spectacle"**

The approved homepage makes the working gradebook the visual centerpiece. Confident white display type and a cobalt ground give way to pale, readable product surfaces, then a dark close. Depth explains the relationship between assignments, categories, and a course grade; it is not scenery behind the product.

This is an extraction of the local implementation, not a new brand proposal. The frontmatter describes only the marketing/home namespace. `css/home.css` owns `.hm-home`, the home-only `.hm-topbar`, `.view--home`, and `html.hm-active`; `js/views/home.js` applies and removes these hooks. The login, dashboard, and other application routes retain `css/style.css` and its light/dark theme. Do not apply the homepage display scale to them. Surface strategy and verification live in `.plans/landing-transformation-spec.md` and `scrollcraft/builds/gradebook-transformation/BRIEF.md`.

**Key Characteristics:**
- Cobalt, pale paper, and a dark closing ground.
- Self-hosted Archivo Black display type with existing Manrope text.
- Real DOM gradebook surfaces that transform before becoming editable.
- Home-only expression with the incumbent application theme preserved.

## Colors

### Primary

`hm-blue` is the homepage cobalt: opening canvas, primary action, assessment bar, selected B, links, and field accent. Its CSS custom property is `--hm-blue`; the same literal also appears on the home-only document backdrop and topbar. `hm-grade-green` marks A grades and the B-to-A outcome, including the other sample courses; it is not reserved exclusively for the changing Algebra letter.

### Neutral

`hm-paper` is the rising paper plane and capabilities ground; `hm-white` is the sheet and inverse-action surface. `hm-ink` carries product data, `hm-soft` secondary explanation, and `hm-line` structural rules. `hm-close` grounds the closing CTA and credits. `hm-selected` distinguishes the active sample course; `hm-field` distinguishes the editable numeric field. `hm-white-button-ink` is the inverse homepage CTA text, not the topbar's separate literal (`#123ac0`).

The five core custom properties are defined in `css/home.css:27–32`. Close, green, white, selected-row, field, and inverse-button colors are extracted literals, not additional runtime custom properties. Remaining local accents (hover, validation, focus contrast, tracks) stay with their component CSS; they are not a new global palette.

The sidecar's eight-step OKLCH ramps are synthesized preview metadata at fixed hue/chroma, not implemented color scales or additional approved application tokens. The frontmatter retains the actual CSS colors as the source of truth.

**The Namespace Rule.** Home colors belong to home. Do not replace the app's `--primary-*`, `--bg`, `--surface*`, `--border*`, `--text*`, or semantic grade colors with these values.

The unchanged app palette is sourced from `css/style.css:7–71`: primary steps 50–900, light background (`--bg: #f8fafc`), light surface (`--surface: #ffffff`), and text (`--text: #0f172a`); dark mode overrides background (`#0f172a`), surface (`#1e293b`), and text (`#f1f5f9`). Use those source tokens for application work, not the marketing frontmatter. This is a scope reference, not an app redesign or a security/quality certification.

## Typography

**Display Font:** Archivo Black, with Manrope and sans-serif fallbacks. The local face is weight 400, `font-display: swap`, loaded from `assets/fonts/archivo-black.ttf`; provenance is in `assets/fonts/PROVENANCE.md`.

**Body Font:** Existing Manrope, sans-serif on home. The app's broader fallback stack remains `--font` in `css/style.css`.

The frontmatter records the desktop opening, scene headline, intro body, CTA, and gradebook heading roles exactly as implemented (`css/home.css:50–63,84`). These are separate roles, not a universal modular scale. Data uses Manrope, bold weights, and tabular numerals for changing percentages and scores.

- Opening on narrow screens: `clamp(42px, 13vw, 86px)`, line-height `1.02`; static opening: `clamp(44px, 9vw, 100px)`.
- Scene headline on narrow screens: `clamp(30px, 9vw, 46px)`, line-height `1.04`; ready headline: `38px`.
- Capabilities heading: `clamp(28px, 3vw, 44px)`, line-height `1.12`; narrow: `28px`.
- Closing heading: `clamp(44px, 6.5vw, 96px)`, line-height `.99`; narrow: `42px`.
- Intro text measures at most `30ch` on desktop and `38ch` on narrow screens. Narrow intro/caption text is `12px`; compact sheet text is generally `11px` and above. Do not promote those compact demonstration sizes to general application body text.

**The Display Boundary Rule.** Archivo Black and the oversized homepage hierarchy do not extend into dashboard headings, forms, or tables. The unchanged app remains Manrope with its existing component sizes (`css/style.css`).

## Layout

The home route removes the app's `1280px` container cap and view padding, but retains the `64px` topbar offset. Desktop story height is `480svh`; the sticky stage is `calc(100svh - 64px)` with `600px` minimum height. Product width is `min(59vw, 900px)`. The layout is one continuous object transformation, followed by a two-column capabilities ledger and a closing section—not disconnected feature cards.

At widths up to `759px`, the story is `420svh`, stage minimum height `560px`, and product width `min(calc(100% - 32px), 510px)`. The board displays two courses: Algebra and one other course; the extra English row is hidden. Capabilities, close, and footer become single-column. Ledger rows stack below `381px`. Desktop adjustments also exist at minimum width `1800px`, widths `760–1100px`, and desktop heights up to `760px`.

**The Complete Fallback Rule.** The exact short-screen condition is `(max-height: 680px), (max-width: 759px) and (max-height: 819px)`. Either that condition or `(prefers-reduced-motion: reduce)` produces a complete normal-flow story with a static, editable gradebook. CSS and JavaScript must agree. There is no long sticky travel in this mode. The static product width is `min(90%, 860px)`, with `14px` between sheet surfaces.

Dynamic geometry is measured from the actual sheet contents, after fonts settle and on resize, rather than relying solely on the CSS's initial top/height values. Validation space is always reserved with `visibility: hidden`, becoming visible on error; do not switch it to `display: none` and change the measured extent.

## Elevation & Depth

Depth is structural: a base course board, category sheet, and assignment sheet remain the same DOM elements through the entire scene. They are not screenshot textures, duplicate scene props, or a raster asset to replace. The sheet shadow is `0 24px 64px #0b286b29, 0 3px 9px #0b286b14, 0 0 0 1px #c8d5ee` (`css/home.css:78`). The category sheet's local ground is `#f7f9fe`.

The starting desktop perspective is `1600px` with rotations `12deg / -16deg / -7deg`. Scroll changes the rotations and detaches the category and assignment planes along z, then returns them to a flat editable stack. Narrow-screen displacement and rotation are smaller; static modes remove the perspective transformation. These are component-specific explanatory surfaces, not a global requirement for 3D app cards. Preserve the existing DOM construction rather than baking it into artwork.

## Shapes

The homepage uses softly squared sheets (`hm-sheet`), actions (`hm-action`), and selected rows/numeric fields (`hm-field-row`). The exact radii are in the frontmatter. Fine rules organize product data; selected-course emphasis is a pale fill rather than another floating badge. Bar tracks use their local `2px` radius. Icons are inline SVG arrows; the existing logo stays branding, not enlarged scenery.

The home topbar still reuses app button/icon primitives, including their existing `10px` corners; do not normalize those into the homepage's three-value radius set. The app's `--radius` and `--radius-sm` remain unchanged.

## Components

### Actions and navigation

Homepage CTAs use the blue or white variants in the frontmatter, minimum height `52px`, `34px` icon gap, and `22px` SVG arrow. The narrow intro variant is `44px` minimum height, `10px 17px` padding, `12px` type, and `18px` gap. The topbar is opaque cobalt with a fine translucent white border, white brand/icons, and a white Get started action. Its theme toggle is hidden only on home. Mobile branding remains visible and the topbar compacts, rather than losing its navigation.

Home focus is a `3px` cobalt outline offset `5px`; on cobalt/closing grounds the local override is white. Hover colors apply only for `(hover: hover) and (pointer: fine)`. With no reduced-motion preference, homepage actions press to `.96` with `150ms` transitions and `cubic-bezier(0.23, 1, 0.32, 1)` for scale; the normal blue button's background transition uses `ease`. Disabled reset/topbar buttons do not press. The topbar neutralizes the app's separate active transform to avoid double scaling.

### Gradebook and editing

Sample labels remain visible. Scroll demonstrates `16/20 → 19/20` and `88.4% B → 91.1% A` through the existing `calculateCategory` / `calculateGrade` chain, not an invented animation-only calculation. The numeric field and range accept `0–20` in `0.1` steps; Reset returns to `16`. Invalid input shows the reserved error row without recomputing a different value behind the focused field. Blur resolves an invalid step to the nearest tenth or restores the last valid value for an out-of-range/empty value.

Controls are disabled while the dynamic explanation runs and become editable at progress `0.94`. Static modes enable them immediately. Try the sample jumps to the editable state and focuses the numeric input. User edits announce the result politely; scroll-driven numbers do not flood the live region. This sample never changes school records.

### Motion ownership and lifecycle

Native scroll is the playhead: no wheel interception or snapping. Direct transform/opacity writes have one writer per element; assessment bars use `scaleX`, not per-frame width animation. Visual progress follows frame-rate-independent exponential damping with a `60ms` time constant, delta capped at `50ms`, and settling threshold `0.0001` (`js/views/home.js:276–285`). Frames stop when settled or the document is hidden; visibility return resynchronizes to scroll. Repeated editing is immediate, not tweened.

Measurement/layout writes are outside the frame loop. Route disposal aborts listeners, disconnects the ResizeObserver, cancels rAF, removes home classes, and restores the view's prior live-region attribute. Font readiness checks the disposed flag. Media preference changes switch layout during the session. Do not add a second transform owner, idle bobbing, or CSS transitions on timeline-owned surfaces.

## Do's and Don'ts

### Do:
- **Do** keep homepage tokens and display typography inside the home namespace.
- **Do** preserve native scrolling, keyboard focus, static editable fallbacks, and the same DOM gradebook surfaces.
- **Do** label demonstrations as sample data and preserve authorship, credits, and non-affiliation text.
- **Do** use the existing app theme tokens for login, dashboard, and other operational screens.

### Don't:
- **Don't** apply the homepage palette, Archivo Black hierarchy, or 3D choreography to the unchanged app UI.
- **Don't** replace live product surfaces with raster mockups or add an independent motion writer.
- **Don't** remove reserved validation space or let CSS and JavaScript fallback conditions diverge.
- **Don't** turn a local visual-review verdict into an award, security, physical-device, or production-deployment claim.
