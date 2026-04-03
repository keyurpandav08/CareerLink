import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  FileUp,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import googleLogo from '../assets/logo/companies/Google.png';
import amazonLogo from '../assets/logo/companies/Amazon.png';
import infosysLogo from '../assets/logo/companies/Infosys.png';
import tcsLogo from '../assets/logo/companies/TCS.png';
import microsoftLogo from '../assets/logo/companies/Microsoft.png';
import sitingmanLogo from '../assets/siting-man-transparent.png';
import './Home.css';

const platformStats = [
  { label: 'Active users', value: 10000, suffix: '+' },
  { label: 'Top companies', value: 500, suffix: '+' },
  { label: 'Curated jobs', value: 1000, suffix: '+' }
];

const experienceOptions = [
  'Experience level',
  'Internship',
  'Entry level',
  '1-3 years',
  '3-5 years'
];

const featureCards = [
  {
    icon: ShieldCheck,
    title: 'Verified hiring teams',
    description: 'Every employer profile is reviewed so candidates spend time on real opportunities.'
  },
  {
    icon: Sparkles,
    title: 'Cleaner job discovery',
    description: 'Search by role, skill, company, or city and surface the most relevant openings faster.'
  },
  {
    icon: TrendingUp,
    title: 'Track momentum',
    description: 'Keep applications, shortlist movement, and interview progress in one place.'
  }
];

const workflowSteps = [
  {
    step: '01',
    title: 'Build your profile once',
    description: 'Add your skills, projects, resume, and preferred cities to unlock better matches.'
  },
  {
    step: '02',
    title: 'Apply with confidence',
    description: 'Use one polished profile to apply to verified roles without repeating the same details.'
  },
  {
    step: '03',
    title: 'Follow every update',
    description: 'See when your application is reviewed, shortlisted, or moved into the next stage.'
  }
];

const categoryCards = [
  {
    title: 'Product & Tech',
    meta: 'Frontend, backend, AI, QA',
    hires: '2.8k roles'
  },
  {
    title: 'Operations',
    meta: 'Analyst, support, strategy',
    hires: '1.6k roles'
  },
  {
    title: 'Growth & Marketing',
    meta: 'SEO, social, performance',
    hires: '1.2k roles'
  },
  {
    title: 'Finance & Admin',
    meta: 'Accounts, audit, payroll',
    hires: '900+ roles'
  }
];

const companyLogos = [
  { src: googleLogo, alt: 'Google' },
  { src: amazonLogo, alt: 'Amazon' },
  { src: infosysLogo, alt: 'Infosys' },
  { src: tcsLogo, alt: 'TCS' },
  { src: microsoftLogo, alt: 'Microsoft' }
];

