import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {TrendingUp,ArrowRight,Search,ShieldCheck,MousePointerClick,BarChart3,Laptop,Briefcase,HeartPulse,Building2,ArrowUp
} from 'lucide-react';
import googleLogo from '../assets/logo/companies/Google.png';
import amazonLogo from '../assets/logo/companies/Amazon.png';
import infosysLogo from '../assets/logo/companies/Infosys.png';
import tcsLogo from '../assets/logo/companies/TCS.png';
import microsoftLogo from '../assets/logo/companies/Microsoft.png';
import heroMan from '../assets/job-man-stand.jpeg';
import './Home.css';

const Home = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const navigate = useNavigate();
    // ===== Animated Counters =====
    const [jobsCount, setJobsCount] = useState(0);
    const [companyCount, setCompanyCount] = useState(0);
    const [studentCount, setStudentCount] = useState(0);
    const [successRate, setSuccessRate] = useState(0);
    const [showTop, setShowTop] = useState(false);
    const [activeCategory, setActiveCategory] = useState("IT & Software");
    const categorySkills = {
        "IT & Software": [
          "React.js",
          "Node.js",
          "Spring Boot",
          "Python",
          "AI / ML"
        ],
        Marketing: [
          "Meta Ads",
          "Content Marketing",
          "Email Marketing",
          "Analytics"
        ],
        Finance: [
          "Tally",
          "GST Filing",
          "Financial Accounting"
        ],
        Healthcare: [
          "Radiology",
          "Pharmacy"
        ],
        Engineering: [
          "AutoCAD",
          "SolidWorks",
          "PLC"
        ]
      };

    useEffect(() => {
      const animateCounter = (setState, end, duration = 2000) => {
        let start = 0;
        const increment = end / (duration / 16);

        const counter = setInterval(() => {
          start += increment;
          if (start >= end) {
            setState(end);
            clearInterval(counter);
          } else {
            setState(Math.floor(start));
          }
        }, 16);
      };

      animateCounter(setJobsCount, 10000);
      animateCounter(setCompanyCount, 5000);
      animateCounter(setStudentCount, 25000);
      animateCounter(setSuccessRate, 95);
    }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword('');
    }
  };

