/* ==========================================================================
   ojjyMelon — app shell: state, router, auth flow, chrome, theme, PWA
   ========================================================================== */
import { StudentVue, isAuthError, clientFromSession, clearSession } from './api.js';
import { DISTRICTS } from './districts.js';
import * as G from './grades.js';
import { toast, errorToast, successToast, bindDropdown, escapeHTML, $, $$ } from './ui.js';

import { renderHome } from './views/home.js';
import { renderLogin } from './views/login.js';
import { renderGrades } from './views/grades.js';
import { renderCourse } from './views/course.js';
import { renderSchedule } from './views/schedule.js';
import { renderAttendance } from './views/attendance.js';
import { renderDocuments } from './views/documents.js';
import { renderFaq } from './views/faq.js';
import { renderPrivacy } from './views/privacy.js';
import { renderCredits } from './views/credits.js';
import { renderSettings } from './views/settings.js';
import { GUEST_GRADES, GUEST_ATTENDANCE, GUEST_SCHEDULE, GUEST_DOCUMENTS, GUEST_STUDENT_INFO } from './views/guestdata.js';

/* ---------- State ---------- */
export const state = {
  client: null,        // StudentVue instance (null in guest mode)
  guest: false,
  grades: null,        // parsed Grades model
  period: null,         // selected reporting period index
  studentInfo: null,
  districtURL: localStorage.getItem('ojjymelon.district') || 'https://md-mcps-psv.edupoint.com',
  defaultView: localStorage.getItem('ojjymelon.defaultView') || 'card',
};

export function setGrades(g) { state.grades = g; if (g) state.period = g.period.index; }
export function createError(message) { errorToast(message); }

/* ---------- Auth ---------- */
const CREDS_KEY = 'ojjymelon.creds';
function saveCreds(username, password, districtURL) {
  try {
    const payload = btoa(JSON.stringify({ u: username, p: password, d: districtURL }));
    localStorage.setItem(CREDS_KEY, payload);
  } catch { /* ignore */ }
}
function loadCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    const { u, p, d } = JSON.parse(atob(raw));
    return { username: u, password: p, districtURL: d };
  } catch { return null; }
}
export function clearCreds() { try { localStorage.removeItem(CREDS_KEY); } catch { /* ignore */ } }

export async function doLogin(username, password, remember, districtURL) {
  if (remember) saveCreds(username, password, districtURL);
  else clearCreds();
  localStorage.setItem('ojjymelon.district', districtURL);
  state.districtURL = districtURL;
  const client = new StudentVue(districtURL);
  await client.login(username, password);
  state.client = client;
  state.guest = false;
  // Prime with gradebook + student info in parallel
  const [gb, info] = await Promise.allSettled([client.gradebook(), client.studentInfo()]);
  if (gb.status === 'fulfilled') setGrades(G.parseGrades(gb.value));
  if (info.status === 'fulfilled') state.studentInfo = info.value;
  updateChrome();
  return true;
}

export async function autoLogin() {
  // 1. Cached session (no new sign-in attempt — avoids Synergy rate limits)
  try {
    const restored = clientFromSession();
    if (restored) {
      await restored.gradebook(); // throws on 401 (expired) or network failure
      state.client = restored;
      state.guest = false;
      await loadGradesFromClient(restored);
      updateChrome();
      return true;
    }
  } catch (e) {
    if (isAuthError(e)) clearSession();      // token expired — fall through to login
    else return false;                       // network down — keep session for later
  }
  // 2. Saved credentials
  const creds = loadCreds();
  if (!creds) return false;
  try {
    await doLogin(creds.username, creds.password, true, creds.districtURL || state.districtURL);
    return true;
  } catch (e) {
    clearCreds();
    if (isAuthError(e)) errorToast('Saved login no longer works — please sign in again.');
    return false;
  }
}

async function loadGradesFromClient(client) {
  const [gb, info] = await Promise.allSettled([client.gradebook(), client.studentInfo()]);
  if (gb.status === 'fulfilled') setGrades(G.parseGrades(gb.value));
  if (info.status === 'fulfilled') state.studentInfo = info.value;
}

export function enterGuestMode() {
  state.client = null;
  state.guest = true;
  state.grades = GUEST_GRADES();
  state.period = state.grades.period.index;
  state.studentInfo = GUEST_STUDENT_INFO;
  state.client = {
    guest: true,
    async gradebook() { return null; },
    async schedule(termIndex) { return GUEST_SCHEDULE(); },
    async attendance() { return GUEST_ATTENDANCE(); },
    async documents() { return GUEST_DOCUMENTS(); },
    async documentContent() { return null; },
    async studentInfo() { return GUEST_STUDENT_INFO; },
  };
  updateChrome();
}