const Home = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Experience level');
  const [animatedStats, setAnimatedStats] = useState(
    platformStats.map(() => 0)
  );
  const navigate = useNavigate();

  useEffect(() => {
    const timers = platformStats.map((stat, index) => {
      let current = 0;
      const step = stat.value / 90;

      return window.setInterval(() => {
        current += step;

        setAnimatedStats((prev) => {
          const next = [...prev];
          next[index] = current >= stat.value ? stat.value : Math.floor(current);
          return next;
        });

        if (current >= stat.value) {
          window.clearInterval(timers[index]);
        }
      }, 18);
    });

    return () => timers.forEach((timer) => window.clearInterval(timer));
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (!searchKeyword.trim()) {
      return;
    }

    const params = new URLSearchParams({
      search: searchKeyword.trim()
    });

    if (experienceLevel !== 'Experience level') {
      params.set('experience', experienceLevel);
    }

    navigate(`/jobs?${params.toString()}`);
    setSearchKeyword('');
  };

  return (
    <div className="home-shell">
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <span className="home-kicker">The curator&apos;s choice</span>

            <h1>
              Find Your Dream Job with <span>JobLithic</span>
            </h1>

            <p className="home-hero-text">
              Search thousands of verified jobs, apply instantly, and track your career growth all in one place.
            </p>

            <form onSubmit={handleSearchSubmit} className="home-search">
              <div className="home-search-panel">
                <label className="home-search-field" htmlFor="home-search-input">
                  <Search size={18} />
                  <input
                    id="home-search-input"
                    type="text"
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder="e.g. Product Designer"
                  />
                </label>

                <label className="home-search-filter" htmlFor="home-experience-select">
                  <select
                    id="home-experience-select"
                    value={experienceLevel}
                    onChange={(event) => setExperienceLevel(event.target.value)}
                  >
                    {experienceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button type="submit" className="home-search-button">
                Search
              </button>
            </form>

            <div className="home-hero-support">
              <Link to="/resume-builder" className="home-upload-link">
                <FileUp size={16} />
                Upload Resume
              </Link>

              <div className="home-social-proof">
                <div className="home-avatar-stack" aria-hidden="true">
                  <span className="home-avatar home-avatar-a">A</span>
                  <span className="home-avatar home-avatar-b">N</span>
                  <span className="home-avatar home-avatar-c">R</span>
                </div>
                <span className="home-social-proof-text">Trusted by students and early professionals</span>
              </div>
            </div>

            <div className="home-hero-actions">
              <Link to="/register" className="btn-primary-glow home-primary-action">
                Create account
                <ArrowRight size={18} />
              </Link>
              <Link to="/jobs" className="btn-outline home-secondary-action">
                Explore openings
              </Link>
            </div>
          </div>

          <div className="home-hero-visual">
            <div className="home-hero-illustration">
              <div className="home-hero-visual-bg" />
              <div className="home-hero-dot home-hero-dot-one" />
              <div className="home-hero-dot home-hero-dot-two" />
              <img className="home-hero-image" src={sitingmanLogo} alt="Person working at a hiring dashboard" />
            </div>
          </div>
        </div>
      </section>

      <section className="home-stats">
        <div className="container home-stats-grid">
          {platformStats.map((stat, index) => (
            <article key={stat.label} className="home-stat-card">
              <strong>
                {animatedStats[index].toLocaleString()}
                {stat.suffix}
              </strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="home-brands">
        <div className="container home-brands-panel">
          <div className="home-brands-copy">
            <p>Trusted by teams hiring across technology, services, and global operations.</p>
          </div>
          <div className="home-brands-row">
            {companyLogos.map((company) => (
              <div key={company.alt} className="home-brand-chip">
                <img src={company.src} alt={company.alt} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-features">
        <div className="container">
          <div className="home-section-heading">
            <span>Why it feels better</span>
            <h2>A fresher landing page built around clarity, not clutter.</h2>
          </div>

          <div className="home-feature-grid">
            {featureCards.map(({ icon: Icon, title, description }) => (
              <article key={title} className="home-feature-card">
                <div className="home-feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-showcase">
        <div className="container home-showcase-grid">
          <div className="home-showcase-copy">
            <span>Role discovery</span>
            <h2>Browse focused categories instead of getting lost in noisy listings.</h2>
            <p>
              Each category groups the roles candidates actually search for most, making it easier to move from
              exploration to application.
            </p>
            <Link to="/jobs" className="home-inline-link">
              View all categories
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="home-category-grid">
            {categoryCards.map((category) => (
              <article key={category.title} className="home-category-card">
                <h3>{category.title}</h3>
                <p>{category.meta}</p>
                <span>{category.hires}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-process">
        <div className="container">
          <div className="home-section-heading home-section-heading-centered">
            <span>How it works</span>
            <h2>Move from profile setup to interview momentum in three simple steps.</h2>
          </div>

          <div className="home-process-grid">
            {workflowSteps.map((item) => (
              <article key={item.step} className="home-process-card">
                <span className="home-process-step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div className="container">
          <div className="home-cta-panel">
            <div>
              <span>Ready to get started?</span>
              <h2>Set up your profile and start applying with a sharper first impression.</h2>
            </div>

            <div className="home-cta-actions">
              <Link to="/register" className="btn-primary-glow home-primary-action">
                Join JobLithic
                <ArrowRight size={18} />
              </Link>
              <Link to="/jobs" className="btn-outline home-secondary-action">
                Browse live jobs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
