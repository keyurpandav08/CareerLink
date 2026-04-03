import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BriefcaseBusiness,
  LayoutGrid,
  Search,
  Users,
  Workflow,
  Home
} from 'lucide-react';
import {
  getRecruiterAvatarLabel,
  getRecruiterCompany,
  getRecruiterName
} from '../utils/recruiterSuite';
import './RecruiterWorkspace.css';

const NAV_ITEMS = [
    { key: 'home', to: '/', label: 'Home', icon: Home },
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
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key || location.pathname === item.to;

            return (
              <Link
                key={item.key}
                to={item.to}
                className={`recruiter-nav-link${isActive ? ' is-active' : ''}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
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
          <Link to="/employer-dashboard" className="recruiter-topbar-brand">
            <span className="recruiter-topbar-mark">JL</span>
            <span>Job Lithic</span>
          </Link>

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
<<<<<<< HEAD
            <button type="button" className="recruiter-icon-btn" aria-label="Settings">
              <Settings size={18} />
            </button>
=======
            <button type="button" className="recruiter-icon-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <Link to="/employer-dashboard/analytics" className="recruiter-icon-btn" aria-label="Open analytics">
              <BarChart3 size={18} />
            </Link>
            <Link to="/employer-dashboard?panel=settings" className="recruiter-avatar-pill" aria-label="Open company settings">
              <div className="recruiter-avatar-pill-media">
                {profile?.companyLogoUrl
                  ? <img src={profile.companyLogoUrl} alt={companyName} />
                  : <span>{avatarLabel}</span>}
              </div>
              <div className="recruiter-avatar-pill-copy">
                <strong>{companyName}</strong>
                <span>{recruiterName}</span>
              </div>
            </Link>
>>>>>>> 98c4fc460197534d796450d9ce1719b14f89147f
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

        <footer className="recruiter-footer">
          <div className="recruiter-footer-card">
            <div className="recruiter-footer-copy">
              <span className="recruiter-footer-kicker">Recruiter system</span>
              <strong>Track open roles, move candidates faster, and keep every hiring touchpoint in one flow.</strong>
            </div>

            <div className="recruiter-footer-links">
              <Link to="/terms">Terms</Link>
              <Link to="/privacy-policy">Privacy</Link>
              <Link to="/contact">Support</Link>
            </div>
          </div>
        </footer>
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
