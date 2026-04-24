import { Link } from 'react-router-dom';
import { Brain, Clock3, MessageSquare, Mic, ShieldCheck, Target, ArrowRight } from 'lucide-react';
import './InterviewTips.css';

const interviewItems = [
  {
    icon: Brain,
    title: 'Research the company like a product',
    text: 'Learn the company mission, products, competitors, and recent news so your answers feel informed and relevant.'
  },
  {
    icon: Target,
    title: 'Tailor answers to the role',
    text: 'Prepare examples that match the job description and use the STAR method for clear, structured answers.'
  },
  {
    icon: Clock3,
    title: 'Plan the interview day',
    text: 'Join early, test your setup, and keep a few notes ready so you can stay calm and focused.'
  },
  {
    icon: ShieldCheck,
    title: 'Show confidence with clarity',
    text: 'Speak clearly, keep eye contact, and keep your answers concise while still showing ownership of your work.'
  },
  {
    icon: MessageSquare,
    title: 'Ask thoughtful questions',
    text: 'Ask about the team structure, success metrics, and what great performance looks like in the first 90 days.'
  }
];

const InterviewTips = () => {
  return (
    <section className="interview-page">
      <div className="interview-shell">
        <header className="interview-hero">
          <div>
            <span className="interview-kicker">Interview preparation</span>
            <h1>Interview Tips</h1>
            <p>
              A strong interview is usually the result of preparation, clear stories, and good questions. Use this
              checklist to enter each interview with more confidence.
            </p>
          </div>

          <div className="interview-hero-meta">
            <strong>Prep goal</strong>
            <span>Sound clear, confident, and ready</span>
          </div>
        </header>

        <div className="interview-grid">
          <article className="interview-card">
            <div className="interview-list">
              {interviewItems.map((item) => {
                const Icon = item.icon;

                return (
                  <section key={item.title} className="interview-item">
                    <div className="interview-item-icon">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h2>{item.title}</h2>
                      <p>{item.text}</p>
                    </div>
                  </section>
                );
              })}
            </div>
          </article>

          <aside className="interview-side">
            <div className="interview-side-card">
              <Mic size={18} />
              <h3>Before the call</h3>
              <ul>
                <li>Test your camera and microphone</li>
                <li>Keep the job description open</li>
                <li>Have 2 or 3 project examples ready</li>
              </ul>
            </div>

            <div className="interview-side-card">
              <h3>After the interview</h3>
              <p>Send a short thank-you note, review what went well, and update your resume with any new keywords.</p>
              <Link to="/resume-builder" className="interview-link">
                Improve your resume <ArrowRight size={16} />
              </Link>
            </div>

            <div className="interview-side-card muted">
              <h3>Need help?</h3>
              <p>Use the contact page to reach the official support inbox for application or profile questions.</p>
              <Link to="/contact" className="interview-secondary-link">Contact support</Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default InterviewTips;
