import { escapeHTML } from '../ui.js';

export function renderHome(view) {
  view.innerHTML = `
  <section class="hero">
    <div>
      <div class="badge-row">
        <span class="badge">🫐 Blue-raspberry edition</span>
        <span class="badge">Built for MCPS</span>
      </div>
      <h1>Stay in control<br>of your <span style="color:var(--primary-600)">grades</span>.</h1>
      <p class="tagline">ojjyMelon is a free, open, third-party alternative to StudentVUE. Sign in with your school account to check your grades, calculate what you need on the next assignment, view your schedule and attendance, and download your report cards — all in a clean, fast interface.</p>
      <div class="badge-row" style="gap:12px">
        <a href="#/login" class="btn btn-primary btn-lg">Get started</a>
        <a href="#/grades?guest=true" class="btn btn-secondary btn-lg">Login as guest</a>
      </div>
    </div>
    <div class="hero-art">
      <img src="assets/img/hero.svg" alt="ojjyMelon app preview" style="width:100%">
    </div>
  </section>

  <section class="section" id="features">
    <h2 class="section-title">Features</h2>
    <p class="section-sub">Everything the original GradeMelon offered, rebuilt for the new Synergy — and themed in blue.</p>
    <div class="features-grid">
      <div class="card feature-card">
        <div class="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div>
        <h3>Edit your grades</h3>
        <p>Change any score and instantly see how it affects your category and overall class grade. Add upcoming assignments before teachers post them.</p>
      </div>
      <div class="card feature-card">
        <div class="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></div>
        <h3>Grade Optimizer</h3>
        <p>Pick the grade you want and see exactly what you need to earn on the remaining work in each category to get there.</p>
      </div>
      <div class="card feature-card">
        <div class="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        <h3>View your schedule</h3>
        <p>Your class schedule for every term of the year, with rooms and teacher emails.</p>
      </div>
      <div class="card feature-card">
        <div class="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 5.5H2v13h20z"/><path d="M2 10.5h20"/><path d="M9 5.5v13"/><path d="M15 5.5v13"/></svg></div>
        <h3>Check your attendance</h3>
        <p>See absences and tardies per period in a bar graph, plus a day-by-day table.</p>
      </div>
      <div class="card feature-card">
        <div class="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
        <h3>View documents</h3>
        <p>Look at and download report cards, progress reports, and assessment results as PDFs.</p>
      </div>
      <div class="card feature-card">
        <div class="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></div>
        <h3>Dark mode</h3>
        <p>Easy on the eyes at 1 a.m. the night before grades close. Toggle it on any page.</p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="opensource-band">
      <h2>Open source</h2>
      <p>ojjyMelon is committed to transparency. The entire site runs in your browser — your credentials are only used to talk to your school's StudentVUE server, and you can read every line of code before you sign in.</p>
      <a class="btn" href="https://github.com/jo-jo-home/ojjyMelon" target="_blank" rel="noopener">View the source</a>
    </div>
  </section>

  <section class="section">
    <h2 class="section-title">Privacy Policy</h2>
    <p class="section-sub">Your data stays in your browser — no servers, no trackers, no databases. Read exactly how it works.</p>
    <a href="#/privacy" class="btn btn-secondary">Read the privacy policy</a>
  </section>

  <section class="section">
    <h2 class="section-title">FAQ</h2>
    <p class="section-sub">Have questions? Check out the FAQ page for answers to common questions.</p>
    <a href="#/faq" class="btn btn-secondary">Open the FAQ</a>
  </section>

  <section class="section">
    <h2 class="section-title">Contact</h2>
    <p class="section-sub">Found a bug or have a suggestion? Feel free to reach out!</p>
    <a class="btn btn-secondary" href="https://github.com/jo-jo-home/ojjyMelon/issues" target="_blank" rel="noopener">Open a GitHub issue</a>
  </section>

  <section class="section">
    <h2 class="section-title">Credits 💙</h2>
    <p class="section-sub">Big thanks to <b>Jayden</b> — my brother — for giving me the idea for making this. Thank you bro 🙏
    And to <b>The Fool</b> for the general advice — without him, this could not have been possible.</p>
    <a href="#/credits" class="btn btn-secondary">See all credits →</a>
  </section>

  <footer class="footer">
    <span>© ${new Date().getFullYear()} ojjyMelon — Made by Jonas, Jayden's brother :) ❤️ — a third-party tool. Not affiliated with Edupoint, Synergy, or MCPS. StudentVUE is a trademark of Edupoint.</span>
    <span><a href="#/credits">Credits 💙</a> · <a href="#/privacy">Privacy</a> · <a href="#/faq">FAQ</a> · <a href="#/login">Sign in</a></span>
  </footer>`;
}
