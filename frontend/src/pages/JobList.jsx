import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Briefcase, DollarSign, MapPin, Search } from 'lucide-react';
import api from '../services/api';
import './JobList.css';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || searchParams.get('skill') || '');
  const [savedJobIds, setSavedJobIds] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    setSavedJobIds(Array.isArray(stored) ? stored.map((item) => item.id) : []);
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const searchTerm = searchParams.get('search') || searchParams.get('skill');
        const url = searchTerm ? `/job?search=${encodeURIComponent(searchTerm)}` : '/job';
        const response = await api.get(url);
        setJobs(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        setError('Failed to load jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [searchParams]);

  const headline = useMemo(() => {
    const searchTerm = searchParams.get('search') || searchParams.get('skill');
    return searchTerm ? `Results for "${searchTerm}"` : 'Latest Job Openings';
  }, [searchParams]);

  const submitSearch = (event) => {
    event.preventDefault();
    const term = searchKeyword.trim();
    if (term) {
      setSearchParams({ search: term });
    } else {
      setSearchParams({});
    }
  };

  const toggleSave = (job) => {
    const stored = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    const jobsList = Array.isArray(stored) ? stored : [];
    const exists = jobsList.some((item) => item.id === job.id);
    const updated = exists
      ? jobsList.filter((item) => item.id !== job.id)
      : [...jobsList, job];

    localStorage.setItem('savedJobs', JSON.stringify(updated));
    setSavedJobIds(updated.map((item) => item.id));
  };

  return (
    <section className="job-list-wrap">
      <div className="container">
        <header className="jobs-head">
          <h1>{headline}</h1>
          <p>Search by title, location, or tech stack. Save jobs to review later.</p>
        </header>

        <form onSubmit={submitSearch} className="jobs-search-form">
          <div className="jobs-search-input">
            <Search size={18} />
            <input
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Search jobs, companies, skills..."
            />
          </div>
          <button type="submit">Search</button>
          {(searchParams.get('search') || searchParams.get('skill')) && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setSearchKeyword('');
                setSearchParams({});
              }}
            >
              Clear
            </button>
          )}
        </form>

        {loading && <div className="jobs-state">Loading jobs...</div>}
        {error && <div className="jobs-state error">{error}</div>}

        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="jobs-state">No jobs found for current search.</div>
            ) : (
              <div className="jobs-grid">
                {jobs.map((job) => {
                  const isSaved = savedJobIds.includes(job.id);

                  return (
                    <article key={job.id} className="job-card-modern">
                      <div className="job-card-head">
                        <h3>{job.title}</h3>
                        <span className={`job-pill ${String(job.status).toLowerCase()}`}>{job.status}</span>
                      </div>

                      <div className="job-card-meta">
                        <span><Briefcase size={14} />{job.employerName || 'Confidential'}</span>
                        <span><MapPin size={14} />{job.location}</span>
                        <span><DollarSign size={14} />${job.salary}</span>
                      </div>

                      <p className="job-card-description">{job.description}</p>

                      <div className="job-card-actions">
                        <Link to={`/jobs/${job.id}`}>View Details</Link>
                        <button type="button" onClick={() => toggleSave(job)} className={isSaved ? 'saved' : ''}>
                          {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                          {isSaved ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default JobList;
