import { state, loadGrades, createError } from '../main.js';
import * as G from '../grades.js';
import { gradeColorClass, pbarColorClass, openModal, confirmModal, spinnerHTML, escapeHTML, toast, emptyStateHTML, formatDate } from '../ui.js';

export async function renderCourse(view, index) {
  view.innerHTML = spinnerHTML(true);

  let grades = state.grades;
  if (!grades && state.client && !state.guest) {
    try { grades = await loadGrades(null); } catch (e) { return renderFail(view, e); }
  }
  const course = grades?.courses[index];
  if (!course) {
    view.innerHTML = emptyStateHTML('', 'Class not found', 'Go back to the gradebook.');
    return;
  }

  const course2 = cloneCourse(grades.courses[index]);

  function render() {
    const periods = grades.periods.map((p) => `<option value="${p.index}" ${p.index === grades.period.index ? 'selected' : ''}>${escapeHTML(p.name)}</option>`).join('');
    const totalW = Math.min(hasGrade(course2.grade.raw) ? course2.grade.raw : 0, 100);
    view.innerHTML = `
      <div class="toolbar">
        <button id="back-btn" class="btn btn-ghost btn-icon" title="Back to grades" aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        </button>
        <div class="select-wrap" style="flex:1;max-width:280px">
          <select id="period-select" class="select" aria-label="Marking period">${periods}</select>
        </div>
        <button id="optimize-btn" class="btn btn-primary btn-icon" title="Grade Optimizer" aria-label="Optimize grade">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        </button>
        <button id="add-btn" class="btn btn-secondary btn-icon" title="Add an upcoming assignment" aria-label="Add assignment">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
        </button>
      </div>
      <h2 class="toolbar-title">${escapeHTML(course2.name)}</h2>
      <p class="toolbar-sub">${escapeHTML(course2.teacher.name)}${course2.room ? ' · Room ' + escapeHTML(course2.room) : ''}${state.guest ? ' · sample data' : ''}</p>

      <div style="font-size:1.6rem;font-weight:800" class="${gradeColorClass(course2.grade.letter)}">
        ${escapeHTML(course2.grade.letter)} ${hasGrade(course2.grade.raw) ? `<span style="font-size:.65em">(${course2.grade.raw}%)</span>` : ''}
      </div>

      <div class="pbar-track"><div class="pbar-fill ${pbarColorClass(course2.grade.letter)}" style="width:${totalW}%"><span>Total</span></div></div>
      ${course2.categories.map((cat) => `
        <div class="pbar-track pbar-cat"><div class="pbar-fill ${pbarColorClass(cat.grade.letter)}" style="width:${Math.min(hasGrade(cat.grade.raw) ? cat.grade.raw : 0, 100)}%"><span>${escapeHTML(cat.name)} (${hasGrade(cat.grade.raw) ? cat.grade.raw + '%' : 'N/A'}) — ${fmtPts(cat.points.earned)}/${fmtPts(cat.points.possible)}</span></div></div>
      `).join('')}

      <div class="table-wrap" style="margin-top:26px">
        <table class="data">
          <thead><tr><th>Date</th><th>Assignment</th><th>Score</th><th>Category</th></tr></thead>
          <tbody id="assignments-body"></tbody>
        </table>
      </div>
      <p class="muted" style="font-size:.78rem;margin-top:10px">Tip: edit any score to see how it changes your grade — changes stay on this device and never touch the gradebook. "(R)" means the assignment is eligible for reassessment per MCPS policy.</p>`;

    const body = view.querySelector('#assignments-body');
    course2.assignments.forEach((a, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="cell-strong">${formatDate(a.date.due)}</td>
        <td class="score-edit" style="cursor:pointer" data-details="${i}" title="Assignment details">${escapeHTML(a.name)}</td>
        <td>
          <div class="score-cell">
            <span class="score-val grade-editable" tabindex="0" role="button" data-earned="${i}" title="Click to edit points earned">${hasGrade(a.points.earned) ? a.points.earned : 'NG'}</span>
            <span class="slash">/</span>
            <span class="score-val grade-editable" tabindex="0" role="button" data-possible="${i}" title="Click to edit points possible">${a.points.possible != null && !isNaN(a.points.possible) ? a.points.possible : 'NG'}</span>
            <span class="grade-sm ${gradeColorClass(a.grade.letter)}" style="margin-left:6px">${escapeHTML(a.grade.letter)}${hasGrade(a.grade.raw) ? `<span style="font-size:.72em"> ${a.grade.raw}%</span>` : ''}</span>
          </div>
        </td>
        <td>
          <span class="cat-val grade-editable" tabindex="0" role="button" data-cat="${i}" title="Click to change category">${escapeHTML(a.category)}</span>
        </td>`;
      body.appendChild(tr);
    });
    if (!course2.assignments.length) {
      body.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-faint);padding:28px">No assignments yet for this class.</td></tr>`;
    }

    /* events */
    view.querySelector('#back-btn').addEventListener('click', () => { location.hash = '#/grades'; });
    view.querySelector('#add-btn').addEventListener('click', () => { G.addAssignment(course2); render(); toast('Assignment added — set its points to play what-if.', 'info', 3500); });
    view.querySelector('#optimize-btn').addEventListener('click', () => optimizerModal(course2));
    view.querySelector('#period-select').addEventListener('change', async (e) => {
      view.innerHTML = spinnerHTML(true);
      try {
        grades = await loadGrades(Number(e.target.value));
        location.hash = '#/grades';
      } catch (err) { createError(err.message); render(); }
    });
    /* click-to-edit score fields (GradeMelon GradeField parity) */
    const makeScoreEditor = (sel, field, parse) => {
      body.querySelectorAll(sel).forEach((span) => {
        const edit = () => {
          const i = Number(span.dataset[field === 'earned' ? 'earned' : 'possible']);
          const a = course2.assignments[i];
          const input = document.createElement('input');
          input.type = 'number';
          input.min = '0';
          input.step = 'any';
          input.className = 'input-sm';
          input.value = (parse(a) ?? '');
          input.style.width = '64px';
          span.replaceWith(input);
          input.focus();
          input.select();
          let committed = false;
          const commit = () => {
            if (committed) return;
            committed = true;
            const v = parseFloat(input.value);
            G.updateCourse(course2, i, field, isNaN(v) ? 0 : v);
            render();
          };
          input.addEventListener('change', commit);
          input.addEventListener('blur', commit);
          input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') { committed = true; render(); } });
        };
        span.addEventListener('click', edit);
        span.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); edit(); } });
      });
    };
    makeScoreEditor('[data-earned]', 'earned', (a) => a.points.earned);
    makeScoreEditor('[data-possible]', 'possible', (a) => a.points.possible);

    /* click-to-edit category (GradeMelon CategoryField parity) */
    body.querySelectorAll('[data-cat]').forEach((span) => {
      const edit = () => {
        const i = Number(span.dataset.cat);
        const sel = document.createElement('select');
        sel.className = 'cat-select';
        sel.style.cssText = 'border:1px solid var(--border-2);background:var(--surface);color:var(--text)';
        sel.innerHTML = course2.categories.map((c, ci) => `<option value="${ci}" ${c.name === course2.assignments[i].category ? 'selected' : ''}>${escapeHTML(c.name)}</option>`).join('');
        span.replaceWith(sel);
        sel.focus();
        const commit = () => { G.updateCategory(course2, i, Number(sel.value)); render(); };
        sel.addEventListener('change', commit);
        sel.addEventListener('blur', () => render());
      };
      span.addEventListener('click', edit);
      span.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); edit(); } });
    });
    body.querySelectorAll('[data-details]').forEach((td) => {
      td.addEventListener('click', () => assignmentModal(course2, Number(td.dataset.details)));
    });
  }

  function assignmentModal(course, i) {
    const a = course.assignments[i];
    const m = openModal({ title: a.name, plainBody: true });
    // Fork parity: custom assignments can be renamed inline in the modal header
    const headTitle = m.modal.querySelector('.modal-head h2');
    if (a.custom) {
      headTitle.innerHTML = '';
      const input = document.createElement('input');
      input.type = 'text';
      input.value = a.name === 'New Assignment' ? '' : a.name;
      input.placeholder = 'Assignment name';
      input.style.cssText = 'width:100%;background:transparent;border:none;outline:none;font-size:1.12rem;font-weight:800;color:var(--text)';
      headTitle.appendChild(input);
      input.addEventListener('blur', () => { G.renameAssignment(course, i, input.value.trim() || 'New Assignment'); render(); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
      setTimeout(() => input.focus(), 60);
    }
    m.body.innerHTML = `
      <dl class="modal-plain">
        <dt>Grade</dt><dd class="${gradeColorClass(a.grade.letter)}">${escapeHTML(a.grade.letter)}${hasGrade(a.grade.raw) ? ` (${a.grade.raw}%)` : ''}</dd>
        <dt>Points</dt><dd>${hasGrade(a.points.earned) ? a.points.earned : 'NG'} / ${a.points.possible != null && !isNaN(a.points.possible) ? a.points.possible : '—'}</dd>
        <dt>Date Due</dt><dd>${formatDate(a.date.due)}</dd>
        <dt>Category</dt><dd>${escapeHTML(a.category)}</dd>
        ${a.notes ? `<dt>Notes</dt><dd>${escapeHTML(a.notes)}</dd>` : ''}
        ${a.description ? `<dt>Details</dt><dd>${escapeHTML(a.description)}</dd>` : ''}
        ${a.displayScore ? `<dt>Reported as</dt><dd>${escapeHTML(a.displayScore)}</dd>` : ''}
      </dl>`;
    const foot = document.createElement('div');
    foot.className = 'modal-foot';
    const close = document.createElement('button');
    close.className = 'btn btn-secondary'; close.textContent = 'Close';
    close.onclick = () => m.close();
    const del = document.createElement('button');
    del.className = 'btn btn-danger'; del.textContent = 'Delete';
    del.onclick = async () => {
      m.close();
      G.delAssignment(course, i);
      render();
      toast('Assignment removed (locally only).', 'info');
    };
    foot.append(close, del);
    m.modal.appendChild(foot);
  }

  function optimizerModal(course) {
    const m = openModal({ title: 'Optimize Grade', wide: true });
    // Fork parity: default desired grade = the lowest A on the MCPS scale
    const aThreshold = G.MCPS_SCALE[0][1];
    let desired = aThreshold;
    const leftInputs = course.categories.map((c) => ({ name: c.name, left: Math.max(10, Math.round((c.points.possible || 10) * 0.5)) }));
    const inputsHTML = `
      <div class="field">
        <label for="desired-grade">Desired grade (1–100)</label>
        <input id="desired-grade" class="input" type="number" min="1" max="100" value="${desired}">
      </div>
      ${course.categories.map((c, i) => `
        <div class="field">
          <label>Points left (${escapeHTML(c.name)})</label>
          <input class="input opt-left" type="number" min="0" step="any" value="${leftInputs[i].left}" data-i="${i}">
        </div>`).join('')}
      <p class="muted" style="font-size:.78rem">“Points left” is how many ungraded points remain in each category. The optimizer lists ways to split those points so you reach your target.</p>`;
    m.body.innerHTML = `
      <div class="opt-input-grid" style="margin-bottom:10px">${inputsHTML}</div>
      <div id="opt-results"></div>`;
    const results = m.body.querySelector('#opt-results');
    results.innerHTML = `<p class="muted" style="text-align:center;padding:16px 0">Press Optimize to see solutions.</p>`;

    const run = () => {
      desired = parseFloat(m.body.querySelector('#desired-grade').value) || 90;
      const left = [...m.body.querySelectorAll('.opt-left')].map((el) => parseFloat(el.value) || 0);
      const sols = G.optimizeGrade(course, desired, left);
      if (!sols.length) {
        results.innerHTML = `<div class="table-wrap"><table class="data"><tbody><tr><td colspan="${course.categories.length + 1}" style="color:var(--red);font-weight:800;text-align:center;padding:18px">No Solutions Found!</td></tr></tbody></table></div>`;
        return;
      }
      results.innerHTML = `
        <div class="table-wrap">
          <table class="data">
            <thead><tr>${course.categories.map((c) => `<th>${escapeHTML(c.name)}</th>`).join('')}<th>Resulting grade</th></tr></thead>
            <tbody>${sols.map((s) => `<tr>${s.points.map((p, i) => `<td class="cell-strong">${p} / ${left[i]}</td>`).join('')}<td class="cell-strong ${gradeColorClass(G.letterGrade(s.grade))}">${s.grade}% (${G.letterGrade(s.grade)})</td></tr>`).join('')}</tbody>
          </table>
        </div>`;
    };
    const foot = document.createElement('div');
    foot.className = 'modal-foot';
    const close = document.createElement('button');
    close.className = 'btn btn-secondary'; close.textContent = 'Close';
    close.onclick = () => m.close();
    const runBtn = document.createElement('button');
    runBtn.className = 'btn btn-primary'; runBtn.textContent = 'Optimize';
    runBtn.onclick = run;
    foot.append(close, runBtn);
    m.modal.appendChild(foot);
  }

  function renderFail(view, e) {
    view.innerHTML = emptyStateHTML('', 'Could not load this class', e.message || 'Please try again.');
    createError(e.message);
  }

  render();
}

/* Deep clone that preserves NaN/undefined (JSON round-trip does not). */
function cloneCourse(obj) {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(obj); } catch { /* fall through */ }
  }
  return JSON.parse(JSON.stringify(obj), (k, v) => (v === null && /raw|earned|possible/.test(k) ? NaN : v));
}
function hasGrade(v) { return v != null && !isNaN(v); }
function fmtPts(n) { return (n != null && !isNaN(n)) ? Number(Number(n).toFixed(2)) : '—'; }
