import { state, logout, createError } from '../main.js';
import { getConfiguredWorker, setConfiguredWorkerUrl, getStoredKeyInfo, setManualKey, clearManualKey } from '../api.js';
import { escapeHTML, openModal, confirmModal, toast, successToast } from '../ui.js';

export async function renderSettings(view) {
  const keyInfo = getStoredKeyInfo();
  const mode = state.client?.mode || (state.guest ? 'guest' : null);
  const modeLabel = {
    svue: 'Zero-setup public relay (fast, no configuration — attendance & document downloads need your own relay)',
    json: 'Full connection via StudentVUE JSON API (through your relay/proxy chain)',
    soap: 'Full connection via Synergy SOAP API (through your relay/proxy chain)',
    guest: 'Guest mode — sample data only',
  }[mode] || 'Not signed in';

  view.innerHTML = `
  <div style="max-width:680px">
    <h2 class="toolbar-title">Settings</h2>
    <p class="toolbar-sub">Connection options for ojjyMelon. You rarely need to touch these — they exist for reliability and transparency.</p>

    <div class="settings-grid">
      <div class="card settings-card">
        <h3>Current connection</h3>
        <p>${escapeHTML(modeLabel)}</p>
      </div>

      <div class="card settings-card">
        <h3>Proxy relay</h3>
        <p>Browsers can't contact your district's StudentVUE server directly, so ojjyMelon relays requests. By default it uses public CORS proxies, which are convenient but rate-limited. For a rock-solid connection, deploy the free one-click Cloudflare Worker from the GitHub README and paste its URL here.</p>
        <div class="field">
          <label for="worker-url">Worker URL (optional)</label>
          <input id="worker-url" class="input" type="url" placeholder="https://ojjymelon-proxy.your-name.workers.dev" value="${escapeHTML(getConfiguredWorker() || '')}">
          <p class="muted" style="font-size:.75rem;margin:6px 0 0">Leave empty to use automatic public proxies.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button id="save-worker" class="btn btn-primary btn-sm">Save</button>
          <button id="clear-worker" class="btn btn-secondary btn-sm">Clear</button>
          <a class="btn btn-ghost btn-sm" href="https://github.com/jo-jo-home/ojjyMelon#deploy-your-own-relay-optional" target="_blank" rel="noopener">How to deploy →</a>
        </div>
      </div>

      <div class="card settings-card">
        <h3>Access key</h3>
        <p>Synergy servers require a version key on every request. ojjyMelon fetches it automatically${keyInfo ? ' (last refreshed ' + new Date(keyInfo.at).toLocaleString() + (keyInfo.manual ? ', manually set' : '') + ')' : ''}. If the school system changes it and the automatic fetch fails, paste a fresh value here.</p>
        <div class="field">
          <label for="key-input">edupointkeyversion value</label>
          <input id="key-input" class="input" type="text" placeholder="${keyInfo ? 'Using: ' + escapeHTML(String(keyInfo.value).slice(0, 14)) + '…' : 'Auto — nothing needed'}">
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button id="save-key" class="btn btn-primary btn-sm">Set key</button>
          ${keyInfo?.manual ? '<button id="clear-key" class="btn btn-secondary btn-sm">Use automatic</button>' : ''}
        </div>
      </div>

      <div class="card settings-card">
        <h3>Account</h3>
        <p>${state.guest ? 'You are in guest mode with sample data.' : 'Signed in as ' + escapeHTML(state.studentInfo?.FormattedName || state.client?.username || 'student') + '.'}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button id="sign-out" class="btn btn-danger btn-sm">Sign out</button>
        </div>
      </div>

      <div class="card settings-card">
        <h3>About</h3>
        <p>ojjyMelon ${'v1.0.0'} — a blue-themed tribute to GradeMelon, rebuilt for the 2026 Synergy servers. Source code and deployment guides live on GitHub.</p>
        <a class="btn btn-secondary btn-sm" href="https://github.com/jo-jo-home/ojjyMelon" target="_blank" rel="noopener">GitHub repository</a>
      </div>
    </div>
  </div>`;

  view.querySelector('#save-worker').addEventListener('click', () => {
    const val = view.querySelector('#worker-url').value.trim();
    const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(val);
    if (val && !/^https?:\/\//.test(val)) return createError('Relay URL should start with https://');
    if (val && !isLocal && !/^https:\/\//.test(val)) return createError('Remote relays must use https:// (http:// is only allowed for localhost testing).');
    setConfiguredWorkerUrl(val);
    successToast(val ? 'Saved. Requests will now use your relay.' : 'Cleared — using automatic proxies.');
  });
  view.querySelector('#clear-worker').addEventListener('click', () => {
    setConfiguredWorkerUrl('');
    view.querySelector('#worker-url').value = '';
    successToast('Worker URL cleared.');
  });
  view.querySelector('#save-key').addEventListener('click', () => {
    const val = view.querySelector('#key-input').value.trim();
    if (!val) return toast('Paste a key value first, or leave this alone for automatic mode.', 'info');
    try {
      setManualKey(val);
      successToast('Key saved.');
      renderSettings(view);
    } catch (e) { createError(e.message); }
  });
  const clearKeyBtn = view.querySelector('#clear-key');
  if (clearKeyBtn) clearKeyBtn.addEventListener('click', () => {
    clearManualKey();
    successToast('Back to automatic key fetching.');
    renderSettings(view);
  });
  view.querySelector('#sign-out').addEventListener('click', async () => {
    if (state.guest || await confirmModal('Sign out?', 'You will need your student ID and password to sign in again (unless you saved them).', 'Sign out')) {
      logout(true);
    }
  });
}
