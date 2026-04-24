import { Link } from 'react-router-dom';
import { BookOpen, Briefcase, LineChart, Network, Target, ArrowRight } from 'lucide-react';
import './CareerAdvice.css';

const adviceItems = [
  {
    icon: Briefcase,
    title: 'Choose roles with a real fit',
    text: 'Match your background to the role description, not just the title. A tight fit improves your callback rate.'
  },
  {
    icon: LineChart,
    title: 'Build evidence, not just skills',
    text: 'Add measurable outcomes to your profile and resume. Numbers make your work easier for recruiters to trust.'
  },
  {
    icon: Network,
    title: 'Treat networking like a system',
    text: 'Set a routine for outreach, follow-ups, and portfolio updates so your job search keeps moving.'
  },
  {
    icon: Target,
    title: 'Set a target for every week',
    text: 'Apply, improve, and review. Small weekly goals create more momentum than one big push.'
  }
];

const CareerAdvice = () => {
  return (
    <section className="career-page">
      <div className="career-shell">
        <header className="career-hero">
          <div>
            <span className="career-kicker">Career growth playbook</span>
            <h1>Career Advice</h1>
            <p>
              Use these practical tips to improve your profile, sharpen your applications, and move toward roles
              that are more aligned with your goals.
            </p>
          </div>

          <div className="career-hero-meta">
            <strong>Focus areas</strong>
            <span>Planning, visibility, and skill growth</span>
          </div>
        </header>

        <div className="career-grid">
          <article className="career-card">
            <div className="career-card-head">
              <BookOpen size={18} />
              <h2>Practical habits that help</h2>
            </div>

            <div className="career-list">
              {adviceItems.map((item) => {
                const Icon = item.icon;

                return (
                  <section key={item.title} className="career-item">
                    <div className="career-item-icon">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </section>
                );
              })}
            </div>
          </article>

          <aside className="career-side">
            <div className="career-side-card">
              <h3>Next steps</h3>
              <ul>
                <li>Update your profile summary with specific results</li>
                <li>Upload the latest resume version and reuse it everywhere</li>
                <li>Review interview tips before every application sprint</li>
              </ul>
              <Link to="/resume-builder" className="career-link">
                Review your resume <ArrowRight size={16} />
              </Link>
            </div>

            <div className="career-side-card muted">
              <h3>Want more help?</h3>
              <p>Use the contact page to send a question or request support from the official team inbox.</p>
              <Link to="/contact" className="career-secondary-link">Contact support</Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default CareerAdvice;