export function logout(silent = false) {
  state.client = null;
  state.guest = false;
  state.grades = null;
  state.studentInfo = null;
  clearCreds();
  clearSession();
  updateChrome();
  if (!silent) successToast('Signed out.');
  location.hash = '#/login';
}

/* Fetch a period's gradebook (or noop in guest mode) */
export async function loadGrades(periodIndex) {
  if (state.guest) {
    const fresh = GUEST_GRADES();
    // keep current period selection if it exists in guest data
    const p = periodIndex != null && fresh.periods.some((x) => x.index === periodIndex) ? periodIndex : fresh.period.index;
    state.grades = fresh;
    state.period = p;
    return fresh;
  }
  if (!state.client) throw new Error('Not signed in.');
  const gb = await state.client.gradebook(periodIndex);
  const g = G.parseGrades(gb);
  setGrades(g);
  return g;
}

/* ---------- Router ---------- */
const APP_ROUTES = new Set(['grades', 'schedule', 'attendance', 'documents', 'settings']);

/* While auto-login is running, route changes wait for it instead of
   bouncing the user to the login page mid-boot. */
let bootGate = Promise.resolve();

function currentRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, query] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(query || '');
  return { name: parts[0] || 'home', arg: parts[1] ? decodeURIComponent(parts[1]) : null, params };
}

function requireAuth() {
  if (state.client || state.guest) return true;
  location.hash = '#/login';
  return false;
}

export async function route() {
  await bootGate.catch(() => {});
  const { name, arg, params } = currentRoute();
  const view = $('#view');
  view.scrollTop = 0;
  window.scrollTo(0, 0);

  switch (name) {
    case 'home': return renderHome(view);
    case 'login': return renderLogin(view, params);
    case 'privacy': return renderPrivacy(view);
    case 'faq': return renderFaq(view, params);
    case 'credits': return renderCredits(view);
    case 'grades': {
      if (params.get('guest') === 'true' && !state.client && !state.guest) {
        enterGuestMode();
        successToast('You are exploring ojjyMelon with sample data.');
      }
      if (!requireAuth()) return;
      if (params.has('view')) {
        state.defaultView = params.get('view');
        localStorage.setItem('ojjymelon.defaultView', state.defaultView);
      }
      if (arg != null) return renderCourse(view, Number(arg));
      return renderGrades(view);
    }
    case 'schedule': if (requireAuth()) return renderSchedule(view); return;
    case 'attendance': if (requireAuth()) return renderAttendance(view); return;
    case 'documents': if (requireAuth()) return renderDocuments(view); return;
    case 'settings': if (requireAuth()) return renderSettings(view); return;
    default:
      view.innerHTML = `<div class="empty"><p><b>404 — page not found</b></p><p><a href="#/">Back to home</a></p></div>`;
  }
}

/* ---------- Chrome (topbar / sidebar / mobilebar / avatar) ---------- */
export function updateChrome() {
  const logged = !!(state.client || state.guest);
  const topbar = $('#topbar');
  topbar.hidden = false;
  $('#avatar-wrap').hidden = !logged;
  $('#login-btn-top').hidden = logged;
  $('#logout-btn').hidden = !logged;

  const route = currentRoute();
  const isApp = APP_ROUTES.has(route.name) || (route.name === 'grades');
  $('#sidebar').hidden = !isApp;
  $('#mobilebar').hidden = !isApp || window.innerWidth > 900;

  // active nav highlighting
  const navKey = route.name === 'grades'
    ? (state.defaultView === 'table' ? 'grades-table' : 'grades-card')
    : route.name;
  $$('.nav-link, .mob-link').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === navKey || (a.dataset.nav === 'grades' && route.name === 'grades'));
  });

  // avatar info
  if (logged) {
    const info = state.studentInfo || {};
    $('#student-name').textContent = state.guest ? 'Guest Student' : (info.FormattedName || info.name || 'Student');
    $('#student-school').textContent = state.guest ? 'ojjyMelon Sample School' : (info.CurrentSchool || info.currentSchool || '');
    $('#student-meta').textContent = state.guest ? 'Guest mode — sample data' : [info.Grade ? `Grade ${info.Grade}` : '', info.PermID ? `ID ${info.PermID}` : ''].filter(Boolean).join(' • ');
    const photo = info.Photo || info.photo || '';
    const img = $('#avatar-img');
    if (photo) img.src = photo.startsWith('data:') ? photo : `data:${photo}`;
    else img.src = state.guest ? 'assets/img/guest-avatar.svg' : 'assets/img/default-avatar.svg';
  }
}

