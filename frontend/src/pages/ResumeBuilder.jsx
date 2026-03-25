import { useState } from 'react';
import { Upload, Sparkles, Target, BookOpenCheck } from 'lucide-react';
import api from '../services/api';
import './ResumeBuilder.css';

const ResumeBuilder = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [targetRole, setTargetRole] = useState('JAVA_DEVELOPER');
  const [additionalSkills, setAdditionalSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      setError(err.response?.data?.error || 'Resume analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-ai-page">
      <div className="resume-ai-card">
        <div className="resume-ai-header">
          <Sparkles size={28} />
          <div>
            <h1>AI Resume Analyzer</h1>
            <p>Upload resume, choose your target role, and get missing skills + suggested jobs.</p>
          </div>
        </div>

        <form className="resume-ai-form" onSubmit={handleAnalyze}>
          <label className="file-upload">
            <Upload size={18} />
            <span>{resumeFile ? resumeFile.name : 'Upload resume (PDF/DOC/DOCX)'}</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              hidden
            />
          </label>

          <div className="form-grid">
            <div>
              <label>Target Role</label>
              <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                <option value="JAVA_DEVELOPER">Java Developer</option>
                <option value="FRONTEND_DEVELOPER">Frontend Developer</option>
                <option value="FULL_STACK_DEVELOPER">Full Stack Developer</option>
                <option value="DATA_ANALYST">Data Analyst</option>
              </select>
            </div>
            <div>
              <label>Extra Skills (optional)</label>
              <input
                type="text"
                value={additionalSkills}
                onChange={(e) => setAdditionalSkills(e.target.value)}
                placeholder="Example: html, css, java"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}

        {result && (
          <div className="analysis-section">
            <div className="analysis-top">
              <div className="metric-box">
                <Target size={18} />
                <div>
                  <small>Recommended Role</small>
                  <strong>{result.recommendedRole}</strong>
                </div>
              </div>
              <div className="metric-box">
                <BookOpenCheck size={18} />
                <div>
                  <small>Current Level</small>
                  <strong>{result.level}</strong>
                </div>
              </div>
            </div>

            <div className="analysis-grid">
              <ListCard title="Detected Skills" items={result.detectedSkills} />
              <ListCard title="Missing Skills" items={result.missingSkills} highlight />
            </div>

            <div className="analysis-grid">
              <ListCard title="Beginner Path" items={result.learningPath?.beginner || []} />
              <ListCard title="Intermediate Path" items={result.learningPath?.intermediate || []} />
              <ListCard title="Advanced Path" items={result.learningPath?.advanced || []} />
            </div>

            <ListCard
              title="Suggested Jobs"
              items={(result.suggestedJobs || []).map((job) => `${job.title} - ${job.company} (${job.location})`)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ListCard = ({ title, items, highlight }) => (
  <div className={`list-card ${highlight ? 'highlight' : ''}`}>
    <h3>{title}</h3>
    {items && items.length > 0 ? (
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ) : (
      <p className="empty">No data yet.</p>
    )}
  </div>
);

export default ResumeBuilder;
