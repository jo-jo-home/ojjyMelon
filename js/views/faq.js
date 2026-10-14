import { escapeHTML } from '../ui.js';

const QA = [
  ['What is ojjyMelon?',
   'ojjyMelon is a free third-party web app for viewing and calculating your grades from Synergy StudentVUE — the grade portal used by MCPS and hundreds of other US school districts. It is a tribute clone of the beloved GradeMelon, re-themed in blue and rebuilt to work with the new Synergy servers.'],
  ['Is ojjyMelon an app?',
   'It is an installable web app (PWA). On your phone, use your browser\'s "Add to Home Screen" (or the install button) and it will behave like a native app, including working offline for pages you\'ve already visited.'],
  ['Is it safe to sign in with my school password?',
   'Your password is used only to sign in to your district\'s StudentVUE server, exactly like the official app. Credentials are kept in your browser only — never on our servers (there are no servers). If you skip "Remember me", nothing is stored after you sign out. See the Privacy page for details.'],
  ['Which school districts are supported?',
   'Any district that runs Synergy StudentVUE — pick yours in the district picker on the login screen (search by zip code). MCPS is the default.'],
  ['How does the grade calculator work?',
   'Grades in ojjyMelon are live: change any assignment score and your category and overall grades recalculate instantly. These what-if changes happen only on your device and are never sent to your school.'],
  ['What is the Grade Optimizer?',
   'Tell it the grade you want and how many ungraded points remain in each category, and it lists realistic point combinations that get you there — "what do I need on the rest of the quarter?"'],
  ['How is GPA calculated?',
   'GPA uses MCPS quality points (A=4, B=3, C=2, D=1, E=0). Weighted GPA adds +1.0 for grades of A, B, and C in honors, AP, and IB courses, matching MCPS policy. Both are estimates of your current marking period, not your official transcript GPA.'],
  ['Why is it called ojjyMelon?',
   'It is a blueberry-flavored homage to GradeMelon. Same idea, different melon.'],
  ['Who\'s behind ojjyMelon?',
   'A student, for students. The full source is available on GitHub — contributions and bug reports are welcome.'],
  ['Grades look different from StudentVUE. Why?',
   'StudentVUE sometimes shows the posted grade, while ojjyMelon recalculates your grade from individual assignment scores (skipping empty categories) — the same approach GradeMelon used. Small rounding differences are normal.'],
];

export function renderFaq(view) {
  view.innerHTML = `
    <h2 class="toolbar-title">FAQ & Info</h2>
    <p class="toolbar-sub">Answers to common questions about ojjyMelon.</p>
    <div style="max-width:760px">
      ${QA.map(([q, a], i) => `
        <details class="card" style="margin-bottom:12px;padding:0">
          <summary style="cursor:pointer;padding:16px 20px;font-weight:800;list-style:none;display:flex;align-items:center;gap:10px">
            <span style="color:var(--primary-500)">Q${i + 1}.</span> ${escapeHTML(q)}
          </summary>
          <div style="padding:0 20px 18px;color:var(--text-soft);line-height:1.65;font-size:.92rem">${escapeHTML(a)}</div>
        </details>`).join('')}
    </div>`;
}
