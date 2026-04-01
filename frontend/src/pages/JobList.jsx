import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Heart,
  IndianRupee,
  MapPin,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { readCachedValue, writeCachedValue } from '../utils/pageCache';
import './JobList.css';

const EXPERIENCE_FILTERS = [
  { label: 'Entry Level', min: 0, max: 1 },
  { label: 'Mid-Level', min: 2, max: 5 },
  { label: 'Senior Level', min: 6, max: 9 },
  { label: 'Director +', min: 10, max: 99 }
];

const JOB_TYPE_FILTERS = ['Remote', 'Full-time', 'Contract', 'Part-time', 'Internship'];

const parseYears = (value) => {
  const numbers = String(value || '').match(/\d+/g)?.map(Number) || [];
  if (!numbers.length) return null;
  return numbers.length === 1 ? numbers[0] : Math.max(...numbers);
};

const formatSalary = (salary) => {
  const numeric = Number(salary);
  if (!Number.isFinite(numeric) || numeric <= 0) return 'Compensation not listed';
  if (numeric >= 100000) return `INR ${(numeric / 100000).toFixed(0)} LPA`;
  return `INR ${numeric.toLocaleString('en-IN')}`;
};

const formatPostedDate = (createdAt) => {
  if (!createdAt) return 'Recently posted';
  const posted = new Date(createdAt);
  const today = new Date();
  const diffDays = Math.max(0, Math.floor((today - posted) / 86400000));
  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted yesterday';
  return `Posted ${diffDays} days ago`;
};

const createInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JL';

