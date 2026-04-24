import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  MapPin,
  Share2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleName } from '../utils/role';
import api from '../services/api';
import { getFriendlyAiError } from '../utils/aiError';
import { hasResume } from '../utils/candidatePortal';
import { readCachedValue, writeCachedValue } from '../utils/pageCache';
import './JobDetail.css';

const defaultApplyData = {
  expectedSalary: '',
  noticePeriod: 'Immediate',
  experienceSummary: '',
  agreeEligibility: false,
  agreeProfileAccurate: false,
  agreeDataConsent: false
};

const splitContent = (value) =>
  String(value || '')
    .split(/\r?\n|[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatSalary = (salary) => {
  const numeric = Number(salary);
  if (!Number.isFinite(numeric) || numeric <= 0) return 'Compensation not listed';
  if (numeric >= 100000) return `INR ${(numeric / 100000).toFixed(0)} LPA`;
  return `INR ${numeric.toLocaleString('en-IN')}`;
};

const createInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JL';

const formatPostedDate = (createdAt) => {
  if (!createdAt) return 'Recently posted';
  const posted = new Date(createdAt);
  const today = new Date();
  const diffDays = Math.max(0, Math.floor((today - posted) / 86400000));
  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted yesterday';
  return `Posted ${diffDays} days ago`;
};

const computeSimilarity = (job, currentJob) => {
  const currentSkills = new Set(splitContent(currentJob.keySkills).map((item) => item.toLowerCase()));
  const nextSkills = splitContent(job.keySkills).map((item) => item.toLowerCase());
  return nextSkills.filter((item) => currentSkills.has(item)).length;
};

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiError, setAiError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyData, setApplyData] = useState(defaultApplyData);
  const [applying, setApplying] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const roleName = getRoleName(user);
  const isApplicant = roleName === 'APPLICANT';

  useEffect(() => {
    const fetchPageData = async () => {
      const cacheKey = `job-detail:${id}:${user?.username || 'guest'}`;
      const cachedState = readCachedValue(cacheKey, null);
      const hasCachedJob = Boolean(cachedState?.job);

      if (hasCachedJob) {
        setJob(cachedState.job || null);
        setRelatedJobs(Array.isArray(cachedState.relatedJobs) ? cachedState.relatedJobs : []);
        setCandidateProfile(cachedState.candidateProfile || null);
        setAiInsight(cachedState.aiInsight || null);
        setAiError(getFriendlyAiError(cachedState.aiError, ''));
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const [jobResponse, relatedResponse] = await Promise.all([
          api.get(`/job/${id}`),
          api.get('/job')
        ]);
        const nextJob = jobResponse.data;
        setJob(nextJob);

        const relatedList = Array.isArray(relatedResponse.data) ? relatedResponse.data : [];
        const nextRelatedJobs = relatedList
          .filter((item) => String(item.id) !== String(id))
          .sort((left, right) => computeSimilarity(right, nextJob) - computeSimilarity(left, nextJob))
          .slice(0, 3);

        setRelatedJobs(nextRelatedJobs);
        setError('');
        setLoading(false);
        writeCachedValue(cacheKey, {
          job: nextJob,
          relatedJobs: nextRelatedJobs,
          candidateProfile: cachedState?.candidateProfile || null,
          aiInsight: cachedState?.aiInsight || null,
          aiError: cachedState?.aiError || ''
        });

        if (user?.username && isApplicant) {
          const candidateId = user?.id;

          setAiError(cachedState?.aiInsight ? '' : 'Refreshing live AI match insights...');

          if (candidateId) {
            Promise.allSettled([
              api.get(`/users/username/${user.username}`),
              api.get(`/api/ai/candidate/${candidateId}/job/${id}`, { timeout: 8000 })
            ]).then(([profileResult, aiResult]) => {
              let nextProfile = cachedState?.candidateProfile || null;
              let nextAiInsight = cachedState?.aiInsight || null;
              let nextAiError = '';

              if (profileResult.status === 'fulfilled') {
                nextProfile = profileResult.value.data;
                setCandidateProfile(nextProfile);
              }

              if (aiResult.status === 'fulfilled') {
                nextAiInsight = aiResult.value.data;
                nextAiError = '';
                setAiInsight(nextAiInsight);
                setAiError('');
              } else {
                nextAiInsight = null;
                nextAiError = getFriendlyAiError(
                  aiResult.reason,
                  'Add your Gemini key in application.properties to unlock live AI match insights.'
                );
                setAiInsight(null);
                setAiError(nextAiError);
              }

              writeCachedValue(cacheKey, {
                job: nextJob,
                relatedJobs: nextRelatedJobs,
                candidateProfile: nextProfile,
                aiInsight: nextAiInsight,
                aiError: nextAiError
              });
            });
          } else {
            api.get(`/users/username/${user.username}`)
              .then(async (profileRes) => {
                setCandidateProfile(profileRes.data);

                try {
                  const insightRes = await api.get(`/api/ai/candidate/${profileRes.data.id}/job/${id}`, {
                    timeout: 8000
                  });
                  setAiInsight(insightRes.data);
                  setAiError('');
                  writeCachedValue(cacheKey, {
                    job: nextJob,
                    relatedJobs: nextRelatedJobs,
                    candidateProfile: profileRes.data,
                    aiInsight: insightRes.data,
                    aiError: ''
                  });
                } catch (aiRequestError) {
                  const nextAiError = getFriendlyAiError(
                    aiRequestError,
                    'Add your Gemini key in application.properties to unlock live AI match insights.'
                  );
                  setAiInsight(null);
                  setAiError(nextAiError);
                  writeCachedValue(cacheKey, {
                    job: nextJob,
                    relatedJobs: nextRelatedJobs,
                    candidateProfile: profileRes.data,
                    aiInsight: null,
                    aiError: nextAiError
                  });
                }
              })
              .catch(() => {
                setCandidateProfile(null);
              });
          }
        } else {
          setCandidateProfile(null);
          setAiInsight(null);
          setAiError(user ? 'Switch to an applicant account to see AI match insights.' : 'Log in as a candidate to unlock AI match insights.');
          writeCachedValue(cacheKey, {
            job: nextJob,
            relatedJobs: nextRelatedJobs,
            candidateProfile: null,
            aiInsight: null,
            aiError: user ? 'Switch to an applicant account to see AI match insights.' : 'Log in as a candidate to unlock AI match insights.'
          });
        }
      } catch (requestError) {
        if (!hasCachedJob) {
          setError(requestError.response?.data?.error || 'Failed to load job details.');
        }
      } finally {
        if (!hasCachedJob) {
          setLoading(false);
        }
      }
    };

    fetchPageData();
  }, [id, isApplicant, user, user?.username]);

  useEffect(() => {
    if (!job) return;
    const stored = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    const savedJobs = Array.isArray(stored) ? stored : [];
    setSaved(savedJobs.some((item) => item.id === job.id));
  }, [job]);

  const highlights = useMemo(() => splitContent(job?.jobHighlights), [job?.jobHighlights]);
  const skills = useMemo(() => splitContent(job?.keySkills), [job?.keySkills]);
  const requirements = useMemo(() => splitContent(job?.jobRequirements), [job?.jobRequirements]);
  const hasProfileResume = hasResume(candidateProfile?.resumeUrl);

  const canApply = Boolean(user) && isApplicant && String(job?.status).toLowerCase() === 'open';
  const isApplyFormValid = useMemo(() => (
    applyData.expectedSalary.trim() &&
    applyData.experienceSummary.trim().length >= 30 &&
    hasProfileResume &&
    applyData.agreeEligibility &&
    applyData.agreeProfileAccurate &&
    applyData.agreeDataConsent
  ), [applyData, hasProfileResume]);

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

    if (!isApplicant) {
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
        resumeUrl: candidateProfile?.resumeUrl
      });

      setApplyFeedback('');
      setApplyOpen(false);
      setApplyData(defaultApplyData);
      setSuccessModalOpen(true);
    } catch (requestError) {
      setApplyFeedback(requestError.response?.data?.error || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="job-detail-page container">Loading job details...</div>;
  if (error) return <div className="job-detail-page container">{error}</div>;
  if (!job) return <div className="job-detail-page container">Job not found.</div>;

  return (
    <section className="job-detail-page">
      <div className="container job-detail-shell">
        <Link to="/jobs" className="job-back-link"><ArrowLeft size={16} />Back to jobs</Link>

        <div className="job-detail-grid">
          <div className="job-detail-main">
            <article className="job-hero-panel">
              <div className="job-hero-brand">
                <div className="job-hero-logo">
                  {job.companyLogoUrl ? (
                    <img src={job.companyLogoUrl} alt={job.employerName} />
                  ) : (
                    <span>{createInitials(job.employerName)}</span>
                  )}
                </div>

                <div>
                  <h1>{job.title}</h1>
                  <div className="job-hero-meta">
                    <span><Briefcase size={15} />{job.employerName || 'Confidential employer'}</span>
                    <span><MapPin size={15} />{job.location || 'Location not shared'}</span>
                    <span>{formatPostedDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="job-hero-actions">
                <button type="button" className="job-primary-btn" onClick={openApplyModal} disabled={!canApply}>
                  {canApply ? 'Apply Now' : (isApplicant ? 'Application unavailable' : 'Candidate account required')}
                </button>
                <button type="button" className={`job-secondary-btn ${saved ? 'is-saved' : ''}`} onClick={toggleSave}>
                  {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  {saved ? 'Saved' : 'Save Job'}
                </button>
                <button type="button" className="job-icon-btn" onClick={shareJob}>
                  <Share2 size={16} />
                </button>
              </div>
            </article>

            <section className="job-content-section">
              <h2>The Role</h2>
              <p>{job.description || 'Role description is not available yet.'}</p>
            </section>

            <section className="job-content-section">
              <h2>Key Responsibilities</h2>
              <ul>
                {(highlights.length ? highlights : ['Lead execution across the core responsibilities of this role.']).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="job-content-section">
              <h2>Qualifications</h2>
              <div className="job-qualification-grid">
                <article className="job-qualification-card">
                  <strong>Technical Proficiency</strong>
                  <p>{skills.length ? skills.join(', ') : 'Role-specific skills will be shared during screening.'}</p>
                </article>

                <article className="job-qualification-card">
                  <strong>Experience Alignment</strong>
                  <p>{job.experienceLevel || 'Experience expectations will be shared by the employer.'}</p>
                </article>

                <article className="job-qualification-card">
                  <strong>Requirements Snapshot</strong>
                  <p>{requirements.length ? requirements.slice(0, 4).join(', ') : 'General role requirements will be clarified by the hiring team.'}</p>
                </article>
              </div>
            </section>

            <section className="job-company-panel">
              <span>Inside {job.employerName || 'the company'}</span>
              <h2>{`${job.employerName || 'This employer'}: Building with intention.`}</h2>
              <p>{job.aboutCompany || `${job.employerName || 'This employer'} is actively hiring and looking for candidates who can contribute from day one.`}</p>

              <div className="job-company-metrics">
                <div>
                  <strong>{formatSalary(job.salary)}</strong>
                  <span>Comp range</span>
                </div>
                <div>
                  <strong>{job.companyReviewCount || 0}+</strong>
                  <span>Employee reviews</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="job-detail-side">
            <article className="job-ai-panel">
              <div className="job-ai-head">
                <h3>AI Match Insights</h3>
                <Sparkles size={18} />
              </div>

              {aiInsight ? (
                <>
                  <div className="job-ai-score">
                    <strong>{aiInsight.matchScore}%</strong>
                    <span>Live match score</span>
                  </div>
                  <h4>{aiInsight.headline}</h4>
                  <p>{aiInsight.summary}</p>

                  <div className="job-ai-list">
                    <small>Top Matches</small>
                    <div className="job-ai-tags">
                      {(aiInsight.topMatches || []).map((item) => <span key={item}>{item}</span>)}
                    </div>
                  </div>

                  {(aiInsight.potentialGaps || []).length > 0 && (
                    <div className="job-ai-list">
                      <small>Potential Gaps</small>
                      <div className="job-ai-tags is-gap">
                        {aiInsight.potentialGaps.map((item) => <span key={item}>{item}</span>)}
                      </div>
                    </div>
                  )}

                  <button type="button" className="job-ai-cta" onClick={openApplyModal}>
                    {canApply ? aiInsight.action || 'Apply with this profile' : 'Unlock with candidate account'}
                  </button>
                </>
              ) : (
                <div className="job-ai-empty">
                  <p>{aiError}</p>
                </div>
              )}
            </article>

            <article className="job-similar-panel">
              <h3>Similar Jobs</h3>
              <div className="job-similar-list">
                {relatedJobs.length ? relatedJobs.map((item) => (
                  <Link key={item.id} to={`/jobs/${item.id}`} className="job-similar-card">
                    <div className="job-similar-logo">
                      {item.companyLogoUrl ? (
                        <img src={item.companyLogoUrl} alt={item.employerName} />
                      ) : (
                        <span>{createInitials(item.employerName)}</span>
                      )}
                    </div>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.employerName}</span>
                      <small>{formatSalary(item.salary)}</small>
                    </div>
                  </Link>
                )) : (
                  <p className="job-similar-empty">More related roles will appear here as soon as matching data is available.</p>
                )}
              </div>
            </article>
          </aside>
        </div>

        {applyFeedback && <div className="job-apply-feedback">{applyFeedback}</div>}

        {applyOpen && (
          <div className="job-apply-overlay" onClick={closeApplyModal}>
            <form className="job-apply-modal" onSubmit={submitApplication} onClick={(event) => event.stopPropagation()}>
              <h3>Apply for {job.title}</h3>
              <p>Complete the quick screening details below before submitting your application.</p>

              <label>
                <span>Expected Salary</span>
                <input
                  type="text"
                  value={applyData.expectedSalary}
                  onChange={(event) => setApplyData((prev) => ({ ...prev, expectedSalary: event.target.value }))}
                  placeholder="e.g. 12 LPA"
                  required
                />
              </label>

              <label>
                <span>Notice Period</span>
                <select
                  value={applyData.noticePeriod}
                  onChange={(event) => setApplyData((prev) => ({ ...prev, noticePeriod: event.target.value }))}
                >
                  <option value="Immediate">Immediate</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="60+ Days">60+ Days</option>
                </select>
              </label>

              <div className="job-resume-block">
                <div>
                  <strong>Resume</strong>
                  <p>
                    {hasProfileResume
                      ? 'Your saved profile resume will be attached to this application automatically.'
                      : 'Upload your resume once from Profile before applying here.'}
                  </p>
                </div>

                {hasProfileResume ? (
                  <div className="job-resume-chip">
                    {candidateProfile?.resumeFileName || 'Saved resume ready'}
                  </div>
                ) : (
                  <Link to="/profile" className="job-secondary-btn job-resume-link">
                    Upload in Profile
                  </Link>
                )}
              </div>

              <label>
                <span>Screening Summary</span>
                <textarea
                  value={applyData.experienceSummary}
                  onChange={(event) => setApplyData((prev) => ({ ...prev, experienceSummary: event.target.value }))}
                  placeholder="Briefly explain your relevant skills, projects, and why you are a strong fit."
                  minLength={30}
                  required
                />
              </label>

              <label className="job-check-row">
                <input
                  type="checkbox"
                  checked={applyData.agreeEligibility}
                  onChange={(event) => setApplyData((prev) => ({ ...prev, agreeEligibility: event.target.checked }))}
                />
                <span>I confirm I am eligible for this role.</span>
              </label>

              <label className="job-check-row">
                <input
                  type="checkbox"
                  checked={applyData.agreeProfileAccurate}
                  onChange={(event) => setApplyData((prev) => ({ ...prev, agreeProfileAccurate: event.target.checked }))}
                />
                <span>I confirm my profile details are accurate.</span>
              </label>

              <label className="job-check-row">
                <input
                  type="checkbox"
                  checked={applyData.agreeDataConsent}
                  onChange={(event) => setApplyData((prev) => ({ ...prev, agreeDataConsent: event.target.checked }))}
                />
                <span>I consent to share this information with the employer.</span>
              </label>

              <div className="job-apply-actions">
                <button type="button" className="job-secondary-btn" onClick={closeApplyModal}>Cancel</button>
                <button type="submit" className="job-primary-btn" disabled={!isApplyFormValid || applying}>
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        {successModalOpen && (
          <div className="job-apply-overlay" onClick={() => setSuccessModalOpen(false)}>
            <div className="job-success-modal" onClick={(event) => event.stopPropagation()}>
              <div className="job-success-mark">✓</div>
              <h3>Application submitted successfully</h3>
              <p>Your profile has been shared with the employer. You can track the latest stage from the applications section.</p>
              <div className="job-apply-actions">
                <Link to="/applications" className="job-primary-btn">View applications</Link>
                <button type="button" className="job-secondary-btn" onClick={() => setSuccessModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default JobDetail;
