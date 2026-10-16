/* Fastcheck for the ojjyMelon landing transformation (gradebook scene).
   Real assertions, no engine:
   - exact grading math through the page's own modules (16 -> 88.4 B, 19 -> 91.1 A)
   - timeline endpoints + fast forward/reverse/direct-jump native scroll
   - editable numeric/range/reset/invalid/decimal behavior
   - keyboard: Try the sample, focus, Home/End/PageDown
   - mobile: no horizontal overflow, assembled product fully on screen
   - short-screen and reduced-motion static fallbacks with working controls
   - route reentry, resize, preference change: no loops, stale styles, or errors
   Every context is fresh/isolated; relay/MCPS requests blocked; pointer
   lock/capture mocked; service workers blocked. */
import { chromium } from 'playwright-core';

const EXE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:8931/#/';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail: String(detail).slice(0, 300) });
  if (!ok) console.log(`FAIL ${name}: ${detail}`);
};

const waitSettled = (page, ms = 800) => page.waitForTimeout(ms);

async function newSession(browser, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference',
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Element.prototype.requestPointerLock = () => {};
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 160)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });
  await ctx.route(/ojjymelon-relay|mcpsmd\.org|corsproxy|allorigins/, (r) => r.abort());
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  return { ctx, page, errors };
}

const scene = (page) => page.evaluate(() => {
  const $ = (s) => document.querySelector(s);
  return {
    letter: $('[data-letter]')?.textContent,
    pct: $('[data-course-pct]')?.textContent,
    scoreValue: $('#hm-score')?.value,
    scoreDisabled: $('#hm-score')?.disabled,
    rangeDisabled: $('#hm-range')?.disabled,
    resetDisabled: $('.hm-reset')?.disabled,
    validationShown: $('#hm-score-error')?.classList.contains('is-shown'),
    ariaInvalid: $('#hm-score')?.getAttribute('aria-invalid'),
    scrollY: Math.round(window.scrollY),
    motionOff: document.querySelector('.hm-home')?.classList.contains('hm-motion-off'),
    docW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
    positionTransform: document.querySelector('.hm-product-position')?.style.transform || '',
    readyOpacity: document.querySelector('.hm-caption--ready')?.style.opacity || '',
  };
});

const geometry = (page) => page.evaluate(() => {
  const story = document.querySelector('.hm-story');
  const stage = document.querySelector('.hm-stage');
  const top = story.getBoundingClientRect().top + window.scrollY - 64;
  return { top, travel: story.offsetHeight - stage.clientHeight, stageH: stage.clientHeight };
});

const browser = await chromium.launch({ executablePath: EXE, headless: true });

/* ---------- 1. Exact math through the app's own grading code ---------- */
{
  const { ctx, page } = await newSession(browser);
  const math = await page.evaluate(async () => {
    const { landingGrade } = await import('/js/views/home.js');
    const g = (s) => { const c = landingGrade(s); return { raw: c.grade.raw, letter: c.grade.letter, cat: c.categories[0].grade.raw }; };
    return { s16: g(16), s19: g(19), s17: g(17), s18: g(18), s0: g(0), s20: g(20), s165: g(16.5) };
  });
  check('math 16 -> 88.4 B', math.s16.raw === 88.4 && math.s16.letter === 'B', JSON.stringify(math.s16));
  check('math 19 -> 91.1 A', math.s19.raw === 91.1 && math.s19.letter === 'A', JSON.stringify(math.s19));
  check('math 17 -> 89.3 B (still B at 17)', math.s17.raw === 89.3 && math.s17.letter === 'B', JSON.stringify(math.s17));
  check('math 18 -> 90.2 A', math.s18.raw === 90.2 && math.s18.letter === 'A', JSON.stringify(math.s18));
  check('math 0 -> 74 C', math.s0.raw === 74 && math.s0.letter === 'C', JSON.stringify(math.s0));
  check('math 20 -> 92 A', math.s20.raw === 92 && math.s20.letter === 'A', JSON.stringify(math.s20));
  check('math 16.5 -> 88.85 B', math.s165.raw === 88.85 && math.s165.letter === 'B', JSON.stringify(math.s165));
  await ctx.close();
}

