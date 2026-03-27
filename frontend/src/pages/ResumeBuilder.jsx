import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  KeyRound,
  Sparkles,
  Target,
  Upload
} from 'lucide-react';
import CandidateWorkspace from '../components/CandidateWorkspace';
import api from '../services/api';
import './ResumeBuilder.css';

const GEMINI_KEY_STORAGE = 'joblithic_gemini_api_key';

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

  const detectedSkills = analysis.detectedSkills?.length || 0;
  const missingSkills = analysis.missingSkills?.length || 0;
  return Math.max(48, Math.min(96, 68 + detectedSkills * 5 - missingSkills * 4));
};

const ResumeBuilder = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [targetRole, setTargetRole] = useState('JAVA_DEVELOPER');
  const [additionalSkills, setAdditionalSkills] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    setGeminiApiKey(localStorage.getItem(GEMINI_KEY_STORAGE) || '');
  }, []);

  const persistGeminiKey = (value) => {
    setGeminiApiKey(value);
    localStorage.setItem(GEMINI_KEY_STORAGE, value);
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();
    setError('');

    if (!resumeFile) {
      setError('Please upload your resume first.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('targetRole', targetRole);
      formData.append('additionalSkills', additionalSkills);

      const response = await api.post('/api/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response.data.analysis);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Resume analysis failed.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <CandidateWorkspace
      activePath="/resume-builder"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search insights..."
    >
      <div className="resume-insights-page">
        <section className="resume-insights-hero">
          <div>
            <h1>
              Your Career,
              <br />
              <span>Architecturally Analyzed.</span>
            </h1>
            <p>
              Our existing resume analysis API is still powering this page. Add a Gemini API key below if you want it saved locally for future AI upgrades, but the current analysis flow remains unchanged.
            </p>
          </div>

          <form className="resume-insights-form" onSubmit={handleAnalyze}>
            <label className="resume-insights-upload">
              <Upload size={18} />
              <span>{resumeFile ? resumeFile.name : 'Upload resume (PDF/DOC/DOCX)'}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                hidden
              />
            </label>

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

            <label className="resume-insights-key">
              <KeyRound size={16} />
              <input
                type="password"
                value={geminiApiKey}
                onChange={(event) => persistGeminiKey(event.target.value)}
                placeholder="Optional Gemini API key"
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </button>
          </form>
        </section>

        {error && <div className="resume-insights-error">{error}</div>}

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
              Insight: closing your top missing skills could materially improve visibility for the next hiring stage.
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

            <button type="button">Update Resume Automatically</button>
          </section>

          <section className="resume-growth-card">
            <h2>Growth Paths</h2>
            <div className="resume-growth-list">
              {growthPaths.map((item) => (
                <article key={item}>
                  <div className="resume-growth-icon">
                    <BookOpenCheck size={18} />
                  </div>
                  <div>
                    <strong>{item}</strong>
                    <span>Recommended next learning milestone</span>
                  </div>
                  <ArrowRight size={16} />
                </article>
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
                    <span>{job.company} • {job.location}</span>
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
