import { state, loadGrades, setGrades, createError } from '../main.js';
import * as G from '../grades.js';
import { gradeColorClass, openModal, spinnerHTML, escapeHTML, toast, emptyStateHTML } from '../ui.js';

export async function renderGrades(view) {
  view.innerHTML = spinnerHTML(true);

  let grades = state.grades;
  if (!grades && state.client && !state.guest) {
    try { grades = await loadGrades(state.period ?? null); }
    catch (e) { return renderError(view, e); }
  }
  if (!grades) {
    view.innerHTML = emptyState(emptyStateHTML(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>`,
      'No gradebook data yet', 'Your school may not have posted grades for this marking period.'));
    return;
  }

  const view_ = state.defaultView === 'table' ? 'table' : 'card';
  render(grades, view_);

  async function refresh(p = grades.period.index) {
    view.innerHTML = spinnerHTML(true);
    try {
      const fresh = await loadGrades(p);
      grades = fresh;
      render(fresh, view_);
      toast('Grades updated.', 'success');
    } catch (e) {
      createError(e.message);
      render(grades, view_);
    }
  }

  function render(g, mode) {
    const periods = g.periods.map((p) => `<option value="${p.index}" ${p.index === g.period.index ? 'selected' : ''}>${escapeHTML(p.name)}</option>`).join('');
    view.innerHTML = `
      <div class="toolbar">
        <button id="refresh-btn" class="btn btn-secondary btn-icon" title="Refresh" aria-label="Refresh">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
        <div class="select-wrap" style="flex:1;max-width:280px">
          <select id="period-select" class="select" aria-label="Marking period">${periods}</select>
        </div>
        <button id="gpa-btn" class="btn btn-primary btn-icon" title="GPA calculator" aria-label="GPA calculator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M8 15c2-4 6-4 8-8"/><path d="M8 7c1.5 2 3 2.5 4 4"/></svg>
        </button>
      </div>
      <h2 class="toolbar-title">Gradebook <span class="muted" style="font-weight:600;font-size:.95rem">· ${escapeHTML(g.period.name)}</span></h2>
      <p class="toolbar-sub">${state.guest ? 'Sample data (guest mode) — try clicking a class to play with the grade editor!' : 'Click a class to see assignments, edit scores, and optimize your grade.'}</p>
      <div id="grades-area"></div>`;

    const area = view.querySelector('#grades-area');
    if (mode === 'card') renderCards(area, g);
    else renderTable(area, g);

    view.querySelector('#refresh-btn').addEventListener('click', () => refresh(g.period.index));
    view.querySelector('#period-select').addEventListener('change', (e) => refresh(Number(e.target.value)));
    view.querySelector('#gpa-btn').addEventListener('click', () => gpaModal(g));
  }

  function renderCards(area, g) {
    area.innerHTML = `<div class="grid-cards">${g.courses.map((c, i) => `
      <div class="card course-card card-hover" data-course="${i}" role="button" tabindex="0" aria-label="Open ${escapeHTML(c.name)}">
        <div class="course-card-top">
          <h3>${c.period} — ${escapeHTML(c.name)}</h3>
          <p class="course-teacher">${escapeHTML(c.teacher.name)}</p>
        </div>
        <div class="course-card-bottom">
          <span class="grade-big ${gradeColorClass(c.grade.letter)}">${escapeHTML(c.grade.letter)}${!isNaN(c.grade.raw) ? ` <span style="font-size:.62em">(${c.grade.raw}%)</span>` : ''}</span>
          <button class="btn btn-primary btn-sm">View</button>
        </div>
      </div>`).join('')}</div>`;
    area.querySelectorAll('.course-card').forEach((el) => {
      el.addEventListener('click', () => { location.hash = `#/grades/${el.dataset.course}`; });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') location.hash = `#/grades/${el.dataset.course}`; });
    });
  }

  function renderTable(area, g) {
    area.innerHTML = `
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Period</th><th>Course Name</th><th>Teacher</th><th>Grade</th></tr></thead>
        <tbody>${g.courses.map((c, i) => `
          <tr data-course="${i}" style="cursor:pointer">
            <td class="cell-strong">${c.period}</td>
            <td><a href="#/grades/${i}">${escapeHTML(c.name)}</a></td>
            <td>${escapeHTML(c.teacher.name)}</td>
            <td><span class="grade-sm ${gradeColorClass(c.grade.letter)}">${escapeHTML(c.grade.letter)}${!isNaN(c.grade.raw) ? ` (${c.grade.raw}%)` : ''}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  function gpaModal(g) {
    const m = openModal({ title: 'GPA Calculator', onClose: null });
    const renderBody = (model) => {
      m.body.innerHTML = `
        <div class="gpa-values">
          <div class="gpa-chip"><div class="gpa-label">GPA</div><div class="gpa-value">${model.gpa.toFixed(2)}</div></div>
          <div class="gpa-chip"><div class="gpa-label">Weighted GPA</div><div class="gpa-value">${model.wgpa.toFixed(2)}</div></div>
        </div>
        <p style="font-weight:800;margin:0 0 8px">Weighted?</p>
        <p class="muted" style="font-size:.78rem;margin:0 0 12px">Per MCPS policy, honors / AP / IB courses add +1.0 quality point for grades of A, B and C. Toggle any course if we guessed wrong.</p>
        ${model.courses.map((c, i) => `
          <div class="weight-row">
            <label class="toggle">
              <input type="checkbox" data-w="${i}" ${c.weighted ? 'checked' : ''} aria-label="Mark ${escapeHTML(c.name)} as weighted">
              <span class="track"></span>
            </label>
            <span>${escapeHTML(c.name)}</span>
          </div>`).join('')}`;
      m.body.querySelectorAll('input[data-w]').forEach((cb) => {
        cb.addEventListener('change', () => {
          const model2 = G.updateGPA({ ...state.grades, courses: [...state.grades.courses] }, Number(cb.dataset.w), cb.checked);
          state.grades.gpa = model2.gpa; state.grades.wgpa = model2.wgpa;
          state.grades.courses[Number(cb.dataset.w)].weighted = cb.checked;
          m.body.querySelector('.gpa-values').innerHTML = `
            <div class="gpa-chip"><div class="gpa-label">GPA</div><div class="gpa-value">${model2.gpa.toFixed(2)}</div></div>
            <div class="gpa-chip"><div class="gpa-label">Weighted GPA</div><div class="gpa-value">${model2.wgpa.toFixed(2)}</div></div>`;
        });
      });
    };
    renderBody(g);
    const foot = document.createElement('div');
    foot.className = 'modal-foot';
    const close = document.createElement('button');
    close.className = 'btn btn-secondary';
    close.textContent = 'Close';
    close.onclick = () => m.close();
    foot.appendChild(close);
    m.modal.appendChild(foot);
  }

  function renderError(view, e) {
    view.innerHTML = emptyStateHTML(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`,
      'Could not load your gradebook', e.message || 'Please try again.');
    createError(e.message);
  }
}
