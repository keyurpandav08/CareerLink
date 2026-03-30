import { useDeferredValue, useMemo, useState } from 'react';
import {
  ArrowRight,
  Filter,
  Mail,
  RefreshCw,
  Sparkles,
  UserRound
} from 'lucide-react';
import RecruiterWorkspace from '../components/RecruiterWorkspace';
import { useRecruiterSuite } from '../hooks/useRecruiterSuite';
import {
  RECRUITER_STAGE_META,
  buildInsight,
  formatCompactNumber,
  formatPercent,
  getApplicationDate,
  getMatchScore,
  sortApplicationsByMatch
} from '../utils/recruiterSuite';
import { createInitials, formatRelativeDate, parseTagList } from '../utils/candidatePortal';
import './RecruiterSuite.css';

const STATUS_FILTERS = ['ALL', 'PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'];

const RecruiterCandidates = () => {
  const { profile, employer, jobs, applications, loading, error, refresh } = useRecruiterSuite();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const deferredSearchValue = useDeferredValue(searchValue);

  const candidateRows = useMemo(() => {
    const normalizedSearch = deferredSearchValue.trim().toLowerCase();

    return sortApplicationsByMatch(applications, jobs).filter((application) => {
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      return [
        application.applicantFullName,
        application.applicantName,
        application.applicantEmail,
        application.jobTitle,
        application.applicantLocation,
        application.status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [applications, deferredSearchValue, jobs, statusFilter]);

  const topCandidates = useMemo(
    () => sortApplicationsByMatch(applications, jobs).slice(0, 2),
    [applications, jobs]
  );

  const stats = useMemo(() => {
    const scoredCandidates = applications
      .map((application) => getMatchScore(application, jobs))
      .filter((score) => score !== null);

    const topMatches = scoredCandidates.filter((score) => score >= 90).length;
    const pendingReviews = applications.filter((application) => application.status === 'PENDING').length;

    return {
      total: applications.length,
      topMatches,
      pendingReviews
    };
  }, [applications, jobs]);

  const insight = buildInsight(jobs, applications);

  if (loading) {
    return <section className="recruiter-page recruiter-empty-state">Loading candidate pool...</section>;
  }

  if (error) {
    return <section className="recruiter-page recruiter-empty-state">{error}</section>;
  }

  return (
    <RecruiterWorkspace
      activeKey="candidates"
      profile={profile}
      employer={employer}
      title="Candidate Pool"
      subtitle="Manage and evaluate your top talent across every live opening."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder="Search candidates..."
      headerActions={(
        <button type="button" className="recruiter-secondary-btn" onClick={refresh}>
          <RefreshCw size={16} />
          Refresh pool
        </button>
      )}
    >
      <section className="recruiter-suite-three-up">
        <article className="recruiter-card recruiter-stat-card">
          <div className="recruiter-stat-top">
            <div className="recruiter-stat-icon">
              <UserRound size={18} />
            </div>
            <div className="recruiter-stat-trend positive">Live</div>
          </div>
          <small>Total Candidates</small>
          <strong>{formatCompactNumber(stats.total)}</strong>
          <span>Applicants tracked across your active roles.</span>
        </article>

        <article className="recruiter-card recruiter-stat-card">
          <div className="recruiter-stat-top">
            <div className="recruiter-stat-icon">
              <Sparkles size={18} />
            </div>
            <div className="recruiter-stat-trend positive">{formatPercent(stats.total ? (stats.topMatches / stats.total) * 100 : 0)}</div>
          </div>
          <small>AI Top Matches</small>
          <strong>{formatCompactNumber(stats.topMatches)}</strong>
          <span>Candidates currently scoring 90% or higher against live role requirements.</span>
        </article>

        <article className="recruiter-card recruiter-stat-card">
          <div className="recruiter-stat-top">
            <div className="recruiter-stat-icon">
              <Filter size={18} />
            </div>
            <div className="recruiter-stat-trend neutral">{statusFilter === 'ALL' ? 'All' : RECRUITER_STAGE_META[statusFilter]?.compactLabel}</div>
          </div>
          <small>Pending Reviews</small>
          <strong>{formatCompactNumber(stats.pendingReviews)}</strong>
          <span>Profiles still waiting for recruiter action.</span>
        </article>
      </section>

      <section className="recruiter-panel recruiter-glass-card" style={{ marginTop: '1.3rem' }}>
        <div className="recruiter-filter-row">
          <input
            className="recruiter-control"
            type="search"
            placeholder="Search by candidate, role, or location"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />

          <select
            className="recruiter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'All statuses' : RECRUITER_STAGE_META[status]?.label || status}
              </option>
            ))}
          </select>

          <button type="button" className="recruiter-secondary-btn" onClick={refresh}>
            <RefreshCw size={16} />
            Sync data
          </button>
        </div>

        {candidateRows.length === 0 ? (
          <div className="recruiter-empty-state">
            <strong>No candidates match the current filters.</strong>
            <p>Try widening the search or clearing the selected status.</p>
          </div>
        ) : (
          <div className="recruiter-table-wrap">
            <table className="recruiter-table">
              <thead>
                <tr>
                  <th>Candidate Details</th>
                  <th className="recruiter-table-center">AI Match</th>
                  <th className="recruiter-table-center">Applied On</th>
                  <th className="recruiter-table-center">Status</th>
                  <th className="recruiter-table-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidateRows.map((application) => {
                  const matchScore = getMatchScore(application, jobs);
                  const stageMeta = RECRUITER_STAGE_META[application.status] || RECRUITER_STAGE_META.PENDING;

                  return (
                    <tr key={application.id}>
                      <td>
                        <div className="recruiter-table-name-wrap">
                          <div className="recruiter-table-avatar">
                            {createInitials(application.applicantFullName || application.applicantName)}
                          </div>
                          <div>
                            <div className="recruiter-table-name">{application.applicantFullName || application.applicantName}</div>
                            <div className="recruiter-table-subline">
                              {application.jobTitle}
                              {application.applicantLocation ? ` • ${application.applicantLocation}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="recruiter-table-center">
                        <span className="recruiter-match-pill">
                          <Sparkles size={12} />
                          {matchScore !== null ? `${matchScore}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="recruiter-table-center">
                        {getApplicationDate(application)?.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) || 'Recently'}
                      </td>
                      <td className="recruiter-table-center">
                        <span className={`recruiter-status-pill ${stageMeta.tone}`}>
                          {stageMeta.compactLabel}
                        </span>
                      </td>
                      <td className="recruiter-table-right">
                        <div className="recruiter-inline-actions" style={{ justifyContent: 'flex-end' }}>
                          {application.applicantEmail && (
                            <a className="recruiter-secondary-btn" href={`mailto:${application.applicantEmail}`}>
                              <Mail size={15} />
                              Message
                            </a>
                          )}
                          <button type="button" className="recruiter-primary-btn" onClick={() => setSelectedApplication(application)}>
                            View Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="recruiter-spotlight" style={{ marginTop: '1.3rem' }}>
        <article className="recruiter-panel recruiter-highlight">
          <div className="recruiter-panel-title">
            <h2>Smart Match Intelligence</h2>
            <p>{insight.body}</p>
          </div>

          <p style={{ marginTop: '1rem' }}>
            {topCandidates.length
              ? (
                <>
                  The strongest current fits are{' '}
                  <strong>{topCandidates[0].applicantFullName || topCandidates[0].applicantName}</strong>
                  {topCandidates[1] && (
                    <>
                      {' '}and <strong>{topCandidates[1].applicantFullName || topCandidates[1].applicantName}</strong>
                    </>
                  )}
                  {' '}based on live skill overlap and role alignment.
                </>
              )
              : 'Top recommendations will appear here once applicants start arriving.'}
          </p>

          <div style={{ marginTop: '1.1rem' }}>
            <button type="button" className="recruiter-secondary-btn" onClick={refresh}>
              Run Fresh Ranking
              <ArrowRight size={16} />
            </button>
          </div>
        </article>

        <article className="recruiter-panel">
          <div className="recruiter-panel-title">
            <h3>Candidate Status Mix</h3>
            <p>How the current pool is spread across live stages.</p>
          </div>

          <div className="recruiter-location-list" style={{ marginTop: '1.15rem' }}>
            {Object.entries(RECRUITER_STAGE_META).map(([status, meta]) => {
              const count = applications.filter((application) => application.status === status).length;
              const share = applications.length ? Math.round((count / applications.length) * 100) : 0;

              return (
                <div key={status} className="recruiter-legend-row">
                  <div>
                    <span className="recruiter-legend-swatch" style={{ background: meta.accent }} />
                    <span>{meta.label}</span>
                  </div>
                  <strong>{share}%</strong>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      {selectedApplication && (
        <div className="recruiter-modal-overlay" onClick={() => setSelectedApplication(null)}>
          <div className="recruiter-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="recruiter-modal-head">
              <div>
                <h2>{selectedApplication.applicantFullName || selectedApplication.applicantName}</h2>
                <p className="recruiter-muted-copy">{selectedApplication.jobTitle}</p>
              </div>

              <button type="button" className="recruiter-ghost-btn" onClick={() => setSelectedApplication(null)}>
                Close
              </button>
            </div>

            <div className="recruiter-modal-grid">
              <div className="recruiter-modal-metric">
                <small>Email</small>
                <strong>{selectedApplication.applicantEmail || 'Not shared'}</strong>
              </div>
              <div className="recruiter-modal-metric">
                <small>Phone</small>
                <strong>{selectedApplication.applicantPhone || 'Not shared'}</strong>
              </div>
              <div className="recruiter-modal-metric">
                <small>Location</small>
                <strong>{selectedApplication.applicantLocation || 'Not shared'}</strong>
              </div>
              <div className="recruiter-modal-metric">
                <small>Experience</small>
                <strong>{selectedApplication.applicantExperience || 'Not shared'}</strong>
              </div>
              <div className="recruiter-modal-metric">
                <small>Applied</small>
                <strong>{formatRelativeDate(selectedApplication.appliedAt)}</strong>
              </div>
              <div className="recruiter-modal-metric">
                <small>Match Score</small>
                <strong>{getMatchScore(selectedApplication, jobs) ?? 'N/A'}%</strong>
              </div>
            </div>

            {selectedApplication.applicantProfileSummary && (
              <article className="recruiter-panel" style={{ marginBottom: '1rem' }}>
                <div className="recruiter-panel-title">
                  <h3>Profile Summary</h3>
                </div>
                <p className="recruiter-muted-copy" style={{ marginTop: '0.8rem' }}>
                  {selectedApplication.applicantProfileSummary}
                </p>
              </article>
            )}

            <article className="recruiter-panel" style={{ marginBottom: '1rem' }}>
              <div className="recruiter-panel-title">
                <h3>Key Skills</h3>
              </div>
              <div className="recruiter-profile-tags" style={{ marginTop: '0.85rem' }}>
                {parseTagList(selectedApplication.applicantSkills).length
                  ? parseTagList(selectedApplication.applicantSkills).map((skill) => <span key={skill}>{skill}</span>)
                  : <span>No structured skills shared</span>}
              </div>
            </article>

            {selectedApplication.applicationNote && (
              <article className="recruiter-panel">
                <div className="recruiter-panel-title">
                  <h3>Candidate Note</h3>
                </div>
                <p className="recruiter-muted-copy" style={{ marginTop: '0.8rem' }}>
                  {selectedApplication.applicationNote}
                </p>
              </article>
            )}
          </div>
        </div>
      )}
    </RecruiterWorkspace>
  );
};

export default RecruiterCandidates;
