import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCog,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AdminDashboard.css';

const numberFormatter = new Intl.NumberFormat('en-IN');
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const statusClassName = (value = '') => String(value).toLowerCase().replace(/\s+/g, '-');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    users: '',
    jobs: '',
    applications: ''
  });

  const deferredUserFilter = useDeferredValue(filters.users);
  const deferredJobFilter = useDeferredValue(filters.jobs);
  const deferredApplicationFilter = useDeferredValue(filters.applications);

  const loadAdminData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [dashboardRes, usersRes, jobsRes, applicationsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/jobs'),
        api.get('/admin/applications')
      ]);

      setDashboard(dashboardRes.data);
      setUsers(usersRes.data);
      setJobs(jobsRes.data);
      setApplications(applicationsRes.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to load admin panel.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const overview = dashboard?.overview || {};

  const metricCards = useMemo(() => ([
    {
      key: 'totalUsers',
      label: 'Platform Users',
      value: overview.totalUsers ?? 0,
      icon: Users,
      tone: 'blue'
    },
    {
      key: 'employers',
      label: 'Employers',
      value: overview.employers ?? 0,
      icon: UserCog,
      tone: 'violet'
    },
    {
      key: 'activeJobs',
      label: 'Active Jobs',
      value: overview.activeJobs ?? 0,
      icon: Briefcase,
      tone: 'amber'
    },
    {
      key: 'totalApplications',
      label: 'Applications',
      value: overview.totalApplications ?? 0,
      icon: FileText,
      tone: 'green'
    },
    {
      key: 'pendingApplications',
      label: 'Pending Review',
      value: overview.pendingApplications ?? 0,
      icon: Clock3,
      tone: 'slate'
    },
    {
      key: 'admins',
      label: 'Admin Accounts',
      value: overview.admins ?? 0,
      icon: Shield,
      tone: 'indigo'
    }
  ]), [overview]);

  const filteredUsers = useMemo(() => {
    const query = deferredUserFilter.trim().toLowerCase();
    if (!query) return users;
    return users.filter((entry) =>
      [entry.fullName, entry.username, entry.email, entry.roleName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [deferredUserFilter, users]);

  const filteredJobs = useMemo(() => {
    const query = deferredJobFilter.trim().toLowerCase();
    if (!query) return jobs;
    return jobs.filter((entry) =>
      [entry.title, entry.location, entry.employerName, String(entry.status)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [deferredJobFilter, jobs]);

  const filteredApplications = useMemo(() => {
    const query = deferredApplicationFilter.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter((entry) =>
      [entry.applicantName, entry.applicantEmail, entry.jobTitle, entry.status, entry.employerName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [applications, deferredApplicationFilter]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const handleRoleUpdate = async (userId, roleName) => {
    try {
      setBusy(true);
      await api.put(`/admin/users/${userId}/role`, { roleName });
      await loadAdminData({ silent: true });
    } catch (requestError) {
      window.alert(requestError.response?.data?.error || 'Failed to update user role.');
    } finally {
      setBusy(false);
    }
  };

  const handleUserDelete = async (targetUser) => {
    const confirmed = window.confirm(`Delete ${targetUser.fullName || targetUser.username}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setBusy(true);
      await api.delete(`/admin/users/${targetUser.id}`);
      await loadAdminData({ silent: true });
    } catch (requestError) {
      window.alert(requestError.response?.data?.error || 'Failed to delete user.');
    } finally {
      setBusy(false);
    }
  };

  const handleJobStatusUpdate = async (jobId, status) => {
    try {
      setBusy(true);
      await api.put(`/admin/jobs/${jobId}/status`, { status });
      await loadAdminData({ silent: true });
    } catch (requestError) {
      window.alert(requestError.response?.data?.error || 'Failed to update job status.');
    } finally {
      setBusy(false);
    }
  };

  const handleJobDelete = async (jobTitle, jobId) => {
    const confirmed = window.confirm(`Delete job "${jobTitle}"?`);
    if (!confirmed) return;

    try {
      setBusy(true);
      await api.delete(`/admin/jobs/${jobId}`);
      await loadAdminData({ silent: true });
    } catch (requestError) {
      window.alert(requestError.response?.data?.error || 'Failed to delete job.');
    } finally {
      setBusy(false);
    }
  };

  const handleApplicationStatusUpdate = async (applicationId, status) => {
    try {
      setBusy(true);
      await api.put(`/admin/applications/${applicationId}/status`, { status });
      await loadAdminData({ silent: true });
    } catch (requestError) {
      window.alert(requestError.response?.data?.error || 'Failed to update application status.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="admin-page-state">Loading admin control room...</div>;
  }

  if (error) {
    return <div className="admin-page-state error">{error}</div>;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">
            <span className="admin-brand-mark">JL</span>
            <div>
              <strong>JobLithic Admin</strong>
              <small>Platform control room</small>
            </div>
          </div>

          <nav className="admin-nav">
            <a href="#overview"><LayoutDashboard size={16} /> Overview</a>
            <a href="#users"><Users size={16} /> Users</a>
            <a href="#jobs"><Briefcase size={16} /> Jobs</a>
            <a href="#applications"><FileText size={16} /> Applications</a>
          </nav>
        </div>

        <div className="admin-side-footer">
          <div className="admin-user-card">
            <span className="admin-user-pill">Signed in as admin</span>
            <strong>{user?.fullName || user?.username}</strong>
            <small>{user?.email}</small>
          </div>
          <div className="admin-side-actions">
            <Link to="/" className="admin-side-link">Open public site</Link>
            <button type="button" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <section className="admin-hero" id="overview">
          <div>
            <span className="admin-eyebrow">Separate admin access</span>
            <h1>Platform moderation and reporting center</h1>
            <p>
              Manage accounts, verify job activity, and keep applications flowing from a single backend-protected panel.
            </p>
          </div>

          <div className="admin-hero-actions">
            <button type="button" className="admin-refresh-btn" onClick={() => loadAdminData()} disabled={busy}>
              <RefreshCw size={16} />
              Refresh data
            </button>
            <div className="admin-hero-note">
              <BadgeCheck size={16} />
              <span>Spring Security locked with `ROLE_ADMIN`</span>
            </div>
          </div>
        </section>

        <section className="admin-stat-grid">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.key} className={`admin-stat-card ${card.tone}`}>
                <div className="admin-stat-icon">
                  <Icon size={20} />
                </div>
                <div>
                  <small>{card.label}</small>
                  <strong>{numberFormatter.format(card.value)}</strong>
                </div>
              </article>
            );
          })}
        </section>

        <section className="admin-recent-grid">
          <article className="admin-panel-card">
            <div className="admin-panel-head">
              <h2>Recent users</h2>
              <span>{dashboard?.recentUsers?.length || 0} entries</span>
            </div>
            <div className="admin-activity-list">
              {(dashboard?.recentUsers || []).map((entry) => (
                <div key={entry.id} className="admin-activity-item">
                  <div>
                    <strong>{entry.fullName || entry.username}</strong>
                    <span>{entry.email}</span>
                  </div>
                  <span className="admin-chip">{entry.roleName}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-panel-card">
            <div className="admin-panel-head">
              <h2>Recent jobs</h2>
              <span>{dashboard?.recentJobs?.length || 0} entries</span>
            </div>
            <div className="admin-activity-list">
              {(dashboard?.recentJobs || []).map((entry) => (
                <div key={entry.id} className="admin-activity-item">
                  <div>
                    <strong>{entry.title}</strong>
                    <span>{entry.employerName} · {entry.location}</span>
                  </div>
                  <span className={`admin-chip status ${statusClassName(entry.status)}`}>{entry.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-panel-card">
            <div className="admin-panel-head">
              <h2>Recent applications</h2>
              <span>{dashboard?.recentApplications?.length || 0} entries</span>
            </div>
            <div className="admin-activity-list">
              {(dashboard?.recentApplications || []).map((entry) => (
                <div key={entry.id} className="admin-activity-item">
                  <div>
                    <strong>{entry.applicantName}</strong>
                    <span>{entry.jobTitle}</span>
                  </div>
                  <span className={`admin-chip status ${statusClassName(entry.status)}`}>{entry.status}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="admin-panel-card" id="users">
          <div className="admin-panel-head">
            <div>
              <h2>User management</h2>
              <p>Promote roles, review signups, or remove unwanted accounts.</p>
            </div>
            <label className="admin-search">
              <Search size={16} />
              <input
                value={filters.users}
                onChange={(event) => setFilters((prev) => ({ ...prev, users: event.target.value }))}
                placeholder="Search users"
              />
            </label>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="admin-cell-stack">
                        <strong>{entry.fullName || entry.username}</strong>
                        <span>{entry.email}</span>
                        <span>@{entry.username}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        value={entry.roleName}
                        disabled={busy || entry.id === user?.id}
                        onChange={(event) => handleRoleUpdate(entry.id, event.target.value)}
                      >
                        <option value="APPLICANT">APPLICANT</option>
                        <option value="EMPLOYER">EMPLOYER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>{formatDate(entry.createdAt)}</td>
                    <td>
                      <div className="admin-cell-stack">
                        <span>{entry.applicationCount} applications</span>
                        <span>{entry.jobCount} jobs</span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-danger-btn"
                        disabled={busy || entry.id === user?.id || entry.roleName === 'ADMIN'}
                        onClick={() => handleUserDelete(entry)}
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel-card" id="jobs">
          <div className="admin-panel-head">
            <div>
              <h2>Job moderation</h2>
              <p>Open, close, or remove employer job posts directly from the panel.</p>
            </div>
            <label className="admin-search">
              <Search size={16} />
              <input
                value={filters.jobs}
                onChange={(event) => setFilters((prev) => ({ ...prev, jobs: event.target.value }))}
                placeholder="Search jobs"
              />
            </label>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Employer</th>
                  <th>Status</th>
                  <th>Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="admin-cell-stack">
                        <strong>{entry.title}</strong>
                        <span>{entry.location}</span>
                        <span>{entry.applicationCount} applications</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-cell-stack">
                        <strong>{entry.employerName}</strong>
                        <span>{entry.employerEmail}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-chip status ${statusClassName(entry.status)}`}>{entry.status}</span>
                    </td>
                    <td>{entry.salary ? currencyFormatter.format(entry.salary) : '-'}</td>
                    <td>
                      <div className="admin-action-row">
                        <button
                          type="button"
                          className="admin-soft-btn"
                          disabled={busy}
                          onClick={() => handleJobStatusUpdate(entry.id, entry.status === 'Open' ? 'CLOSE' : 'OPEN')}
                        >
                          {entry.status === 'Open' ? 'Close job' : 'Open job'}
                        </button>
                        <button
                          type="button"
                          className="admin-danger-btn"
                          disabled={busy}
                          onClick={() => handleJobDelete(entry.title, entry.id)}
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel-card" id="applications">
          <div className="admin-panel-head">
            <div>
              <h2>Application control</h2>
              <p>Track pipeline progress and manually update candidate status.</p>
            </div>
            <label className="admin-search">
              <Search size={16} />
              <input
                value={filters.applications}
                onChange={(event) => setFilters((prev) => ({ ...prev, applications: event.target.value }))}
                placeholder="Search applications"
              />
            </label>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Job</th>
                  <th>Employer</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="admin-cell-stack">
                        <strong>{entry.applicantName}</strong>
                        <span>{entry.applicantEmail}</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-cell-stack">
                        <strong>{entry.jobTitle}</strong>
                        <span>{entry.applicationNote || 'No note added'}</span>
                      </div>
                    </td>
                    <td>{entry.employerName || '-'}</td>
                    <td>{formatDate(entry.appliedAt)}</td>
                    <td>
                      <span className={`admin-chip status ${statusClassName(entry.status)}`}>{entry.status}</span>
                    </td>
                    <td>
                      <select
                        value={entry.status}
                        disabled={busy}
                        onChange={(event) => handleApplicationStatusUpdate(entry.id, event.target.value)}
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
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
