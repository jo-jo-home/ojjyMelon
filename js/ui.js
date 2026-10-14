/* ojjyMelon — UI primitives: toasts, modals, dropdowns, misc helpers */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Toasts ---------- */
export function toast(message, type = 'info', timeout = 5000) {
  const host = $('#toast-host');
  const el = document.createElement('div');
  el.className = `toast toast-${type === 'info' ? 'info' : type}`;
  el.setAttribute('role', 'status');
  const icon = document.createElement('span');
  el.appendChild(icon);
  const msg = document.createElement('div');
  msg.className = 'toast-msg';
  msg.textContent = message;
  el.appendChild(msg);
  const x = document.createElement('button');
  x.className = 'toast-x';
  x.setAttribute('aria-label', 'Dismiss');
  x.innerHTML = '&times;';
  el.appendChild(x);
  const dismiss = () => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 220);
  };
  x.addEventListener('click', dismiss);
  host.appendChild(el);
  if (timeout) setTimeout(dismiss, timeout);
  return el;
}
export const errorToast   = (m, t) => toast(m, 'error', t);
export const successToast = (m, t) => toast(m, 'success', t);

/* ---------- Modals ---------- */
let openModalCount = 0;
export function openModal({ title, bodyHTML, wide = false, onClose = null, plainBody = false }) {
  const root = $('#modal-root');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const modal = document.createElement('div');
  modal.className = `modal${wide ? ' modal-wide' : ''}`;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="modal-head">
      <h2></h2>
      <button class="modal-x" aria-label="Close">&times;</button>
    </div>
    <div class="modal-body"></div>
  `;
  modal.querySelector('h2').textContent = title || '';
  const body = modal.querySelector('.modal-body');
  if (typeof bodyHTML === 'string') body.innerHTML = bodyHTML;
  else if (bodyHTML instanceof Node) body.appendChild(bodyHTML);
  overlay.appendChild(modal);
  root.appendChild(overlay);
  openModalCount++;

  const close = () => {
    overlay.remove();
    openModalCount = Math.max(0, openModalCount - 1);
    document.body.classList.remove('no-scroll');
    if (onClose) onClose();
  };
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  modal.querySelector('.modal-x').addEventListener('click', close);
  const onKey = (e) => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
  return { overlay, modal, body, close };
}
export function confirmModal(title, text, confirmLabel = 'Confirm', danger = true) {
  return new Promise((resolve) => {
    const m = openModal({
      title,
      bodyHTML: `<p style="margin:0;color:var(--text-soft);line-height:1.6">${escapeHTML(text)}</p>`,
      onClose: () => resolve(false),
    });
    const foot = document.createElement('div');
    foot.className = 'modal-foot';
    const cancel = document.createElement('button');
    cancel.className = 'btn btn-secondary';
    cancel.textContent = 'Cancel';
    cancel.onclick = () => { m.close(); resolve(false); };
    const ok = document.createElement('button');
    ok.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    ok.textContent = confirmLabel;
    ok.onclick = () => { resolve(true); m.close(); };
    foot.append(cancel, ok);
    m.modal.appendChild(foot);
  });
}

/* ---------- Dropdown (avatar menu) ---------- */
export function bindDropdown(btnSel, menuSel) {
  const btn = $(btnSel), menu = $(menuSel);
  if (!btn || !menu) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !menu.hidden;
    menu.hidden = open;
    btn.setAttribute('aria-expanded', String(!open));
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { menu.hidden = true; btn.focus(); }
  });
}

/* ---------- Helpers ---------- */
export function escapeHTML(s) {
  const AMP = String.fromCharCode(38); // "&"
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': AMP + 'amp;',
    '<': AMP + 'lt;',
    '>': AMP + 'gt;',
    '"': AMP + 'quot;',
    "'": AMP + '#39;',
  }[c]));
}
export function spinnerHTML(large = false) {
  return `<div class="spinner${large ? ' spinner-lg' : ''} spinner-blue" role="status" aria-label="Loading"></div>`;
}
export function emptyStateHTML(iconSVG, line1, line2 = '') {
  return `<div class="empty">${iconSVG}<p><b>${escapeHTML(line1)}</b></p>${line2 ? `<p>${escapeHTML(line2)}</p>` : ''}</div>`;
}
export function formatDate(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' });
}

/* Grade color helpers shared by all views (semantic grade colors — unchanged from GradeMelon) */
export function gradeColorClass(letter) {
  if (!letter) return 'grade-gray';
  if (letter.includes('A') && letter !== 'N/A') return 'grade-green';
  if (letter.includes('B')) return 'grade-blue';
  if (letter.includes('C')) return 'grade-yellow';
  if (letter.includes('D')) return 'grade-orange';
  if (letter.includes('E') || letter.includes('F')) return 'grade-red';
  return 'grade-gray';
}
export function pbarColorClass(letter) {
  const map = { green: 'pbar-green', blue: 'pbar-blue', yellow: 'pbar-yellow', orange: 'pbar-orange', red: 'pbar-red' };
  const cls = gradeColorClass(letter).replace('grade-', '');
  return map[cls] || 'pbar-gray';
}
