import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Filter,
  Search,
  Sparkles,
  UserRound,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleName } from '../utils/role';
import api from '../services/api';
import './Applications.css';

const STATUS_FILTERS = ['ALL', 'PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'];

const getStatusMeta = (status) => {
  switch (status) {
    case 'ACCEPTED':
      return { label: 'Accepted', className: 'accepted', icon: <CheckCircle2 size={14} /> };
    case 'REJECTED':
      return { label: 'Rejected', className: 'rejected', icon: <XCircle size={14} /> };
    case 'REVIEWED':
      return { label: 'Reviewed', className: 'reviewed', icon: <Sparkles size={14} /> };
    default:
      return { label: 'Pending', className: 'pending', icon: <Clock3 size={14} /> };
  }
};

const hasExternalResume = (value) => value && value !== 'resume_not_uploaded' && /^https?:\/\//i.test(value);

const Applications = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const userRes = await api.get(`/users/username/${user.username}`);
        const currentProfile = userRes.data;
        setProfile(currentProfile);

        const isEmployer = currentProfile.roleName === 'EMPLOYER';
        const endpoint = isEmployer
          ? `/applications/employer/${currentProfile.id}`
          : `/applications/user/${currentProfile.id}`;

        const appsRes = await api.get(endpoint);
        setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      } catch {
        setError('Failed to load applications.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      loadApplications();
    }
  }, [user]);

  const isEmployer = getRoleName(profile) === 'EMPLOYER';

  const statusCount = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((item) => item.status === 'PENDING').length,
    reviewed: applications.filter((item) => item.status === 'REVIEWED').length,
    accepted: applications.filter((item) => item.status === 'ACCEPTED').length,
    rejected: applications.filter((item) => item.status === 'REJECTED').length
  }), [applications]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedQuery) return true;

      return [
        application.jobTitle,
        application.jobLocation,
        application.applicantName,
        application.applicantFullName,
        application.applicationNote,
        application.status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [applications, searchTerm, statusFilter]);

  if (loading) {
    return <section className="applications-page">Loading applications...</section>;
  }

  if (!profile) {
    return <section className="applications-page">{error || 'Profile not available.'}</section>;
  }

  return (
    <section className="applications-page">
      <div className="container applications-page-layout">
        <header className="applications-hero">
          <div className="applications-hero-copy">
            <span className="applications-kicker">{isEmployer ? 'Hiring pipeline' : 'Candidate tracker'}</span>
            <h1>{isEmployer ? 'Review every candidate in one place.' : 'Track every application with clarity.'}</h1>
            <p>
              {isEmployer
                ? 'Monitor incoming applications, compare candidate details, and stay on top of hiring flow.'
                : 'See your pipeline, filter outcomes quickly, and focus on the roles that are moving forward.'}
            </p>
          </div>

          <div className="applications-hero-actions">
            <Link to={isEmployer ? '/employer-dashboard' : '/dashboard'} className="applications-outline-btn">
              Back to dashboard
            </Link>
            {!isEmployer && (
              <Link to="/jobs" className="applications-primary-btn">
                Find more jobs
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </header>

        <section className="applications-stats-grid">
          <article className="applications-stat-card">
            <small>Total</small>
            <strong>{statusCount.total}</strong>
            <span>Tracked records</span>
          </article>
          <article className="applications-stat-card">
            <small>Pending</small>
            <strong>{statusCount.pending}</strong>
            <span>Awaiting next action</span>
          </article>
          <article className="applications-stat-card">
            <small>Reviewed</small>
            <strong>{statusCount.reviewed}</strong>
            <span>In active evaluation</span>
          </article>
          <article className="applications-stat-card">
            <small>Accepted</small>
            <strong>{statusCount.accepted}</strong>
            <span>Positive outcomes</span>
          </article>
          <article className="applications-stat-card">
            <small>Rejected</small>
            <strong>{statusCount.rejected}</strong>
            <span>Closed out applications</span>
          </article>
        </section>

        <section className="applications-toolbar">
          <div className="applications-search">
            <Search size={16} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={isEmployer ? 'Search candidate, job, or note' : 'Search job, location, or note'}
            />
          </div>

          <div className="applications-filter-group">
            <Filter size={16} />
            <div className="applications-filter-pills">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={statusFilter === status ? 'active' : ''}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'ALL' ? 'All statuses' : status.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </section>

        {filteredApplications.length === 0 ? (
          <div className="applications-empty-state">
            <strong>{applications.length === 0
              ? (isEmployer ? 'No candidates applied yet.' : 'You have not applied to any jobs yet.')
              : 'No records match your current filters.'}
            </strong>
            <p>
              {applications.length === 0
                ? (isEmployer ? 'New candidate activity will appear here as applications arrive.' : 'Start applying to roles and this tracker will fill automatically.')
                : 'Try changing the search term or status filter to see more results.'}
            </p>
            {!isEmployer && applications.length === 0 && (
              <Link to="/jobs" className="applications-primary-btn">
                Browse jobs
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          <>
            <section className="applications-results-table">
              <div className="applications-table-head">
                <h2>{isEmployer ? 'Candidate list' : 'My submissions'}</h2>
                <span>{filteredApplications.length} visible</span>
              </div>

              <div className="applications-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{isEmployer ? 'Candidate' : 'Role'}</th>
                      <th>{isEmployer ? 'Applied job' : 'Location'}</th>
                      <th>{isEmployer ? 'Applied on' : 'Applied on'}</th>
                      <th>Status</th>
                      <th>{isEmployer ? 'Resume' : 'Application note'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((application) => {
                      const statusMeta = getStatusMeta(application.status);

                      return (
                        <tr key={application.id}>
                          <td>
                            <div className="applications-table-primary">
                              {isEmployer ? <UserRound size={15} /> : <BriefcaseBusiness size={15} />}
                              <div>
                                <strong>{isEmployer ? (application.applicantFullName || application.applicantName) : application.jobTitle}</strong>
                                <span>{isEmployer ? application.applicantEmail || 'No email shared' : application.applicationNote || 'No note added'}</span>
                              </div>
                            </div>
                          </td>
                          <td>{isEmployer ? application.jobTitle : (application.jobLocation || 'Location not added')}</td>
                          <td>{application.appliedAt || '-'}</td>
                          <td>
                            <span className={`applications-status-pill ${statusMeta.className}`}>
                              {statusMeta.icon}
                              {statusMeta.label}
                            </span>
                          </td>
                          <td>
                            {isEmployer ? (
                              hasExternalResume(application.resumeUrl)
                                ? <a href={application.resumeUrl} target="_blank" rel="noreferrer">Open resume</a>
                                : 'Not attached'
                            ) : (
                              application.applicationNote || '-'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="applications-mobile-list">
              {filteredApplications.map((application) => {
                const statusMeta = getStatusMeta(application.status);

                return (
                  <article key={application.id} className="applications-mobile-card">
                    <div className="applications-mobile-top">
                      <div>
                        <h3>{isEmployer ? (application.applicantFullName || application.applicantName) : application.jobTitle}</h3>
                        <p>{isEmployer ? application.jobTitle : (application.jobLocation || 'Location not added')}</p>
                      </div>
                      <span className={`applications-status-pill ${statusMeta.className}`}>
                        {statusMeta.icon}
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="applications-mobile-meta">
                      <span>{application.appliedAt || 'Recently applied'}</span>
                      {isEmployer && <span>{application.applicantEmail || 'No email shared'}</span>}
                    </div>

                    <div className="applications-mobile-note">
                      {isEmployer
                        ? (hasExternalResume(application.resumeUrl)
                          ? <a href={application.resumeUrl} target="_blank" rel="noreferrer">Open attached resume</a>
                          : 'Resume not attached')
                        : (application.applicationNote || 'No application note was added.')}
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </div>
    </section>
  );
};

export default Applications;
