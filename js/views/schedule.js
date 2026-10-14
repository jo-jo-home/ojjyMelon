import { state, createError } from '../main.js';
import { spinnerHTML, escapeHTML, emptyStateHTML } from '../ui.js';

export async function renderSchedule(view) {
  view.innerHTML = spinnerHTML(true);
  let schedule;
  try {
    schedule = await state.client.schedule(null); // term list + current/default term
  } catch (e) {
    view.innerHTML = emptyStateHTML('', 'Could not load your schedule', e.message || 'Please try again.');
    createError(e.message);
    return;
  }

  const terms = schedule?.termLists || [];

  const byTerm = () => {
    if (Array.isArray(schedule?.studentClassScheduleForTerms)) return schedule.studentClassScheduleForTerms;
    return [{ thisTermIndex: schedule?.termIndex ?? 0, classLists: schedule?.classLists || [] }];
  };

  function findEntry(termIdx) {
    const list = byTerm();
    return list.find((e) => Number(e.thisTermIndex) === Number(termIdx)) || list[0];
  }

  async function ensureTerm(termIdx) {
    let entry = findEntry(termIdx);
    if (entry && entry.classLists != null) return entry;
    // This term isn't loaded yet (svue lazy mode) — fetch just it
    try {
      const s2 = await state.client.schedule(Number(termIdx));
      const fresh = Array.isArray(s2?.studentClassScheduleForTerms)
        ? s2.studentClassScheduleForTerms.find((e) => Number(e.thisTermIndex) === Number(termIdx))
        : { thisTermIndex: termIdx, classLists: s2?.classLists || [] };
      if (fresh) {
        if (entry) entry.classLists = fresh.classLists;
        else schedule.studentClassScheduleForTerms.push(fresh);
      }
    } catch (e) {
      createError(e.message);
    }
    return findEntry(termIdx);
  }

  async function render(termIdx) {
    const term = terms.find((t) => Number(t.termIndex) === Number(termIdx)) || terms[0];
    const entry = await ensureTerm(termIdx);
    const classes = entry?.classLists || [];
    view.innerHTML = `
      <h2 class="toolbar-title">Schedule</h2>
      <p class="toolbar-sub">Your classes for the selected term.</p>
      <div class="toolbar">
        <div class="select-wrap" style="min-width:220px">
          <select id="term-select" class="select" aria-label="Term">
            ${terms.map((t) => `<option value="${t.termIndex}" ${Number(t.termIndex) === Number(termIdx) ? 'selected' : ''}>${escapeHTML(t.termName)}</option>`).join('')}
          </select>
        </div>
      </div>
      ${term && term.beginDate ? `<p class="muted" style="margin:0 0 16px;font-size:.85rem">${escapeHTML(term.beginDate)} – ${escapeHTML(term.endDate)}${state.guest ? ' · sample data' : ''}</p>` : ''}
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>Period</th><th>Course Name</th><th>Room</th><th>Teacher</th></tr></thead>
          <tbody>
            ${classes.map((c, i) => `
              <tr>
                <td class="cell-strong">${c.period ? escapeHTML(c.period) : i}</td>
                <td>${escapeHTML(c.courseTitle)}</td>
                <td>${escapeHTML(c.roomName || '—')}</td>
                <td>${c.teacherEmail ? `<a href="mailto:${escapeHTML(c.teacherEmail)}">${escapeHTML(c.teacher)}</a>` : escapeHTML(c.teacher || '—')}</td>
              </tr>`).join('') || `<tr><td colspan="4" style="text-align:center;color:var(--text-faint);padding:28px">No classes for this term.</td></tr>`}
          </tbody>
        </table>
      </div>`;
    view.querySelector('#term-select').addEventListener('change', async (e) => {
      const sel = e.target;
      sel.disabled = true;
      await render(Number(sel.value));
    });
  }

  const initial = terms[0]?.termIndex ?? 0;
  await render(initial);
}
