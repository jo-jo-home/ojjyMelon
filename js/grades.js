/* ==========================================================================
   ojjyMelon — grade engine (GradeMelon-parity math, MCPS policy)
   - MCPS scale (verified live from the district's own gradingScale payload):
       A 89.5–100, B 79.5–89.49, C 69.5–79.49, D 59.5–69.49, E 0–59.49
   - WGPA (MCPS IKC-RA): +1.0 quality point for A/B/C in Honors/AP/IB only.
   - Course % = renormalized weighted categories (empty categories skipped).
   - Editing chain: assignment -> category -> course -> GPA (all client-side).
   ========================================================================== */

/* ---------- MCPS grading scale ---------- */
export const MCPS_SCALE = [
  ['A', 89.5, 100],
  ['B', 79.5, 89.49],
  ['C', 69.5, 79.49],
  ['D', 59.5, 69.49],
  ['E', 0, 59.49],
];
const ROUND = { percent: true, percentPlaces: 2, mark: false, markPlaces: 0 };

export function letterGrade(grade, scale = MCPS_SCALE, rounding = ROUND) {
  if (grade == null || isNaN(grade)) return 'N/A';
  if (rounding.percent) grade = Number(grade.toFixed(rounding.percentPlaces));
  if (grade > 100) grade = 100;
  for (const [letter, low, high] of scale) {
    if (grade >= low && grade <= high) return letter;
  }
  return grade > 100 ? scale[0][0] : 'N/A';
}

export function letterGradeColor(letter) {
  if (!letter) return 'gray';
  if (letter.includes('A') && letter !== 'N/A') return 'green';
  if (letter.includes('B')) return 'blue';
  if (letter.includes('C')) return 'yellow';
  if (letter.includes('D')) return 'orange';
  if (letter.includes('E') || letter.includes('F')) return 'red';
  return 'gray';
}

/* Quality points: MCPS IKC-RA — weighted adds +1 to A, B and C only. */
export function letterGPA(letter, weighted, double = false) {
  let gpa = 0;
  if (!letter || letter === 'N/A') return 0;
  if (letter.includes('A')) gpa = 4;
  else if (letter.includes('B')) gpa = 3;
  else if (letter.includes('C')) gpa = 2;
  else if (letter.includes('D')) gpa = 1;
  else if (letter.includes('E') || letter.includes('F')) gpa = 0;
  else return 0;
  if (weighted && (letter.includes('A') || letter.includes('B') || letter.includes('C'))) gpa += 1;
  if (double) gpa *= 2;
  return gpa;
}

export const isWeighted = (name = '') => /\b(AP|Hon|IB|Mag)/i.test(name);
export const isDouble = (name = '') => /\bDP\b/i.test(name);

const stripParens = (str = '') => str.replace(/\(([^)]+)\)/g, '');

const parseAssignmentName = (name = '') => {
  const d = document.createElement('div');
  d.innerHTML = String(name);
  return (d.textContent || d.innerText || '').trim();
};

/* Parse the many score shapes Synergy emits into {earned, possible}. */
export function parseAssignmentScore(a) {
  const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
  let earned = num(a.point ?? a.scoreCalValue);
  let possible = num(a.pointPossible ?? a.scoreMaxValue);
  if (earned == null || possible == null) {
    const pts = String(a.points || '').trim();
    const slash = pts.match(/^(-?[\d.]+)\s*\/\s*(-?[\d.]+)$/);
    if (slash) {
      if (earned == null) earned = parseFloat(slash[1]);
      if (possible == null) possible = parseFloat(slash[2]);
    } else {
      const maxOnly = pts.match(/^(-?[\d.]+)\s*Points?\s*Possible$/i);
      if (maxOnly && possible == null) possible = parseFloat(maxOnly[1]);
      const outOf = String(a.displayScore || '').match(/(-?[\d.]+)\s*out of\s*(-?[\d.]+)/i);
      if (outOf) {
        if (earned == null) earned = parseFloat(outOf[1]);
        if (possible == null) possible = parseFloat(outOf[2]);
      }
      const numOnly = num(a.score);
      if (numOnly != null && earned == null && a.scoreType === 'Raw Score' && possible == null) {
        earned = numOnly; // e.g. completion-style entries with implicit max 1? keep score as earned
      }
    }
  }
  return { earned, possible };
}

