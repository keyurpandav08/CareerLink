import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, FileText, CheckCircle2, Clock3, XCircle, ClipboardCheck } from 'lucide-react';
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
    try {
      setActionLoading(true);
      await api.put(`/applications/${appId}/status`, { status });
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update application status');
    } finally {
      setActionLoading(false);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      setActionLoading(true);
      await api.put(`/job/${jobId}/status`, { status });
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update job status');
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
      alert('Delete failed');
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
                <p className="job-meta">{job.location} · ${job.salary}</p>
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
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <div style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center"
            }}>
              <h3>Delete Job</h3>
              <p>Are you sure you want to delete this job?</p>

              <button onClick={() => setShowConfirm(false)}>Cancel</button>
              <button onClick={confirmDelete} style={{ marginLeft: "10px", color: "red" }}>
                Delete
              </button>
            </div>
          </div>
        )}
        {applications.length ? (
          <div className="applications-table-wrap">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Applied</th>
                  <th>Candidate Note</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.applicantName}</td>
                    <td>{app.jobTitle}</td>
                    <td>{app.appliedAt || '-'}</td>
                    <td>{app.applicationNote || '-'}</td>
                    <td><span className={`status-chip ${String(app.status).toLowerCase()}`}>{app.status}</span></td>
                    <td>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-panel"><p>No applications yet.</p></div>
        )}

      </section>
    </div>
  );
};

export default EmployerDashboard;
