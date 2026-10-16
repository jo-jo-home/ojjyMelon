/* ojjyMelon landing: a scroll-craft page.
   Brief and score live in scrollcraft/BRIEF.md. Grammar: filmic one-shot
   (burden of proof met in the brief). Signature move: the scroll-regrade.
   The engine (assets/engine/scrollcraft.*) is never edited; this page authors
   data-sc-* markup, CSS against --sc-p, a Lenis-style smoothed scroll layer,
   and one bespoke spring-driven regrade driver. */

import { $, escapeHTML } from '../ui.js';
import { letterGrade, letterGradeColor } from '../grades.js';

let mounted = null;      // ScrollCraft instance for the current home render
let regradeRaf = 0;      // bespoke regrade loop handle
let styleLink = null;    // engine stylesheet handle
let themeEl = null;      // token theme block
let resizeTimer = 0;
let lastW = 0;
const fx = {};           // per-render handles (smooth scroll, resize, listeners)

/* Teardown: everything renderHome registered, and nothing else.
   Called by the router before any other view renders. */
export function destroyHomeFX() {
  if (regradeRaf) { cancelAnimationFrame(regradeRaf); regradeRaf = 0; }
  if (mounted) { mounted.destroy(); mounted = null; }
  if (fx.smooth) { fx.smooth.destroy(); delete fx.smooth; }
  if (styleLink) { styleLink.remove(); styleLink = null; }
  if (themeEl) { themeEl.remove(); themeEl = null; }
  window.removeEventListener('resize', fx.onResize || (() => {}));
  document.documentElement.style.removeProperty('--sc-canvas');
  document.documentElement.style.removeProperty('scroll-behavior');
  const view = $('#view');
  if (view) { view.classList.remove('view--bleed'); }
  document.getElementById('topbar')?.classList.remove('topbar--world');
}

/* ---- sample data (labelled on its face; the regrade math is the real thing) ----
   "All Tasks / Assessments" (90%): 72/80 from other work + the test x/20.
   "Practice / Preparation" (10%): 46/50 = 92%.
   Test at 16 -> overall 88.4% (B). Test at 19 -> overall 91.1% (A). The letter
   flips at x = 17.22, mid-act, through the real letterGrade function. */
const SAMPLE = {
  test: { name: 'Unit 4 Test', from: 16, to: 19, possible: 20 },
  others: { earned: 72, possible: 80 },
  weightA: 0.9,
  practice: { pct: 92, weight: 0.1 },
};
const SURFACE_COURSES = [
  { period: 1, name: 'Investigations in Life Science', teacher: 'D. Flores', letter: 'A', raw: 96.4, bar: 96.4, color: 'green' },
  { period: 3, name: 'Algebra 1', teacher: 'P. Natarajan', letter: 'B', raw: 87.9, bar: 87.9, color: 'blue' },
  { period: 5, name: 'Grade 7 Adv English', teacher: 'J. Ellis', letter: 'A', raw: 93.1, bar: 93.1, color: 'green' },
];

function overallFor(earned) {
  const pctA = ((SAMPLE.others.earned + earned) / (SAMPLE.others.possible + SAMPLE.test.possible)) * 100;
  const raw = pctA * SAMPLE.weightA + SAMPLE.practice.pct * SAMPLE.practice.weight;
  return { raw: Math.round(raw * 100) / 100, letter: letterGrade(raw), color: letterGradeColor(letterGrade(raw)) };
}

/* ---- Lenis-style smoothed scrolling ----
   Wheel sets a target; one rAF loop walks the real scroll position toward it.
   Sticky positioning keeps working because it is real scroll. Touch, keyboard
   and scrollbar drags sync natively (no smoothing), the standard hybrid. */
function mountSmoothScroll() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const s = { target: window.scrollY, current: window.scrollY, raf: 0, on: true };
  const max = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const loop = () => {
    if (!s.on) return;
    s.current += (s.target - s.current) * 0.107;
    if (Math.abs(s.target - s.current) < 0.35) s.current = s.target;
    window.scrollTo(0, s.current);
    s.raf = requestAnimationFrame(loop);
  };
  const onWheel = (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16; else if (e.deltaMode === 2) dy *= window.innerHeight;
    s.target = Math.max(0, Math.min(s.target + dy, max()));
    if (!s.raf) s.raf = requestAnimationFrame(loop);
  };
  const sync = () => {
    const y = window.scrollY;
    if (Math.abs(y - s.current) > 1.5) { s.current = y; s.target = y; }
  };
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', sync, { passive: true });
  document.documentElement.style.scrollBehavior = 'auto';
  s.raf = requestAnimationFrame(loop);
  return {
    destroy() {
      s.on = false;
      cancelAnimationFrame(s.raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', sync);
      document.documentElement.style.removeProperty('scroll-behavior');
    },
  };
}

