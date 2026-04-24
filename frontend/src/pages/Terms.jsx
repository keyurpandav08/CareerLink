import { Link } from 'react-router-dom';
import { BookOpen, FileCheck2, Scale, ShieldCheck, Users, BriefcaseBusiness } from 'lucide-react';
import './ContentPage.css';

const Terms = () => {
  return (
    <section className="info-page">
      <div className="info-shell">
        <header className="info-hero">
          <div>
            <span className="info-kicker">Platform usage rules</span>
            <h1>Terms of Use</h1>
            <p>
              These terms describe how CareerLink should be used by applicants, employers, and visitors. They
              are written to keep the platform fair, secure, and useful for everyone.
            </p>
          </div>

          <div className="info-hero-meta">
            <strong>Last updated</strong>
            <span>April 2026</span>
          </div>
        </header>

        <div className="info-grid">
          <article className="info-card">
            <div className="info-pill-row">
              <span className="info-pill">Account safety</span>
              <span className="info-pill">Fair usage</span>
              <span className="info-pill">Content ownership</span>
            </div>

            <section className="info-section">
              <h3><Scale size={18} /> Eligibility and account responsibility</h3>
              <p>
                You must provide accurate account details and keep your login credentials secure. You are
                responsible for activity that happens under your account.
              </p>
            </section>

            <section className="info-section">
              <h3><BriefcaseBusiness size={18} /> Using the platform</h3>
              <ul className="info-list">
                <li>Use CareerLink only for lawful recruitment and job-search activity</li>
                <li>Do not submit spam, false profiles, or misleading job posts</li>
                <li>Employers should only contact candidates for genuine hiring needs</li>
                <li>Applicants should keep resumes and application details current</li>
              </ul>
            </section>

            <section className="info-section">
              <h3><FileCheck2 size={18} /> Applications and resume use</h3>
              <p>
                CareerLink does not guarantee placement or interview outcomes. We provide tools to store resumes,
                apply for jobs, and review fit, but hiring decisions stay with the employer.
              </p>
            </section>

            <section className="info-section">
              <h3><Users size={18} /> Visibility and access</h3>
              <p>
                Profile visibility settings control who can view your candidate information. Employers can only
                access data that is available through the platform workflow and your current account settings.
              </p>
            </section>

            <section className="info-section">
              <h3><ShieldCheck size={18} /> Suspension and changes</h3>
              <p>
                We may suspend accounts that violate these terms or compromise platform integrity. We can also
                update these terms from time to time, and continued use means you accept the updated version.
              </p>
            </section>

            <section className="info-section">
              <h3><BookOpen size={18} /> Governing law</h3>
              <p>
                These terms are interpreted according to applicable law and are meant to support a professional
                and respectful hiring environment.
              </p>
            </section>
          </article>

          <aside className="info-side">
            <div className="info-side-card">
              <h3>Need help with these terms?</h3>
              <p>Our support team can answer account or policy questions.</p>
              <div className="info-cta">
                <Link to="/contact" className="info-button">Contact Support</Link>
                <Link to="/privacy-policy" className="info-button-secondary">Privacy Policy</Link>
              </div>
            </div>

            <div className="info-side-card">
              <h3>Key reminders</h3>
              <ul>
                <li>Keep your profile accurate</li>
                <li>Use the resume manager to replace outdated files</li>
                <li>Delete your account from Settings if you no longer want to use CareerLink</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Terms;
