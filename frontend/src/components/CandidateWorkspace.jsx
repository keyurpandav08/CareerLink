import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  Shield,
  UserRound,
  X,
  Home
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import {
  createInitials,
  getDisplayName,
  getProfessionalTitle,
  getProfilePhoto,
  getProfileVisibilityMeta
} from '../utils/candidatePortal';
import './CandidateWorkspace.css';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/applications', label: 'My Applications', icon: FileText },
  { to: '/resume-builder', label: 'AI Resume Insights', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings }
];

const CandidateWorkspace = ({
  activePath,
  profile,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  children
}) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = useMemo(() => getDisplayName(profile, user), [profile, user]);
  const headline = useMemo(() => getProfessionalTitle(profile, user), [profile, user]);
  const profilePhoto = useMemo(() => getProfilePhoto(user, profile), [profile, user]);
  const visibilityMeta = useMemo(() => getProfileVisibilityMeta(user), [user]);

  return (
    <section className="candidate-workspace">
      <button
        type="button"
        className={`candidate-workspace-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        aria-label="Close sidebar"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="candidate-workspace-shell">
        <aside className={`candidate-workspace-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
          <div className="candidate-workspace-sidebar-head">
            <div>
              <Link to="/dashboard" className="candidate-workspace-brand" aria-label="CareerLink candidate dashboard">
                <BrandLogo variant="full" className="candidate-workspace-brand-logo" alt="CareerLink" />
              </Link>
              <p>Manage your career</p>
            </div>

            <button
              type="button"
              className="candidate-workspace-sidebar-close"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <nav className="candidate-workspace-nav">
            {NAV_ITEMS.map((item) => {
              const ItemIcon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`candidate-workspace-link ${item.to === activePath ? 'is-active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <ItemIcon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="candidate-workspace-identity">
            <div className="candidate-workspace-identity-avatar">
              {profilePhoto
                ? <img src={profilePhoto} alt={displayName} />
                : createInitials(displayName)}
            </div>
            <div>
              <strong>{displayName}</strong>
              <span>{headline}</span>
              <div className={`candidate-workspace-visibility is-${visibilityMeta.visibility}`}>
                <Shield size={12} />
                <span>{visibilityMeta.label}</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="candidate-workspace-main">
          <header className="candidate-workspace-topbar">
            <div className="candidate-workspace-topbar-left">
              <button
                type="button"
                className="candidate-workspace-sidebar-toggle"
                aria-label="Open sidebar"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>

              <Link to="/dashboard" className="candidate-workspace-product-name">
                <BrandLogo variant="icon" className="candidate-workspace-product-mark" alt="CareerLink" />
                <span>CareerLink</span>
              </Link>

              <label className="candidate-workspace-search" htmlFor="candidateWorkspaceSearch">
                <Search size={16} />
                <input
                  id="candidateWorkspaceSearch"
                  type="search"
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                />
              </label>
            </div>

            <div className="candidate-workspace-topbar-actions">
              <Link to="/jobs" className="candidate-workspace-icon-btn" aria-label="Browse jobs">
                <BriefcaseBusiness size={18} />
              </Link>

              <Link to="/settings" className="candidate-workspace-icon-btn" aria-label="Open settings">
                <Settings size={18} />
              </Link>

              <Link to="/profile" className="candidate-workspace-avatar-link">
                <div className="candidate-workspace-avatar-badge">
                  {profilePhoto
                    ? <img src={profilePhoto} alt={displayName} />
                    : createInitials(displayName)}
                </div>
                <div className="candidate-workspace-avatar-copy">
                  <strong>{displayName}</strong>
                  <span>Candidate profile</span>
                </div>
              </Link>
            </div>
          </header>

          <main className="candidate-workspace-content">
            {children}
          </main>

          <footer className="candidate-workspace-footer">
            <div className="candidate-workspace-footer-card">
              <div className="candidate-workspace-footer-copy">
                <span className="candidate-workspace-footer-kicker">Candidate system</span>
                <strong>Stay application-ready with a sharper profile, resume, and recruiter-facing story.</strong>
              </div>

              <div className="candidate-workspace-footer-links">
                <Link to="/terms">Terms</Link>
                <Link to="/privacy-policy">Privacy</Link>
                <Link to="/contact">Contact</Link>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <nav className="candidate-workspace-mobile-nav" aria-label="Candidate navigation">
        {NAV_ITEMS.map((item) => {
          const ItemIcon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`candidate-workspace-mobile-link ${item.to === activePath ? 'is-active' : ''}`}
            >
              <ItemIcon size={18} />
            </Link>
          );
        })}
      </nav>
    </section>
  );
};

CandidateWorkspace.propTypes = {
  activePath: PropTypes.string.isRequired,
  profile: PropTypes.object,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  children: PropTypes.node.isRequired
};

CandidateWorkspace.defaultProps = {
  profile: null,
  searchValue: '',
  onSearchChange: () => {},
  searchPlaceholder: 'Search your workspace...'
};

export default CandidateWorkspace;
