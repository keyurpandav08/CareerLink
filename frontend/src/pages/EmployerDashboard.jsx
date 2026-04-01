import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LineChart,
  RefreshCw,
  Sparkles,
  Users
} from 'lucide-react';
import EmployerSettingsPanel from '../components/EmployerSettingsPanel';
import RecruiterWorkspace from '../components/RecruiterWorkspace';
import { useRecruiterSuite } from '../hooks/useRecruiterSuite';
import {
  RECRUITER_STAGE_META,
  buildDailySeries,
  buildInsight,
  formatCurrency,
  formatCompactNumber,
  getDeltaSummary,
  getMatchScore,
  sortApplicationsByMatch
} from '../utils/recruiterSuite';
import { createInitials } from '../utils/candidatePortal';
import './RecruiterSuite.css';

const STAT_ICONS = {
  openJobs: Briefcase,
  applicants: Users,
  reviewed: ClipboardCheck,
  accepted: CheckCircle2
};

const EmployerDashboard = () => {
  const { profile, employer, jobs, applications, aiInsights, loading, error, refresh } = useRecruiterSuite();
  const [searchParams, setSearchParams] = useSearchParams();
  const settingsOpen = searchParams.get('panel') === 'settings';
  const aiMatches = useMemo(
    () => Object.fromEntries((aiInsights?.matches || []).map((item) => [item.applicationId, item])),
    [aiInsights?.matches]
  );

  const metrics = useMemo(() => ({
    openJobs: jobs.filter((job) => String(job.status).toLowerCase() === 'open').length,
    applicants: applications.length,
    reviewed: applications.filter((app) => app.status === 'REVIEWED').length,
    accepted: applications.filter((app) => app.status === 'ACCEPTED').length
  }), [applications, jobs]);

  const trendSeries = buildDailySeries(applications, 7);
  const insight = aiInsights?.headline
    ? {
      eyebrow: aiInsights.error ? 'Setup' : 'AI Signal',
      title: aiInsights.headline,
      body: aiInsights.summary
    }
    : buildInsight(jobs, applications);

  const topCandidates = useMemo(
    () => sortApplicationsByMatch(applications, jobs, aiMatches),
    [aiMatches, applications, jobs]
  );
  const featuredJobs = useMemo(
    () => jobs
      .slice()
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
      .slice(0, 3),
    [jobs]
  );
  const stageColumns = useMemo(
    () => Object.entries(RECRUITER_STAGE_META).map(([status, meta]) => ({
      status,
      meta,
      items: topCandidates.filter((application) => application.status === status).slice(0, 2)
    })),
    [topCandidates]
  );

  if (loading) {
    return <section className="recruiter-page recruiter-empty-state">Loading recruiter overview...</section>;
  }

  if (error) {
    return <section className="recruiter-page recruiter-empty-state">{error}</section>;
  }

  return (
    <RecruiterWorkspace
      activeKey="overview"
      profile={profile}
      employer={employer}
      title="Performance Overview"
      subtitle="A live command center for your open roles, candidate flow, and hiring momentum."
      headerActions={(
        <button type="button" className="recruiter-secondary-btn" onClick={refresh}>
          <RefreshCw size={16} />
          Refresh data
        </button>
      )}
    >
      <section className="recruiter-suite-stats">
        {Object.entries({
          openJobs: 'Active Jobs',
          applicants: 'Total Applicants',
          reviewed: 'Reviewed',
          accepted: 'Accepted'
        }).map(([key, label]) => {
          const Icon = STAT_ICONS[key] || Briefcase;
          const previousValue = key === 'accepted' ? 0 : Math.max(0, metrics[key] - 1);
          const trend = getDeltaSummary(metrics[key], previousValue, '%');

          return (
            <article className="recruiter-card recruiter-stat-card" key={key}>
              <div className="recruiter-stat-top">
                <div className="recruiter-stat-icon">
                  <Icon size={18} />
                </div>
                <div className={`recruiter-stat-trend ${trend.tone}`}>{trend.label}</div>
              </div>
              <div>
                <small>{label}</small>
                <strong>{formatCompactNumber(metrics[key] ?? 0)}</strong>
                <span>
                  {key === 'openJobs' && 'Roles currently visible to candidates'}
                  {key === 'applicants' && 'Applicants across your posted roles'}
                  {key === 'reviewed' && 'Profiles moved into recruiter evaluation'}
                  {key === 'accepted' && 'Positive decisions already made'}
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="recruiter-suite-two-up" style={{ marginTop: '1.3rem' }}>
        <article className="recruiter-panel recruiter-glass-card">
          <div className="recruiter-panel-header">
            <div className="recruiter-panel-title">
              <h2>Application Trends</h2>
              <p>Daily candidate movement across your live funnel.</p>
            </div>
            <span className="recruiter-match-pill">
              <LineChart size={12} />
              Last 7 days
            </span>
          </div>

          <div className="recruiter-bar-chart" style={{ marginTop: '1.4rem' }}>
            {trendSeries.map((point) => {
              const maxCount = Math.max(...trendSeries.map((item) => item.count), 1);
              const height = `${Math.max(20, (point.count / maxCount) * 100)}%`;

              return (
                <div key={point.label} className="recruiter-bar-column">
                  <div className="recruiter-bar-track">
                    <div className="recruiter-bar-fill" style={{ height }} />
                  </div>
                  <div className="recruiter-bar-value">{point.count}</div>
                  <div className="recruiter-bar-label">{point.label}</div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="recruiter-panel recruiter-insight-card">
          <div>
            <span className="recruiter-kicker">{insight.eyebrow}</span>
            <strong style={{ marginTop: '0.9rem' }}>{insight.title}</strong>
            <p style={{ marginTop: '1rem' }}>{insight.body}</p>
          </div>

          <Link to="/employer-dashboard/analytics" className="recruiter-secondary-btn" style={{ alignSelf: 'flex-start' }}>
            View detailed report
            <ArrowRight size={16} />
          </Link>
        </article>
      </section>

      <section className="recruiter-panel recruiter-glass-card" style={{ marginTop: '1.3rem' }}>
        <div className="recruiter-section-head">
          <div>
            <h2>Active Roles</h2>
            <p>Your newest openings with live compensation and demand context.</p>
          </div>
          <Link to="/employer-dashboard/jobs" className="recruiter-secondary-btn">
            Open jobs
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="recruiter-suite-three-up" style={{ marginTop: '1.2rem' }}>
          {featuredJobs.length ? featuredJobs.map((job) => (
            <article key={job.id} className="recruiter-candidate-card">
              <div className="recruiter-candidate-top">
                <div className="recruiter-candidate-avatar">
                  {createInitials(job.title)}
                </div>
                <span className={`recruiter-status-pill ${String(job.status).toLowerCase() === 'open' ? 'accepted' : 'rejected'}`}>
                  {String(job.status || 'Open')}
                </span>
              </div>
              <h4>{job.title}</h4>
              <p>{job.location || 'Location not shared'}</p>
              <div className="recruiter-pill-row">
                <span className="recruiter-tag-pill">{job.jobType || 'Role type not shared'}</span>
                <span className="recruiter-tag-pill">{formatCurrency(job.salary)}</span>
              </div>
            </article>
          )) : (
            <article className="recruiter-candidate-card">
              <p className="recruiter-inline-muted">Your active roles will appear here after you publish a job.</p>
            </article>
          )}
        </div>
      </section>

      <section className="recruiter-panel recruiter-glass-card" style={{ marginTop: '1.3rem' }}>
        <div className="recruiter-section-head">
          <div>
            <h2>Pipeline Snapshot</h2>
            <p>Top live candidates grouped by their current hiring stage.</p>
          </div>
          <Link to="/employer-dashboard/pipeline" className="recruiter-secondary-btn">
            Open pipeline
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="recruiter-pipeline-columns" style={{ marginTop: '1.2rem' }}>
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
                {items.length ? items.map((application) => (
                  <article className="recruiter-candidate-card" key={application.id}>
                    <div className="recruiter-candidate-top">
                      <div className="recruiter-candidate-avatar">
                        {createInitials(application.applicantFullName || application.applicantName)}
                      </div>
                      <span className="recruiter-match-pill">
                        <Sparkles size={12} />
                        {getMatchScore(application, jobs, aiMatches) ?? 'N/A'}%
                      </span>
                    </div>
                    <h4>{application.applicantFullName || application.applicantName}</h4>
                    <p>{application.jobTitle}</p>
                    <div className="recruiter-pill-row">
                      <span className={`recruiter-status-pill ${meta.tone}`}>{meta.compactLabel}</span>
                      <span className="recruiter-tag-pill">
                        <Clock3 size={12} />
                        {application.appliedAt || 'Recently'}
                      </span>
                    </div>
                    {aiMatches[application.id]?.summary && (
                      <p className="recruiter-note-block">{aiMatches[application.id].summary}</p>
                    )}
                  </article>
                )) : (
                  <article className="recruiter-candidate-card">
                    <p className="recruiter-inline-muted">No candidates in this stage.</p>
                  </article>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <EmployerSettingsPanel
        open={settingsOpen}
        profile={profile}
        onClose={() => setSearchParams({})}
        onSaved={refresh}
      />
    </RecruiterWorkspace>
  );
};

export default EmployerDashboard;
