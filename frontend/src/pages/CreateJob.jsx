import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SkillTagInput from '../components/SkillTagInput';
import RecruiterWorkspace from '../components/RecruiterWorkspace';
import { useRecruiterSuite } from '../hooks/useRecruiterSuite';
import api from '../services/api';
import { buildDailySeries, formatCurrency } from '../utils/recruiterSuite';
import './RecruiterSuite.css';

const DEFAULT_FORM = {
  title: '',
  location: '',
  minSalary: '',
  maxSalary: '',
  jobType: 'Full-time Permanent',
  experienceLevel: 'Senior',
  skills: '',
  description: '',
  jobRequirements: '',
  persona: '',
  portfolioWeight: 85,
  domainWeight: 40
};

const CreateJob = () => {
  const navigate = useNavigate();
  const aiSectionRef = useRef(null);
  const { profile, employer, applications, loading: workspaceLoading, error: workspaceError } = useRecruiterSuite();
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const draftStorageKey = profile?.username ? `joblithic-job-draft:${profile.username}` : null;

  const setField = (name, value) => {
    setSavedMessage('');
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const loadInitialState = async () => {
      if (!profile?.username) {
        setPrefillLoading(false);
        return;
      }

      const basePrefill = {
        ...DEFAULT_FORM,
        location: profile.location || DEFAULT_FORM.location
      };

      if (draftStorageKey) {
        try {
          const storedDraft = JSON.parse(localStorage.getItem(draftStorageKey) || 'null');
          if (storedDraft) {
            setFormData({ ...basePrefill, ...storedDraft });
            setPrefillLoading(false);
            return;
          }
        } catch {
          // Ignore invalid local drafts and continue with profile-backed defaults.
        }
      }

      setFormData(basePrefill);
      setPrefillLoading(false);
    };

    loadInitialState();
  }, [draftStorageKey, profile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const minSalary = Number(formData.minSalary);
    const maxSalary = Number(formData.maxSalary);

    if (!Number.isFinite(minSalary) || !Number.isFinite(maxSalary) || minSalary <= 0 || maxSalary <= 0) {
      setError('Add a valid salary range before publishing.');
      return;
    }

    if (maxSalary < minSalary) {
      setError('Maximum salary must be greater than or equal to minimum salary.');
      return;
    }

    if (!formData.skills.trim()) {
      setError('Add at least one required skill.');
      return;
    }

    if (!formData.jobRequirements.trim()) {
      setError('Add job requirements before publishing.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/job', {
        title: formData.title.trim(),
        location: formData.location.trim(),
        salary: Math.round((minSalary + maxSalary) / 2),
        jobType: formData.jobType,
        experienceLevel: formData.experienceLevel,
        keySkills: formData.skills,
        jobHighlights: [
          `Salary range: ${formatCurrency(minSalary)} - ${formatCurrency(maxSalary)}`,
          `Priority focus: Portfolio quality ${formData.portfolioWeight}%`,
          `Domain emphasis: ${formData.domainWeight}%`
        ].join('\n'),
        description: formData.description.trim(),
        aboutCompany: String(profile?.companyOverview || '').trim(),
        jobRequirements: formData.jobRequirements.trim(),
        companyReviewSummary: String(profile?.companyReviewSummary || '').trim(),
        companyReviewCount: Number(profile?.companyReviewCount) || 0
      });

      if (draftStorageKey) {
        localStorage.removeItem(draftStorageKey);
      }

      navigate('/employer-dashboard');
    } catch (requestError) {
      const serverData = requestError.response?.data;
      if (serverData?.error) setError(serverData.error);
      else if (serverData && typeof serverData === 'object') setError(Object.values(serverData)[0] || 'Failed to post job.');
      else setError('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = () => {
    if (!draftStorageKey) return;
    localStorage.setItem(draftStorageKey, JSON.stringify(formData));
    setSavedMessage('Draft saved locally.');
    setError('');
  };

  const demandTrend = useMemo(() => buildDailySeries(applications, 6), [applications]);
  const previewTitle = formData.title || 'Senior Principal Product Designer';
  const previewLocation = formData.location || profile?.location || 'San Francisco (Hybrid)';
  const previewSalary = formData.minSalary && formData.maxSalary
    ? `${formatCurrency(formData.minSalary)} - ${formatCurrency(formData.maxSalary)}`
    : 'Compensation range';
  const hasEmployerCompanyData = Boolean(
    String(profile?.companyOverview || '').trim()
    || String(profile?.companyReviewSummary || '').trim()
    || Number(profile?.companyReviewCount)
  );

  if (workspaceLoading) {
    return <section className="recruiter-page recruiter-empty-state">Loading opportunity builder...</section>;
  }

  if (workspaceError) {
    return <section className="recruiter-page recruiter-empty-state">{workspaceError}</section>;
  }

  return (
    <RecruiterWorkspace
      activeKey="jobs"
      tone="dark"
      profile={profile}
      employer={employer}
      title="Post New Opportunity"
      subtitle="Shape the role details, candidate requirements, and AI curation signals before publishing."
      topActions={(
        <>
          <button type="button" className="recruiter-ghost-btn" onClick={saveDraft}>
            Save Draft
          </button>
          <button type="submit" form="recruiterOpportunityForm" className="recruiter-primary-btn" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Opportunity'}
          </button>
        </>
      )}
    >
      <section className="recruiter-stepper" style={{ marginBottom: '1.5rem' }}>
        <div className="recruiter-step is-complete">
          <div className="recruiter-step-badge"><Check size={15} /></div>
          <span>Job Details</span>
        </div>
        <div className="recruiter-step is-active">
          <div className="recruiter-step-badge">2</div>
          <span>Requirements</span>
        </div>
        <div className="recruiter-step">
          <div className="recruiter-step-badge">3</div>
          <span>AI Matching</span>
        </div>
        <div className="recruiter-step">
          <div className="recruiter-step-badge">4</div>
          <span>Review</span>
        </div>
      </section>

      {error && <section className="recruiter-panel" style={{ marginBottom: '1rem', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#b91c1c' }}>{error}</section>}
      {savedMessage && <section className="recruiter-panel" style={{ marginBottom: '1rem', borderColor: 'rgba(37, 99, 235, 0.2)', color: '#1d4ed8' }}>{savedMessage}</section>}
      {prefillLoading && <section className="recruiter-panel" style={{ marginBottom: '1rem' }}>Loading company defaults from your employer profile...</section>}

      <div className="recruiter-suite-two-up" style={{ alignItems: 'start' }}>
        <form id="recruiterOpportunityForm" className="recruiter-form-section" onSubmit={handleSubmit}>
          <section className="recruiter-panel recruiter-glass-card">
            <div className="recruiter-panel-title">
              <h2>Job Details</h2>
              <p>Define the role, geography, and compensation clearly for candidates.</p>
            </div>

            <div className="recruiter-form-grid" style={{ marginTop: '1.3rem' }}>
              <div className="recruiter-form-field recruiter-form-field--full">
                <label htmlFor="title">Job Title</label>
                <input
                  id="title"
                  className="recruiter-form-control"
                  value={formData.title}
                  onChange={(event) => setField('title', event.target.value)}
                  placeholder="e.g. Senior Principal Product Designer"
                  required
                />
              </div>

              <div className="recruiter-form-field">
                <label htmlFor="jobType">Employment Type</label>
                <select
                  id="jobType"
                  className="recruiter-select"
                  value={formData.jobType}
                  onChange={(event) => setField('jobType', event.target.value)}
                >
                  <option value="Full-time Permanent">Full-time Permanent</option>
                  <option value="Contract / Freelance">Contract / Freelance</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="recruiter-form-field">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  className="recruiter-form-control"
                  value={formData.location}
                  onChange={(event) => setField('location', event.target.value)}
                  placeholder="e.g. San Francisco (Hybrid)"
                  required
                />
              </div>

              <div className="recruiter-form-field">
                <label htmlFor="minSalary">Salary Range Min</label>
                <input
                  id="minSalary"
                  type="number"
                  min="1"
                  className="recruiter-form-control"
                  value={formData.minSalary}
                  onChange={(event) => setField('minSalary', event.target.value)}
                  placeholder="$140k"
                  required
                />
              </div>

              <div className="recruiter-form-field">
                <label htmlFor="maxSalary">Salary Range Max</label>
                <input
                  id="maxSalary"
                  type="number"
                  min="1"
                  className="recruiter-form-control"
                  value={formData.maxSalary}
                  onChange={(event) => setField('maxSalary', event.target.value)}
                  placeholder="$190k"
                  required
                />
              </div>

              <div className="recruiter-form-field recruiter-form-field--full">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="recruiter-textarea"
                  value={formData.description}
                  onChange={(event) => setField('description', event.target.value)}
                  placeholder="Define the mission, impact, day-to-day work, and the business context for this role."
                  required
                />
              </div>
            </div>
          </section>

          <section className="recruiter-panel recruiter-glass-card">
            <div className="recruiter-panel-title">
              <h2>Candidate Requirements</h2>
              <p>Set the seniority and capabilities you want the ranking model to prioritize.</p>
            </div>

            <div className="recruiter-form-section" style={{ marginTop: '1.2rem' }}>
              <div className="recruiter-form-field">
                <span className="recruiter-field-label">Experience Level</span>
                <div className="recruiter-segment-buttons">
                  {['Junior', 'Mid-Level', 'Senior', 'Lead/VP'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={formData.experienceLevel === option ? 'is-active' : ''}
                      onClick={() => setField('experienceLevel', option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="recruiter-form-field">
                <label htmlFor="skills">Technical Skills & Expertise</label>
                <SkillTagInput
                  value={formData.skills}
                  onChange={(next) => setField('skills', next)}
                  placeholder="Figma, System Thinking, User Research"
                />
              </div>

              <div className="recruiter-form-field">
                <label htmlFor="jobRequirements">Candidate Requirements</label>
                <textarea
                  id="jobRequirements"
                  className="recruiter-textarea"
                  value={formData.jobRequirements}
                  onChange={(event) => setField('jobRequirements', event.target.value)}
                  placeholder={'List must-have requirements, one per line.\nLead collaboration across functions\nStrong design systems experience\nComfort with product discovery'}
                  required
                />
              </div>
            </div>
          </section>

          <section ref={aiSectionRef} className="recruiter-panel recruiter-dark-panel">
            <div className="recruiter-panel-title">
              <h2>AI Curator Parameters</h2>
              <p>Use these controls to encode the profile DNA of your ideal candidate.</p>
            </div>

            <div className="recruiter-form-section" style={{ marginTop: '1.3rem' }}>
              <div className="recruiter-form-field">
                <span className="recruiter-field-label">Matching Focus</span>

                <div className="recruiter-slider-row">
                  <div>
                    <strong>Portfolio Quality</strong>
                    <span>Visual craft and execution</span>
                  </div>
                  <div className="recruiter-slider-track">
                    <div style={{ width: `${formData.portfolioWeight}%`, background: '#3b82f6' }} />
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.portfolioWeight}
                  onChange={(event) => setField('portfolioWeight', Number(event.target.value))}
                />

                <div className="recruiter-slider-row">
                  <div>
                    <strong>Domain Experience</strong>
                    <span>Relevant industry background</span>
                  </div>
                  <div className="recruiter-slider-track">
                    <div style={{ width: `${formData.domainWeight}%`, background: '#a855f7' }} />
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.domainWeight}
                  onChange={(event) => setField('domainWeight', Number(event.target.value))}
                />
              </div>

              <div className="recruiter-form-field">
                <label htmlFor="persona">Ideal Candidate Persona</label>
                <textarea
                  id="persona"
                  className="recruiter-textarea"
                  value={formData.persona}
                  onChange={(event) => setField('persona', event.target.value)}
                  placeholder="Describe the soft skills and mindset you want the AI ranking to emphasize..."
                />
              </div>

              <article className="recruiter-company-data-note">
                <strong>Company profile data is attached automatically.</strong>
                <p>
                  About-company content, review headline, and review count are taken from your employer settings
                  so this form stays focused on the role itself.
                </p>
                {!hasEmployerCompanyData && (
                  <p>
                    Add those company details in Settings if you want richer branded job cards.
                  </p>
                )}
              </article>
            </div>
          </section>
        </form>

        <aside className="recruiter-preview-card">
          <div className="recruiter-panel recruiter-preview-mini">
            <span className="recruiter-field-label">Live Preview</span>

            <div className="recruiter-preview-logo" style={{ marginTop: '1rem' }}>
              {profile?.companyLogoUrl
                ? <img src={profile.companyLogoUrl} alt={profile.companyName || 'Company logo'} />
                : <span>{(profile?.companyName || profile?.username || 'JL').slice(0, 2).toUpperCase()}</span>}
            </div>

            <h3>{previewTitle}</h3>
            <p className="recruiter-preview-meta">
              {(profile?.companyName || profile?.username || 'JobLithic')} | {previewLocation}
            </p>

            <div className="recruiter-preview-chip-row">
              <span className="recruiter-tag-pill">{formData.jobType}</span>
              <span className="recruiter-tag-pill">{previewSalary}</span>
            </div>

            <div className="recruiter-preview-sparkline">
              {demandTrend.map((point, index) => {
                const maxCount = Math.max(...demandTrend.map((item) => item.count), 1);
                const height = `${Math.max(18, (point.count / maxCount) * 100)}%`;
                return <span key={`${point.label}-${index}`} style={{ height }} />;
              })}
            </div>

            <p className="recruiter-inline-muted" style={{ marginTop: '0.85rem', textAlign: 'center' }}>
              Market demand trend from your recent applicant activity
            </p>
          </div>

          <div className="recruiter-tip-card">
            <strong>Recruiter Pro Tip</strong>
            <p>
              Listings with clear salary expectations and concrete skill tags usually convert better because candidates self-qualify earlier.
            </p>
          </div>

          <div className="recruiter-panel recruiter-glass-card">
            <button type="button" className="recruiter-primary-btn" style={{ width: '100%' }} onClick={() => aiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              Next: Matching Strategy
              <ChevronRight size={16} />
            </button>
            <button type="button" className="recruiter-ghost-btn" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => navigate('/employer-dashboard')}>
              Back to Overview
            </button>
          </div>
        </aside>
      </div>
    </RecruiterWorkspace>
  );
};

export default CreateJob;
