import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  FileText,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import CandidateWorkspace from '../components/CandidateWorkspace';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { hasResume } from '../utils/candidatePortal';
import { readCachedValue, writeCachedValue } from '../utils/pageCache';
import './ResumeBuilder.css';

const ROLE_OPTIONS = {
  JAVA_DEVELOPER: {
    label: 'Java Developer',
    previewScore: 84,
    growth: '+21%',
    paths: ['Spring Architecture Labs', 'Advanced API Design', 'Cloud Deployment']
  },
  FRONTEND_DEVELOPER: {
    label: 'Frontend Developer',
    previewScore: 86,
    growth: '+24%',
    paths: ['Design Systems Mastery', 'Frontend Performance', 'Experimentation Fundamentals']
  },
  FULL_STACK_DEVELOPER: {
    label: 'Full Stack Developer',
    previewScore: 82,
    growth: '+27%',
    paths: ['System Design Essentials', 'Distributed APIs', 'Observability for Web Apps']
  },
  DATA_ANALYST: {
    label: 'Data Analyst',
    previewScore: 79,
    growth: '+19%',
    paths: ['Advanced SQL for Analytics', 'Power BI Storytelling', 'Statistics for Decisions']
  }
};

const calculateScore = (analysis, targetRole) => {
  if (!analysis) return ROLE_OPTIONS[targetRole]?.previewScore || 84;
  if (analysis.score) return analysis.score;

  const detectedSkills = analysis.detectedSkills?.length || 0;
  const missingSkills = analysis.missingSkills?.length || 0;
  return Math.max(48, Math.min(96, 68 + detectedSkills * 5 - missingSkills * 4));
};