const buildTags = (job) => {
  const skills = String(job.keySkills || '')
    .split(/[,\n|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  return [job.jobType || 'Full-time', ...skills].slice(0, 3);
};

const JobList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || searchParams.get('skill') || '');
  const [locationFilter, setLocationFilter] = useState('');
  const [salaryCap, setSalaryCap] = useState(2500000);
  const [selectedTypes, setSelectedTypes] = useState(['Remote']);
  const [selectedExperience, setSelectedExperience] = useState(['Mid-Level', 'Senior Level']);
  const [sortBy, setSortBy] = useState('recent');
  const [savedJobIds, setSavedJobIds] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    setSavedJobIds(Array.isArray(stored) ? stored.map((item) => item.id) : []);
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      const searchTerm = searchParams.get('search') || searchParams.get('skill');
      const url = searchTerm ? `/job?search=${encodeURIComponent(searchTerm)}` : '/job';
      const cacheKey = `jobs:${url}`;
      const cachedJobs = readCachedValue(cacheKey, []);
      const hasCachedJobs = Array.isArray(cachedJobs) && cachedJobs.length > 0;

      if (hasCachedJobs) {
        setJobs(cachedJobs);
        setLoading(false);
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');
      try {
        const response = await api.get(url);
        const nextJobs = Array.isArray(response.data) ? response.data : [];
        setJobs(nextJobs);
        writeCachedValue(cacheKey, nextJobs);
      } catch (requestError) {
        if (!hasCachedJobs) {
          setError(requestError.response?.data?.error || 'Failed to load jobs. Please try again later.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchJobs();
  }, [searchParams]);

  const filteredJobs = useMemo(() => {
    const normalizedLocation = locationFilter.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      const salary = Number(job.salary) || 0;
      const experienceYears = parseYears(job.experienceLevel);
      const normalizedType = String(job.jobType || '').toLowerCase();
      const jobLocation = String(job.location || '').toLowerCase();

      const matchesLocation = !normalizedLocation || jobLocation.includes(normalizedLocation);
      const matchesSalary = salary <= salaryCap;
      const matchesType = !selectedTypes.length || selectedTypes.some((type) => normalizedType.includes(type.toLowerCase()));
      const matchesExperience = !selectedExperience.length || selectedExperience.some((selected) => {
        const match = EXPERIENCE_FILTERS.find((item) => item.label === selected);
        if (!match || experienceYears === null) return false;
        return experienceYears >= match.min && experienceYears <= match.max;
      });

      return matchesLocation && matchesSalary && matchesType && matchesExperience;
    });

    return filtered.sort((left, right) => {
      if (sortBy === 'salary-high') return (Number(right.salary) || 0) - (Number(left.salary) || 0);
      if (sortBy === 'salary-low') return (Number(left.salary) || 0) - (Number(right.salary) || 0);
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
  }, [jobs, locationFilter, salaryCap, selectedTypes, selectedExperience, sortBy]);

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
    const savedJobs = Array.isArray(stored) ? stored : [];
    const exists = savedJobs.some((item) => item.id === job.id);
    const updated = exists
      ? savedJobs.filter((item) => item.id !== job.id)
      : [...savedJobs, job];

    localStorage.setItem('savedJobs', JSON.stringify(updated));
    setSavedJobIds(updated.map((item) => item.id));
  };

  const toggleFilterValue = (value, current, setter) => {
    setter(current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  };

  const clearFilters = () => {
    setLocationFilter('');
    setSalaryCap(2500000);
    setSelectedTypes([]);
    setSelectedExperience([]);
    setSortBy('recent');
  };

  return (
    <section className="jobs-page">
      <div className="container jobs-shell">
        <aside className="jobs-filter-card">
          <div className="jobs-filter-head">
            <div>
              <span className="jobs-filter-eyebrow">Filters</span>
              <h2>Refine Roles</h2>
            </div>
            <button type="button" onClick={clearFilters}>Clear All</button>
          </div>

          <div className="jobs-filter-group">
            <label htmlFor="jobsLocation">Location</label>
            <div className="jobs-filter-input">
              <MapPin size={15} />
              <input
                id="jobsLocation"
                type="text"
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
                placeholder="City, state, or country"
              />
            </div>
          </div>

          <div className="jobs-filter-group">
            <div className="jobs-salary-head">
              <label htmlFor="jobsSalaryRange">Salary Range</label>
              <span>{formatSalary(salaryCap)}</span>
            </div>
            <input
              id="jobsSalaryRange"
              type="range"
              min="200000"
              max="5000000"
              step="50000"
              value={salaryCap}
              onChange={(event) => setSalaryCap(Number(event.target.value))}
            />
          </div>

          <div className="jobs-filter-group">
            <label>Experience Level</label>
            <div className="jobs-checkbox-stack">
              {EXPERIENCE_FILTERS.map((item) => (
                <label key={item.label} className="jobs-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedExperience.includes(item.label)}
                    onChange={() => toggleFilterValue(item.label, selectedExperience, setSelectedExperience)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="jobs-filter-group">
            <label>Job Type</label>
            <div className="jobs-chip-row">
              {JOB_TYPE_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`jobs-chip ${selectedTypes.includes(item) ? 'is-active' : ''}`}
                  onClick={() => toggleFilterValue(item, selectedTypes, setSelectedTypes)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="jobs-main">
          <header className="jobs-hero-card">
            <span className="jobs-kicker">Live Opportunities</span>
            <h1>Explore Open Roles</h1>
            <p>Curated opportunities powered by your live data, employer activity, and the refreshed JobLithic UI.</p>
          </header>

          <form onSubmit={submitSearch} className="jobs-search-strip">
            <label className="jobs-search-input" htmlFor="jobsSearch">
              <Search size={18} />
              <input
                id="jobsSearch"
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Search for roles, companies, or skills..."
              />
            </label>
            <button type="submit" className="jobs-search-btn">Search</button>
          </form>

          <div className="jobs-toolbar">
            <div>
              <strong>{filteredJobs.length}</strong>
              <span>matching jobs</span>
            </div>

            <label className="jobs-sort">
              <span>Sort by</span>
              <div>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="recent">Most Recent</option>
                  <option value="salary-high">Highest Salary</option>
                  <option value="salary-low">Lowest Salary</option>
                </select>
                <ChevronDown size={16} />
              </div>
            </label>
          </div>

          {loading && !jobs.length && <div className="jobs-state-card">Loading jobs...</div>}
          {refreshing && jobs.length > 0 && <div className="jobs-state-card">Refreshing jobs...</div>}
          {error && !jobs.length && <div className="jobs-state-card jobs-state-card-error">{error}</div>}

          {(!loading || jobs.length > 0) && !error && (
            <>
              {filteredJobs.length === 0 ? (
                <div className="jobs-state-card">No jobs match the current filters.</div>
              ) : (
                <div className="jobs-results">
                  {filteredJobs.map((job) => {
                    const isSaved = savedJobIds.includes(job.id);

                    return (
                      <article key={job.id} className="jobs-role-card">
                        <div className="jobs-role-brand">
                          <div className="jobs-role-logo">
                            {job.companyLogoUrl ? (
                              <img src={job.companyLogoUrl} alt={job.employerName} />
                            ) : (
                              <span>{createInitials(job.employerName)}</span>
                            )}
                          </div>

                          <div className="jobs-role-copy">
                            <h3>{job.title}</h3>
                            <div className="jobs-role-meta">
                              <span>{job.employerName || 'Confidential employer'}</span>
                              <span><MapPin size={14} />{job.location || 'Location not shared'}</span>
                              <span><IndianRupee size={14} />{formatSalary(job.salary)}</span>
                              <span>{formatPostedDate(job.createdAt)}</span>
                            </div>
                            <div className="jobs-role-tags">
                              {buildTags(job).map((tag) => <span key={`${job.id}-${tag}`}>{tag}</span>)}
                            </div>
                          </div>
                        </div>

                        <div className="jobs-role-actions">
                          <Link to={`/jobs/${job.id}`} className="jobs-apply-btn">Apply Now</Link>
                          <button type="button" className={`jobs-save-btn ${isSaved ? 'is-saved' : ''}`} onClick={() => toggleSave(job)}>
                            {isSaved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <section className="jobs-insight-grid">
                <article className="jobs-insight-panel">
                  <span>Featured Insight</span>
                  <h2>Architecture of the Future: The AI Pivot</h2>
                  <p>See how hiring teams are prioritizing adaptable engineering talent with strong system thinking and role-specific depth.</p>
                  <Link to="/career-advice">Read the report</Link>
                </article>

                <article className="jobs-booster-panel">
                  <Heart size={22} />
                  <h3>Resume Booster</h3>
                  <p>Run live AI analysis on your resume and apply with stronger role alignment.</p>
                  <Link to="/resume-builder">Try it now</Link>
                </article>
              </section>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default JobList;
