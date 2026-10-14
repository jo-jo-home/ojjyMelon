export function renderPrivacy(view) {
  view.innerHTML = `
  <div style="max-width:760px">
    <h2 class="toolbar-title">Privacy</h2>
    <p class="toolbar-sub">The short version: your data stays in your browser.</p>

    <div class="card" style="margin-bottom:18px">
      <h3 style="margin:0 0 8px;font-size:1.05rem">What ojjyMelon stores</h3>
      <p style="margin:0 0 10px;color:var(--text-soft);line-height:1.65;font-size:.92rem">
        ojjyMelon has <b>no servers and no database</b>. Your student ID, password, and grades
        exist only in your browser's memory while you use the app. If you check
        <b>Remember me</b>, your credentials are saved in this browser's local storage
        (lightly obfuscated, not encrypted) so you stay signed in — uncheck it or press
        Sign out and nothing is kept. Theme and layout preferences are also stored locally.
      </p>
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3 style="margin:0 0 8px;font-size:1.05rem">Where your data travels</h3>
      <p style="margin:0 0 10px;color:var(--text-soft);line-height:1.65;font-size:.92rem">
        To show your grades, ojjyMelon must talk to your school district's StudentVUE
        server — the same one the official app uses, at <span class="kbd">md-mcps-psv.edupoint.com</span>.
        Browsers cannot call that server directly (it does not allow cross-site requests), so
        ojjyMelon relays requests one of two ways: through a small <b>public relay</b> (no setup
        needed; your credentials pass through that third-party service the same way they did
        with GradeMelon's proxy), or through <b>your own relay</b> — a ~80-line Cloudflare Worker
        you deploy yourself in two minutes (see the GitHub README), which forwards and immediately
        forgets your request. Nothing is logged, stored, or shared by ojjyMelon itself either way.
        Your credentials are never written back to your gradebook: score edits are local what-if
        simulations only.
      </p>
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3 style="margin:0 0 8px;font-size:1.05rem">What ojjyMelon does NOT do</h3>
      <ul style="margin:0;padding-left:20px;color:var(--text-soft);line-height:1.8;font-size:.92rem">
        <li>No ads, no trackers, no analytics, no third-party scripts (except the Chart.js CDN for graphs and Google Fonts).</li>
        <li>No selling or sharing of any data — there is nothing to sell.</li>
        <li>No writing back to your gradebook: score edits are local what-if simulations only.</li>
      </ul>
    </div>

    <div class="card">
      <h3 style="margin:0 0 8px;font-size:1.05rem">Disclaimer</h3>
      <p style="margin:0;color:var(--text-soft);line-height:1.65;font-size:.92rem">
        ojjyMelon is a third-party, unofficial tool and is not affiliated with, endorsed by, or
        connected to Edupoint Educational Systems, Synergy, or Montgomery County Public Schools.
        StudentVUE is a registered trademark of Edupoint. Use your school account's data
        responsibly and follow your school's acceptable-use policies.
      </p>
    </div>

    <p class="muted" style="font-size:.8rem;margin-top:18px">Questions? Open an issue on the <a href="https://github.com/jo-jo-home/ojjyMelon" target="_blank" rel="noopener">GitHub repository</a>.</p>
  </div>`;
}