/* ---------- 2. Timeline endpoints, direct jumps, fast native scroll ---------- */
{
  const { ctx, page, errors } = await newSession(browser);
  const geo = await geometry(page);
  let s = await scene(page);
  check('start: 88.4 B, controls disabled', s.pct === '88.4' && s.letter === 'B' && s.scoreDisabled, JSON.stringify(s));

  // direct jump to the end
  await page.evaluate((y) => window.scrollTo(0, y), geo.top + geo.travel);
  await waitSettled(page);
  s = await scene(page);
  check('end jump: 91.1 A, editable', s.pct === '91.1' && s.letter === 'A' && !s.scoreDisabled && s.scoreValue === '19', JSON.stringify(s));
  check('end jump: ready caption visible', parseFloat(s.readyOpacity) > 0.95, s.readyOpacity);

  // reverse direct jump back to the start
  await page.evaluate((y) => window.scrollTo(0, y), geo.top);
  await waitSettled(page);
  s = await scene(page);
  check('reverse jump: 88.4 B, locked again', s.pct === '88.4' && s.letter === 'B' && s.scoreDisabled, JSON.stringify(s));

  // fast forward wheel bursts -> must reach A without breaking
  await page.mouse.move(720, 450);
  for (let i = 0; i < 14; i++) await page.mouse.wheel(0, 600);
  await waitSettled(page, 1200);
  s = await scene(page);
  check('fast wheel forward: A and editable', s.letter === 'A' && !s.scoreDisabled, JSON.stringify(s));

  // fast reverse wheel bursts -> back to B
  for (let i = 0; i < 18; i++) await page.mouse.wheel(0, -600);
  await waitSettled(page, 1200);
  s = await scene(page);
  check('fast wheel reverse: B and locked', s.letter === 'B' && s.scoreDisabled, JSON.stringify(s));

  // native scroll answers a single wheel immediately (no hijack)
  const y0 = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(120);
  const y1 = await page.evaluate(() => window.scrollY);
  check('native wheel responds immediately', y1 !== y0, `${y0} -> ${y1}`);
  check('no page errors (timeline)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* ---------- 3. Editable demo: numeric, decimal, invalid, range, reset ---------- */
{
  const { ctx, page, errors } = await newSession(browser);
  const geo = await geometry(page);
  await page.evaluate((y) => window.scrollTo(0, y), geo.top + geo.travel);
  await waitSettled(page);

  const type = async (val) => {
    await page.fill('#hm-score', String(val));
    await page.dispatchEvent('#hm-score', 'input');
    return scene(page);
  };
  let s = await type(0);
  check('edit 0 -> 74.0 C', s.pct === '74.0' && s.letter === 'C', JSON.stringify(s));
  s = await type(20);
  check('edit 20 -> 92.0 A', s.pct === '92.0' && s.letter === 'A', JSON.stringify(s));
  s = await type(16.5);
  // (88.85).toFixed(1) is "88.8" through the app's own display math — same as the real app.
  check('edit 16.5 -> 88.8 B (decimal)', s.pct === '88.8' && s.letter === 'B', JSON.stringify(s));
  s = await type(25);
  check('edit 25 -> invalid, values hold', s.validationShown && s.ariaInvalid === 'true' && s.pct === '88.8', JSON.stringify(s));
  s = await type('');
  check('edit empty -> invalid', s.validationShown && s.ariaInvalid === 'true', JSON.stringify(s));
  await page.$eval('#hm-score', (el) => { el.value = '-3'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  s = await scene(page);
  check('edit -3 -> invalid', s.validationShown && s.ariaInvalid === 'true', JSON.stringify(s));
  // blur restores the last valid value and clears the error
  await page.$eval('#hm-score', (el) => el.blur());
  s = await scene(page);
  check('blur keeps valid 16.5, no error', !s.validationShown && s.scoreValue === '16.5', JSON.stringify(s));

  // range slider drives the same chain
  await page.$eval('#hm-range', (el) => { el.value = '10'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  s = await scene(page);
  check('range 10 -> 83.0 B', s.pct === '83.0' && s.letter === 'B' && s.scoreValue === '10', JSON.stringify(s));

  // reset returns to the sample's 16/20
  await page.click('.hm-reset');
  s = await scene(page);
  check('reset -> 88.4 B', s.pct === '88.4' && s.letter === 'B' && s.scoreValue === '16', JSON.stringify(s));

  // repeat edits answer instantly (no debounce/animation lag)
  const t = Date.now();
  for (const v of [19, 16, 19, 16]) await type(v);
  const elapsed = Date.now() - t;
  s = await scene(page);
  check('repeat edits instant (<400ms for 4)', elapsed < 400 && s.pct === '88.4', `${elapsed}ms ${s.pct}`);
  check('no page errors (editable)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* ---------- 4. Keyboard: Try the sample, Home/End/PageDown ---------- */
{
  const { ctx, page, errors } = await newSession(browser);
  // Tab to the Try the sample button like a real keyboard user
  await page.keyboard.press('Tab');
  let focused = '';
  for (let i = 0; i < 15; i++) {
    focused = await page.evaluate(() => `${document.activeElement?.tagName}:${document.activeElement?.textContent?.trim()}:${document.activeElement?.className}`);
    if (focused.includes('Try the sample')) break;
    await page.keyboard.press('Tab');
  }
  check('keyboard reaches Try the sample by Tab', focused.includes('Try the sample'), focused);
  await page.keyboard.press('Enter');
  await waitSettled(page);
  const s = await scene(page);
  check('Enter on Try: scrolled to end, A', s.letter === 'A' && !s.scoreDisabled, JSON.stringify(s));
  const active = await page.evaluate(() => `${document.activeElement?.id}`);
  check('Enter on Try: focus lands in the score field', active === 'hm-score', active);

  // Home/End/PageDown on the page (blur the input first)
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('End');
  await waitSettled(page, 500);
  const endY = await page.evaluate(() => Math.round(window.scrollY));
  const docH = await page.evaluate(() => Math.round(document.documentElement.scrollHeight - window.innerHeight));
  check('End reaches document bottom', Math.abs(endY - docH) < 4, `${endY} vs ${docH}`);
  await page.keyboard.press('Home');
  await waitSettled(page, 600);
  const homeY = await page.evaluate(() => Math.round(window.scrollY));
  const sHome = await scene(page);
  check('Home returns to top and B', homeY === 0 && sHome.letter === 'B', `${homeY} ${sHome.letter}`);
  await page.keyboard.press('PageDown');
  await waitSettled(page, 400);
  const pdY = await page.evaluate(() => Math.round(window.scrollY));
  check('PageDown scrolls the page', pdY > 400, String(pdY));
  check('no page errors (keyboard)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* ---------- 5. Mobile: overflow + assembled visibility ---------- */
{
  const { ctx, page, errors } = await newSession(browser, { viewport: { width: 390, height: 844 } });
  const geo = await geometry(page);
  await page.evaluate((y) => window.scrollTo(0, y), geo.top + geo.travel);
  await waitSettled(page);
  let s = await scene(page);
  check('mobile: no horizontal overflow at end', s.docW === 390, `docW=${s.docW}`);
  const vis = await page.evaluate(() => {
    const a = document.querySelector('.hm-assignment').getBoundingClientRect();
    const stage = document.querySelector('.hm-stage').getBoundingClientRect();
    return { aBottom: Math.round(a.bottom), stageBottom: Math.round(stage.bottom), aRight: Math.round(a.right), innerW: window.innerWidth };
  });
  check('mobile: assembled assignment fully on screen', vis.aBottom <= vis.stageBottom - 2 && vis.aRight <= vis.innerW + 1, JSON.stringify(vis));
  await page.evaluate((y) => window.scrollTo(0, y), geo.top);
  await waitSettled(page);
  s = await scene(page);
  check('mobile: no horizontal overflow at start', s.docW === 390, `docW=${s.docW}`);
  // sweep through the middle: sample several progress points, assert the letter transitions B -> A
  let sawB = false, sawA = false, sawExploded = false;
  for (let f = 0; f <= 10; f++) {
    await page.evaluate(([t, tr, fr]) => window.scrollTo(0, t + tr * fr), [geo.top, geo.travel, f / 10]);
    await waitSettled(page, 500);
    const m = await scene(page);
    if (m.letter === 'B') sawB = true;
    if (m.letter === 'A') sawA = true;
  }
  const midExplode = await page.evaluate(([t, tr]) => { window.scrollTo(0, t + tr * 0.34); return new Promise((res) => setTimeout(() => res(document.querySelector('.hm-weights').style.transform), 350)); }, [geo.top, geo.travel]);
  sawExploded = /translate3d\(-?\d+(\.\d+)?px,/.test(midExplode) && !midExplode.includes('translate3d(0px,0px,0px)');
  check('mobile sweep: both B and A appear across the journey', sawB && sawA, `B=${sawB} A=${sawA}`);
  check('mobile: layers visibly detach mid-journey', sawExploded, midExplode);
  check('no page errors (mobile)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* ---------- 6. Static fallbacks: short screen + reduced motion ---------- */
for (const caseDef of [{ name: 'short', viewport: { width: 360, height: 640 }, reduced: false }, { name: 'reduced', viewport: { width: 1440, height: 900 }, reduced: true }]) {
  const { ctx, page, errors } = await newSession(browser, { viewport: caseDef.viewport, reduced: caseDef.reduced });
  let s = await scene(page);
  check(`${caseDef.name}: static layout active`, s.motionOff === true, JSON.stringify(s.motionOff));
  check(`${caseDef.name}: controls editable immediately`, !s.scoreDisabled && !s.rangeDisabled && !s.resetDisabled, JSON.stringify(s));
  check(`${caseDef.name}: starts at 88.4 B`, s.pct === '88.4' && s.letter === 'B', JSON.stringify(s));
  const stagePos = await page.evaluate(() => getComputedStyle(document.querySelector('.hm-stage')).position);
  check(`${caseDef.name}: stage not pinned`, stagePos !== 'sticky', stagePos);
  // editing works in static mode
  await page.fill('#hm-score', '19');
  await page.dispatchEvent('#hm-score', 'input');
  s = await scene(page);
  check(`${caseDef.name}: edit 19 -> 91.1 A`, s.pct === '91.1' && s.letter === 'A', JSON.stringify(s));
  await page.click('.hm-reset');
  s = await scene(page);
  check(`${caseDef.name}: reset -> 88.4 B`, s.pct === '88.4' && s.letter === 'B', JSON.stringify(s));
  // Try the sample focuses the field and brings it into view (static mode never teleports elsewhere)
  await page.click('[data-try]');
  await waitSettled(page, 200);
  const tryResult = await page.evaluate(() => {
    const el = document.activeElement;
    const b = el?.getBoundingClientRect();
    return { id: el?.id, visible: b ? b.top >= 0 && b.bottom <= window.innerHeight : false, y: Math.round(window.scrollY) };
  });
  check(`${caseDef.name}: Try focuses the field into view`, tryResult.id === 'hm-score' && tryResult.visible, JSON.stringify(tryResult));
  check(`${caseDef.name}: no page errors`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* ---------- 7. Route reentry + resize + preference change ---------- */
{
  const { ctx, page, errors } = await newSession(browser);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { location.hash = '#/login'; });
    await page.waitForTimeout(120);
    await page.evaluate(() => { location.hash = '#/'; });
    await page.waitForTimeout(120);
  }
  await waitSettled(page, 600);
  const count = await page.evaluate(() => document.querySelectorAll('.hm-home').length);
  check('reentry: exactly one home instance', count === 1, String(count));
  const topbarOk = await page.evaluate(() => document.getElementById('topbar').classList.contains('hm-topbar'));
  check('reentry: topbar re-themed', topbarOk, String(topbarOk));
  const geo = await geometry(page);
  await page.evaluate((y) => window.scrollTo(0, y), geo.top + geo.travel);
  await waitSettled(page);
  let s = await scene(page);
  check('reentry: timeline still ends at A, editable', s.letter === 'A' && !s.scoreDisabled, JSON.stringify(s));

  // resize within the dynamic range: geometry re-measures, no stale state
  await page.setViewportSize({ width: 1100, height: 800 });
  await waitSettled(page, 500);
  s = await scene(page);
  check('resize 1100x800: no overflow, still editable at end', s.docW === 1100 && !s.scoreDisabled, JSON.stringify(s));

  // cross the short-screen boundary: static must take over cleanly
  await page.setViewportSize({ width: 1000, height: 640 });
  await waitSettled(page, 500);
  s = await scene(page);
  check('resize across 680px: static layout takes over', s.motionOff === true && !s.scoreDisabled, JSON.stringify(s));

  // grow back: the live timeline resumes without a reload
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitSettled(page, 500);
  s = await scene(page);
  check('resize back: timeline resumes, transform writer alive', s.motionOff === false && s.positionTransform.length > 0, JSON.stringify(s));
  check('reentry/resize: no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await ctx.close();
}

/* ---------- 8. Reduced-preference change mid-session ---------- */
{
  const { ctx, page, errors } = await newSession(browser);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await waitSettled(page, 400);
  let s = await scene(page);
  check('mid-session preference -> static', s.motionOff === true, JSON.stringify(s));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await waitSettled(page, 400);
  s = await scene(page);
  check('preference restored -> live timeline', s.motionOff === false && s.positionTransform.length > 0, JSON.stringify(s));
  check('preference flip: no page errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* ---------- 9. Decimal step contract: 0.1 steps, real keyboard ---------- */
{
  const { ctx, page, errors } = await newSession(browser);
  const geo = await geometry(page);
  await page.evaluate((y) => window.scrollTo(0, y), geo.top + geo.travel);
  await waitSettled(page);
  await page.click('.hm-reset');
  let s = await scene(page);
  check('step: reset to 88.4 B', s.pct === '88.4' && s.letter === 'B', JSON.stringify(s));

  // real typing: select all, type 16.25 -> stepMismatch -> error, nothing recomputes
  await page.click('#hm-score');
  await page.keyboard.press('Meta+A');
  for (const k of ['1', '6', '.', '2', '5']) await page.keyboard.press(k);
  await page.waitForTimeout(150);
  s = await scene(page);
  // each valid prefix commits live; the invalid tail is flagged and the last
  // valid prefix (16.2 -> 88.6) holds while the buffer stays visible
  check('step: typed 16.25 errors, last valid prefix 16.2/88.6 holds', s.validationShown && s.ariaInvalid === 'true' && s.pct === '88.6' && s.scoreValue === '16.25', JSON.stringify(s));
  const rangeDuringError = await page.evaluate(() => document.querySelector('#hm-range').value);
  check('step: range holds last valid step 16.2', rangeDuringError === '16.2', rangeDuringError);

  // Tab away -> blur normalizes to the nearest 0.1 step and commits
  await page.keyboard.press('Tab');
  await waitSettled(page, 150);
  s = await scene(page);
  check('step: blur normalizes 16.25 -> 16.3, field+math agree (88.7)', !s.validationShown && s.scoreValue === '16.3' && s.pct === '88.7' && s.letter === 'B', JSON.stringify(s));
  const agree = await page.evaluate(() => ({ range: document.querySelector('#hm-range').value, aria: document.querySelector('[data-announcement]').textContent }));
  check('step: range + live announcement agree after normalize', agree.range === '16.3' && /88\.7.*B/.test(agree.aria), JSON.stringify(agree));

  // real typing 16.5 -> valid step, computes live, survives blur unchanged
  await page.click('#hm-score');
  await page.keyboard.press('Meta+A');
  for (const k of ['1', '6', '.', '5']) await page.keyboard.press(k);
  await page.waitForTimeout(150);
  s = await scene(page);
  check('step: typed 16.5 valid, live recompute', !s.validationShown && s.scoreValue === '16.5' && s.pct === '88.8' && s.letter === 'B', JSON.stringify(s));
  await page.keyboard.press('Tab');
  await waitSettled(page, 150);
  s = await scene(page);
  check('step: 16.5 survives blur unchanged', !s.validationShown && s.scoreValue === '16.5' && s.pct === '88.8', JSON.stringify(s));
  await page.fill('#hm-score', '');
  await page.keyboard.press('Tab');
  s = await scene(page);
  check('empty blur restores last score rather than coercing to zero', !s.validationShown && s.scoreValue === '16.5' && s.pct === '88.8', JSON.stringify(s));
  check('no page errors (step)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* ---------- 10. Short dynamic desktops: invalid input fully visible ---------- */
for (const [w, h] of [[1440, 681], [1440, 700], [1440, 740]]) {
  const { ctx, page, errors } = await newSession(browser, { viewport: { width: w, height: h } });
  let s = await scene(page);
  check(`short ${w}x${h}: stays dynamic`, s.motionOff === false, String(s.motionOff));
  const geo = await geometry(page);
  await page.evaluate((y) => window.scrollTo(0, y), geo.top + geo.travel);
  await waitSettled(page);
  await page.fill('#hm-score', '25');
  await page.dispatchEvent('#hm-score', 'input');
  s = await scene(page);
  check(`short ${w}x${h}: invalid error shown at end`, s.validationShown && s.ariaInvalid === 'true', JSON.stringify(s));
  const vis = await page.evaluate(() => {
    const a = document.querySelector('.hm-assignment').getBoundingClientRect();
    const v = document.querySelector('#hm-score-error').getBoundingClientRect();
    const st = document.querySelector('.hm-stage').getBoundingClientRect();
    return { aBottom: Math.round(a.bottom), vBottom: Math.round(v.bottom), stageBottom: Math.round(st.bottom), errVisible: v.top < st.bottom && v.bottom <= st.bottom + 1 };
  });
  check(`short ${w}x${h}: sheet + error inside stage`, vis.aBottom <= vis.stageBottom - 2 && vis.errVisible, JSON.stringify(vis));
  await page.click('.hm-reset');
  s = await scene(page);
  check(`short ${w}x${h}: reset clears error, controls usable`, !s.validationShown && s.pct === '88.4' && !s.resetDisabled, JSON.stringify(s));
  check(`short ${w}x${h}: no page errors`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* ---------- 11. Mobile matrix: 360/390 at 700/740/780/812/844 ---------- */
for (const width of [360, 390]) {
  for (const height of [700, 740, 780, 812, 844]) {
    const expectStatic = height <= 819; // mirrors the CSS/JS fallback query exactly
    const { ctx, page, errors } = await newSession(browser, { viewport: { width, height } });
    let s = await scene(page);
    check(`mobile ${width}x${height}: ${expectStatic ? 'static fallback' : 'dynamic scene'}`, s.motionOff === expectStatic, String(s.motionOff));
    check(`mobile ${width}x${height}: no horizontal overflow`, s.docW === width, `docW=${s.docW}`);
    if (expectStatic) {
      const stagePos = await page.evaluate(() => getComputedStyle(document.querySelector('.hm-stage')).position);
      check(`mobile ${width}x${height}: stage unpinned in static`, stagePos !== 'sticky', stagePos);
      check(`mobile ${width}x${height}: editable immediately`, !s.scoreDisabled, JSON.stringify(s));
      await page.fill('#hm-score', '25');
      await page.dispatchEvent('#hm-score', 'input');
      s = await scene(page);
      const errVis = await page.evaluate(() => {
        const v = document.querySelector('#hm-score-error').getBoundingClientRect();
        return v.height > 0 && v.bottom <= document.documentElement.scrollHeight;
      });
      check(`mobile ${width}x${height}: error shown in flow`, s.validationShown && errVis, JSON.stringify(s));
      await page.click('.hm-reset');
      s = await scene(page);
      check(`mobile ${width}x${height}: reset works`, !s.validationShown && s.pct === '88.4', JSON.stringify(s));
    } else {
      const geo = await geometry(page);
      await page.evaluate((y) => window.scrollTo(0, y), geo.top + geo.travel);
      await waitSettled(page);
      await page.fill('#hm-score', '25');
      await page.dispatchEvent('#hm-score', 'input');
      await waitSettled(page, 150);
      const vis = await page.evaluate(() => {
        const a = document.querySelector('.hm-assignment').getBoundingClientRect();
        const st = document.querySelector('.hm-stage').getBoundingClientRect();
        return { aBottom: Math.round(a.bottom), stageBottom: Math.round(st.bottom) };
      });
      check(`mobile ${width}x${height}: sheet + error inside stage at ready`, vis.aBottom <= vis.stageBottom - 2, JSON.stringify(vis));
      s = await scene(page);
      check(`mobile ${width}x${height}: error shown at ready`, s.validationShown, JSON.stringify(s));
      await page.click('.hm-reset');
      s = await scene(page);
      check(`mobile ${width}x${height}: reset clears at ready`, !s.validationShown && s.pct === '88.4', JSON.stringify(s));
    }
    check(`mobile ${width}x${height}: no page errors`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
}

/* ---------- 12. Persisted dark theme: home backdrop + login restoration ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('ojjymelon.theme', 'dark');
    Element.prototype.requestPointerLock = () => {};
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
  });
  await ctx.route(/ojjymelon-relay|mcpsmd\.org|corsproxy|allorigins/, (r) => r.abort());
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const home = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    htmlActive: document.documentElement.classList.contains('hm-active'),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyImage: getComputedStyle(document.body).backgroundImage,
  }));
  check('dark theme: home body backdrop is flat cobalt', home.theme === 'dark' && home.htmlActive && home.bodyBg === 'rgb(23, 74, 227)' && home.bodyImage === 'none', JSON.stringify(home));
  await page.evaluate(() => { location.hash = '#/login'; });
  await page.waitForTimeout(500);
  const login = await page.evaluate(() => ({
    htmlActive: document.documentElement.classList.contains('hm-active'),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    topbarClass: document.getElementById('topbar').className,
  }));
  check('dark theme: login restores app backdrop + chrome', login.htmlActive === false && login.bodyBg !== 'rgb(23, 74, 227)' && !login.topbarClass.includes('hm-topbar'), JSON.stringify(login));
  check('dark theme: no page errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* ---------- 13. Cached older HTML shell: new stylesheet compatibility ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Element.prototype.requestPointerLock = () => {};
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await ctx.route(/ojjymelon-relay|mcpsmd\.org|corsproxy|allorigins/, (r) => r.abort());
  await ctx.route('http://localhost:8931/', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(/<link[^>]+(?:href="css\/home\.css"|href="assets\/fonts\/archivo-black\.ttf")[^>]*>/g, '');
    await route.fulfill({ response, body: html });
  });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('.hm-home') && getComputedStyle(document.querySelector('.hm-home')).getPropertyValue('--hm-blue').trim() === '#174ae3');
  const restored = await page.evaluate(() => ({
    links: [...document.querySelectorAll('link[rel="stylesheet"]')].filter((l) => l.href.endsWith('/css/home.css')).length,
    blue: getComputedStyle(document.querySelector('.hm-stage')).backgroundColor,
  }));
  check('cached shell without home.css gets the new landing stylesheet', restored.links === 1 && restored.blue === 'rgb(23, 74, 227)', JSON.stringify(restored));
  await page.evaluate(() => { location.hash = '#/login'; });
  await page.waitForTimeout(150);
  await page.evaluate(() => { location.hash = '#/'; });
  await page.waitForTimeout(150);
  const linksAfterReentry = await page.locator('link[rel="stylesheet"][href$="/css/home.css"]').count();
  check('cached shell reentry does not duplicate the stylesheet', linksAfterReentry === 1, String(linksAfterReentry));
  check('cached shell compatibility has no page errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log(JSON.stringify(failed, null, 1));
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
