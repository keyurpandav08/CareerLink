import { useMemo, useState } from 'react';
import { Eye, RefreshCw, Sparkles } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import RecruiterWorkspace from '../components/RecruiterWorkspace';
import { useRecruiterSuite } from '../hooks/useRecruiterSuite';
import {
  RECRUITER_STAGE_META,
  buildInsight,
  getMatchScore,
  sortApplicationsByMatch
} from '../utils/recruiterSuite';
import { createInitials, formatRelativeDate, parseTagList } from '../utils/candidatePortal';
import api from '../services/api';
import './RecruiterSuite.css';

const STATUS_ORDER = ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'];

const parseApplicationNote = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return { metadata: [], summary: '' };
  }

  const segments = raw
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean);

  let summary = '';
  const metadata = [];

  segments.forEach((segment) => {
    if (/screening summary/i.test(segment)) {
      summary = segment.replace(/screening summary\s*:?\s*/i, '').trim();
      return;
    }

    metadata.push(segment);
  });

  if (!summary && metadata.length > 2) {
    summary = metadata.slice(2).join(' | ');
  }

  return {
    metadata: metadata.slice(0, 2),
    summary
  };
};

const RecruiterPipeline = () => {
  const { profile, employer, jobs, applications, aiInsights, loading, error, refresh } = useRecruiterSuite();
  const [jobFilter, setJobFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const aiMatches = useMemo(
    () => Object.fromEntries((aiInsights?.matches || []).map((item) => [item.applicationId, item])),
    [aiInsights?.matches]
  );

  const visibleApplications = useMemo(() => {
    const filtered = jobFilter === 'ALL'
      ? applications
      : applications.filter((application) => application.jobTitle === jobFilter);

    return sortApplicationsByMatch(filtered, jobs, aiMatches);
  }, [aiMatches, applications, jobFilter, jobs]);

  const stageColumns = useMemo(
    () => STATUS_ORDER.map((status) => ({
      status,
      meta: RECRUITER_STAGE_META[status],
      items: visibleApplications.filter((application) => application.status === status)
    })),
    [visibleApplications]
  );

  const insight = buildInsight(jobs, visibleApplications);

  const handleStatusChange = async () => {
    if (!pendingStatusChange) return;

    try {
      setActionLoading(true);
      await api.put(`/applications/${pendingStatusChange.applicationId}/status`, {
        status: pendingStatusChange.nextStatus
      });
      await refresh();
      setPendingStatusChange(null);
    } catch (requestError) {
      window.alert(requestError.response?.data?.error || 'Failed to update application stage.');
    } finally {
      setActionLoading(false);
    }
  };

  const requestStatusChange = (application, nextStatus) => {
    if (!nextStatus || nextStatus === application.status) {
      return;
    }

    setPendingStatusChange({
      applicationId: application.id,
      applicantName: application.applicantFullName || application.applicantName,
      currentStatus: application.status,
      nextStatus
    });
  };

  if (loading) {
    return <section className="recruiter-page recruiter-empty-state">Loading hiring pipeline...</section>;
  }

  if (error) {
    return <section className="recruiter-page recruiter-empty-state">{error}</section>;
  }

  return (
    <RecruiterWorkspace
      activeKey="pipeline"
      profile={profile}
      employer={employer}
      title="Hiring Pipeline"
      subtitle={`${jobFilter === 'ALL' ? 'All active roles' : jobFilter} | ${visibleApplications.length} tracked applicants`}
      headerActions={(
        <>
          <select className="recruiter-select" value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}>
            <option value="ALL">All jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.title}>{job.title}</option>
            ))}
          </select>
          <button type="button" className="recruiter-secondary-btn" onClick={refresh}>
            <RefreshCw size={16} />
            Refresh board
          </button>
        </>
      )}
    >
      <section className="recruiter-panel recruiter-highlight" style={{ marginBottom: '1.3rem' }}>
        <div className="recruiter-panel-header">
          <div className="recruiter-panel-title">
            <h2>{insight.title}</h2>
            <p>{insight.body}</p>
          </div>
          <span className="recruiter-match-pill">
            <Sparkles size={12} />
            Live prioritization
          </span>
        </div>
      </section>

      {visibleApplications.length === 0 ? (
        <section className="recruiter-panel recruiter-empty-state">
          <strong>No applications available for this board view.</strong>
          <p>Open a different role or wait for new candidate activity.</p>
        </section>
      ) : (
        <section className="recruiter-pipeline-columns">
          {stageColumns.map(({ status, meta, items }) => (
            <div key={status} className="recruiter-stage-column">
              <div className="recruiter-stage-head">
                <div className="recruiter-stage-title">
                  <span className="recruiter-stage-dot" style={{ background: meta.accent }} />
                  <span>{meta.label}</span>
                </div>
                <span className="recruiter-stage-count">{items.length}</span>
              </div>

              <div className="recruiter-stage-stack">
                {items.length === 0 ? (
                  <article className="recruiter-candidate-card">
                    <p className="recruiter-inline-muted">No candidates in this stage.</p>
                  </article>
                ) : (
                  items.map((application) => {
                    const noteDetails = parseApplicationNote(application.applicationNote);
                    const matchScore = getMatchScore(application, jobs, aiMatches);

                    return (
                    <article key={application.id} className="recruiter-candidate-card">
                      <div className="recruiter-candidate-top">
                        <div className="recruiter-candidate-avatar">
                          {createInitials(application.applicantFullName || application.applicantName)}
                        </div>
                        <span className="recruiter-match-pill">
                          {matchScore !== null ? `${matchScore}% match` : 'Needs skill data'}
                        </span>
                      </div>

                      <h4>{application.applicantFullName || application.applicantName}</h4>
                      <p>{application.jobTitle}</p>

                      <div className="recruiter-pill-row">
                        <span className={`recruiter-status-pill ${meta.tone}`}>
                          {meta.compactLabel}
                        </span>
                        <span className="recruiter-tag-pill">
                          {formatRelativeDate(application.appliedAt)}
                        </span>
                      </div>

                      {noteDetails.metadata.length > 0 && (
                        <div className="recruiter-pill-row recruiter-pill-row--dense">
                          {noteDetails.metadata.map((item) => (
                            <span key={item} className="recruiter-tag-pill">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}

                      {(noteDetails.summary || application.applicantProfileSummary) && (
                        <div className="recruiter-note-block">
                          {noteDetails.summary || application.applicantProfileSummary}
                        </div>
                      )}

                      {aiMatches[application.id]?.summary && (
                        <div className="recruiter-note-block">
                          {aiMatches[application.id].summary}
                        </div>
                      )}

                      <div className="recruiter-candidate-footer" style={{ marginTop: '1rem', justifyContent: 'space-between' }}>
                        <select
                          className="recruiter-select"
                          style={{ minWidth: 'unset', flex: 1 }}
                          value={application.status}
                          disabled={actionLoading}
                          onChange={(event) => requestStatusChange(application, event.target.value)}
                        >
                          {STATUS_ORDER.map((option) => (
                            <option key={option} value={option}>
                              {RECRUITER_STAGE_META[option].label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          className="recruiter-icon-btn"
                          aria-label="View candidate details"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </article>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      <ConfirmationModal
        open={Boolean(pendingStatusChange)}
        title="Confirm applicant status change"
        message={pendingStatusChange
          ? `Move ${pendingStatusChange.applicantName} from ${RECRUITER_STAGE_META[pendingStatusChange.currentStatus]?.label || pendingStatusChange.currentStatus} to ${RECRUITER_STAGE_META[pendingStatusChange.nextStatus]?.label || pendingStatusChange.nextStatus}?`
          : ''}
        confirmLabel="Update status"
        cancelLabel="Keep current status"
        busy={actionLoading}
        onCancel={() => setPendingStatusChange(null)}
        onConfirm={handleStatusChange}
      />

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
                <small>Match Score</small>
                <strong>{getMatchScore(selectedApplication, jobs, aiMatches) ?? 'Needs skill data'}</strong>
              </div>
            </div>

            {parseTagList(selectedApplication.applicantSkills).length > 0 && (
              <article className="recruiter-panel" style={{ marginBottom: '1rem' }}>
                <div className="recruiter-panel-title">
                  <h3>Key Skills</h3>
                </div>
                <div className="recruiter-profile-tags" style={{ marginTop: '0.85rem' }}>
                  {parseTagList(selectedApplication.applicantSkills).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </article>
            )}

            {(parseApplicationNote(selectedApplication.applicationNote).summary || selectedApplication.applicantProfileSummary) && (
              <article className="recruiter-panel">
                <div className="recruiter-panel-title">
                  <h3>Candidate Summary</h3>
                </div>
                <p className="recruiter-note-block" style={{ marginTop: '0.85rem' }}>
                  {parseApplicationNote(selectedApplication.applicationNote).summary || selectedApplication.applicantProfileSummary}
                </p>
              </article>
            )}
          </div>
        </div>
      )}
    </RecruiterWorkspace>
  );
};

export default RecruiterPipeline;
