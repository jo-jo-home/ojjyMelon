import { state, createError } from '../main.js';
import { spinnerHTML, escapeHTML, emptyStateHTML, toast } from '../ui.js';

export async function renderDocuments(view) {
  view.innerHTML = spinnerHTML(true);
  let docs = [];
  try {
    docs = await state.client.documents();
  } catch (e) {
    view.innerHTML = emptyStateHTML('', 'Could not load documents', e.message || 'Please try again.');
    createError(e.message);
    return;
  }

  view.innerHTML = `
    <h2 class="toolbar-title">Documents</h2>
    <p class="toolbar-sub">Report cards, progress reports, and assessment results${state.guest ? ' (sample data)' : ''}. Click a document to open it as a PDF.</p>`;

  if (!docs.length) {
    view.insertAdjacentHTML('beforeend', emptyStateHTML(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      'No documents yet', 'Your school will post report cards and progress reports here.'));
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  wrap.innerHTML = `
    <table class="data">
      <thead><tr><th>Date</th><th>Document</th><th>Type</th><th></th></tr></thead>
      <tbody>
        ${docs.map((d, i) => {
          const date = typeof d.documentDate === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(d.documentDate)
            ? new Date(d.documentDate) : null;
          return `<tr data-doc="${i}" style="cursor:pointer">
            <td class="cell-strong">${date ? date.toLocaleDateString() : escapeHTML(d.documentDate || '—')}</td>
            <td>${escapeHTML(d.documentComment || d.documentFileName || 'Document')}</td>
            <td><span class="doc-type-chip">${escapeHTML(d.documentType || 'Document')}</span></td>
            <td><button class="btn btn-primary btn-sm" data-open="${i}">Open</button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  view.appendChild(wrap);

  wrap.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openDoc(Number(btn.dataset.open)); });
  });
  wrap.querySelectorAll('tr[data-doc]').forEach((tr) => {
    tr.addEventListener('click', () => openDoc(Number(tr.dataset.doc)));
  });

  async function openDoc(i) {
    const d = docs[i];
    if (state.guest) { toast('Guest mode: sample data only — no real PDF to open.', 'info'); return; }
    btnState(i, 'Loading…', true);
    try {
      const content = await state.client.documentContent(d.documentGu || d.documentGU);
      if (!content || !content.base64Code) throw new Error('The document came back empty.');
      const bytes = base64ToBytes(content.base64Code);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_self'; // iOS in-app friendly
      a.download = (content.fileName || d.documentFileName || 'document.pdf').replace(/[^\w.\-]+/g, '_');
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      btnState(i, 'Open', false);
    } catch (e) {
      btnState(i, 'Open', false);
      createError('Could not open the document: ' + e.message);
    }
  }
  function btnState(i, label, disabled) {
    const btn = wrap.querySelector(`[data-open="${i}"]`);
    if (btn) { btn.textContent = label; btn.disabled = disabled; }
  }
}

function base64ToBytes(b64) {
  const clean = b64.replace(/\s/g, '');
  const bin = atob(clean);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
