import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  LayoutGrid,
  Search,
  Settings,
  Users,
  Workflow
} from 'lucide-react';
import {
  getRecruiterAvatarLabel,
  getRecruiterCompany,
  getRecruiterName
} from '../utils/recruiterSuite';
import './RecruiterWorkspace.css';

const NAV_ITEMS = [
  { key: 'overview', to: '/employer-dashboard', label: 'Overview', icon: LayoutGrid },
  { key: 'jobs', to: '/employer-dashboard/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { key: 'candidates', to: '/employer-dashboard/candidates', label: 'Candidates', icon: Users },
  { key: 'pipeline', to: '/employer-dashboard/pipeline', label: 'Pipeline', icon: Workflow },
  { key: 'analytics', to: '/employer-dashboard/analytics', label: 'Analytics', icon: BarChart3 }
];

const RecruiterWorkspace = ({
  activeKey,
  profile,
  employer,
  title,
  subtitle,
  tone = 'light',
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search candidates, roles, or insights...',
  topActions,
  headerActions,
  children
}) => {
  const location = useLocation();
  const companyName = getRecruiterCompany(profile, employer || {});
  const recruiterName = getRecruiterName(profile, employer || {});
  const avatarLabel = getRecruiterAvatarLabel(profile, employer || {});

  return (
    <div className={`recruiter-shell recruiter-shell--${tone}`}>
      <aside className="recruiter-sidebar">
        <div className="recruiter-brand-block">
          <Link to="/employer-dashboard" className="recruiter-brand-link">Job Lithic</Link>
          <p>Recruiter Suite</p>
        </div>

        <nav className="recruiter-sidebar-nav">
          {NAV_ITEMS.map(({ key, to, label, icon: Icon }) => {
            const isActive = activeKey === key || location.pathname === to;

            return (
              <Link
                key={key}
                to={to}
                className={`recruiter-nav-link${isActive ? ' is-active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="recruiter-sidebar-card">
          <div className="recruiter-sidebar-avatar">
            {profile?.companyLogoUrl
              ? <img src={profile.companyLogoUrl} alt={companyName} />
              : <span>{avatarLabel}</span>}
          </div>

          <div className="recruiter-sidebar-copy">
            <strong>{companyName}</strong>
            <span>{recruiterName}</span>
          </div>
        </div>
      </aside>

      <div className="recruiter-main">
        <header className="recruiter-topbar">
          <div className="recruiter-topbar-brand">Job Lithic</div>

          <div className="recruiter-topbar-search">
            <Search size={16} />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>

          <div className="recruiter-topbar-actions">
            <button type="button" className="recruiter-icon-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button type="button" className="recruiter-icon-btn" aria-label="Settings">
              <Settings size={18} />
            </button>
            {topActions || (
              <Link to="/employer-dashboard/jobs" className="recruiter-primary-btn">
                Post a Job
              </Link>
            )}
          </div>
        </header>

        <div className="recruiter-mobile-nav">
          {NAV_ITEMS.map(({ key, to, label }) => (
            <Link
              key={key}
              to={to}
              className={`recruiter-mobile-nav-link${activeKey === key ? ' is-active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <main className="recruiter-page">
          {(title || subtitle || headerActions) && (
            <section className="recruiter-page-header">
              <div>
                {title && <h1>{title}</h1>}
                {subtitle && <p>{subtitle}</p>}
              </div>

              {headerActions && (
                <div className="recruiter-page-header-actions">
                  {headerActions}
                </div>
              )}
            </section>
          )}

          {children}
        </main>
      </div>
    </div>
  );
};

RecruiterWorkspace.propTypes = {
  activeKey: PropTypes.string.isRequired,
  profile: PropTypes.object,
  employer: PropTypes.object,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  tone: PropTypes.oneOf(['light', 'dark']),
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  topActions: PropTypes.node,
  headerActions: PropTypes.node,
  children: PropTypes.node.isRequired
};

RecruiterWorkspace.defaultProps = {
  profile: null,
  employer: null,
  title: '',
  subtitle: '',
  tone: 'light',
  searchValue: '',
  onSearchChange: undefined,
  searchPlaceholder: 'Search candidates, roles, or insights...',
  topActions: null,
  headerActions: null
};

export default RecruiterWorkspace;
