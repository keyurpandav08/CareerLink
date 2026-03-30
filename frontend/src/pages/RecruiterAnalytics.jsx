import { useMemo, useState } from 'react';
import {
  Activity,
  BriefcaseBusiness,
  Clock3,
  Download,
  Filter,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import RecruiterWorkspace from '../components/RecruiterWorkspace';
import { useRecruiterSuite } from '../hooks/useRecruiterSuite';
import {
  RECRUITER_STAGE_META,
  buildInsight,
  buildJobTypeDistribution,
  buildLocationDistribution,
  buildPipelineRows,
  buildWeeklySeries,
  formatCompactNumber,
  formatPercent,
  getApplicationDate,
  getDeltaSummary
} from '../utils/recruiterSuite';
import './RecruiterSuite.css';

const TIMEFRAMES = {
  '30': { label: 'Last 30 Days', days: 30 },
  '90': { label: 'Quarterly', days: 90 },
  '365': { label: 'Yearly', days: 365 }
};

const filterApplicationsByDays = (applications, days) => {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return applications.filter((application) => {
    const appliedAt = getApplicationDate(application);
    return appliedAt && appliedAt >= start;
  });
};

const RecruiterAnalytics = () => {
  const { profile, employer, jobs, applications, loading, error } = useRecruiterSuite();
  const [timeframeKey, setTimeframeKey] = useState('30');

  const activeDays = TIMEFRAMES[timeframeKey].days;
  const currentApplications = filterApplicationsByDays(applications, activeDays);

  const previousApplications = useMemo(() => {
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - (activeDays - 1));
    currentStart.setHours(0, 0, 0, 0);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - activeDays);

    return applications.filter((application) => {
      const appliedAt = getApplicationDate(application);
      return appliedAt && appliedAt >= previousStart && appliedAt < currentStart;
    });
  }, [activeDays, applications]);

  const insight = buildInsight(jobs, currentApplications);
  const weeklySeries = buildWeeklySeries(currentApplications, 4);
  const locations = buildLocationDistribution(currentApplications.length ? currentApplications : applications);
  const jobTypes = buildJobTypeDistribution(jobs);
  const pipelineRows = buildPipelineRows(currentApplications.length ? currentApplications : applications);

  const metrics = useMemo(() => {
    const reviewedCurrent = currentApplications.filter((application) => application.status === 'REVIEWED').length;
    const reviewedPrevious = previousApplications.filter((application) => application.status === 'REVIEWED').length;
    const acceptedCurrent = currentApplications.filter((application) => application.status === 'ACCEPTED').length;
    const acceptedPrevious = previousApplications.filter((application) => application.status === 'ACCEPTED').length;

    return [
      {
        label: 'Total Applicants',
        value: formatCompactNumber(currentApplications.length),
        helper: 'Applications captured in this time window',
        icon: Activity,
        trend: getDeltaSummary(currentApplications.length, previousApplications.length)
      },
      {
        label: 'Review Rate',
        value: formatPercent(currentApplications.length ? (reviewedCurrent / currentApplications.length) * 100 : 0),
        helper: 'Candidates moved into recruiter review',
        icon: Sparkles,
        trend: getDeltaSummary(reviewedCurrent, reviewedPrevious)
      },
      {
        label: 'Offer Rate',
        value: formatPercent(currentApplications.length ? (acceptedCurrent / currentApplications.length) * 100 : 0),
        helper: 'Accepted outcomes inside the selected range',
        icon: Clock3,
        trend: getDeltaSummary(acceptedCurrent, acceptedPrevious)
      },
      {
        label: 'Active Jobs',
        value: formatCompactNumber(jobs.filter((job) => String(job.status).toLowerCase() === 'open').length),
        helper: 'Open roles receiving candidate traffic',
        icon: BriefcaseBusiness,
        trend: { label: `${jobs.length} total`, tone: 'neutral' }
      }
    ];
  }, [currentApplications, jobs, previousApplications]);

  const donutSegments = useMemo(() => {
    const source = locations.length ? locations : [{ label: 'Unspecified', count: 1 }];
    const total = source.reduce((sum, item) => sum + item.count, 0) || 1;
    let cursor = 0;

    const colors = ['#2563eb', '#0f172a', '#93c5fd'];

    const parts = source.map((item, index) => {
      const start = cursor;
      const slice = (item.count / total) * 360;
      cursor += slice;
      return `${colors[index % colors.length]} ${start}deg ${cursor}deg`;
    });

    return {
      background: `conic-gradient(${parts.join(', ')})`,
      total,
      legend: source.map((item, index) => ({
        ...item,
        color: colors[index % colors.length],
        share: Math.round((item.count / total) * 100)
      }))
    };
  }, [locations]);

  if (loading) {
    return <section className="recruiter-page recruiter-empty-state">Loading analytics...</section>;
  }

  if (error) {
    return <section className="recruiter-page recruiter-empty-state">{error}</section>;
  }

  return (
    <RecruiterWorkspace
      activeKey="analytics"
      profile={profile}
      employer={employer}
      title="Analytics"
      subtitle="Deep, honest insight into recruitment performance and candidate movement."
      headerActions={(
        <div className="recruiter-time-toggle">
          {Object.entries(TIMEFRAMES).map(([key, option]) => (
            <button
              key={key}
              type="button"
              className={timeframeKey === key ? 'is-active' : ''}
              onClick={() => setTimeframeKey(key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    >
      <section className="recruiter-suite-stats">
        {metrics.map(({ label, value, helper, icon: Icon, trend }) => (
          <article key={label} className="recruiter-card recruiter-stat-card">
            <div className="recruiter-stat-top">
              <div className="recruiter-stat-icon">
                <Icon size={18} />
              </div>
              <div className={`recruiter-stat-trend ${trend.tone}`}>{trend.label}</div>
            </div>
            <small>{label}</small>
            <strong>{value}</strong>
            <span>{helper}</span>
          </article>
        ))}
      </section>

      <section className="recruiter-suite-two-up" style={{ marginTop: '1.3rem' }}>
        <article className="recruiter-panel">
          <div className="recruiter-panel-header">
            <div className="recruiter-panel-title">
              <h2>Application Trends</h2>
              <p>Rolling volume across the selected reporting period.</p>
            </div>
            <span className="recruiter-match-pill">
              <TrendingUp size={12} />
              {TIMEFRAMES[timeframeKey].label}
            </span>
          </div>

          <div className="recruiter-bar-chart" style={{ marginTop: '1.4rem' }}>
            {weeklySeries.map((point, index) => {
              const maxCount = Math.max(...weeklySeries.map((item) => item.count), 1);
              const height = `${Math.max(18, (point.count / maxCount) * 100)}%`;

              return (
                <div key={point.label} className="recruiter-bar-column">
                  <div className="recruiter-bar-track">
                    <div
                      className="recruiter-bar-fill"
                      style={{
                        height,
                        background: index % 2 === 0
                          ? 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)'
                          : 'linear-gradient(180deg, #475569 0%, #0f172a 100%)'
                      }}
                    />
                  </div>
                  <div className="recruiter-bar-value">{point.count}</div>
                  <div className="recruiter-bar-label">{point.label}</div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="recruiter-panel">
          <div className="recruiter-panel-title">
            <h3>Candidate Locations</h3>
            <p>Top applicant origins in the current range.</p>
          </div>

          <div className="recruiter-donut-wrap" style={{ background: donutSegments.background, marginTop: '1rem' }}>
            <div className="recruiter-donut-inner">
              <strong>{formatCompactNumber(donutSegments.total)}</strong>
              <span>Applicants</span>
            </div>
          </div>

          <div className="recruiter-donut-legend">
            {donutSegments.legend.map((item) => (
              <div key={item.label} className="recruiter-legend-row">
                <div>
                  <span className="recruiter-legend-swatch" style={{ background: item.color }} />
                  <span>{item.label}</span>
                </div>
                <strong>{item.share}%</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="recruiter-panel" style={{ marginTop: '1.3rem' }}>
        <div className="recruiter-panel-header">
          <div className="recruiter-panel-title">
            <h2>Jobs by Type</h2>
            <p>Openings grouped by the structure employers are hiring for.</p>
          </div>
          <div className="recruiter-inline-actions">
            <button type="button" className="recruiter-icon-btn" aria-label="Filter jobs by type">
              <Filter size={16} />
            </button>
            <button type="button" className="recruiter-icon-btn" aria-label="Download analytics">
              <Download size={16} />
            </button>
          </div>
        </div>

        <div className="recruiter-segment-bars" style={{ marginTop: '1.3rem' }}>
          {jobTypes.map((item, index) => {
            const maxCount = Math.max(...jobTypes.map((entry) => entry.count), 1);
            const ratio = item.count / maxCount;

            return (
              <div key={item.label} className="recruiter-segment-column">
                <div className="recruiter-segment-column-header">
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="recruiter-segment-track">
                  <div
                    className="recruiter-segment-fill"
                    style={{
                      height: `${Math.max(20, ratio * 100)}%`,
                      background: index % 2 === 0
                        ? 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)'
                        : 'linear-gradient(180deg, #475569 0%, #0f172a 100%)'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="recruiter-panel" style={{ marginTop: '1.3rem' }}>
        <div className="recruiter-panel-title">
          <h2>Pipeline Velocity</h2>
          <p>{insight.title}</p>
        </div>

        <div className="recruiter-table-wrap" style={{ marginTop: '1rem' }}>
          <table className="recruiter-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Active Candidates</th>
                <th>Avg. Age in Stage</th>
                <th>Share of Volume</th>
              </tr>
            </thead>
            <tbody>
              {pipelineRows.map((row) => {
                const meta = RECRUITER_STAGE_META[row.status];

                return (
                  <tr key={row.status}>
                    <td>
                      <div className="recruiter-table-name-wrap">
                        <span className="recruiter-legend-swatch" style={{ background: meta.accent }} />
                        <div className="recruiter-table-name">{row.label}</div>
                      </div>
                    </td>
                    <td>{row.activeCandidates}</td>
                    <td>{row.averageAgeDays} days</td>
                    <td>
                      <div className="recruiter-legend-row" style={{ justifyContent: 'flex-start' }}>
                        <div style={{ width: '7rem', height: '0.45rem', borderRadius: '999px', background: 'rgba(226, 232, 240, 0.95)', overflow: 'hidden' }}>
                          <div style={{ width: `${row.share}%`, height: '100%', background: meta.accent }} />
                        </div>
                        <strong>{row.share}%</strong>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </RecruiterWorkspace>
  );
};

export default RecruiterAnalytics;
