import { Search, Filter, Users, Database, ShieldCheck, BarChart3 } from "lucide-react";
import "./TalentSearch.css";

const TalentSearch = () => {
  return (
    <div className="talent-container">
      <div className="talent-card">

        <div className="talent-header">
          <Search size={34} />
          <h1>Talent Search for Employers</h1>
          <p>Discover, filter, and hire top candidates efficiently using smart search tools.</p>
        </div>

        <div className="talent-list">

          <div className="talent-item">
            <Database size={22} />
            <div>
              <h3>1. Access Complete Candidate Profiles</h3>
              <p>View detailed resumes, skills, experience, education, certifications, and project portfolios.</p>
            </div>
          </div>

          <div className="talent-item">
            <Filter size={22} />
            <div>
              <h3>2. Advanced Filtering Options</h3>
              <p>Filter candidates by location, skills, experience level, salary expectation, education, and availability.</p>
            </div>
          </div>

          <div className="talent-item">
            <Users size={22} />
            <div>
              <h3>3. Shortlist & Save Candidates</h3>
              <p>Create shortlists and manage selected profiles in one organized dashboard.</p>
            </div>
          </div>

          <div className="talent-item">
            <BarChart3 size={22} />
            <div>
              <h3>4. Match Score Insights</h3>
              <p>Use AI-powered ranking to identify candidates that best match your job requirements.</p>
            </div>
          </div>

          <div className="talent-item">
            <ShieldCheck size={22} />
            <div>
              <h3>5. Secure & Verified Profiles</h3>
              <p>All profiles are verified to ensure authenticity and reduce hiring risks.</p>
            </div>
          </div>

        </div>

        <div className="talent-bottom">
          <div className="talent-divider"></div>

          <p className="talent-note">
            Efficient hiring starts with structured talent discovery.
          </p>

          <button
            className="talent-back-btn"
            onClick={() => window.history.back()}
          >
            ← Go Back
          </button>
        </div>

      </div>
    </div>
  );
};

export default TalentSearch;