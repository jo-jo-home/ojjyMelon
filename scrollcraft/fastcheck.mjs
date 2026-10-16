/* Fast-scroll verification for the ojjyMelon landing (absolute coordinates):
   1. smooth scroll glides after a wheel flick
   2. spring catches up: end of the regrade act = 19/20 = A; back to the start = B
   3. no console errors */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
await page.goto('http://localhost:8931/#/', { waitUntil: 'load' });
await page.waitForTimeout(1600);

const r = {};
r.engineMounted = await page.evaluate(() => !!window.ScrollCraft && window.ScrollCraft.instances.length > 0);

// act geometry in absolute document coordinates
const geo = await page.evaluate(() => {
  const act = document.querySelector('#oj-regrade');
  const top = act.getBoundingClientRect().top + window.scrollY;
  return { top, travel: act.offsetHeight - window.innerHeight };
});

// 1. smooth glide: one 500px flick inside the act
await page.evaluate((y) => window.scrollTo(0, y), geo.top + geo.travel * 0.2);
await page.waitForTimeout(300);
await page.mouse.move(720, 450);
await page.mouse.wheel(0, 500);
const samples = [];
for (let i = 0; i < 6; i++) {
  samples.push(await page.evaluate(() => Math.round(window.scrollY)));
  await page.waitForTimeout(60);
}
r.glide = samples;
r.glideVelocities = samples.slice(1).map((y, i) => y - samples[i]);

// 2. jump to 96% of the act travel, let the spring settle -> must be A / 19
await page.evaluate((y) => window.scrollTo(0, y), geo.top + geo.travel * 0.96);
await page.waitForTimeout(1500);
r.atEnd = await page.evaluate(() => ({
  letter: document.querySelector('#oj-rg-letter')?.textContent,
  score: document.querySelector('#oj-rg-earned')?.textContent,
  overall: document.querySelector('#oj-rg-overall')?.textContent,
}));

// 3. jump back to 4% -> must return to B / 16
await page.evaluate((y) => window.scrollTo(0, y), geo.top + geo.travel * 0.04);
await page.waitForTimeout(1500);
r.atStart = await page.evaluate(() => ({
  letter: document.querySelector('#oj-rg-letter')?.textContent,
  score: document.querySelector('#oj-rg-earned')?.textContent,
  overall: document.querySelector('#oj-rg-overall')?.textContent,
}));

r.errors = errors;
console.log(JSON.stringify(r, null, 1));
await browser.close();