const ResumeBuilder = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [targetRole, setTargetRole] = useState('JAVA_DEVELOPER');
  const [additionalSkills, setAdditionalSkills] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.username) {
        setLoading(false);
        return;
      }

      const cacheKey = `resume-builder:${user.username}`;
      const cachedState = readCachedValue(cacheKey, null);
      if (cachedState?.profile) {
        setProfile(cachedState.profile);
        setResult(cachedState.result || null);
        setFeedback(cachedState.feedback || '');
      }

      try {
        const response = await api.get(`/users/username/${user.username}`);
        setProfile(response.data);
        writeCachedValue(cacheKey, {
          profile: response.data,
          result: cachedState?.result || null,
          feedback: cachedState?.feedback || ''
        });
      } catch (requestError) {
        if (!cachedState?.profile) {
          setError(requestError.response?.data?.error || 'Unable to load your saved resume.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const savedResumeAvailable = hasResume(profile?.resumeUrl);
  const roleConfig = ROLE_OPTIONS[targetRole];
  const globalScore = useMemo(() => calculateScore(result, targetRole), [result, targetRole]);

  const keywordItems = useMemo(() => {
    const detected = (result?.detectedSkills || []).map((skill) => ({ label: skill, type: 'detected' }));
    const missing = (result?.missingSkills || []).map((skill) => ({ label: skill, type: 'missing' }));
    const fallback = ['Systems Thinking', 'APIs', 'Prototyping'].map((skill) => ({ label: skill, type: 'detected' }));

    return [...detected, ...missing].length ? [...detected, ...missing] : fallback;
  }, [result]);

  const gapMetrics = useMemo(() => {
    const detectedSkills = result?.detectedSkills || [];
    const missingSkills = result?.missingSkills || [];
    const total = detectedSkills.length + missingSkills.length || 1;

    return [
      {
        label: roleConfig.label,
        score: Math.max(42, Math.min(96, Math.round((detectedSkills.length / total) * 100) || roleConfig.previewScore))
      },
      {
        label: 'Keyword Coverage',
        score: Math.max(35, Math.min(92, (detectedSkills.length * 12) || 78))
      },
      {
        label: 'Gap Closure Potential',
        score: Math.max(28, Math.min(89, 100 - (missingSkills.length * 11 || 42)))
      }
    ];
  }, [result, roleConfig]);

  const growthPaths = useMemo(() => {
    if (result?.learningPath) {
      return [
        ...(result.learningPath.beginner || []),
        ...(result.learningPath.intermediate || []),
        ...(result.learningPath.advanced || [])
      ].slice(0, 3);
    }

    return roleConfig.paths;
  }, [result, roleConfig]);

  const suggestedJobs = useMemo(() => {
    const jobs = result?.suggestedJobs || [];
    if (!searchTerm.trim()) return jobs;
    const query = searchTerm.trim().toLowerCase();

    return jobs.filter((job) =>
      [job.title, job.company, job.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [result?.suggestedJobs, searchTerm]);

  const handleAnalyze = async (event) => {
    event.preventDefault();
    setError('');
    setFeedback('');

    if (!savedResumeAvailable) {
      setError('Upload your resume once from Profile before running AI analysis here.');
      return;
    }

    try {
      setAnalyzing(true);
      const resumeResponse = await api.get(profile.resumeUrl, { responseType: 'blob' });
      const resumeFile = new File(
        [resumeResponse.data],
        profile.resumeFileName || 'resume.pdf',
        { type: resumeResponse.data.type || 'application/pdf' }
      );

      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('targetRole', targetRole);
      formData.append('additionalSkills', additionalSkills);

      const response = await api.post('/api/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response.data.analysis);
      setFeedback('Live AI analysis completed successfully.');
      writeCachedValue(`resume-builder:${user.username}`, {
        profile,
        result: response.data.analysis,
        feedback: 'Live AI analysis completed successfully.'
      });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Resume analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAutoUpdate = async () => {
    if (!result?.resumeRewrite) {
      setError('Run the AI analysis first to unlock an updated resume summary.');
      return;
    }

    try {
      await navigator.clipboard.writeText(result.resumeRewrite);
      setFeedback('AI-updated resume summary copied to clipboard.');
      setTimeout(() => setFeedback(''), 2200);
    } catch {
      setError('Could not copy the AI resume summary. Please try again.');
    }
  };

  if (loading) {
    return <CandidateWorkspace activePath="/resume-builder">Loading resume insights...</CandidateWorkspace>;
  }

  return (
    <CandidateWorkspace
      activePath="/resume-builder"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search insights..."
    >
      <div className="resume-insights-page">
        <section className="resume-insights-hero">
          <div className="resume-insights-copy">
            <span className="resume-insights-kicker">
              <Sparkles size={14} />
              Resume Intelligence
            </span>
            <h1>
              Your Career,
              <br />
              <span>Architecturally Analyzed.</span>
            </h1>
            <p>
              Gemini is used only at analysis time. Your saved profile resume is fetched from the single profile manager,
              then reviewed against the role you want to highlight missing skills and surface matching jobs.
            </p>
            <div className="resume-insights-meta">
              <div className="resume-source-pill">
                <FileText size={16} />
                <span>
                  {savedResumeAvailable
                    ? `Using ${profile.resumeFileName || 'your saved resume'}`
                    : 'Upload your resume once in Profile to unlock AI analysis'}
                </span>
              </div>

              <div className="resume-insights-mini-stats">
                <div>
                  <strong>{roleConfig.label}</strong>
                  <span>Current target</span>
                </div>
                <div>
                  <strong>{roleConfig.growth}</strong>
                  <span>Market momentum</span>
                </div>
              </div>
            </div>
          </div>

          <form className="resume-insights-form" onSubmit={handleAnalyze}>
            <div className="resume-insights-form-head">
              <div>
                <span>Analysis Controls</span>
                <h2>Run a focused resume review</h2>
                <p>Choose the target role, add optional keywords, then analyze the same saved resume used across your profile and applications.</p>
              </div>
              <div className={`resume-insights-form-status ${savedResumeAvailable ? 'is-ready' : 'is-empty'}`}>
                <Zap size={16} />
                <span>{savedResumeAvailable ? 'Resume ready' : 'Resume missing'}</span>
              </div>
            </div>

            <div className="resume-insights-grid">
              <label>
                <span>Target Role</span>
                <select value={targetRole} onChange={(event) => setTargetRole(event.target.value)}>
                  {Object.entries(ROLE_OPTIONS).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Extra Skills</span>
                <input
                  type="text"
                  value={additionalSkills}
                  onChange={(event) => setAdditionalSkills(event.target.value)}
                  placeholder="Example: react, metrics, spring"
                />
              </label>
            </div>

            <div className="resume-insights-actions">
              <button type="submit" disabled={analyzing || !savedResumeAvailable}>
                {analyzing ? 'Analyzing...' : 'Analyze Saved Resume'}
              </button>

              {!savedResumeAvailable ? (
                <Link to="/profile" className="resume-insights-profile-link">
                  Manage Resume in Profile
                </Link>
              ) : (
                <p className="resume-insights-helper">
                  Analysis starts only when you submit. Uploading and storing your resume does not use Gemini.
                </p>
              )}
            </div>
          </form>
        </section>

        {error && <div className="resume-insights-error">{error}</div>}
        {feedback && <div className="resume-insights-error resume-insights-success">{feedback}</div>}

        <div className="resume-insights-bento">
          <section className="resume-score-card">
            <div className="resume-score-ring" style={{ '--score': globalScore }}>
              <div>
                <strong>{globalScore}</strong>
                <span>Global Score</span>
              </div>
            </div>

            <p>You are positioning toward <span>{roleConfig.label}</span> opportunities.</p>

            <div className="resume-score-pills">
              <span>Format: Strong</span>
              <span>Impact: {result?.level || 'High'}</span>
            </div>
          </section>

          <section className="resume-gap-card">
            <h2>Skill Gap Analysis</h2>
            <div className="resume-gap-list">
              {gapMetrics.map((metric) => (
                <div key={metric.label}>
                  <div className="resume-gap-row">
                    <span>{metric.label}</span>
                    <strong>{metric.score}% Match</strong>
                  </div>
                  <div className="resume-gap-bar">
                    <span style={{ width: `${metric.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <blockquote>
              Insight: {result?.insight || 'Closing your top missing skills could materially improve visibility for the next hiring stage.'}
            </blockquote>
          </section>

          <section className="resume-keyword-card">
            <h2>Keyword Optimization</h2>
            <div className="resume-keyword-list">
              {keywordItems.map((item) => (
                <span key={`${item.type}-${item.label}`} className={item.type}>
                  {item.label}
                </span>
              ))}
            </div>

            <button type="button" onClick={handleAutoUpdate}>Update Resume Automatically</button>
          </section>

          <section className="resume-growth-card">
            <h2>Growth Paths</h2>
            <div className="resume-growth-list">
              {growthPaths.map((item) => (
                <Link key={item} to={`/jobs?search=${encodeURIComponent(item)}`} className="resume-growth-link">
                  <div className="resume-growth-icon">
                    <BookOpenCheck size={18} />
                  </div>
                  <div>
                    <strong>{item}</strong>
                    <span>Recommended next learning milestone</span>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="resume-market-card">
          <div>
            <h2>Market Demand Trend</h2>
            <p>{roleConfig.label} talent with stronger role-specific skills is seeing increased hiring momentum this quarter.</p>
            <div className="resume-market-metric">
              <strong>{roleConfig.growth}</strong>
              <span>Q3 growth</span>
            </div>
          </div>

          <div className="resume-market-jobs">
            <div className="resume-market-jobs-head">
              <h3>Suggested Jobs</h3>
              <span>{suggestedJobs.length} visible</span>
            </div>

            {suggestedJobs.length > 0 ? (
              suggestedJobs.slice(0, 3).map((job) => (
                <Link key={`${job.id}-${job.title}`} to={job.id ? `/jobs/${job.id}` : '/jobs'} className="resume-market-job">
                  <div className="resume-market-job-copy">
                    <strong>{job.title}</strong>
                    <span>{`${job.company} • ${job.location}`}</span>
                  </div>
                  <Target size={16} />
                </Link>
              ))
            ) : (
              <div className="resume-market-empty">Analyze your resume to unlock suggested roles.</div>
            )}
          </div>
        </section>
      </div>
    </CandidateWorkspace>
  );
};

export default ResumeBuilder;
