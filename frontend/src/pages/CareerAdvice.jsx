import { BookOpen, Briefcase, TrendingUp, Users, Target } from "lucide-react";
import "./CareerAdvice.css";

const CareerAdvice = () => {
  return (
    <div className="career-container">
      <div className="career-card">

        <div className="career-header">
          <BookOpen size={32} />
          <h1>Career Advice</h1>
          <p>Expert guidance to help you grow professionally.</p>
        </div>

        <div className="advice-list">

          <div className="advice-item">
            <Briefcase size={22} />
            <div>
              <h3>Choose the Right Career Path</h3>
              <p>Identify your strengths, interests, and market demand before selecting a career.</p>
            </div>
          </div>

          <div className="advice-item">
            <TrendingUp size={22} />
            <div>
              <h3>Build In-Demand Skills</h3>
              <p>Stay updated with industry trends and continuously upgrade your skills.</p>
            </div>
          </div>

          <div className="advice-item">
            <Users size={22} />
            <div>
              <h3>Network Strategically</h3>
              <p>Connect with professionals and attend events to expand your opportunities.</p>
            </div>
          </div>

          <div className="advice-item">
            <Target size={22} />
            <div>
              <h3>Set Clear Career Goals</h3>
              <p>Define short-term and long-term goals to stay focused and motivated.</p>
            </div>
          </div>

        </div>
        <div className="career-bottom">
          <div className="career-divider"></div>

          <p className="career-agree">
            Start applying today and shape your future with JobLithic.
          </p>

          <button
            className="career-back-btn"
            onClick={() => window.history.back()}
          >
            ← Go Back
          </button>
        </div>

      </div>
    </div>
  );
};

export default CareerAdvice;