export function renderHome(view) {
  destroyHomeFX();

  styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = 'assets/engine/scrollcraft.css';
  document.head.appendChild(styleLink);

  view.classList.add('view--bleed');
  document.getElementById('topbar')?.classList.add('topbar--world');

  const courses = SURFACE_COURSES.map((c) => `
    <div class="oj-course">
      <div class="oj-course__head"><span class="oj-course__period">${c.period}</span>
        <div><h3>${escapeHTML(c.name)}</h3><p>${escapeHTML(c.teacher)}</p></div></div>
      <div class="oj-course__grade"><span class="oj-letter oj-letter--${c.color}">${c.letter}</span><span class="oj-course__raw">${c.raw}%</span></div>
      <div class="oj-course__bar"><i style="width:${c.bar}%"></i></div>
    </div>`).join('');

  view.innerHTML = `
  <div class="oj-sc" id="oj-sc">

  <!-- 1 · RECOGNITION: cinematic plane hero -->
  <section data-sc-act="pin" data-sc-span="2.3" data-sc-drift="#0d1b33">
    <div data-sc-stage class="oj-hero" data-sc-spotlight>
      <div class="oj-sky" aria-hidden="true"></div>
      <div class="oj-aurora" aria-hidden="true"><i></i><i></i></div>
      <div class="oj-plane oj-stamp" data-sc-parallax="-1.15" aria-hidden="true"><span>A+</span></div>
      <div class="oj-plane oj-cloud oj-cloud--a" data-sc-parallax="-0.85" aria-hidden="true"></div>
      <div class="oj-plane oj-cloud oj-cloud--b" data-sc-parallax="-0.45" aria-hidden="true"></div>
      <div class="oj-plane oj-hero__melon" data-sc-parallax="-0.32" aria-hidden="true">
        <div class="oj-melon-tilt" data-sc-tilt="7">
          <img src="assets/img/logo.svg" alt="" width="440" height="440">
        </div>
      </div>
      <div class="oj-chip oj-chip--a" data-sc-parallax="-0.66" aria-hidden="true">
        <span class="oj-chip__inner"><i class="oj-chip__icon oj-chip__icon--green">✓</i>
        <span class="oj-chip__t"><b>Cell Quiz</b><span>Life Science · 15/15</span></span>
        <i class="oj-letter oj-letter--green">A</i></span>
      </div>
      <div class="oj-chip oj-chip--b" data-sc-parallax="-0.18" aria-hidden="true">
        <span class="oj-chip__inner oj-bob-b"><i class="oj-chip__icon oj-chip__icon--blue">✎</i>
        <span class="oj-chip__t"><b>HW Practice</b><span>Algebra 1 · 5/5</span></span>
        <i class="oj-letter oj-letter--blue">A</i></span>
      </div>
      <div class="oj-plane oj-wave" data-sc-parallax="0.55" aria-hidden="true">
        <svg viewBox="0 0 1440 180" preserveAspectRatio="none"><path d="M0,96 C240,160 480,20 760,64 C1040,108 1240,150 1440,96 L1440,180 L0,180 Z" fill="currentColor"></path></svg>
      </div>
      <div class="sc-copy sc-copy--lead oj-hero-copy" data-sc-cue="0 0.8 0">
        <h1 class="sc-display sc-display--xl" data-sc-kinetic="lines">Your quarter, at a glance.</h1>
        <p class="sc-body">ojjyMelon turns your StudentVUE gradebook into something you can read at speed. One sign in. Everything appears.</p>
        <a class="cta" href="#/login" data-sc-magnet="0.24" data-sc-cue="0.12" data-sc-rise="0">Get started</a>
      </div>
    </div>
  </section>

  <!-- 2 · TENSION: editorial kinetic type -->
  <section class="sc-section" data-sc-act="flow" data-sc-drift="#101d36">
    <div class="sc-wrap oj-ritual sc-stack" data-sc-in data-sc-stagger="120">
      <h2 class="sc-display oj-ritual-h">The StudentVUE ritual.</h2>
      <p class="oj-ritual-line">Open the portal. Wait for the tables to load.</p>
      <p class="oj-ritual-line">Find the class. Find the category. Find the assignment.</p>
      <p class="oj-ritual-line">Do the percentage math in your head. Hope it was right.</p>
      <p class="oj-ritual-turn">Every single time, for one number.</p>
    </div>
  </section>

  <!-- 3 · TURN: pan into the surface -->
  <section data-sc-act="pan" data-sc-drift="#0c1830" id="oj-pan-surface">
    <div data-sc-stage>
      <div class="oj-rail" data-sc-pan="0.05">
        <div class="oj-rail__lead sc-stack">
          <h2 class="sc-display sc-display--md">One sign in. <br>Then everything.</h2>
          <p class="sc-body">Your whole gradebook, translated into something readable at speed.</p>
        </div>
        <div class="oj-surface" data-sc-tilt="4">
          <div class="oj-surface__bar"><span class="oj-dot"></span><span class="oj-dot"></span><span class="oj-dot"></span><em>Gradebook · sample student</em></div>
          ${courses}
        </div>
        <div class="oj-note sc-stack">
          <h3>Real data once you sign in.</h3>
          <p>This panel is a sample. Yours pulls live from your school, every time you open it.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 4 · PEAK: the scroll-regrade -->
  <section data-sc-act="pin" data-sc-span="3.4" data-sc-dwell="0.3" data-sc-drift="#0a1626" id="oj-regrade">
    <div data-sc-stage class="oj-regrade">
      <div class="oj-aurora oj-aurora--peak" aria-hidden="true"><i></i><i></i></div>
      <div class="oj-regrade-grid">
        <div class="sc-copy oj-regrade-copy" data-sc-cue="0 0.24 0">
          <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">Scroll. Watch the math.</h2>
          <p class="sc-body">The slider is your scroll wheel. This runs the same grading code the app ships.</p>
        </div>
        <div class="oj-calc-wrap" data-sc-cue="0.1">
          <div class="oj-calc">
            <div class="oj-calc__head"><span class="oj-calc__badge" id="oj-rg-letter">B</span>
              <div><h3>Algebra 1 · MP1</h3><p id="oj-rg-overall">88.4% overall</p></div></div>
            <div class="oj-calc__row">
              <div class="oj-calc__assign">
                <p class="oj-calc__label">Unit 4 Test</p>
                <p class="oj-calc__score"><span id="oj-rg-earned" class="sc-nums">16</span><span class="oj-calc__of"> / 20</span></p>
                <div class="oj-cat__bar oj-cat__bar--big"><i id="oj-rg-barT"></i></div>
              </div>
              <div class="oj-calc__bars">
                <div class="oj-cat"><span>Overall · weighted across categories</span><div class="oj-cat__bar"><i id="oj-rg-barO"></i></div><em id="oj-rg-pctO"></em></div>
                <div class="oj-cat"><span>Practice / Preparation · 10%</span><div class="oj-cat__bar"><i style="width:92%"></i></div><em>92.0%</em></div>
              </div>
            </div>
            <p class="oj-calc__foot">Sample data. In the app, every keystroke recomputes like this.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 5 · RANGE: the toolkit, sideways -->
  <section data-sc-act="pan" data-sc-drift="#0d1c34" id="oj-pan-range">
    <div data-sc-stage>
      <div class="oj-rail" data-sc-pan="0.05">
        <div class="oj-rail__lead sc-stack">
          <h2 class="sc-display sc-display--md">The rest of the melon.</h2>
          <p class="sc-body">Everything GradeMelon taught us to build, and a little more.</p>
        </div>
        <article class="oj-tool" data-sc-tilt="5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg><h3>Optimizer</h3><p>Pick the grade you want. It tells you what to earn on the remaining work.</p></article>
        <article class="oj-tool" data-sc-tilt="5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/></svg><h3>GPA</h3><p>Weighted and unweighted, on MCPS policy. Honors, AP and IB included.</p></article>
        <article class="oj-tool" data-sc-tilt="5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><h3>Attendance</h3><p>Absences and tardies per period, charted and gridded by day.</p></article>
        <article class="oj-tool" data-sc-tilt="5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><h3>Documents</h3><p>Report cards and assessment results, opened as PDFs.</p></article>
      </div>
    </div>
  </section>

  <!-- 6 · COMMITMENT: close with colophon -->
  <section data-sc-act="pin" data-sc-span="1.25" data-sc-drift="#0a1426">
    <div data-sc-stage class="oj-close" data-sc-spotlight>
      <div class="oj-close__inner">
        <div class="oj-close__melon" aria-hidden="true"><img src="assets/img/logo.svg" alt="" width="140" height="140"></div>
        <h2 class="sc-display sc-display--lg" data-sc-cue="0.06" data-sc-kinetic="lines">Made for students. <br>Made by Jonas.</h2>
        <p class="sc-body" data-sc-cue="0.16">Free, open source, no ads. Thanks Jayden, for the idea. And The Fool, for the advice.</p>
        <a class="cta" href="#/login" data-sc-magnet="0.26" data-sc-cue="0.22" data-sc-rise="0">Get started</a>
        <footer class="oj-colophon">
          <span>© ${new Date().getFullYear()} ojjyMelon · Not affiliated with Edupoint or MCPS</span>
          <a href="#/credits">Credits 💙</a>
        </footer>
      </div>
    </div>
  </section>

  <div class="sc-grain" aria-hidden="true"></div>
  </div>`;

  themeEl = document.createElement('style');
  themeEl.textContent = `
    .oj-sc {
      --sc-canvas: #0d1b33; --sc-surface: #14233f;
      --sc-ink: #eef4ff; --sc-ink-soft: #93a5c8;
      --sc-accent: #60a5fa; --sc-accent-ink: #0a1626;
      --sc-font-display: "Manrope", system-ui, sans-serif;
      --sc-font-text: "Manrope", system-ui, sans-serif;
      --sc-shadow-color: 220 60% 4%;
      background: var(--sc-canvas);
      color: var(--sc-ink);
    }`;
  document.head.appendChild(themeEl);

  fx.smooth = mountSmoothScroll();

  const engineScript = document.createElement('script');
  engineScript.src = 'assets/engine/scrollcraft.js';
  engineScript.onload = () => {
    sizePans();
    mounted = window.ScrollCraft.mount($('#oj-sc'));
  };
  document.head.appendChild(engineScript);

  function sizePans() {
    const vh = window.innerHeight;
    for (const id of ['oj-pan-surface', 'oj-pan-range']) {
      const act = document.getElementById(id);
      const rail = act?.querySelector('.oj-rail');
      if (!act || !rail) continue;
      const overflow = Math.max(0, rail.scrollWidth - window.innerWidth);
      act.dataset.scSpan = Math.max(1.2, overflow / vh + 1.08).toFixed(2);
    }
  }
  fx.sizePans = sizePans;
  fx.onResize = onResize;

  lastW = window.innerWidth;
  window.addEventListener('resize', onResize);
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (Math.abs(window.innerWidth - lastW) < 120) return;
      lastW = window.innerWidth;
      if (mounted) { mounted.destroy(); mounted = null; }
      sizePans();
      mounted = window.ScrollCraft.mount($('#oj-sc'));
    }, 250);
  }

  /* ---- The signature move: the scroll-regrade, spring-driven ----
     The painted value chases the true value with a lerp, so fast scrolling
     glides instead of snapping. The letter badge pops through WAAPI when it
     flips. Single writer: this paint owns every number in the panel. */
  const rgAct = $('#oj-regrade');
  const rgLetter = $('#oj-rg-letter', view);
  const rgOverall = $('#oj-rg-overall', view);
  const rgEarned = $('#oj-rg-earned', view);
  const rgBarT = $('#oj-rg-barT', view);
  const rgBarO = $('#oj-rg-barO', view);
  const rgPctO = $('#oj-rg-pctO', view);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lastLetter = '';
  const paint = (earned) => {
    const o = overallFor(earned);
    const pctT = (earned / SAMPLE.test.possible) * 100;
    rgEarned.textContent = String(Math.round(earned * 10) / 10).replace(/\.0$/, '');
    rgOverall.textContent = o.raw + '% overall';
    rgBarT.style.width = Math.min(pctT, 100) + '%';
    rgBarO.style.width = Math.min(o.raw, 100) + '%';
    rgPctO.textContent = o.raw.toFixed(1) + '%';
    if (o.letter !== lastLetter) {
      rgLetter.textContent = o.letter;
      rgLetter.className = 'oj-calc__badge oj-letter oj-letter--' + o.color;
      if (lastLetter && !reduce && rgLetter.animate) {
        rgLetter.animate(
          [
            { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(96,165,250,0.55)' },
            { transform: 'scale(1.18)', boxShadow: '0 0 0 14px rgba(96,165,250,0)' },
            { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(96,165,250,0)' },
          ],
          { duration: 340, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
      lastLetter = o.letter;
    }
  };

  if (reduce) {
    paint(SAMPLE.test.to);
  } else {
    let paintedP = 0;
    const tick = () => {
      if (!document.body.contains(rgAct)) { regradeRaf = 0; return; }
      const prect = rgAct.getBoundingClientRect();
      if (prect.bottom < -300 || prect.top > innerHeight + 300) {
        regradeRaf = requestAnimationFrame(tick); return;   // off-screen: skip the paint, keep the loop
      }
      const vh = window.innerHeight;
      const total = Math.max(prect.height - vh, 1);
      const targetP = Math.min(1, Math.max(0, -prect.top / total));
      paintedP += (targetP - paintedP) * 0.16;
      if (Math.abs(targetP - paintedP) < 0.001) paintedP = targetP;
      const eased = paintedP * paintedP * (3 - 2 * paintedP);
      paint(SAMPLE.test.from + (SAMPLE.test.to - SAMPLE.test.from) * eased);
      regradeRaf = requestAnimationFrame(tick);
    };
    regradeRaf = requestAnimationFrame(tick);
  }
}
