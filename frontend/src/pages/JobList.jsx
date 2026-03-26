import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, MapPin, Search, IndianRupee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './JobList.css';

const JobList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || searchParams.get('skill') || '');
  const [savedJobIds, setSavedJobIds] = useState([]);
const [minSalary, setMinSalary] = useState(200000);
const [maxSalary, setMaxSalary] = useState(1000000);
const [filteredJobs, setFilteredJobs] = useState([]);
const [selectedTypes, setSelectedTypes] = useState([]);
const [selectedExp, setSelectedExp] = useState([]);

const getInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JL';

useEffect(() => {
  setFilteredJobs(jobs);
}, [jobs]);
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
    if (!user) {
      navigate('/login', { state: { message: 'Login required to save jobs.' } });
      return;
    }

    const stored = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    const jobsList = Array.isArray(stored) ? stored : [];
    const exists = jobsList.some((item) => item.id === job.id);
    const updated = exists
      ? jobsList.filter((item) => item.id !== job.id)
      : [...jobsList, job];

    localStorage.setItem('savedJobs', JSON.stringify(updated));
    setSavedJobIds(updated.map((item) => item.id));
  };
    const handleApply = () => {
      let result = [...jobs];

      // Job Type
      if (selectedTypes.length > 0) {
        result = result.filter(job =>
          selectedTypes.includes(job.jobType)
        );
      }

      // Experience
      if (selectedExp.length > 0) {
        result = result.filter(job =>
          selectedExp.includes(job.experienceLevel)
        );
      }

      // 🔥 SALARY FILTER
      result = result.filter(job => {
        const salary = Number(job.salary) || 0;
        return salary >= minSalary && salary <= maxSalary;
      });

      setFilteredJobs(result);
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

              // 🔥 NEW LAYOUT START
              <div className="jobs-layout">

                {/* SIDEBAR */}
                <aside className="jobs-sidebar">
                  <h3>Filters</h3>

                  <div className="filter-group">
                    <h4>Job Type</h4>
                    <label className="filter-option">
                      <input
                        type="checkbox"
                        onChange={() => {
                          const value = "Full Time";
                          setSelectedTypes(prev =>
                            prev.includes(value)
                              ? prev.filter(v => v !== value)
                              : [...prev, value]
                          );
                        }}
                      />
                      <span>Full Time</span>
                    </label>

                    <label className="filter-option">
                      <input
                        type="checkbox"
                        onChange={() => {
                          const value = "Part Time";
                          setSelectedTypes(prev =>
                            prev.includes(value)
                              ? prev.filter(v => v !== value)
                              : [...prev, value]
                          );
                        }}
                      />
                      <span>Part Time</span>
                    </label>
                    <label className="filter-option">
                      <input
                        type="checkbox"
                        onChange={() => {
                          const value = "Remote";
                          setSelectedTypes(prev =>
                            prev.includes(value)
                              ? prev.filter(v => v !== value)
                              : [...prev, value]
                          );
                        }}
                      />
                      <span>Remote</span>
                    </label>
                  </div>

                  <div className="filter-group">
                    <h4>Experience</h4>

                   <label className="filter-option">
                     <input
                       type="checkbox"
                       onChange={() => {
                         const value = "0-2 years";
                         setSelectedExp(prev =>
                           prev.includes(value)
                             ? prev.filter(v => v !== value)
                             : [...prev, value]
                         );
                       }}
                     />
                     <span>0-2 years</span>
                   </label>

                   <label className="filter-option">
                     <input
                       type="checkbox"
                       onChange={() => {
                         const value = "2-4 years";
                         setSelectedExp(prev =>
                           prev.includes(value)
                             ? prev.filter(v => v !== value)
                             : [...prev, value]
                         );
                       }}
                     />
                     <span>2-4 years</span>
                   </label>
                   <label className="filter-option">
                     <input
                       type="checkbox"
                       onChange={() => {
                         const value = "4-6 years";
                         setSelectedExp(prev =>
                           prev.includes(value)
                             ? prev.filter(v => v !== value)
                             : [...prev, value]
                         );
                       }}
                     />
                     <span>4-6 years</span>
                   </label>
                   <label className="filter-option">
                     <input
                       type="checkbox"
                       onChange={() => {
                         const value = "6-8 years";
                         setSelectedExp(prev =>
                           prev.includes(value)
                             ? prev.filter(v => v !== value)
                             : [...prev, value]
                         );
                       }}
                     />
                     <span>6-8 years</span>
                   </label>
                   <label className="filter-option">
                     <input
                       type="checkbox"
                       onChange={() => {
                         const value = "8+ years";
                         setSelectedExp(prev =>
                           prev.includes(value)
                             ? prev.filter(v => v !== value)
                             : [...prev, value]
                         );
                       }}
                     />
                     <span>8+ years</span>
                   </label>

                  </div>
                 <div className="filter-group salary-group">
                   <h4>Salary Range</h4>

                   <div className="range-slider">

                     {/* MIN */}
                     <input
                       type="range"
                       min="0"
                       max="2000000"
                       step="50000"
                       value={minSalary}
                       onChange={(e) => setMinSalary(Number(e.target.value))}
                       className="thumb thumb-left"
                     />

                     {/* MAX */}
                     <input
                       type="range"
                       min="0"
                       max="20000000"
                       step="50000"
                       value={maxSalary}
                       onChange={(e) => setMaxSalary(Number(e.target.value))}
                       className="thumb thumb-right"
                     />

                     {/* TRACK */}
                     <div className="slider-track"></div>
                     <div
                       className="slider-range"
                       style={{
                         left: `${(minSalary / 20000000) * 100}%`,
                         right: `${100 - (maxSalary / 20000000) * 100}%`
                       }}
                     ></div>

                   </div>

                   {/* INPUT BOXES */}
                   <div className="salary-inputs">

                     <div className="input-box">
                       <input
                         type="number"
                         value={minSalary}
                         onChange={(e) => setMinSalary(Number(e.target.value))}
                       />
                       <span className="label">Min</span>
                     </div>

                     <span className="dash">—</span>

                     <div className="input-box">
                       <input
                         type="number"
                         value={maxSalary}
                         onChange={(e) => setMaxSalary(Number(e.target.value))}
                       />
                       <span className="label">Max</span>
                     </div>

                   </div>

                 </div>
                <div className="filter-actions">
                  <button onClick={handleApply} className="apply-btn">
                    Apply
                  </button>

                  <button onClick={() => setFilteredJobs(jobs)} className="reset-btn">
                    Reset
                  </button>
                </div>
                </aside>

                {/* JOBS */}
                <div className="jobs-content">
                  <div className="jobs-grid">

                    {filteredJobs.map((job) => {
                      const isSaved = savedJobIds.includes(job.id);

                      return (
                        <article key={job.id} className="job-card-modern">

                          {/* TOP SECTION */}
                          <div className="job-top">

                            <div className="job-left">
                              <div className="job-logo">
                                {job.companyLogoUrl ? (
                                  <img src={job.companyLogoUrl} alt={job.employerName} />
                                ) : (
                                  getInitials(job.employerName)
                                )}
                              </div>

                              <div className="job-main">
                                <h3>{job.title}</h3>
                                <p className="company">{job.employerName || 'Confidential'}</p>
                              </div>
                            </div>

                            <span className={`job-pill ${String(job.status).toLowerCase()}`}>
                              {job.status}
                            </span>

                          </div>

                          {/* META */}
                          <div className="job-meta">
                            <span><MapPin size={14} /> {job.location}</span>
                            <span><IndianRupee size={14} /> {Math.round(job.salary / 100000)} LPA</span>
                          </div>

                          {/* TAGS */}
                          <div className="job-tags">
                            <span>{job.jobType || "Full-time"}</span>
                            <span>{job.experienceLevel || "0-2 years"}</span>
                          </div>

                          {/* DESCRIPTION */}
                          <p className="job-desc">
                            {(job.jobHighlights || job.description || '').slice(0, 120)}...
                          </p>

                          {/* FOOTER */}
                          <div className="job-footer">

                            {/* POSTED DATE */}
                           <span className="posted">
                             {job.createdAt
                               ? new Date(job.createdAt).toLocaleDateString("en-GB", {
                                   day: "2-digit",
                                   month: "short",
                                   year: "numeric"
                                 })
                               : "No Date"}
                           </span>

                            {/* ACTIONS */}
                            <div className="actions">

                               <div className="job-card-actions">
                                   <Link to={`/jobs/${job.id}`}>View Details</Link>

                                   <button type="button" onClick={() => toggleSave(job)} className={isSaved ? 'saved' : ''}>
                                       {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                                       {isSaved ? 'Saved' : 'Save'}
                                       </button>
                                   </div>

                            </div>

                          </div>

                        </article>
                      );
                    })}

                  </div>
                </div>

              </div>
              // 🔥 NEW LAYOUT END

            )}
          </>
        )}
      </div>
    </section>
  );
};

export default JobList;
