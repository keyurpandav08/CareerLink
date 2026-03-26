import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkX } from 'lucide-react';
import './SavedJobs.css';

const SavedJobs = () => {
  const jobs = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }, []);

  return (
    <section className="saved-jobs-wrap">
      <div className="container saved-jobs-card">
        <header>
          <h1>Saved Jobs</h1>
          <p>Review and apply to jobs you bookmarked.</p>
        </header>

        {jobs.length === 0 ? (
          <div className="saved-empty">
            <BookmarkX size={40} />
            <p>No saved jobs yet.</p>
            <Link to="/jobs">Browse jobs</Link>
          </div>
        ) : (
          <div className="saved-jobs-grid">
            {jobs.map((job) => (
              <article key={job.id} className="saved-job-item">
                <h3>{job.title}</h3>
                <p>{job.employerName || 'Confidential'} · {job.location}</p>
                <span>${job.salary}</span>
                <Link to={`/jobs/${job.id}`}>View Job</Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SavedJobs;
