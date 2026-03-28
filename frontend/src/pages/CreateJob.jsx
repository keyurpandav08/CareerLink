import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SkillTagInput from '../components/SkillTagInput';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './CreateJob.css';

const CreateJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    salary: '',
    jobType: 'Full-time',
    experienceLevel: '0-2 years',
    skills: '',
    jobHighlights: '',
    description: '',
    aboutCompany: '',
    jobRequirements: '',
    companyReviewSummary: '',
    companyReviewCount: '250'
  });
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(true);
  const [error, setError] = useState('');

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchEmployerProfile = async () => {
      if (!user?.username) {
        setPrefillLoading(false);
        return;
      }

      try {
        const response = await api.get(`/users/username/${user.username}`);
        const profile = response.data;
        setFormData((prev) => ({
          ...prev,
          aboutCompany: profile.companyOverview || prev.aboutCompany,
          companyReviewSummary: profile.companyReviewSummary || prev.companyReviewSummary,
          companyReviewCount: String(profile.companyReviewCount ?? prev.companyReviewCount)
        }));
      } catch {
        // Keep the form usable even if profile prefill fails.
      } finally {
        setPrefillLoading(false);
      }
    };

    fetchEmployerProfile();
  }, [user?.username]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.skills.trim()) {
      setError('Add at least one required skill.');
      return;
    }
    if (!formData.jobHighlights.trim()) {
      setError('Add job highlights so candidates can quickly understand the role.');
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
        salary: Number(formData.salary),
        jobType: formData.jobType,
        experienceLevel: formData.experienceLevel,
        keySkills: formData.skills,
        jobHighlights: formData.jobHighlights.trim(),
        description: formData.description.trim(),
        aboutCompany: formData.aboutCompany.trim(),
        jobRequirements: formData.jobRequirements.trim(),
        companyReviewSummary: formData.companyReviewSummary.trim(),
        companyReviewCount: Number(formData.companyReviewCount) || 0
      });
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

  return (
    <section className="create-job-wrap">
      <div className="container create-job-card">
        <header className="create-job-header">
          <div>
            <h1>Create Job Opening</h1>
            <p>Fill structured company and role details so the job page looks like a professional hiring portal.</p>
          </div>
          <Link to="/employer-dashboard">Back to dashboard</Link>
        </header>

        {error && <div className="create-job-alert">{error}</div>}
        {prefillLoading && <div className="create-job-note">Loading company details from employer profile...</div>}
        {!prefillLoading && formData.aboutCompany && (
          <div className="create-job-note">
            Company branding and logo are taken from employer settings. Update them from the Settings page when needed.
          </div>
        )}

        <form className="create-job-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title">Job Title</label>
            <input
              id="title"
              value={formData.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder="e.g. Java Backend Developer"
              required
            />
          </div>

          <div>
            <label htmlFor="location">Location</label>
            <input
              id="location"
              value={formData.location}
              onChange={(event) => setField('location', event.target.value)}
              placeholder="e.g. Ahmedabad / Remote"
              required
            />
          </div>

          <div>
            <label htmlFor="salary">Annual Salary (INR)</label>
            <input
              id="salary"
              type="number"
              min="1"
              value={formData.salary}
              onChange={(event) => setField('salary', event.target.value)}
              placeholder="e.g. 900000"
              required
            />
          </div>

          <div>
            <label htmlFor="jobType">Job Type</label>
            <select
              id="jobType"
              value={formData.jobType}
              onChange={(event) => setField('jobType', event.target.value)}
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          <div>
            <label htmlFor="experienceLevel">Experience Level</label>
            <select
              id="experienceLevel"
              value={formData.experienceLevel}
              onChange={(event) => setField('experienceLevel', event.target.value)}
            >
              <option value="0-2 years">0-2 years</option>
              <option value="2-4 years">2-4 years</option>
              <option value="4-7 years">4-7 years</option>
              <option value="7+ years">7+ years</option>
            </select>
          </div>

          <div className="full-width">
            <label htmlFor="skills">Key Skills</label>
            <SkillTagInput
              value={formData.skills}
              onChange={(next) => setField('skills', next)}
              placeholder="React, Java, Spring Boot, SQL, Communication"
            />
          </div>

          <div className="full-width">
            <label htmlFor="jobHighlights">Job Highlights</label>
            <textarea
              id="jobHighlights"
              value={formData.jobHighlights}
              onChange={(event) => setField('jobHighlights', event.target.value)}
              placeholder={'Write 3-6 short points, one per line.\nFlexible hybrid model\nFast-growth product team\nDirect mentorship from senior engineers'}
              rows={5}
              required
            />
          </div>

          <div className="full-width">
            <label htmlFor="description">Job Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder="What the role will own, day-to-day responsibilities, and what success looks like."
              rows={7}
              required
            />
          </div>

          <div className="full-width">
            <label htmlFor="jobRequirements">Job Requirements</label>
            <textarea
              id="jobRequirements"
              value={formData.jobRequirements}
              onChange={(event) => setField('jobRequirements', event.target.value)}
              placeholder={'Add must-have requirements, one per line.\nStrong React fundamentals\nREST API integration\nGood problem solving'}
              rows={6}
              required
            />
          </div>

          <div className="full-width create-job-section-title">Company Presentation</div>

          <div className="full-width">
            <label htmlFor="aboutCompany">About Company</label>
            <textarea
              id="aboutCompany"
              value={formData.aboutCompany}
              onChange={(event) => setField('aboutCompany', event.target.value)}
              placeholder="Tell candidates about company mission, products, work culture, and why they should join."
              rows={6}
            />
          </div>

          <div>
            <label htmlFor="companyReviewSummary">Review Headline</label>
            <input
              id="companyReviewSummary"
              value={formData.companyReviewSummary}
              onChange={(event) => setField('companyReviewSummary', event.target.value)}
              placeholder="4.4 overall rating from employees"
            />
          </div>

          <div>
            <label htmlFor="companyReviewCount">Review Count</label>
            <input
              id="companyReviewCount"
              type="number"
              min="0"
              value={formData.companyReviewCount}
              onChange={(event) => setField('companyReviewCount', event.target.value)}
              placeholder="250"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Job'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default CreateJob;
