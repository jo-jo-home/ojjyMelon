import { doLogin, enterGuestMode, state } from '../main.js';
import { DISTRICTS } from '../districts.js';
import { toast, errorToast, openModal, escapeHTML, $ } from '../ui.js';

export function renderLogin(view, params) {
  const defaultDistrict = DISTRICTS.find((d) => d.parentVueUrl === state.districtURL) || DISTRICTS.find((d) => d.parentVueUrl.includes('md-mcps')) || DISTRICTS[0];
  let selectedURL = defaultDistrict.parentVueUrl;
  let selectedName = defaultDistrict.name;

  view.innerHTML = `
  <div class="login-wrap">
    <div class="card login-card">
      <h1>Sign in to your account</h1>
      <form id="login-form" novalidate>
        <div class="field">
          <label for="username">Student ID</label>
          <input id="username" class="input" type="text" autocomplete="username" placeholder="Your student ID" required>
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" class="input" type="password" autocomplete="current-password" placeholder="••••••••" required>
        </div>
        <div class="field checkbox-row">
          <input id="remember" type="checkbox">
          <label for="remember" style="margin:0">Remember me</label>
        </div>
        <button type="button" id="district-btn" class="btn btn-secondary btn-block">${escapeHTML(selectedName)}</button>
        <button type="submit" id="login-submit" class="btn btn-primary btn-block" style="margin-top:12px">Sign in</button>
        <p id="login-error" class="hidden" style="color:var(--red);font-size:.85rem;margin:12px 0 0;text-align:center"></p>
        <p id="connection-check-link" class="hidden" style="text-align:center;margin:10px 0 0;font-size:.85rem">
          <a href="#/settings">Run the connection check →</a>
        </p>
      </form>
      <div class="login-links">
        <a href="#/grades?guest=true" id="guest-link">Login as guest</a>
        <a href="#" id="trouble-link">Having trouble?</a>
      </div>
    </div>
  </div>`;

  const form = $('#login-form', view);
  const submit = $('#login-submit', view);
  const errEl = $('#login-error', view);
  let busy = false;
  let cooldownTimer = null;

  /* Client-side throttling: Synergy rate-limits sign-ins per account (and can
     temporarily lock them), so cool down after failures and space out retries. */
  const cooldownStore = {
    get() {
      try { return JSON.parse(localStorage.getItem('ojjymelon.loginCooldown') || 'null'); } catch { return null; }
    },
    set(count) {
      const waits = [15, 30, 60, 300]; // seconds after 1st, 2nd, 3rd, 4th+ failure
      const secs = waits[Math.min(count - 1, waits.length - 1)];
      const until = Date.now() + secs * 1000;
      try { localStorage.setItem('ojjymelon.loginCooldown', JSON.stringify({ count, until })); } catch { /* ignore */ }
      return secs;
    },
    clear() { try { localStorage.removeItem('ojjymelon.loginCooldown'); } catch { /* ignore */ } },
  };

  function updateCooldownUI() {
    const cd = cooldownStore.get();
    if (!cd || cd.until < Date.now()) {
      if (!busy) { submit.disabled = false; submit.innerHTML = 'Sign in'; }
      return;
    }
    const secs = Math.ceil((cd.until - Date.now()) / 1000);
    submit.disabled = true;
    submit.textContent = `Wait ${secs}s before trying again…`;
    clearTimeout(cooldownTimer);
    cooldownTimer = setTimeout(updateCooldownUI, 1000);
  }
  updateCooldownUI();

  const fail = (msg, showCheck) => {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
    const checkBtn = $('#connection-check-link', view);
    if (showCheck && checkBtn) checkBtn.classList.remove('hidden');
    else if (checkBtn) checkBtn.classList.add('hidden');
    busy = false;
    updateCooldownUI();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || submit.disabled) return;
    errEl.classList.add('hidden');
    const username = $('#username', view).value.trim();
    const password = $('#password', view).value;
    if (!username || !password) return fail('Please enter both your student ID and password.');
    busy = true;
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:3px;margin:0"></span> Signing in…';
    try {
      await doLogin(username, password, $('#remember', view).checked, selectedURL);
      cooldownStore.clear();
      toast('Welcome back! Loading your grades…', 'success');
      location.hash = '#/grades';
    } catch (err) {
      const prev = cooldownStore.get();
      const count = (prev && prev.until > Date.now() ? prev.count : 0) + 1;
      const wait = cooldownStore.set(count);
      const { msg, check } = friendlyError(err);
      const extra = count >= 2 ? ` (Waiting ${wait >= 60 ? Math.round(wait / 60) + ' min' : wait + 's'} before the next attempt — frequent retries can extend MCPS's lockout.)` : '';
      fail(msg + extra, check);
    }
  });

  const checkLink = $('#connection-check-link', view);
  if (checkLink) checkLink.addEventListener('click', () => { location.hash = '#/settings'; });

  $('#trouble-link', view).addEventListener('click', (e) => {
    e.preventDefault();
    toast('Make sure you can sign in at your school portal first: ' + selectedURL, 'info', 7000);
  });

  /* District picker modal — zip search + full list (GradeMelon parity) */
  $('#district-btn', view).addEventListener('click', () => {
    const m = openModal({ title: 'Choose School District' });
    const zip = selectedURL; // remember selection across searches
    m.body.innerHTML = `
      <div class="field">
        <label for="zip-input">Zip Code</label>
        <div style="display:flex;gap:8px">
          <input id="zip-input" class="input" type="text" placeholder="20850">
          <button id="zip-search" class="btn btn-primary">Search</button>
        </div>
      </div>
      <div class="field">
        <label for="district-select">School Districts</label>
        <select id="district-select" class="select" size="12" style="min-width:100%"></select>
      </div>`;
    const select = $('#district-select', m.body);
    const fill = (list, zipMode) => {
      select.innerHTML = '';
      for (const d of list) {
        const opt = document.createElement('option');
        opt.value = d.parentVueUrl;
        opt.textContent = `${d.name} — ${d.address}`;
        if (d.parentVueUrl === zip) opt.selected = true;
        select.appendChild(opt);
      }
      if (!list.length) {
        const opt = document.createElement('option');
        opt.disabled = true;
        opt.textContent = zipMode ? 'No districts found for that zip code' : '';
        select.appendChild(opt);
      }
    };
    fill(DISTRICTS);
    $('#zip-search', m.body).addEventListener('click', () => {
      const z = $('#zip-input', m.body).value.trim();
      if (!/^\d{5}$/.test(z)) { errorToast('Enter a 5-digit zip code.'); return; }
      const matches = DISTRICTS.filter((d) => d.address.endsWith(' ' + z));
      fill(matches.length ? matches : DISTRICTS.filter((d) => d.address.includes(z)), true);
    });
    select.addEventListener('change', () => {
      selectedURL = select.value;
      const d = DISTRICTS.find((x) => x.parentVueUrl === selectedURL);
      selectedName = d ? d.name : selectedURL;
      $('#district-btn', view).textContent = selectedName;
      m.close();
    });
    const foot = document.createElement('div');
    foot.className = 'modal-foot';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => m.close();
    foot.appendChild(closeBtn);
    m.modal.appendChild(foot);
  });
}

function friendlyError(err) {
  const msg = String(err?.message || '');
  if (/Invalid user|password|credential|sign in again|session expired/i.test(msg)) {
    return { msg: 'Invalid student ID or password. (Make sure you use the same login as the StudentVUE app.)' };
  }
  if (/locked|attempt/i.test(msg)) {
    return { msg: 'MCPS temporarily limited sign-ins for your account. Their rate limit clears on its own, usually within 15–60 minutes — please wait before trying again (each retry can extend the lockout). Good news: ojjyMelon now caches your session, so page refreshes no longer count as new sign-ins.', check: false };
  }
  if (err?.allBlocked || /Every connection path|blocked/i.test(msg)) {
    return { msg, check: true };
  }
  if (/proxy|network|fetch|Failed|reach/i.test(msg)) {
    return { msg: 'Could not reach the StudentVUE server. Check your connection and try again — or run the connection check below.', check: true };
  }
  if (/UPD5304|upgraded/i.test(msg)) return { msg: 'The school server refused the request (version check). Try again — if it persists, update the access key in Settings.' };
  return { msg: msg || 'Something went wrong while signing in. Please try again.' };
}
