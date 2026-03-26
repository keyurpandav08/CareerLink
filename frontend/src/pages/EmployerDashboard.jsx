import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  FileBadge2,
  FileText,
  Mail,
  Phone,
  XCircle
} from 'lucide-react';
import api from '../services/api';
import './EmployerDashboard.css';

const STAT_ICONS = {
  totalJobs: Briefcase,
  openJobs: ClipboardCheck,
  totalApplications: FileText,
  pending: Clock3,
  accepted: CheckCircle2,
  rejected: XCircle
};

const EmployerDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employer/dashboard');
      setDashboard(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load employer dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const jobs = dashboard?.jobs || [];
  const applications = dashboard?.applications || [];

  const metrics = useMemo(() => ({
    totalJobs: jobs.length,
    openJobs: jobs.filter((job) => String(job.status).toLowerCase() === 'open').length,
    totalApplications: applications.length,
    pending: applications.filter((app) => app.status === 'PENDING').length,
    accepted: applications.filter((app) => app.status === 'ACCEPTED').length,
    rejected: applications.filter((app) => app.status === 'REJECTED').length
  }), [applications, jobs]);

  const updateApplicationStatus = async (appId, status) => {
    const confirmed = window.confirm(`Update this application status to ${status}?`);
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await api.put(`/applications/${appId}/status`, { status });
      await loadDashboard();
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to update application status');
    } finally {
      setActionLoading(false);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    const label = String(status).toLowerCase() === 'close' ? 'close' : 'reopen';
    const confirmed = window.confirm(`Are you sure you want to ${label} this job?`);
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await api.put(`/job/${jobId}/status`, { status });
      await loadDashboard();
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to update job status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (jobId) => {
    setSelectedJobId(jobId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setActionLoading(true);
      await api.delete(`/job/${selectedJobId}`);
      setShowConfirm(false);
      await loadDashboard();
    } catch {
      window.alert('Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="container employer-page-state">Loading employer dashboard...</div>;
  if (error) return <div className="container employer-page-state error">{error}</div>;

  return (
    <div className="employer-dashboard container">
      <section className="employer-header">
        <div>
          <h1>Employer Control Center</h1>
          <p>Manage jobs, review applications, and update hiring pipeline.</p>
        </div>
        <div className="header-actions">
          <Link to="/post-job" className="solid-btn">Post New Job</Link>
          <button className="ghost-btn" onClick={loadDashboard} disabled={actionLoading}>Refresh</button>
        </div>
      </section>

      <section className="stats-grid">
        {Object.entries({
          totalJobs: 'Total Jobs',
          openJobs: 'Open Jobs',
          totalApplications: 'Total Applications',
          pending: 'Pending',
          accepted: 'Accepted',
          rejected: 'Rejected'
        }).map(([key, label]) => {
          const Icon = STAT_ICONS[key] || Briefcase;
          return (
            <article className="stat-card" key={key}>
              <Icon size={20} />
              <div>
                <small>{label}</small>
                <strong>{metrics[key] ?? 0}</strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-section">
        <div className="section-head">
          <h2>My Jobs</h2>
          <span>{jobs.length} listings</span>
        </div>

        {jobs.length ? (
          <div className="job-grid">
            {jobs.map((job) => (
              <article className="job-card" key={job.id}>
                <div className="job-top">
                  <h3>{job.title}</h3>
                  <span className={`status-chip ${String(job.status).toLowerCase()}`}>{job.status}</span>
                </div>
                <p className="job-meta">{job.location} · {job.jobType || 'Full-time'}</p>
                <p className="job-desc">{job.description}</p>
                <div className="job-actions">
                  <button onClick={() => updateJobStatus(job.id, job.status === 'Open' ? 'Close' : 'Open')} disabled={actionLoading}>
                    {job.status === 'Open' ? 'Close Job' : 'Reopen Job'}
                  </button>
                  <button className="danger" onClick={() => handleDeleteClick(job.id)} disabled={actionLoading}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <p>No jobs posted yet.</p>
            <Link to="/post-job">Create first job</Link>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-head">
          <h2>Applications Pipeline</h2>
          <span>{applications.length} candidates</span>
        </div>

        {showConfirm && (
          <div className="profile-modal-overlay">
            <div className="profile-modal-card compact-confirm">
              <h3>Delete Job</h3>
              <p>Are you sure you want to delete this job?</p>
              <div className="profile-modal-actions">
                <button type="button" className="ghost-btn-inline" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button type="button" className="solid-btn danger" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {applications.length ? (
          <div className="pipeline-grid">
            {applications.map((app) => (
              <article className="pipeline-card" key={app.id}>
                <div className="pipeline-top">
                  <div>
                    <h3>{app.applicantFullName || app.applicantName}</h3>
                    <p>{app.jobTitle} · {app.jobLocation || 'Location not set'}</p>
                  </div>
                  <span className={`status-chip ${String(app.status).toLowerCase()}`}>{app.status}</span>
                </div>

                <div className="pipeline-meta">
                  <span><Mail size={15} />{app.applicantEmail || 'No email'}</span>
                  <span><Phone size={15} />{app.applicantPhone || 'No phone'}</span>
                  <span><Clock3 size={15} />{app.appliedAt || '-'}</span>
                </div>

                <p className="pipeline-note">{app.applicationNote || 'No screening note shared by the candidate.'}</p>

                <div className="pipeline-actions">
                  <button type="button" className="outline-action-btn" onClick={() => setSelectedApplication(app)}>
                    <Eye size={15} />
                    View profile
                  </button>

                  {app.resumeUrl && app.resumeUrl !== 'resume_not_uploaded' ? (
                    <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="outline-action-btn">
                      <FileBadge2 size={15} />
                      Show resume
                    </a>
                  ) : (
                    <button type="button" className="outline-action-btn muted" disabled>
                      <FileBadge2 size={15} />
                      Resume unavailable
                    </button>
                  )}

                  <select
                    value={app.status}
                    disabled={actionLoading}
                    onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="REVIEWED">REVIEWED</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-panel"><p>No applications yet.</p></div>
        )}
      </section>

      {selectedApplication && (
        <div className="profile-modal-overlay" onClick={() => setSelectedApplication(null)}>
          <div className="profile-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="profile-modal-head">
              <div>
                <h3>{selectedApplication.applicantFullName || selectedApplication.applicantName}</h3>
                <p>{selectedApplication.jobTitle}</p>
              </div>
              <button type="button" className="ghost-btn-inline" onClick={() => setSelectedApplication(null)}>Close</button>
            </div>

            <div className="profile-modal-grid">
              <div>
                <small>Email</small>
                <strong>{selectedApplication.applicantEmail || '-'}</strong>
              </div>
              <div>
                <small>Phone</small>
                <strong>{selectedApplication.applicantPhone || '-'}</strong>
              </div>
              <div>
                <small>Experience</small>
                <strong>{selectedApplication.applicantExperience || 'Not added'}</strong>
              </div>
              <div>
                <small>Applied On</small>
                <strong>{selectedApplication.appliedAt || '-'}</strong>
              </div>
            </div>

            <div className="profile-modal-section">
              <small>Key Skills</small>
              <p>{selectedApplication.applicantSkills || 'No skills added by applicant.'}</p>
            </div>

            <div className="profile-modal-section">
              <small>Candidate Note</small>
              <p>{selectedApplication.applicationNote || 'No candidate note shared.'}</p>
            </div>

            <div className="profile-modal-actions">
              {selectedApplication.resumeUrl && selectedApplication.resumeUrl !== 'resume_not_uploaded' ? (
                <a href={selectedApplication.resumeUrl} target="_blank" rel="noreferrer" className="solid-btn">
                  <FileBadge2 size={15} />
                  Show resume
                </a>
              ) : (
                <button type="button" className="ghost-btn-inline" disabled>Resume unavailable</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
