import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, DollarSign, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleName } from '../utils/role';
import api from '../services/api';
import './JobDetail.css';

const defaultApplyData = {
  expectedSalary: '',
  noticePeriod: 'Immediate',
  experienceSummary: '',
  agreeEligibility: false,
  agreeProfileAccurate: false,
  agreeDataConsent: false
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

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/job/${id}`);
        setJob(response.data);
      } catch (requestError) {
        setError('Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const roleName = getRoleName(user);
  const isApplicant = roleName === 'APPLICANT';
  const canApply = Boolean(user) && isApplicant && job?.status === 'Open';

  const isApplyFormValid = useMemo(() => (
    applyData.expectedSalary.trim() &&
    applyData.experienceSummary.trim().length >= 30 &&
    applyData.agreeEligibility &&
    applyData.agreeProfileAccurate &&
    applyData.agreeDataConsent
  ), [applyData]);

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
        applicationNote: note
      });
      setApplyFeedback('Application submitted successfully.');
      setApplyOpen(false);
      setApplyData(defaultApplyData);
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

        <article className="job-detail-card">
          <header className="job-detail-head">
            <div>
              <h1>{job.title}</h1>
              <div className="job-meta-row">
                <span><Briefcase size={15} />{job.employerName || 'Confidential'}</span>
                <span><MapPin size={15} />{job.location}</span>
                <span><DollarSign size={15} />${job.salary}</span>
              </div>
            </div>
            <span className={`job-status ${String(job.status).toLowerCase()}`}>{job.status}</span>
          </header>

          <section className="job-description">
            <h2>Job Description</h2>
            <p>{job.description}</p>
          </section>

          {applyFeedback && <div className="apply-feedback">{applyFeedback}</div>}

          <div className="job-actions-row">
            <button
              type="button"
              className="apply-main-btn"
              onClick={openApplyModal}
              disabled={!canApply}
            >
              {canApply ? 'Apply with details' : (roleName === 'EMPLOYER' ? 'Employer account cannot apply' : 'Application unavailable')}
            </button>
          </div>
        </article>

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
      </div>
    </section>
  );
};

export default JobDetail;
