import { Link } from 'react-router-dom';
import { Shield, Clock3, Database, FileText, Lock, Mail } from 'lucide-react';
import './ContentPage.css';

const PrivacyPolicy = () => {
  return (
    <section className="info-page">
      <div className="info-shell">
        <header className="info-hero">
          <div>
            <span className="info-kicker">Privacy and data protection</span>
            <h1>Privacy Policy</h1>
            <p>
              CareerLink is built to help candidates and employers connect safely. This policy explains what we
              collect, why we collect it, and how you can control your data.
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
              <span className="info-pill">Resume data</span>
              <span className="info-pill">Account security</span>
              <span className="info-pill">Recruiter access</span>
            </div>

            <section className="info-section">
              <h3><Database size={18} /> Information we collect</h3>
              <p>
                We collect the details you choose to add to your profile, including your name, email address,
                phone number, resume, education, experience, skills, and job application history. We also record
                basic usage data to keep the platform working smoothly.
              </p>
            </section>

            <section className="info-section">
              <h3><FileText size={18} /> How we use it</h3>
              <ul className="info-list">
                <li>To create and maintain your account</li>
                <li>To match you with relevant jobs and recruiter workflows</li>
                <li>To analyze uploaded resumes and provide career insights</li>
                <li>To send application updates, password reset emails, and support replies</li>
              </ul>
            </section>

            <section className="info-section">
              <h3><Shield size={18} /> Protection and access</h3>
              <p>
                Access to sensitive profile data is restricted to authenticated users and authorized employer
                workflows. Resume files are stored on the server and are served only to the account owner or
                authorized recruiters where applicable.
              </p>
            </section>

            <section className="info-section">
              <h3><Clock3 size={18} /> Retention and deletion</h3>
              <p>
                Resume files and profile records remain available until you delete them or request account removal.
                You can update your profile and replace your resume at any time from the app.
              </p>
            </section>

            <section className="info-section">
              <h3><Lock size={18} /> Cookies and sessions</h3>
              <p>
                We use sessions and browser storage to keep you signed in and to preserve your workspace settings.
                You can clear local storage or sign out from the app whenever you want.
              </p>
            </section>
          </article>

          <aside className="info-side">
            <div className="info-side-card">
              <Mail size={18} />
              <h3>Questions about privacy?</h3>
              <p>Reach the support inbox if you want to review, correct, or delete your data.</p>
              <Link to="/contact" className="info-button">Contact Support</Link>
            </div>

            <div className="info-side-card">
              <h3>Your rights</h3>
              <ul>
                <li>View and update your account information</li>
                <li>Replace your resume whenever you need to</li>
                <li>Delete your account from Settings</li>
                <li>Request clarification on any retained data</li>
              </ul>
            </div>

            <div className="info-side-card">
              <h3>Quick summary</h3>
              <p>
                We use your data to power job matching, resume storage, and account security. We do not sell your
                personal information.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