useEffect(() => {
  const handleScroll = () => {
    if (window.scrollY > 300) {
      setShowTop(true);
    } else {
      setShowTop(false);
    }
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
  return (
    <div className="home-container">
      {/* Background blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      {/* ================= HERO ================= */}
     <section className="hero-section">
       <div className="container hero-flex">

         {/* LEFT CONTENT */}
         <div className="hero-left">

           <h2 className="hero-small-title">
             Your Next Opportunity Starts Here.
           </h2>

           <form onSubmit={handleSearchSubmit} className="hero-search-box">
             <div className="search-input-group">
               <Search size={22} style={{ color: 'var(--primary)' }} />
               <input
                 type="text"
                 value={searchKeyword}
                 onChange={(e) => setSearchKeyword(e.target.value)}
                 placeholder="Search roles, skills, companies, or cities..."
               />
             </div>

             <button type="submit" className="search-btn">
               Search
             </button>
           </form>

           <h1 className="hero-title">
             Find the <br /> Right Job Faster
           </h1>

           <p className="hero-subtitle">
             Discover verified job opportunities tailored to your skills and experience.
             Apply instantly and move one step closer to your ideal career.
           </p>

           <div className="hero-buttons">
             <Link to="/register" className="btn-primary-glow">
               Get Started
             </Link>
             <Link to="/jobs" className="btn-outline">
               Browse Jobs
             </Link>
           </div>

         </div>

         {/* RIGHT SIDE MAN */}
         <div className="hero-right">
           <img src={heroMan} alt="Job Seeker" />
           <div class="icons">
               <span class="icon i1">💻</span>
               <span class="icon i5">🧑‍💻</span>
               <span class="icon i4">📄</span>
               <span class="icon i2">📊</span>
               <span class="icon i3">💼</span>
             </div>
         </div>

       </div>
     </section>


      {/* ================= FEATURES ================= */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose JobLithic?</h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <ShieldCheck size={28} />
              </div>
              <h3>Verified Employers</h3>
              <p>Connect only with trusted and verified companies.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <MousePointerClick size={28} />
              </div>
              <h3>One-Click Apply</h3>
              <p>Apply instantly with your saved profile.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <TrendingUp size={28} />
              </div>
              <h3>Career Insights</h3>
              <p>Get salary insights and skill recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="how-section">
        <div className="container">
          <h2 className="section-title">How JobLithic Works</h2>

          <div className="how-grid">
            <div className="how-card">
              <div className="how-number">1</div>
              <h3>Create Your Profile</h3>
              <p>Build your professional profile in minutes.</p>
            </div>

            <div className="how-card">
              <div className="how-number">2</div>
              <h3>Apply to Verified Jobs</h3>
              <p>Explore trusted opportunities and apply easily.</p>
            </div>

            <div className="how-card">
              <div className="how-number">3</div>
              <h3>Get Hired Faster</h3>
              <p>Track applications and connect with employers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="about-section">
        <div className="container text-center">
          <h2 className="cta-title">Start Your Career Journey Today</h2>
          <p className="cta-subtitle">
            Create your profile, explore opportunities, and land your dream job faster.
          </p>

          <Link to="/register" className="cta-btn">
            Create Free Account
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ================= TOP COMPANIES ================= */}
      {/* TOP COMPANIES */}
      <section className="companies-section">
        <div className="container">
          <h2 className="section-title">Trusted by Leading Companies</h2>

          <div className="companies-grid">

            <div className="company-card">
              <img src={googleLogo} alt="Google" />
              <p>Google</p>
            </div>

            <div className="company-card">
              <img src={amazonLogo} alt="Amazon" />
              <p>Amazon</p>
            </div>

            <div className="company-card">
              <img src={infosysLogo} alt="Infosys" />
              <p>Infosys</p>
            </div>

            <div className="company-card">
              <img src={tcsLogo} alt="TCS" />
              <p>TCS</p>
            </div>

            <div className="company-card">
              <img src={microsoftLogo} alt="Microsoft" />
              <p>Microsoft</p>
            </div>

          </div>
        </div>
      </section>


      {/* ================= JOB CATEGORIES ================= */}
      <section style={{ padding: '5rem 0', background: 'var(--surface)' }}>
        <div className="container text-center">
          <h2 className="section-title animated-heading">Explore Job Categories</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            marginTop: '3rem'
          }}>
            <Category icon={<Laptop size={28} />} title="IT & Software" />
            <Category icon={<BarChart3 size={28} />} title="Marketing" />
            <Category icon={<Briefcase size={28} />} title="Finance" />
            <Category icon={<HeartPulse size={28} />} title="Healthcare" />
            <Category icon={<Building2 size={28} />} title="Engineering" />
          </div>
        </div>
      </section>
      {/* ===== TOP SKILLS IN DEMAND ===== */}
      <section className="skills-section">
        <div className="container text-center">

          <h2 className="section-title">🔥 Top Skills in Demand</h2>

          <div className="skills-grid">
            {Object.values(categorySkills)
              .flat()
              .map((skill, index) => (
                <button
                  key={index}
                  className="skill-pill"
                  onClick={() =>
                    navigate(`/jobs?skill=${encodeURIComponent(skill)}`)
                  }
                >
                  {skill}
                </button>
              ))}
          </div>

        </div>
      </section>



      {/* ===== PLATFORM STATS ===== */}
      <section className="stats-section">
        <div className="container stats-grid">

          <div className="stat-box">
            <h2>💼 {jobsCount.toLocaleString()}+</h2>
            <p>Active Jobs</p>
          </div>

          <div className="stat-box">
            <h2>🏢 {companyCount.toLocaleString()}+</h2>
            <p>Companies</p>
          </div>

          <div className="stat-box">
            <h2>🎓 {studentCount.toLocaleString()}+</h2>
            <p>Students Hired</p>
          </div>

          <div className="stat-box">
            <h2>⭐ {successRate}%</h2>
            <p>Success Rate</p>
          </div>

        </div>
      </section>
      {showTop && (
        <button
          className="back-to-top"
          onClick={() =>
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
        >
          <ArrowUp size={18} />
        </button>
      )}

<section className="tracking-preview">
        <div className="container text-center">
          <h2 className="section-title">Track Your Application Status</h2>
          <div className="tracking-mock">
            <div className="status">✔ Applied</div>
            <div className="status">⏳ Under Review</div>
            <div className="status">🎯 Shortlisted</div>
          </div>
        </div>
      </section>
      <div className="verification-note text-center">
              <p>
                All employers are manually verified before any job goes live.
              </p>
            </div>

    </div>
  );
};

const Category = ({ icon, title }) => (
  <div className="category-card">
    <div className="category-icon">
      {icon}
    </div>
    <h4>{title}</h4>
  </div>
);


export default Home;
