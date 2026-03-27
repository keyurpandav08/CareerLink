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
import CandidateWorkspace from '../components/CandidateWorkspace';
import { useAuth } from '../context/AuthContext';
import { getRoleName } from '../utils/role';
import api from '../services/api';
import { createInitials, parsePossibleDate } from '../utils/candidatePortal';
import './Applications.css';

const STATUS_FILTERS = ['ALL', 'PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'];

const getLegacyStatusMeta = (status) => {
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

const getCandidateStatusMeta = (status) => {
  switch (status) {
    case 'ACCEPTED':
      return {
        label: 'Offer Received',
        className: 'accepted',
        actionLabel: 'View Offer',
        note: 'Offer stage reached. Review the terms and next steps soon.'
      };
    case 'REJECTED':
      return {
        label: 'Declined',
        className: 'rejected',
        actionLabel: 'Feedback',
        note: 'Use the outcome to refine your next application cycle.'
      };
    case 'REVIEWED':
      return {
        label: 'Under Review',
        className: 'reviewed',
        actionLabel: 'View Details',
        note: 'Recruiters are actively evaluating your profile.'
      };
    default:
      return {
        label: 'Applied',
        className: 'pending',
        actionLabel: 'View Details',
        note: 'Your application is waiting for recruiter action.'
      };
  }
};

const hasExternalResume = (value) => value && value !== 'resume_not_uploaded' && /^https?:\/\//i.test(value);

const formatAppliedDate = (value) => {
  const parsed = parsePossibleDate(value);
  if (!parsed) return value || 'Recently applied';

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const Applications = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [viewMode, setViewMode] = useState('ACTIVE');

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

  const candidateCards = useMemo(() => {
    const workspaceQuery = workspaceSearch.trim().toLowerCase();

    return [...filteredApplications]
      .filter((application) => {
        if (viewMode === 'ARCHIVED') return application.status === 'REJECTED';
        return application.status !== 'REJECTED';
      })
      .filter((application) => {
        if (!workspaceQuery) return true;

        return [
          application.jobTitle,
          application.jobLocation,
          application.applicationNote,
          application.status
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(workspaceQuery));
      })
      .sort((left, right) => {
        const leftDate = parsePossibleDate(left.appliedAt)?.getTime() || 0;
        const rightDate = parsePossibleDate(right.appliedAt)?.getTime() || 0;
        return rightDate - leftDate;
      });
  }, [filteredApplications, viewMode, workspaceSearch]);

  if (loading) {
    return <section className="applications-page">Loading applications...</section>;
  }

  if (!profile) {
    return <section className="applications-page">{error || 'Profile not available.'}</section>;
  }

  if (!isEmployer) {
    const activeApplicationCount = applications.filter((item) => item.status !== 'REJECTED').length;
    const stageCount = new Set(applications.filter((item) => item.status !== 'REJECTED').map((item) => item.status)).size;

    return (
      <CandidateWorkspace
        activePath="/applications"
        profile={profile}
        searchValue={workspaceSearch}
        onSearchChange={setWorkspaceSearch}
        searchPlaceholder="Search applications..."
      >
        <div className="candidate-applications-page">
          <section className="candidate-applications-hero">
            <div>
              <h1>My Applications</h1>
              <p>
                Track and manage your professional journey. You have {activeApplicationCount} active applications across {stageCount || 1} stages.
              </p>
            </div>

            <div className="candidate-applications-toggle">
              <button
                type="button"
                className={viewMode === 'ACTIVE' ? 'is-active' : ''}
                onClick={() => setViewMode('ACTIVE')}
              >
                Active
              </button>
              <button
                type="button"
                className={viewMode === 'ARCHIVED' ? 'is-active' : ''}
                onClick={() => setViewMode('ARCHIVED')}
              >
                Archived
              </button>
            </div>
          </section>

          <section className="candidate-applications-filters">
            <div className="candidate-applications-filter-chip">
              <Filter size={14} />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">Status: All</option>
                <option value="PENDING">Status: Applied</option>
                <option value="REVIEWED">Status: Under Review</option>
                <option value="ACCEPTED">Status: Offer Received</option>
                <option value="REJECTED">Status: Declined</option>
              </select>
            </div>

            <div className="candidate-applications-filter-chip">
              <Clock3 size={14} />
              <span>Date: Recent First</span>
            </div>

            <label className="candidate-applications-filter-chip candidate-applications-filter-chip--search" htmlFor="candidateApplicationsFilter">
              <Search size={14} />
              <input
                id="candidateApplicationsFilter"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Filter current results..."
              />
            </label>
          </section>

          <div className="candidate-applications-list">
            {candidateCards.length === 0 ? (
              <div className="candidate-applications-empty">
                <strong>No applications match the current view.</strong>
                <p>Try changing the status filter, active/archive toggle, or search term.</p>
                <Link to="/jobs" className="candidate-applications-empty-action">
                  Browse jobs
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              candidateCards.map((application) => {
                const statusMeta = getCandidateStatusMeta(application.status);

                return (
                  <article
                    key={application.id}
                    className={`candidate-application-card ${statusMeta.className}`}
                  >
                    <div className="candidate-application-logo">
                      {createInitials(application.jobTitle)}
                    </div>

                    <div className="candidate-application-copy">
                      <div className="candidate-application-title-row">
                        <h2>{application.jobTitle}</h2>
                        <span className={`candidate-application-status ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </div>

                      <p>{application.jobLocation || 'Location not added'}</p>

                      <div className="candidate-application-meta">
                        <span><Clock3 size={13} /> Applied {formatAppliedDate(application.appliedAt)}</span>
                        <span>{statusMeta.note}</span>
                      </div>
                    </div>

                    <div className="candidate-application-actions">
                      {application.status === 'ACCEPTED' ? (
                        <button type="button" className="candidate-application-btn candidate-application-btn--primary">
                          {statusMeta.actionLabel}
                        </button>
                      ) : application.status === 'REJECTED' ? (
                        <button type="button" className="candidate-application-btn candidate-application-btn--ghost">
                          {statusMeta.actionLabel}
                        </button>
                      ) : (
                        <button type="button" className="candidate-application-btn">
                          {statusMeta.actionLabel}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </CandidateWorkspace>
    );
  }

  return (
    <section className="applications-page">
      <div className="container applications-page-layout">
        <header className="applications-hero">
          <div className="applications-hero-copy">
            <span className="applications-kicker">Hiring pipeline</span>
            <h1>Review every candidate in one place.</h1>
            <p>
              Monitor incoming applications, compare candidate details, and stay on top of hiring flow.
            </p>
          </div>

          <div className="applications-hero-actions">
            <Link to="/employer-dashboard" className="applications-outline-btn">
              Back to dashboard
            </Link>
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
              placeholder="Search candidate, job, or note"
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
            <strong>No candidates applied yet.</strong>
            <p>New candidate activity will appear here as applications arrive.</p>
          </div>
        ) : (
          <>
            <section className="applications-results-table">
              <div className="applications-table-head">
                <h2>Candidate list</h2>
                <span>{filteredApplications.length} visible</span>
              </div>

              <div className="applications-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Applied job</th>
                      <th>Applied on</th>
                      <th>Status</th>
                      <th>Resume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((application) => {
                      const statusMeta = getLegacyStatusMeta(application.status);

                      return (
                        <tr key={application.id}>
                          <td>
                            <div className="applications-table-primary">
                              <UserRound size={15} />
                              <div>
                                <strong>{application.applicantFullName || application.applicantName}</strong>
                                <span>{application.applicantEmail || 'No email shared'}</span>
                              </div>
                            </div>
                          </td>
                          <td>{application.jobTitle}</td>
                          <td>{application.appliedAt || '-'}</td>
                          <td>
                            <span className={`applications-status-pill ${statusMeta.className}`}>
                              {statusMeta.icon}
                              {statusMeta.label}
                            </span>
                          </td>
                          <td>
                            {hasExternalResume(application.resumeUrl)
                              ? <a href={application.resumeUrl} target="_blank" rel="noreferrer">Open resume</a>
                              : 'Not attached'}
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
                const statusMeta = getLegacyStatusMeta(application.status);

                return (
                  <article key={application.id} className="applications-mobile-card">
                    <div className="applications-mobile-top">
                      <div>
                        <h3>{application.applicantFullName || application.applicantName}</h3>
                        <p>{application.jobTitle}</p>
                      </div>
                      <span className={`applications-status-pill ${statusMeta.className}`}>
                        {statusMeta.icon}
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="applications-mobile-meta">
                      <span>{application.appliedAt || 'Recently applied'}</span>
                      <span>{application.applicantEmail || 'No email shared'}</span>
                    </div>

                    <div className="applications-mobile-note">
                      {hasExternalResume(application.resumeUrl)
                        ? <a href={application.resumeUrl} target="_blank" rel="noreferrer">Open attached resume</a>
                        : 'Resume not attached'}
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
