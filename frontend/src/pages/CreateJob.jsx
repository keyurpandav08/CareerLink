import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SkillTagInput from '../components/SkillTagInput';
import api from '../services/api';
import './CreateJob.css';

const CreateJob = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    salary: '',
    jobType: 'Full-time',
    experienceLevel: '0-2 years',
    skills: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.skills.trim()) {
      setError('Add at least one required skill.');
      return;
    }

    const structuredDescription = [
      `Job Type: ${formData.jobType}`,
      `Experience Level: ${formData.experienceLevel}`,
      `Required Skills: ${formData.skills}`,
      '',
      formData.description.trim()
    ].join('\n');

    setLoading(true);
    try {
      await api.post('/job', {
        title: formData.title.trim(),
        location: formData.location.trim(),
        salary: Number(formData.salary),
        description: structuredDescription
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
            <p>Fill all required details to attract relevant applicants.</p>
          </div>
          <Link to="/employer-dashboard">Back to dashboard</Link>
        </header>

        {error && <div className="create-job-alert">{error}</div>}

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
            <label htmlFor="salary">Annual Salary (USD)</label>
            <input
              id="salary"
              type="number"
              min="1"
              value={formData.salary}
              onChange={(event) => setField('salary', event.target.value)}
              placeholder="e.g. 100000"
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
            <label htmlFor="skills">Required Skills</label>
            <SkillTagInput
              value={formData.skills}
              onChange={(next) => setField('skills', next)}
              placeholder="Select required skills"
            />
          </div>

          <div className="full-width">
            <label htmlFor="description">Role Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder="Responsibilities, must-have requirements, and hiring process."
              rows={7}
              required
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
