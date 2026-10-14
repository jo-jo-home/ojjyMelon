import { state, createError } from '../main.js';
import { spinnerHTML, escapeHTML, emptyStateHTML } from '../ui.js';

const TYPE_COLORS = {
  'absent': '#FF7F7F', 'excused': '#FFEC1F', 'illness': '#ADD8E6',
  'activity': '#50C878', 'supervision': '#50C878', 'tardy': '#FA8A20', 'other': '#7dd3fc',
};
const TYPE_LABELS = {
  'Excused Absence': 'Excused', 'Unexcused Absence': 'Absent', 'Tardy': 'Tardy',
  'Excused Tardy': 'Excused Tardy', 'Unexcused Tardy': 'Unexcused Tardy',
  'Activity': 'Activities', 'Supervision': 'Supervision',
};
function typeColor(name = '') {
  const n = name.toLowerCase();
  for (const key of Object.keys(TYPE_COLORS)) if (n.includes(key)) return TYPE_COLORS[key];
  return TYPE_COLORS.other;
}
function typeLabel(name = '') { return TYPE_LABELS[name] || name; }

/* Zero-dependency stacked bar chart (SVG). Same output Chart.js gave
   GradeMelon: bars per period, stacked by absence type, hover tooltips. */
function renderStackedBarSVG(labels, datasets) {
  const W = 640, H = 300, padL = 36, padB = 30, padT = 12;
  const plotW = W - padL - 12, plotH = H - padT - padB;
  const max = Math.max(1, ...labels.map((_, li) => datasets.reduce((s, d) => s + (d.data[li] || 0), 0)));
  const ticks = [...Array(max + 1).keys()];
  const barW = Math.min(64, plotW / Math.max(labels.length, 1) * 0.62);
  const x0 = (li) => padL + (plotW / labels.length) * li + (plotW / labels.length - barW) / 2;
  const yScale = (v) => padT + plotH - (v / max) * plotH;

  let bars = '';
  labels.forEach((label, li) => {
    let stackTop = 0;
    let total = 0;
    const segs = [];
    for (const d of datasets) {
      const v = d.data[li] || 0;
      if (!v) continue;
      const y1 = yScale(stackTop), y2 = yScale(stackTop + v);
      segs.push(`<rect x="${x0(li)}" y="${y2}" width="${barW}" height="${Math.max(1, y1 - y2)}" fill="${d.backgroundColor}" rx="3"><title>${escapeHTML(d.label)}: ${v}</title></rect>`);
      stackTop += v;
      total += v;
    }
    bars += segs.join('');
    bars += `<text x="${x0(li) + barW / 2}" y="${yScale(total) - 6}" font-size="11" font-weight="700" fill="var(--text-soft)" text-anchor="middle">${total || ''}</text>`;
    bars += `<text x="${x0(li) + barW / 2}" y="${H - 10}" font-size="11" fill="var(--text-faint)" text-anchor="middle">${escapeHTML(label)}</text>`;
  });
  let grid = '';
  for (const t of ticks) {
    grid += `<line x1="${padL}" y1="${yScale(t)}" x2="${W - 12}" y2="${yScale(t)}" stroke="var(--border)" stroke-width="1" ${t === 0 ? '' : 'stroke-dasharray="3,4"'}/>`;
    grid += `<text x="${padL - 8}" y="${yScale(t) + 4}" font-size="11" fill="var(--text-faint)" text-anchor="end">${t}</text>`;
  }
  return `
    <div class="chart-canvas-wrap">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Absences per period, stacked by type" style="width:100%;height:auto;max-height:340px">
        ${grid}${bars}
      </svg>
    </div>
    <div style="margin-top:12px;display:flex;gap:16px;flex-wrap:wrap;font-size:.78rem;color:var(--text-soft)">
      ${datasets.map((d) => `<span><span class="legend-dot" style="background:${d.backgroundColor}"></span>${escapeHTML(d.label)}</span>`).join('')}
    </div>`;
}

export async function renderAttendance(view) {
  view.innerHTML = spinnerHTML(true);
  let att;
  try {
    att = await state.client.attendance();
  } catch (e) {
    view.innerHTML = emptyStateHTML('', 'Could not load attendance', e.message || 'Please try again.');
    createError(e.message);
    return;
  }
  const absences = att?.absences || [];
  const periodInfos = att?.periodInfos || [];

  view.innerHTML = `
    <h2 class="toolbar-title">Attendance</h2>
    <p class="toolbar-sub">Absences and tardies by period${state.guest ? ' (sample data)' : ''}.</p>`;

  if (!absences.length && !periodInfos.length) {
    view.insertAdjacentHTML('beforeend', emptyStateHTML(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 6 9 17l-5-5"/></svg>`,
      'Perfect attendance!', 'No absences or tardies on record.'));
    return;
  }

  /* Bar chart: totals per period, stacked by type */
  const labels = [...new Set(absences.flatMap((a) => a.periods.map((p) => p.period)))].sort((a, b) => a - b);
  const types = [...new Set(absences.flatMap((a) => a.periods.map((p) => typeLabel(p.name))))];
  const datasets = types.map((t) => ({
    label: t,
    data: labels.map((pl) => absences.filter((a) => a.periods.some((p) => p.period === pl && typeLabel(p.name) === t)).length),
    backgroundColor: typeColor(t),
  }));

  if (labels.length) {
    const chartBox = document.createElement('div');
    chartBox.className = 'chart-box';
    chartBox.innerHTML = renderStackedBarSVG(labels.map(String), datasets);
    view.appendChild(chartBox);
  }

  /* Grid table: date × period */
  const grid = document.createElement('div');
  grid.className = 'table-wrap';
  grid.innerHTML = `
    <table class="data">
      <thead><tr><th>Date</th>${labels.map((p) => `<th>P${p}</th>`).join('')}</tr></thead>
      <tbody>
        ${absences.map((a) => {
          const d = a.date;
          const dt = typeof d === 'string'
            ? new Date(d.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, '$3-$1-$2').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
            : new Date(d);
          return `<tr><td class="cell-strong">${isNaN(dt) ? escapeHTML(String(d)) : dt.toLocaleDateString()}</td>
            ${labels.map((p) => {
              const hit = a.periods.find((x) => x.period === p);
              return `<td>${hit ? `<span class="att-cell" style="color:${typeColor(hit.name)}" title="${escapeHTML(hit.name)}">${escapeHTML(typeLabel(hit.name))}</span>` : '<span class="muted">·</span>'}</td>`;
            }).join('')}</tr>`;
        }).join('') || `<tr><td colspan="${labels.length + 1}" style="text-align:center;color:var(--text-faint);padding:28px">No absences on record.</td></tr>`}
      </tbody>
    </table>`;
  view.appendChild(grid);
}
