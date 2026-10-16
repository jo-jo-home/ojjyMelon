import { calculateCategory, calculateGrade } from '../grades.js';

// Older service-worker-cached index pages do not include the new home.css link.
// Keep the network-first module compatible with that shell during deployment.
const stylesheetURL = new URL('../../css/home.css', import.meta.url).href;
if (!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((link) => link.href === stylesheetURL)) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = stylesheetURL;
  document.head.appendChild(stylesheet);
}

let dispose = null;

// The same category -> course calculation chain used by the real gradebook.
export function landingGrade(score) {
  const course = {
    grade: {},
    categories: [
      { name: 'All Tasks / Assessments', weight: 90, points: {}, grade: {} },
      { name: 'Practice / Preparation', weight: 10, points: {}, grade: {} },
    ],
    assignments: [
      { category: 'All Tasks / Assessments', points: { earned: 72, possible: 80 } },
      { category: 'All Tasks / Assessments', points: { earned: score, possible: 20 } },
      { category: 'Practice / Preparation', points: { earned: 46, possible: 50 } },
    ],
  };
  course.categories.forEach((_, i) => calculateCategory(course, i));
  calculateGrade(course);
  return course;
}

export function destroyHomeFX() {
  dispose?.();
  dispose = null;
}

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const ramp = (p, a, b) => { const t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

export function renderHome(view) {
  destroyHomeFX();
  const abort = new AbortController();
  const { signal } = abort;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Mirrors the CSS fallback exactly: short viewports, and narrow viewports too
  // short for a legible dynamic scene, get the complete static story.
  const shortScreen = matchMedia('(max-height: 680px), (max-width: 759px) and (max-height: 819px)');
  const isStatic = () => reduced.matches || shortScreen.matches;
  const topbar = document.getElementById('topbar');
  const oldLive = view.getAttribute('aria-live');
  view.setAttribute('aria-live', 'off'); // Never announce a scroll-driven number on every frame.
  view.classList.add('view--home');
  topbar?.classList.add('hm-topbar');
  document.documentElement.classList.add('hm-active');

  view.innerHTML = `
    <div class="hm-home">
      <section class="hm-story" aria-label="Explore a sample gradebook">
        <div class="hm-stage">
          <div class="hm-paper" aria-hidden="true"></div>
          <div class="hm-opening">
            <h1><span>Your grades.</span><span>Your move.</span></h1>
            <div class="hm-intro">
              <p>A clearer view of StudentVUE.<br>And a little more control over what comes next.</p>
              <a class="hm-button hm-button--white" href="#/login">Get started ${arrow}</a>
              <button class="hm-text-button" type="button" data-try>Try the sample</button>
            </div>
          </div>

          <div class="hm-caption hm-caption--layers" aria-hidden="true">
            <h2>One grade.<br> Every layer.</h2>
            <p>Assignments feed categories.<br>Categories carry weight.<br>Now you can see the whole picture.</p>
          </div>
          <div class="hm-caption hm-caption--math" aria-hidden="true">
            <h2>Three points,<br> one letter.</h2>
            <p>Three more points on this test.<br>The entire course recalculates.</p>
            <p class="hm-grade-change" aria-label="B to A"><span>B</span>${arrow}<strong>A</strong></p>
          </div>
          <div class="hm-caption hm-caption--ready" aria-hidden="true">
            <h2>What if<br> you got…</h2>
            <p>Your turn. Change the test score.<br>See what it means for the course.</p>
            <a class="hm-button" href="#/login">Get started ${arrow}</a>
          </div>

          <p class="hm-static-note">One grade, three layers. Assignments feed weighted categories; categories feed the course.</p>
          <div class="hm-product-position">
            <div class="hm-product" role="group" aria-label="Interactive sample Algebra gradebook">
              <div class="hm-book hm-sheet">
                <div class="hm-book-nav"><span>ojjyMelon</span><span>Gradebook</span><span>Sample data · MP1</span></div>
                <div class="hm-book-heading"><h3>Your quarter.</h3><span>Three classes. One clear view.</span></div>
                <div class="hm-course"><span class="hm-period">1</span><span>Life Science<small>All Tasks / Assessments</small></span><strong>96.4<span>%</span></strong><b>A</b></div>
                <div class="hm-course hm-course--selected"><span class="hm-period">3</span><span>Algebra 1<small>What-if preview</small></span><strong><span data-course-pct>88.4</span><span>%</span></strong><b data-letter>B</b></div>
                <div class="hm-course hm-course--extra"><span class="hm-period">5</span><span>Advanced English<small>All Tasks / Assessments</small></span><strong>93.1<span>%</span></strong><b>A</b></div>
              </div>

              <div class="hm-weights hm-sheet">
                <div class="hm-layer-title"><span>Inside Algebra 1</span><span>Weighted categories</span></div>
                <div class="hm-weight-row"><span>Assessments <b>90%</b></span><div class="hm-track"><i data-assessment-bar></i></div><strong><span data-assessment-pct>88.0</span>%</strong></div>
                <div class="hm-weight-row"><span>Practice <b>10%</b></span><div class="hm-track"><i class="hm-practice-bar"></i></div><strong>92.0%</strong></div>
                <p class="hm-equation"><span data-equation>88.0% × 0.9 + 92.0% × 0.1</span><strong>= <span data-weighted-pct>88.4</span>%</strong></p>
              </div>

              <div class="hm-assignment hm-sheet">
                <div class="hm-assignment-heading"><div><label for="hm-score">Unit 4 Test</label><p data-edit-hint>Follow one assignment through the math.</p></div><div class="hm-score-field"><input id="hm-score" type="number" inputmode="decimal" min="0" max="20" step="0.1" value="16" disabled aria-describedby="hm-score-help hm-score-error"><span>/ 20</span></div></div>
                <label class="hm-sr-only" for="hm-range">Sample test score out of 20</label>
                <input id="hm-range" type="range" min="0" max="20" step="0.1" value="16" disabled>
                <div class="hm-assignment-footer"><span id="hm-score-help">Sample only. School records never change.</span><button class="hm-reset" type="button" disabled>Reset</button></div>
                <p id="hm-score-error" class="hm-validation">Enter a score from 0 to 20 in 0.1 steps.</p>
                <p class="hm-sr-only" data-announcement role="status" aria-live="polite"></p>
              </div>
            </div>
          </div>
          <p class="hm-scene-note">Your gradebook, with room to explore.</p>
        </div>
      </section>

      <section class="hm-beyond" aria-labelledby="hm-beyond-title">
        <h2 id="hm-beyond-title">The whole school day.<br>Not just the numbers.</h2>
        <div class="hm-feature-ledger">
          <p><strong>Grades & what-ifs</strong><span>Edit scores. Explore possibilities.</span></p>
          <p><strong>GPA & optimizer</strong><span>Work backward from the grade you want.</span></p>
          <p><strong>Schedule & attendance</strong><span>Your classes and the days in between.</span></p>
          <p><strong>Documents</strong><span>Report cards and assessment results.</span></p>
        </div>
      </section>

      <section class="hm-close" aria-labelledby="hm-close-title">
        <h2 id="hm-close-title">Make it<br>your quarter.</h2>
        <div class="hm-close-action"><p>Built for students who want<br>to understand their grades.</p><a class="hm-button hm-button--white" href="#/login">Get started ${arrow}</a></div>
        <footer class="hm-footer">
          <div><p>Made by Jonas, Jayden's brother :) ❤️</p><p>Jayden, thank you bro for the idea.</p><p>General advice from The Fool. It wouldn't have been possible without you.</p></div>
          <div class="hm-footer-links"><a href="#/credits">Full credits</a><a href="https://github.com/jo-jo-home/ojjyMelon" target="_blank" rel="noopener noreferrer">Source code ${arrow}</a><a href="#/privacy">Privacy</a></div>
          <p class="hm-legal">© ${new Date().getFullYear()} ojjyMelon. Not affiliated with Edupoint or MCPS.</p>
        </footer>
      </section>
    </div>`;

  const root = view.querySelector('.hm-home');
  const q = (selector) => root.querySelector(selector);
  const stage = q('.hm-stage');
  const story = q('.hm-story');
  const product = q('.hm-product');
  const position = q('.hm-product-position');
  const opening = q('.hm-opening');
  const intro = q('.hm-intro');
  const paper = q('.hm-paper');
  const weights = q('.hm-weights');
  const assignment = q('.hm-assignment');
  const sceneNote = q('.hm-scene-note');
  const captions = [q('.hm-caption--layers'), q('.hm-caption--math'), q('.hm-caption--ready')];
  const score = q('#hm-score');
  const range = q('#hm-range');
  const reset = q('.hm-reset');
  const validation = q('.hm-validation');
  const announcement = q('[data-announcement]');
  const assessmentBar = q('[data-assessment-bar]');
  const pct = q('[data-course-pct]');
  const letter = q('[data-letter]');
  const catPct = q('[data-assessment-pct]');
  const equation = q('[data-equation]');
  const weighted = q('[data-weighted-pct]');
  let raf = 0;
  let previousTime = 0;
  let progress = 0;
  let target = 0;
  let geometry;
  let editable = false;
  let manual = false;
  let lastScore = NaN;
  let dead = false;

  function paintScore(value, fromUser = false) {
    value = Math.round(value * 10) / 10;
    if (!fromUser && value === lastScore) return;
    lastScore = value;
    const result = landingGrade(value);
    const overall = result.grade.raw.toFixed(1);
    const assessment = result.categories[0].grade.raw.toFixed(1);
    pct.textContent = overall;
    letter.textContent = result.grade.letter;
    letter.dataset.grade = result.grade.letter;
    catPct.textContent = assessment;
    equation.textContent = `${assessment}% × 0.9 + 92.0% × 0.1`;
    weighted.textContent = overall;
    assessmentBar.style.transform = `scaleX(${result.categories[0].grade.raw / 100})`;
    if (document.activeElement !== score || !fromUser) score.value = String(value);
    range.value = String(value);
    range.setAttribute('aria-valuetext', `${value} out of 20. Course ${overall}%, ${result.grade.letter}.`);
    if (fromUser) announcement.textContent = `Sample course: ${overall} percent, grade ${result.grade.letter}.`;
  }

  function setEditable(value) {
    if (editable === value) return;
    editable = value;
    score.disabled = range.disabled = reset.disabled = !value;
    q('[data-edit-hint]').textContent = value ? 'Change this score. The course responds.' : 'Follow one assignment through the math.';
    root.classList.toggle('hm-editable', value);
    if (!value) { manual = false; validation.classList.remove('is-shown'); score.removeAttribute('aria-invalid'); }
  }

  function measure() {
    if (isStatic()) {
      product.style.removeProperty('height');
      weights.style.removeProperty('top');
      assignment.style.removeProperty('top');
      return;
    }
    const r = story.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const ib = intro.getBoundingClientRect();
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const mobile = w < 760;
    const bookWidth = mobile ? Math.min(w - 32, 510) : Math.min(w * 0.59, 900);
    // Resolve layout once, outside the animation loop, from real content rather
    // than assuming fixed sheet heights after font loading or text wrapping.
    weights.style.top = `${q('.hm-book').offsetHeight + 12}px`;
    assignment.style.top = `${weights.offsetTop + weights.offsetHeight + 12}px`;
    const extent = assignment.offsetTop + assignment.offsetHeight;
    product.style.height = `${extent}px`;
    // The settled stack must clear the tallest scene caption on mobile.
    const capBottom = Math.max(...captions.map((c) => c.offsetTop + c.offsetHeight));
    const topClear = mobile ? capBottom + 18 : 70;
    // Mobile keeps extra bottom room: mid-assembly rotation and the returning
    // z-flight briefly extend the stack past its resting extent.
    const bottomPad = mobile ? 46 : 14;
    const scale = clamp((h - topClear - bottomPad) / extent, 0.72, 1);
    const introRight = ib.right - sr.left;
    const introBottom = ib.bottom - sr.top;
    let x0, y0;
    if (mobile) {
      x0 = (w - bookWidth) / 2;
      y0 = Math.max(310, h * 0.49, introBottom + 16);
    } else {
      const sideX = Math.max(w * 0.34, introRight + 16);
      if (sideX + bookWidth <= w - 4) { x0 = sideX; y0 = h * 0.43; }
      else { x0 = (w - bookWidth) / 2; y0 = Math.min(introBottom + 28, Math.max(h * 0.3, h - 96)); }
    }
    geometry = {
      top: r.top + window.scrollY - 64,
      travel: Math.max(story.offsetHeight - h, 1),
      w, h, mobile, bookWidth, extent, scale, x0, y0,
      x1: mobile ? (w - bookWidth) / 2 : w * 0.39,
      y1: mobile ? clamp(h - extent * scale - bottomPad, topClear, h * 0.38) : Math.max(70, (h - extent * scale) * 0.42),
    };
    readScroll();
  }

  function paint(p) {
    const { h, mobile, bookWidth, scale, x0, x1, y0, y1 } = geometry;
    const enter = ramp(p, 0.03, 0.28);
    const explode = ramp(p, 0.25, 0.43) * (1 - ramp(p, 0.46, 0.60));
    const assemble = ramp(p, 0.48, 0.67);
    const grade = ramp(p, 0.60, 0.86);
    const ready = ramp(p, 0.86, 0.94);
    paper.style.transform = `translateY(${(1 - ramp(p, 0.09, 0.27)) * 101}%)`;
    opening.style.opacity = String(1 - ramp(p, 0.03, 0.16));
    opening.style.transform = `translateY(${-enter * h * 0.20}px)`;
    opening.inert = p > 0.15;

    const visible = [ramp(p, 0.22, 0.29) * (1 - ramp(p, 0.46, 0.53)), ramp(p, 0.50, 0.57) * (1 - ramp(p, 0.83, 0.89)), ready];
    captions.forEach((el, i) => {
      el.style.opacity = String(visible[i]);
      el.style.transform = `translateY(${(1 - visible[i]) * 18}px)`;
      el.setAttribute('aria-hidden', String(visible[i] < 0.5));
      el.inert = visible[i] < 0.5;
    });

    position.style.transform = `translate3d(${mix(x0, x1, enter)}px,${mix(y0, y1, enter)}px,0) scale(${scale})`;
    const rx = mobile ? mix(8, 0, assemble) : mix(12 + enter * 9, 0, assemble);
    const ry = mobile ? 0 : mix(-16 - enter * 6, 0, assemble);
    const rz = mobile ? mix(-4, 0, enter) : mix(-7, 0, assemble);
    product.style.transform = `perspective(1600px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
    const ex = mobile ? 0 : -bookWidth * 0.07;
    weights.style.transform = `translate3d(${ex * explode}px,${(mobile ? -15 : -28) * explode}px,${(mobile ? 30 : 95) * explode}px) rotateZ(${-3 * explode}deg)`;
    assignment.style.transform = `translate3d(${(mobile ? 0 : -bookWidth * 0.13) * explode}px,${(mobile ? 30 : 70) * explode}px,${(mobile ? 55 : 180) * explode}px) rotateZ(${3 * explode}deg)`;
    sceneNote.style.opacity = String(1 - enter);
    setEditable(p >= 0.94);
    if (!manual) paintScore(mix(16, 19, grade));
  }

  function tick(time) {
    raf = 0;
    if (dead || document.hidden || isStatic()) return;
    const dt = previousTime ? Math.min(time - previousTime, 50) : 16;
    previousTime = time;
    progress += (target - progress) * (1 - Math.exp(-dt / 60));
    if (Math.abs(target - progress) < 0.0001) progress = target;
    paint(progress);
    if (Math.abs(target - progress) > 0.0001) raf = requestAnimationFrame(tick);
    else previousTime = 0;
  }

  function readScroll() {
    if (dead || !geometry || isStatic()) return;
    target = clamp((window.scrollY - geometry.top) / geometry.travel);
    if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
  }

  // One switch for both fallbacks: reduced motion and short viewports.
  // The CSS media queries and this function must stay in agreement.
  function applyLayout() {
    cancelAnimationFrame(raf); raf = 0; previousTime = 0;
    const staticNow = isStatic();
    root.classList.toggle('hm-motion-off', staticNow);
    // Clear timeline-owned styles before the static, normal-flow layout takes over.
    for (const el of [paper, opening, position, product, weights, assignment, sceneNote, ...captions]) {
      el.style.removeProperty('transform'); el.style.removeProperty('opacity');
    }
    opening.inert = false;
    captions.forEach((el, i) => { el.inert = i !== 2; el.setAttribute('aria-hidden', String(i !== 2)); });
    manual = false;
    setEditable(staticNow);
    paintScore(16);
    measure();
    if (!staticNow) {
      target = clamp((window.scrollY - geometry.top) / geometry.travel);
      progress = target;
      paint(progress);
    }
  }

  function edit(value) {
    if (!editable) return;
    const n = value === '' ? NaN : Number(value);
    const inRange = Number.isFinite(n) && n >= 0 && n <= 20;
    // The browser owns step validation: 16.25 is a stepMismatch on step 0.1.
    // A focused buffer that would compute differently is treated as invalid,
    // never silently recomputed behind the visitor's back.
    const valid = inRange && !score.validity.stepMismatch;
    validation.classList.toggle('is-shown', !valid);
    score.setAttribute('aria-invalid', String(!valid));
    if (!valid) return;
    manual = true;
    paintScore(n, true);
  }

  score.addEventListener('input', () => edit(score.value), { signal });
  score.addEventListener('blur', () => {
    if (!editable) return;
    if (validation.classList.contains('is-shown')) {
      const n = score.value === '' ? NaN : Number(score.value);
      if (Number.isFinite(n) && n >= 0 && n <= 20) {
        // Commit to the nearest 0.1 step so field, math, and range agree.
        manual = true;
        score.value = String(Math.round(n * 10) / 10);
        paintScore(Number(score.value), true);
      } else {
        score.value = String(lastScore);
      }
      validation.classList.remove('is-shown');
      score.removeAttribute('aria-invalid');
    }
  }, { signal });
  range.addEventListener('input', () => { score.value = range.value; edit(range.value); }, { signal });
  reset.addEventListener('click', () => { manual = true; validation.classList.remove('is-shown'); score.removeAttribute('aria-invalid'); paintScore(16, true); }, { signal });
  q('[data-try]').addEventListener('click', () => {
    if (!isStatic()) {
      window.scrollTo({ top: geometry.top + geometry.travel, behavior: 'instant' });
      target = progress = 1;
      paint(1);
    }
    score.focus({ preventScroll: !isStatic() });
  }, { signal });
  window.addEventListener('scroll', readScroll, { passive: true, signal });
  window.addEventListener('resize', measure, { passive: true, signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; previousTime = 0; }
    else if (!isStatic()) { readScroll(); progress = target; if (geometry) paint(progress); }
  }, { signal });
  reduced.addEventListener('change', applyLayout, { signal });
  shortScreen.addEventListener('change', applyLayout, { signal });
  document.fonts?.ready.then(() => { if (!dead) measure(); });
  const observer = new ResizeObserver(measure);
  observer.observe(stage);
  applyLayout();

  dispose = () => {
    dead = true;
    abort.abort();
    observer.disconnect();
    cancelAnimationFrame(raf);
    view.classList.remove('view--home');
    topbar?.classList.remove('hm-topbar');
    document.documentElement.classList.remove('hm-active');
    if (oldLive === null) view.removeAttribute('aria-live'); else view.setAttribute('aria-live', oldLive);
  };
}
