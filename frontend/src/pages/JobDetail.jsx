import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  DollarSign,
  MapPin,
  Share2,
  Sparkles,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleName } from '../utils/role';
import api from '../services/api';
import './JobDetail.css';

const defaultApplyData = {
  expectedSalary: '',
  noticePeriod: 'Immediate',
  resumeUrl: '',
  experienceSummary: '',
  agreeEligibility: false,
  agreeProfileAccurate: false,
  agreeDataConsent: false
};

const splitContent = (value) => {
  if (!value) return [];
  return value
    .split(/\r?\n|[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const createInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JL';

const formatSalary = (salary) => {
  if (!salary) return 'Salary not disclosed';
  if (salary >= 100000) return `INR ${(salary / 100000).toFixed(1).replace('.0', '')} LPA`;
  return `INR ${salary}`;
};

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyData, setApplyData] = useState(defaultApplyData);
  const [applying, setApplying] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/job/${id}`);
        setJob(response.data);
      } catch {
        setError('Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  useEffect(() => {
    if (!job) return;
    const stored = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    const savedJobs = Array.isArray(stored) ? stored : [];
    setSaved(savedJobs.some((item) => item.id === job.id));
  }, [job]);

  const roleName = getRoleName(user);
  const isApplicant = roleName === 'APPLICANT';
  const canApply = Boolean(user) && isApplicant && job?.status === 'Open';

  const highlights = useMemo(() => splitContent(job?.jobHighlights), [job?.jobHighlights]);
  const skills = useMemo(() => splitContent(job?.keySkills), [job?.keySkills]);
  const requirements = useMemo(() => splitContent(job?.jobRequirements), [job?.jobRequirements]);

  const isApplyFormValid = useMemo(() => (
    applyData.expectedSalary.trim() &&
    applyData.experienceSummary.trim().length >= 30 &&
    applyData.agreeEligibility &&
    applyData.agreeProfileAccurate &&
    applyData.agreeDataConsent
  ), [applyData]);

  const toggleSave = () => {
    if (!user) {
      navigate('/login', { state: { message: 'Login required to save jobs.' } });
      return;
    }

    if (!job) return;

    const stored = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    const savedJobs = Array.isArray(stored) ? stored : [];
    const exists = savedJobs.some((item) => item.id === job.id);
    const updated = exists
      ? savedJobs.filter((item) => item.id !== job.id)
      : [...savedJobs, job];

    localStorage.setItem('savedJobs', JSON.stringify(updated));
    setSaved(!exists);
    setApplyFeedback(exists ? 'Job removed from saved list.' : 'Job saved successfully.');
  };

  const shareJob = async () => {
    if (!job) return;

    const shareData = {
      title: job.title,
      text: `${job.title} at ${job.employerName}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setApplyFeedback('Job link copied to clipboard.');
      }
    } catch {
      setApplyFeedback('Unable to share this job right now.');
    }
  };

  const openApplyModal = () => {
    if (!user) {
      navigate('/login', { state: { message: 'Login required to apply for jobs.' } });
      return;
    }

    if (roleName !== 'APPLICANT') {
      setApplyFeedback('Only candidate accounts can apply.');
      return;
    }

    setApplyOpen(true);
    setApplyFeedback('');
  };

  const closeApplyModal = () => {
    if (applying) return;
    setApplyOpen(false);
    setApplyData(defaultApplyData);
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    if (!user || !job || !isApplyFormValid) return;

    const note = [
      `Expected Salary: ${applyData.expectedSalary}`,
      `Notice Period: ${applyData.noticePeriod}`,
      `Screening Summary: ${applyData.experienceSummary}`
    ].join(' | ');

    try {
      setApplying(true);
      await api.post('/applications/apply-json', {
        userId: user.id,
        jobId: job.id,
        applicationNote: note,
        resumeUrl: applyData.resumeUrl.trim() || undefined
      });
      setApplyFeedback('');
      setApplyOpen(false);
      setApplyData(defaultApplyData);
      setSuccessModalOpen(true);
    } catch (requestError) {
      const message = requestError.response?.data?.error || 'Failed to submit application.';
      setApplyFeedback(message);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="job-detail-wrap container">Loading job details...</div>;
  if (error) return <div className="job-detail-wrap container">{error}</div>;
  if (!job) return <div className="job-detail-wrap container">Job not found.</div>;

  return (
    <section className="job-detail-wrap">
      <div className="container job-detail-shell">
        <Link to="/jobs" className="back-link"><ArrowLeft size={16} />Back to jobs</Link>

        <div className="job-detail-grid">
          <article className="job-hero-card">
            <header className="job-company-head">
              <div className="job-company-brand">
                {job.companyLogoUrl ? (
                  <img src={job.companyLogoUrl} alt={job.employerName} className="company-logo" />
                ) : (
                  <div className="company-logo company-logo-fallback">{createInitials(job.employerName)}</div>
                )}

                <div>
                  <span className="company-kicker">Featured opportunity</span>
                  <h1>{job.title}</h1>
                  <div className="company-name-row">
                    <strong>{job.employerName || 'Confidential company'}</strong>
                    <span className={`job-status ${String(job.status).toLowerCase()}`}>{job.status}</span>
                  </div>
                  <div className="company-review-row">
                    <span><Star size={14} />{job.companyReviewSummary || 'Trusted employer profile'}</span>
                    <span>{job.companyReviewCount || 0}+ reviews</span>
                  </div>
                </div>
              </div>

              <div className="job-meta-badges">
                <span><Briefcase size={15} />{job.jobType || 'Full-time'}</span>
                <span><MapPin size={15} />{job.location}</span>
                <span><DollarSign size={15} />{formatSalary(job.salary)}</span>
                <span><Sparkles size={15} />{job.experienceLevel || '0-2 years'}</span>
              </div>
            </header>

            <section className="job-section-card">
              <div className="section-title-row">
                <h2>Job details</h2>
                <span>Quick overview</span>
              </div>

              <div className="detail-grid">
                <div>
                  <h3>Job highlights</h3>
                  <ul>
                    {(highlights.length ? highlights : [
                      'Structured hiring process',
                      'Role aligned to current skill demand',
                      'Fast-response employer dashboard'
                    ]).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>

                <div>
                  <h3>Key skills</h3>
                  <div className="skill-chip-row">
                    {(skills.length ? skills : ['Communication', 'Problem Solving']).map((item) => (
                      <span key={item} className="skill-chip">{item}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3>Location</h3>
                  <p>{job.location}</p>
                </div>

                <div>
                  <h3>Salary</h3>
                  <p>{formatSalary(job.salary)}</p>
                </div>
              </div>
            </section>

            <section className="job-section-card">
              <div className="section-title-row">
                <h2>Description</h2>
                <span>Role and company context</span>
              </div>

              <div className="description-block">
                <h3>Role overview</h3>
                <p>{job.description}</p>
              </div>

              <div className="description-block">
                <h3>About company</h3>
                <p>{job.aboutCompany || `${job.employerName} is actively hiring and looking for candidates who can contribute from day one.`}</p>
              </div>

              <div className="description-block">
                <h3>Job requirements</h3>
                <ul>
                  {(requirements.length ? requirements : ['Relevant technical foundation', 'Ability to work in team environments', 'Strong learning mindset']).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          </article>

          <aside className="job-side-card">
            <div className="job-side-actions">
              <button type="button" className="apply-main-btn" onClick={openApplyModal} disabled={!canApply}>
                {canApply ? 'Apply now' : (roleName === 'EMPLOYER' ? 'Employer account cannot apply' : 'Application unavailable')}
              </button>
              <button type="button" className={`side-action-btn ${saved ? 'saved' : ''}`} onClick={toggleSave}>
                {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {saved ? 'Saved' : 'Save job'}
              </button>
              <button type="button" className="side-action-btn" onClick={shareJob}>
                <Share2 size={16} />
                Share job
              </button>
            </div>

            {applyFeedback && <div className="apply-feedback">{applyFeedback}</div>}
          </aside>
        </div>

        {applyOpen && (
          <div className="apply-modal-overlay">
            <form className="apply-modal" onSubmit={submitApplication}>
              <h3>Application Requirements</h3>
              <p>Complete all required fields before submitting.</p>

              <label>Expected Salary (required)</label>
              <input
                type="text"
                value={applyData.expectedSalary}
                onChange={(event) => setApplyData((prev) => ({ ...prev, expectedSalary: event.target.value }))}
                placeholder="e.g. 6 LPA"
                required
              />

              <label>Notice Period</label>
              <select
                value={applyData.noticePeriod}
                onChange={(event) => setApplyData((prev) => ({ ...prev, noticePeriod: event.target.value }))}
              >
                <option value="Immediate">Immediate</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="60+ Days">60+ Days</option>
              </select>

              <label>Resume Link (optional)</label>
              <input
                type="url"
                value={applyData.resumeUrl}
                onChange={(event) => setApplyData((prev) => ({ ...prev, resumeUrl: event.target.value }))}
                placeholder="Google Drive / portfolio / resume link"
              />
              <small className="apply-helper-note">
                If you leave this blank, your latest uploaded profile resume will be used automatically when available.
              </small>

              <label>Screening Summary (required, min 30 chars)</label>
              <textarea
                value={applyData.experienceSummary}
                onChange={(event) => setApplyData((prev) => ({ ...prev, experienceSummary: event.target.value }))}
                placeholder="Briefly explain relevant skills and project experience."
                minLength={30}
                required
              />

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={applyData.agreeEligibility}
                  onChange={(event) => setApplyData((prev) => ({ ...prev, agreeEligibility: event.target.checked }))}
                />
                <span>I confirm I am eligible for this role.</span>
              </label>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={applyData.agreeProfileAccurate}
                  onChange={(event) => setApplyData((prev) => ({ ...prev, agreeProfileAccurate: event.target.checked }))}
                />
                <span>I confirm profile details are accurate.</span>
              </label>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={applyData.agreeDataConsent}
                  onChange={(event) => setApplyData((prev) => ({ ...prev, agreeDataConsent: event.target.checked }))}
                />
                <span>I consent to share this information with the employer.</span>
              </label>

              <div className="apply-modal-actions">
                <button type="button" className="ghost-btn-inline" onClick={closeApplyModal}>Cancel</button>
                <button type="submit" className="apply-main-btn" disabled={!isApplyFormValid || applying}>
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        {successModalOpen && (
          <div className="apply-modal-overlay">
            <div className="apply-success-modal">
              <div className="success-mark">✓</div>
              <h3>Application submitted successfully</h3>
              <p>
                Your profile has been shared with the employer. You can track the status from the applications section.
              </p>
              <div className="apply-modal-actions">
                <Link to="/applications" className="apply-main-btn">View applications</Link>
                <button type="button" className="ghost-btn-inline" onClick={() => setSuccessModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default JobDetail;
