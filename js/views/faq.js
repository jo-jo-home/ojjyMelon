import { escapeHTML } from '../ui.js';

const INSTALL_STEPS_HTML = `
  <p>Yes, ojjyMelon is a PWA (Progressive Web App).</p>
  <p><b>To add ojjyMelon to your Home Screen, follow these steps:</b></p>
  <p style="margin:8px 0 4px"><b>Apple iPhone/iPad</b></p>
  <ul style="margin:0 0 10px;padding-left:22px;line-height:1.8">
    <li>Open ojjyMelon in Safari</li>
    <li>Tap the Share button in the bottom bar</li>
    <li>Tap "Add to Home Screen"</li>
  </ul>
  <p style="margin:8px 0 4px"><b>Android</b></p>
  <ul style="margin:0;padding-left:22px;line-height:1.8">
    <li>Open ojjyMelon in Chrome</li>
    <li>Tap the 3 dots in the top right corner</li>
    <li>Tap "Add to Home Screen"</li>
  </ul>
  <p>On a computer, click the install icon in the address bar (or the install button in ojjyMelon's top bar).</p>`;

const QA = [
  ['What is ojjyMelon?',
   'ojjyMelon is a free third-party web app for viewing and calculating your grades from Synergy StudentVUE — the grade portal used by MCPS and hundreds of other US school districts. It is a tribute clone of the beloved GradeMelon, re-themed in blue and rebuilt to work with the new Synergy servers.'],
  ['Is ojjyMelon an app?', null, true], // filled with INSTALL_STEPS_HTML
  ['How do I send feedback regarding ojjyMelon?',
   'Open a GitHub issue on the repository — bug reports and suggestions are super welcome, and you can read (and even improve) every line of the code yourself.'],
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
  ['I can\'t sign in on my school Chromebook.',
   'MCPS Chromebooks run the county web filter, which blocks the third-party connections ojjyMelon needs — the same filter blocked GradeMelon itself on Chromebooks. Use a personal device (your phone, or Chrome on a home computer) and it will work. You can see exactly what your network blocks in Settings → Connection check.'],
];

export function renderFaq(view, params) {
  const openApp = params && params.get('refer') === 'app';
  view.innerHTML = `
    <h2 class="toolbar-title">FAQ & Info</h2>
    <p class="toolbar-sub">Answers to common questions about ojjyMelon.</p>
    <div style="max-width:760px">
      ${QA.map(([q, a, isInstall], i) => `
        <details class="card" style="margin-bottom:12px;padding:0" ${isInstall && openApp ? 'open' : ''}>
          <summary style="cursor:pointer;padding:16px 20px;font-weight:800;list-style:none;display:flex;align-items:center;gap:10px">
            <span style="color:var(--primary-500)">Q${i + 1}.</span> ${escapeHTML(q)}
          </summary>
          <div style="padding:0 20px 18px;color:var(--text-soft);line-height:1.65;font-size:.92rem">${isInstall ? INSTALL_STEPS_HTML : escapeHTML(a)}</div>
        </details>`).join('')}
    </div>`;
}
