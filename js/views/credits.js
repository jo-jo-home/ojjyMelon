import { escapeHTML } from '../ui.js';

export function renderCredits(view) {
  view.innerHTML = `
  <div style="max-width:720px">
    <h2 class="toolbar-title">Credits 💙</h2>
    <p class="toolbar-sub">The people behind ojjyMelon.</p>

    <div class="card" style="margin-bottom:18px;text-align:center;padding:36px 24px">
      <div style="font-size:2rem;margin-bottom:10px">🫐</div>
      <h3 style="margin:0 0 6px;font-size:1.5rem">Made by Jonas, Jayden's brother :) ❤️</h3>
      <p style="margin:0;color:var(--text-soft);font-size:.92rem">Built for students, by a student.</p>
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3 style="margin:0 0 8px;font-size:1.05rem">💡 The idea</h3>
      <p style="margin:0 0 10px;color:var(--text-soft);line-height:1.65;font-size:.92rem">
        <b>Jayden</b> — my brother — thank you bro 🙏 for giving me the idea for making this in the first place.
        ojjyMelon exists because of you.
      </p>
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3 style="margin:0 0 8px;font-size:1.05rem">🌟 Special thanks</h3>
      <p style="margin:0 0 10px;color:var(--text-soft);line-height:1.65;font-size:.92rem">
        <b>The Fool</b> — for the general advice along the way. Without him, this could not have been possible.
      </p>
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3 style="margin:0 0 8px;font-size:1.05rem">🧱 Built on the shoulders of</h3>
      <ul style="margin:0;padding-left:20px;color:var(--text-soft);line-height:1.9;font-size:.92rem">
        <li><b>GradeMelon</b> by Tinu Vanapamula — the original. ojjyMelon is a tribute clone; all the feature ideas came from his creation.</li>
        <li><b>svue-api</b> by Zillorz — the public grade relay that powers the zero-setup connection, and the version-key service.</li>
        <li><b>StudentVue/docs</b> — the community reverse-engineering documentation that made the new Synergy protocol possible to understand.</li>
        <li>Every student who reported a bug or shared an idea. You know who you are 💙</li>
      </ul>
    </div>

    <div class="card">
      <h3 style="margin:0 0 8px;font-size:1.05rem">📜 Disclaimer</h3>
      <p style="margin:0;color:var(--text-soft);line-height:1.65;font-size:.92rem">
        ojjyMelon is a third-party, unofficial tool and is not affiliated with, endorsed by, or connected to
        Edupoint Educational Systems, Synergy, or Montgomery County Public Schools. StudentVUE is a registered
        trademark of Edupoint.
      </p>
    </div>

    <p class="muted" style="font-size:.8rem;margin-top:18px">Made with ❤️ and blueberries.</p>
  </div>`;
}