const parseUSDate = (s) => {
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
};

export function periodLabel(start, end) {
  const s = parseUSDate(start), e = parseUSDate(end);
  if (!s || !e) return '';
  const now = Date.now();
  const daysLeft = Math.ceil((e.getTime() - now) / 86400000);
  const daysToStart = Math.floor((s.getTime() - now) / 86400000);
  const daysAgo = Math.floor((now - e.getTime()) / 86400000);
  if (daysLeft > 0 && daysToStart <= 0) return `ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
  if (daysToStart > 0) return `starts in ${daysToStart} day${daysToStart > 1 ? 's' : ''}`;
  if (daysAgo > 0) return `ended ${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
  return 'ends today';
}

/* ---------- Parse the API gradebook into the app model ---------- */

function makeGrade(raw) {
  const letter = letterGrade(raw);
  return { letter, raw, color: letterGradeColor(letter) };
}

export function parseGrades(gb) {
  if (!gb) return null;
  const periods = (gb.reportingPeriods || []).map((p) => ({
    name: `${p.gradePeriod} (${periodLabel(p.startDate, p.endDate)})`,
    plainName: p.gradePeriod,
    index: Number(p.index),
    startDate: p.startDate,
    endDate: p.endDate,
  }));
  let current = gb.reportingPeriod;
  let currentIdx = Number(current?.index);
  if (currentIdx == null || isNaN(currentIdx)) {
    const today = new Date();
    const live = (gb.reportingPeriods || []).find((p) => {
      const s = parseUSDate(p.startDate), e = parseUSDate(p.endDate);
      return s && e && today >= s && today <= e && !String(p.gradePeriod).toLowerCase().includes('interim');
    }) || (gb.reportingPeriods || []).find((p) => {
      const s = parseUSDate(p.startDate), e = parseUSDate(p.endDate);
      return s && e && today >= s && today <= e;
    });
    currentIdx = live ? Number(live.index) : Number((gb.reportingPeriods || [])[0]?.index ?? 0);
    current = live || null;
  }

  const courses = (gb.courses || []).map((c, i) => {
    const name = stripParens(c.title || c.courseName || '');
    const mark = (c.marks || [])[0] || {};
    const summary = mark.gradeCalculationSummary || [];
    // Category rows from the calculation summary; skip the TOTAL row (GradeMelon parity)
    const catRows = (Array.isArray(summary) ? summary : (summary.assignmentGradeCalcs || []))
      .filter((g) => !String(g.type).toLowerCase().includes('total'));

    const categories = catRows.map((g) => ({
      name: g.type,
      weight: parseFloat(String(g.weight).replace('%', '')) / 100,
      grade: { letter: 'N/A', raw: NaN, color: 'gray' },
      points: { earned: NaN, possible: NaN },
      _summaryEarned: parseFloat(g.points), _summaryPossible: parseFloat(g.pointsPossible),
    }));

    const assignments = (mark.assignments || []).map((a) => {
      const { earned, possible } = parseAssignmentScore(a);
      const pct = (earned != null && possible > 0) ? (earned / possible) * 100 : NaN;
      return {
        id: a.gradebookID,
        name: parseAssignmentName(a.measure),
        grade: makeGrade(pct),
        points: { earned, possible },
        date: { due: parseUSDate(a.dueDate || a.date), assigned: parseUSDate(a.date) },
        dueLabel: a.dueDate || a.date || '',
        category: a.type || (categories[0]?.name ?? 'N/A'),
        notes: a.notes || '',
        description: parseAssignmentName(a.measureDescription || ''),
        displayScore: a.displayScore || '',
        custom: false,
      };
    });

    return {
      name,
      courseID: c.courseID || '',
      period: c.period ? Number(c.period) : i + 1,
      room: c.room || '',
      weighted: isWeighted(c.title || ''),
      double: isDouble(c.title || ''),
      grade: { letter: 'N/A', raw: NaN, color: 'gray' },
      teacher: { name: c.staff || '', email: c.staffEMail || '' },
      categories,
      assignments,
      serverGrade: mark.calculatedScoreString || '',
      markName: mark.markName || current?.gradePeriod || '',
    };
  });

  // Recompute all course grades from the assignment data (GradeMelon behavior)
  for (const course of courses) {
    course.categories.forEach((_, i) => calculateCategory(course, i));
    calculateGrade(course);
  }

  const grades = {
    courses,
    gpa: 0,
    wgpa: 0,
    period: {
      name: current?.gradePeriod ? `${current.gradePeriod} (${periodLabel(current.startDate, current.endDate)})` : (periods[currentIdx]?.name ?? ''),
      index: currentIdx,
    },
    periods,
  };
  calculateGPA(grades);
  return grades;
}

/* ---------- Recalculation chain (GradeMelon parity) ---------- */

export function calculateCategory(course, categoryId) {
  const cat = course.categories[categoryId];
  if (!cat) return course;
  const scored = course.assignments.filter(
    (a) => a.category === cat.name && a.points.earned != null && !isNaN(a.points.earned)
      && a.points.possible != null && !isNaN(a.points.possible)
  );
  const earned = scored.reduce((s, a) => s + a.points.earned, 0);
  const possible = scored.reduce((s, a) => s + a.points.possible, 0);
  cat.points.earned = earned;
  cat.points.possible = possible;
  const pct = possible > 0 ? (earned / possible) * 100 : NaN;
  cat.grade.raw = parseFloat(pct.toFixed(2));
  cat.grade.letter = letterGrade(pct);
  cat.grade.color = letterGradeColor(cat.grade.letter);
  return course;
}

export function calculateGrade(course) {
  let totalWeight = 0;
  const cats = course.categories.filter((c) => !isNaN(c.grade.raw));
  for (const c of cats) totalWeight += c.weight;
  if (cats.length === 0 || totalWeight === 0) {
    course.grade.raw = NaN;
    course.grade.letter = 'N/A';
    course.grade.color = 'gray';
    return course;
  }
  let raw = 0;
  for (const c of cats) raw += c.grade.raw * (c.weight / totalWeight);
  course.grade.raw = parseFloat(raw.toFixed(2));
  course.grade.letter = letterGrade(course.grade.raw);
  course.grade.color = letterGradeColor(course.grade.letter);
  return course;
}

export function calculateGPA(grades) {
  const graded = grades.courses.filter((c) => c.grade.letter !== 'N/A');
  const n = graded.length || 1;
  grades.gpa = graded.reduce((s, c) => s + letterGPA(c.grade.letter, false, c.double), 0) / n;
  grades.wgpa = graded.reduce((s, c) => s + letterGPA(c.grade.letter, c.weighted, c.double), 0) / n;
  grades.gpa = parseFloat(grades.gpa.toFixed(2));
  grades.wgpa = parseFloat(grades.wgpa.toFixed(2));
  return grades;
}

export function updateGPA(grades, i, weighted) {
  grades.courses[i].weighted = weighted;
  return calculateGPA(grades);
}

export function addAssignment(course) {
  course.assignments.unshift({
    id: `custom-${Date.now()}`,
    name: 'New Assignment',
    grade: { letter: 'N/A', raw: NaN, color: 'gray' },
    points: { earned: 0, possible: 0 },
    date: { due: new Date(), assigned: new Date() },
    dueLabel: '',
    category: course.categories.length ? course.categories[0].name : 'N/A',
    notes: '',
    description: '',
    displayScore: '',
    custom: true,
  });
  return course;
}

export function delAssignment(course, assignmentId) {
  course.assignments.splice(assignmentId, 1);
  course.categories.forEach((_, i) => calculateCategory(course, i));
  calculateGrade(course);
  return course;
}

export function updateCategory(course, assignmentId, categoryIndex) {
  const cat = course.categories[categoryIndex];
  if (cat) course.assignments[assignmentId].category = cat.name;
  course.categories.forEach((_, i) => calculateCategory(course, i));
  calculateGrade(course);
  return course;
}

export function updateCourse(course, assignmentId, update, val) {
  const a = course.assignments[assignmentId];
  if (!a) return course;
  const v = Math.max(0, val || 0);
  if (update === 'earned') a.points.earned = v;
  else if (update === 'possible') a.points.possible = v;
  const pct = (a.points.possible > 0) ? (a.points.earned / a.points.possible) * 100 : NaN;
  a.grade.raw = parseFloat(pct.toFixed(2));
  a.grade.letter = letterGrade(pct);
  a.grade.color = letterGradeColor(a.grade.letter);
  const categoryId = course.categories.findIndex((c) => c.name === a.category);
  if (categoryId >= 0) calculateCategory(course, categoryId);
  calculateGrade(course);
  return course;
}

export function renameAssignment(course, assignmentId, name) {
  if (course.assignments[assignmentId]) course.assignments[assignmentId].name = name;
  return course;
}

/* ---------- Grade Optimizer (GradeMelon feature, correct & bounded) ---------- */
/* Finds combinations of points earned across categories ("points left" caps)
   that reach the desired grade, listing a spread of realistic solutions. */

export function optimizeGrade(course, desired, pointsLeft) {
  const cats = course.categories.map((c, i) => ({
    name: c.name,
    weight: c.weight,
    earned: c.points.earned || 0,
    possible: c.points.possible || 0,
    left: Math.max(0, pointsLeft[i] != null ? Number(pointsLeft[i]) || 0 : 0),
  }));
  const solutions = [];
  const seen = new Set();
  const MAX_SOLUTIONS = 24;
  const MAX_ITER = 120000;
  let iter = 0;

  const gradeFor = (extra) => {
    let total = 0, w = 0;
    cats.forEach((c, i) => {
      const e = c.earned + (extra[i] || 0);
      const p = c.possible + (pointsLeft[i] != null ? Number(pointsLeft[i]) || 0 : 0);
      if (p > 0) {
        const pct = (e / p) * 100;
        if (!isNaN(pct)) { total += pct * c.weight; w += c.weight; }
      } else if (c.possible > 0) {
        total += (c.earned / c.possible) * 100 * c.weight;
        w += c.weight;
      }
    });
    if (w === 0) return NaN;
    return parseFloat((total / w).toFixed(2));
  };

  const steps = (left) => {
    if (left <= 0) return [0];
    if (left <= 12) return Array.from({ length: left + 1 }, (_, k) => k); // integer steps
    const out = [];
    for (let k = 0; k <= left; k += Math.max(1, Math.round(left / 12))) out.push(k);
    if (out[out.length - 1] !== left) out.push(left);
    return out;
  };

  const dfs = (i, extra) => {
    if (solutions.length >= MAX_SOLUTIONS || iter > MAX_ITER) return;
    if (i === cats.length) {
      iter++;
      const g = gradeFor(extra);
      if (!isNaN(g) && g >= desired) {
        const key = extra.map((x) => x).join(',');
        if (!seen.has(key)) {
          seen.add(key);
          solutions.push({ points: [...extra], grade: g });
        }
      }
      return;
    }
    for (const step of steps(cats[i].left)) {
      dfs(i + 1, [...extra, step]);
      if (solutions.length >= MAX_SOLUTIONS) return;
    }
  };
  dfs(0, []);

  // Sort: prefer doing the least work first (fewest total points), then highest grade
  solutions.sort((a, b) => (a.points.reduce((s, x) => s + x, 0)) - (b.points.reduce((s, x) => s + x, 0)) || b.grade - a.grade);
  return solutions;
}
