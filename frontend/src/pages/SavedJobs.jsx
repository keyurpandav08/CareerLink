import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookmarkCheck,
  BookmarkX,
  BriefcaseBusiness,
  MapPin,
  Trash2
} from 'lucide-react';
import './SavedJobs.css';

const formatSalary = (salary) => {
  if (!salary) return 'Salary not disclosed';
  if (salary >= 100000) return `INR ${(salary / 100000).toFixed(1).replace('.0', '')} LPA`;
  return `INR ${salary}`;
};

const loadSavedJobs = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const SavedJobs = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    setJobs(loadSavedJobs());
  }, []);

  const insights = useMemo(() => {
    const locations = [...new Set(jobs.map((job) => job.location).filter(Boolean))];
    return {
      total: jobs.length,
      locations: locations.length,
      companies: [...new Set(jobs.map((job) => job.employerName).filter(Boolean))].length
    };
  }, [jobs]);

  const removeSavedJob = (jobId) => {
    const updatedJobs = jobs.filter((job) => job.id !== jobId);
    setJobs(updatedJobs);
    localStorage.setItem('savedJobs', JSON.stringify(updatedJobs));
  };

  return (
    <section className="saved-jobs-page">
      <div className="container saved-jobs-layout">
        <header className="saved-jobs-hero">
          <div>
            <span className="saved-jobs-kicker">Saved opportunities</span>
            <h1>Keep your shortlist organized and action-ready.</h1>
            <p>Review bookmarked roles, compare locations and compensation, and jump back into applications quickly.</p>
          </div>

          <div className="saved-jobs-hero-actions">
            <Link to="/jobs" className="saved-jobs-primary-btn">
              Explore jobs
              <ArrowRight size={16} />
            </Link>
            <Link to="/dashboard" className="saved-jobs-outline-btn">Back to dashboard</Link>
          </div>
        </header>

        <section className="saved-jobs-stats">
          <article>
            <small>Saved roles</small>
            <strong>{insights.total}</strong>
            <span>Your active shortlist</span>
          </article>
          <article>
            <small>Locations</small>
            <strong>{insights.locations}</strong>
            <span>Distinct markets tracked</span>
          </article>
          <article>
            <small>Companies</small>
            <strong>{insights.companies}</strong>
            <span>Hiring teams in view</span>
          </article>
        </section>

        {jobs.length === 0 ? (
          <div className="saved-jobs-empty">
            <BookmarkX size={44} />
            <strong>No saved jobs yet</strong>
            <p>Bookmark promising roles while browsing jobs and they will show up here for easy comparison.</p>
            <Link to="/jobs" className="saved-jobs-primary-btn">
              Browse active jobs
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <section className="saved-jobs-grid">
            {jobs.map((job) => (
              <article key={job.id} className="saved-job-card">
                <div className="saved-job-card-top">
                  <span className="saved-job-badge">
                    <BookmarkCheck size={14} />
                    Saved
                  </span>
                  <button type="button" className="saved-job-remove" onClick={() => removeSavedJob(job.id)}>
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>

                <div className="saved-job-headline">
                  <h2>{job.title}</h2>
                  <p>{job.employerName || 'Confidential employer'}</p>
                </div>

                <div className="saved-job-meta">
                  <span><MapPin size={15} />{job.location || 'Location not shared'}</span>
                  <span><BriefcaseBusiness size={15} />{formatSalary(job.salary)}</span>
                </div>

                <p className="saved-job-description">
                  {job.description || 'Open the role to read full requirements, company overview, and application instructions.'}
                </p>

                <div className="saved-job-actions">
                  <Link to={`/jobs/${job.id}`} className="saved-jobs-primary-btn">
                    View role
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/applications" className="saved-jobs-outline-btn">Open tracker</Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </section>
  );
};

export default SavedJobs;