function bindChrome() {
  bindDropdown('#avatar-btn', '#avatar-menu');
  $('#logout-btn').addEventListener('click', () => logout());
  $('#menu-grades').addEventListener('click', () => { location.hash = '#/grades'; $('#avatar-menu').hidden = true; });
  $('#menu-settings').addEventListener('click', () => { location.hash = '#/settings'; $('#avatar-menu').hidden = true; });
  $('#login-btn-top').addEventListener('click', () => { location.hash = '#/login'; });
  $('#brand-link').addEventListener('click', (e) => { if ((state.client || state.guest)) { e.preventDefault(); location.hash = '#/grades'; } });

  $('#theme-toggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem('ojjymelon.theme', cur);
  });

  window.addEventListener('resize', updateChrome);

  const sidebarLogout = $('#sidebar-logout');
  if (sidebarLogout) sidebarLogout.addEventListener('click', () => logout());
}

/* ---------- Theme ---------- */
function initTheme() {
  const saved = localStorage.getItem('ojjymelon.theme');
  const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

/* ---------- PWA ---------- */
let deferredPrompt = null;
function initPWA() {
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $('#install-btn').hidden = false;
    maybeShowInstallPromo();
  });
  $('#install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('#install-btn').hidden = true;
    dismissPromo('install');
  });

  // in-app browser nudge (Instagram/Facebook/TikTok webviews)
  const ua = navigator.userAgent || '';
  if (/Instagram|FBAN|FBAV|FBIOS|TikTok/i.test(ua)) {
    showPromo('browser', `
      <div class="promo">
        <img class="promo-icon" src="assets/img/logo.svg" alt="">
        <p><b>You're viewing ojjyMelon inside an in-app browser.</b> For the best experience (install, dark mode, downloads), open this page in Safari or Chrome.</p>
        <button class="promo-x" aria-label="Dismiss">&times;</button>
      </div>`);
  }
}
function maybeShowInstallPromo() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone) return;
  if (localStorage.getItem('ojjymelon.promo.install') === 'dismissed') return;
  if ($('#promo-host').children.length) return;
  showPromo('install', `
      <div class="promo">
        <img class="promo-icon" src="assets/img/logo.svg" alt="">
        <p><b>Install ojjyMelon!</b> Add it to your home screen for quick access to your grades — it works like a native app.</p>
        <button class="promo-x" aria-label="Dismiss">&times;</button>
      </div>`);
}
function showPromo(kind, html) {
  const host = $('#promo-host');
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const el = wrap.firstElementChild;
  el.querySelector('.promo-x').addEventListener('click', () => {
    localStorage.setItem(`ojjymelon.promo.${kind}`, 'dismissed');
    el.remove();
  });
  host.appendChild(el);
  if (kind === 'install') {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.promo-x')) return;
      if (deferredPrompt) { deferredPrompt.prompt(); }
      else { location.hash = '#/faq?refer=app'; } // GradeMelon parity: "Check out how!"
    });
    el.style.cursor = 'pointer';
  }
}
function dismissPromo(kind) {
  localStorage.setItem(`ojjymelon.promo.${kind}`, 'dismissed');
  const host = $('#promo-host');
  host.innerHTML = '';
}

/* ---------- Boot ---------- */
async function boot() {
  initTheme();
  bindChrome();
  initPWA();
  window.addEventListener('hashchange', () => { route().then(() => updateChrome()).catch(() => {}); });

  const { name } = currentRoute();
  if (name === 'login' || name === 'home' || name === 'privacy' || name === 'faq') {
    route();
    updateChrome();
  } else if (loadCreds()) {
    // auto-login then continue to the requested route
    let release;
    bootGate = new Promise((r) => { release = r; });
    viewLoading('Signing you in…');
    try {
      await autoLogin();
      release();
      route();
    } catch {
      release();
      location.hash = '#/login';
    }
    updateChrome();
  } else {
    location.hash = '#/login';
  }
}

function viewLoading(msg) {
  $('#view').innerHTML = `
    <div class="center-wrap">
      <div class="spinner spinner-lg spinner-blue"></div>
      <p class="muted">${escapeHTML(msg || 'Loading…')}</p>
    </div>`;
}

boot();
